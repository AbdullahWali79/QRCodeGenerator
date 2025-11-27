import { NextRequest, NextResponse } from 'next/server'
import QRCode from 'qrcode'
import Jimp from 'jimp'
import sharp from 'sharp'

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, text, url, size, color, backgroundColor, logo, bgImage, centerText, centerTextColor, centerTextSize, centerTextBold } = body

    // Validate required fields
    if (!type || !size) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: type and size' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Validate type-specific fields
    if (type === 'text' && !text) {
      return new Response(
        JSON.stringify({ error: 'Text is required for text type' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    if (type === 'url' && !url) {
      return new Response(
        JSON.stringify({ error: 'URL is required for url type' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    if (type === 'logo' && !logo) {
      return new Response(
        JSON.stringify({ error: 'Logo is required for logo type' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    if (type === 'background' && !bgImage) {
      return new Response(
        JSON.stringify({ error: 'Background image is required for background type' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Determine the content for QR code
    let qrContent = ''
    if (type === 'text') {
      qrContent = text
    } else if (type === 'url') {
      qrContent = url
    } else if (type === 'logo' || type === 'background') {
      // For logo and background types, use text or url
      qrContent = text || url
      if (!qrContent) {
        return new Response(
          JSON.stringify({ error: 'Text or URL is required for logo and background types' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        )
      }
    }

    // Generate QR code as data URL
    const qrDataUrl = await QRCode.toDataURL(qrContent, {
      width: size,
      color: {
        dark: color || '#000000',
        light: backgroundColor || '#ffffff',
      },
      margin: 1,
    })

    // Convert data URL to buffer
    const qrBuffer = Buffer.from(qrDataUrl.split(',')[1], 'base64')
    let finalImage = await Jimp.read(qrBuffer)

    // Handle logo type - embed logo at center
    if (type === 'logo' && logo) {
      try {
        const logoBuffer = Buffer.from(logo, 'base64')
        const logoImage = await Jimp.read(logoBuffer)

        // Resize logo to be 30% of QR code size
        const logoSize = Math.floor(size * 0.3)
        logoImage.resize(logoSize, logoSize)

        // Calculate center position
        const x = Math.floor((size - logoSize) / 2)
        const y = Math.floor((size - logoSize) / 2)

        // Composite logo onto QR code
        finalImage.composite(logoImage, x, y, {
          mode: Jimp.BLEND_SOURCE_OVER,
          opacitySource: 1.0,
          opacityDest: 1.0,
        })
      } catch (logoError) {
        console.error('Error processing logo:', logoError)
        return new Response(
          JSON.stringify({ error: 'Failed to process logo image' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        )
      }
    }

    // Handle background type - draw QR over background image
    if (type === 'background' && bgImage) {
      try {
        const bgBuffer = Buffer.from(bgImage, 'base64')
        const bgImageJimp = await Jimp.read(bgBuffer)

        // Resize background to match QR size (maintain aspect ratio, then crop/center)
        bgImageJimp.cover(size, size)

        // Generate QR code with white background first
        const qrDataUrlForBg = await QRCode.toDataURL(qrContent, {
          width: size,
          color: {
            dark: color || '#000000',
            light: '#ffffff',
          },
          margin: 1,
        })

        const qrBufferForBg = Buffer.from(qrDataUrlForBg.split(',')[1], 'base64')
        const qrImageForBg = await Jimp.read(qrBufferForBg)

        // Make white pixels transparent in QR code
        qrImageForBg.scan(0, 0, qrImageForBg.bitmap.width, qrImageForBg.bitmap.height, function (x, y, idx) {
          const red = this.bitmap.data[idx]
          const green = this.bitmap.data[idx + 1]
          const blue = this.bitmap.data[idx + 2]
          
          // If pixel is white (or very close to white), make it transparent
          if (red > 250 && green > 250 && blue > 250) {
            this.bitmap.data[idx + 3] = 0 // Set alpha to 0 (transparent)
          }
        })

        // Composite QR code over background
        bgImageJimp.composite(qrImageForBg, 0, 0, {
          mode: Jimp.BLEND_SOURCE_OVER,
          opacitySource: 1.0,
          opacityDest: 1.0,
        })

        finalImage = bgImageJimp
      } catch (bgError) {
        console.error('Error processing background:', bgError)
        return new Response(
          JSON.stringify({ error: 'Failed to process background image' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        )
      }
    }

    // Handle center text - use simple SVG with web-safe fonts
    if (centerText && centerText.trim()) {
      try {
        console.log('Processing center text:', { centerText, centerTextSize, centerTextColor, centerTextBold })
        
        const fontSize = centerTextSize || 24
        const lines = centerText.split('\n')
        const lineHeight = fontSize * 1.2
        const totalHeight = lines.length * lineHeight
        
        // Calculate circle size
        const padding = fontSize * 0.8
        const maxLineWidth = Math.max(...lines.map((l: string) => l.length))
        const estimatedTextWidth = maxLineWidth * fontSize * 0.6
        const circleRadius = Math.max(
          (totalHeight / 2) + padding,
          (estimatedTextWidth / 2) + padding
        )
        const maxRadius = size * 0.12
        const finalRadius = Math.min(circleRadius, maxRadius)
        
        const centerX = size / 2
        const centerY = size / 2
        const startY = centerY - (totalHeight / 2) + fontSize
        
        // Parse text color
        const textColor = centerTextColor || '#000000'
        const finalTextColor = (textColor === '#ffffff' || textColor === '#fff' || textColor.toLowerCase() === 'white') ? '#000000' : textColor
        
        // Create simple SVG with web-safe font - use absolute positioning
        const whiteCircle = `<circle cx="${centerX}" cy="${centerY}" r="${finalRadius}" fill="white" fill-opacity="0.98" stroke="#cccccc" stroke-width="2"/>`
        
        const svgText = lines.map((line: string, index: number) => {
          const y = startY + (index * lineHeight)
          const fontWeight = centerTextBold ? 'bold' : 'normal'
          const escapedLine = line
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;')
          
          // Use absolute positioning and web-safe font
          return `<text x="${centerX}" y="${y}" font-family="Arial, Helvetica, sans-serif" font-size="${fontSize}" font-weight="${fontWeight}" fill="${finalTextColor}" stroke="white" stroke-width="2" text-anchor="middle" alignment-baseline="middle">${escapedLine}</text>`
        }).join('\n')
        
        // Create SVG with proper namespace and structure
        const svg = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  ${whiteCircle}
  ${svgText}
</svg>`
        
        console.log('SVG created, length:', svg.length)
        console.log('Converting SVG to PNG with Sharp...')
        
        // Use Sharp to render SVG with explicit settings
        let textBuffer: Buffer
        try {
          textBuffer = await sharp(Buffer.from(svg), {
            density: 100,
            limitInputPixels: 268402689
          })
            .resize(size, size, {
              fit: 'contain',
              background: { r: 0, g: 0, b: 0, alpha: 0 }
            })
            .png()
            .toBuffer()
          
          console.log('Sharp conversion successful, buffer size:', textBuffer.length)
        } catch (sharpError) {
          console.error('Sharp error:', sharpError)
          throw sharpError
        }
        
        console.log('Loading buffer with Jimp...')
        const textImage = await Jimp.read(textBuffer)
        console.log('Text image loaded, size:', textImage.bitmap.width, 'x', textImage.bitmap.height)
        
        // Composite text onto QR code
        finalImage.composite(textImage, 0, 0, {
          mode: Jimp.BLEND_SOURCE_OVER,
          opacitySource: 1.0,
          opacityDest: 1.0,
        })
        
        console.log('Center text successfully added to QR code')
      } catch (textError) {
        console.error('Error processing center text:', textError)
        console.error('Error details:', textError instanceof Error ? textError.stack : String(textError))
        // Don't throw - continue without text so QR code still generates
      }
    }

    // Convert to PNG buffer
    const pngBuffer = await finalImage.getBufferAsync(Jimp.MIME_PNG)

    // Return PNG buffer (fixed for Vercel / Web Response)
    return new Response(new Uint8Array(pngBuffer), {
      status: 200,
      headers: {
        "Content-Type": "image/png",
      },
    })
  } catch (error) {
    console.error('Error generating QR code:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to generate QR code' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

