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

    // Handle center text - render text in center of QR code using Sharp for SVG rendering
    if (centerText && centerText.trim()) {
      console.log('Processing center text:', { centerText, centerTextSize, centerTextColor, centerTextBold })
      try {
        // Use Sharp to render SVG text (avoids canvas font family issues)
        const fontSize = centerTextSize || 24
        const lines = centerText.split('\n')
        const lineHeight = fontSize * 1.2
        const totalHeight = lines.length * lineHeight
        
        // Calculate circle size based on text dimensions
        // Use smaller padding to avoid covering too much QR code area
        // This ensures QR code remains scannable
        const padding = fontSize * 0.8
        const maxLineWidth = Math.max(...lines.map((l: string) => l.length))
        const estimatedTextWidth = maxLineWidth * fontSize * 0.6
        
        // Calculate circle radius - keep it compact to preserve QR code scannability
        const circleRadius = Math.max(
          (totalHeight / 2) + padding,
          (estimatedTextWidth / 2) + padding
        )
        
        // Limit maximum circle size to preserve QR code integrity
        // Circle should not exceed 25% of QR code size
        const maxRadius = size * 0.12
        const finalRadius = Math.min(circleRadius, maxRadius)
        
        // Center position for circle and text
        const centerX = size / 2
        const centerY = size / 2
        const startY = centerY - (totalHeight / 2) + fontSize
        
        // Create white circle background with border for better visibility
        // Using solid white for better text readability
        const whiteCircle = `<circle cx="${centerX}" cy="${centerY}" r="${finalRadius}" fill="white" fill-opacity="0.98" stroke="#cccccc" stroke-width="2"/>`
        
        // Create SVG with white circle and text
        // Add text stroke/outline for better visibility
        const svgText = lines.map((line: string, index: number) => {
          const y = startY + (index * lineHeight)
          const fontWeight = centerTextBold ? 'bold' : 'normal'
          // Escape XML special characters
          const escapedLine = line
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;')
          
          // Use darker color for better visibility, ensure it's not too light
          const textColor = centerTextColor || '#000000'
          // If color is too light, use black
          const finalTextColor = (textColor === '#ffffff' || textColor === '#fff' || textColor.toLowerCase() === 'white') ? '#000000' : textColor
          
          // Add text with white stroke/outline for better visibility against white background
          // Using multiple strokes for better visibility
          return `
            <text x="50%" y="${y}" font-size="${fontSize}" font-weight="${fontWeight}" 
                  fill="${finalTextColor}" 
                  stroke="white" 
                  stroke-width="3" 
                  stroke-opacity="1"
                  paint-order="stroke fill"
                  text-anchor="middle" 
                  dominant-baseline="middle">${escapedLine}</text>`
        }).join('\n')
        
        const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  ${whiteCircle}
  ${svgText}
</svg>`
        
        // Use Sharp to convert SVG to PNG buffer
        try {
          const textBuffer = await sharp(Buffer.from(svg))
            .png()
            .toBuffer()
          
          // Load with Jimp for compositing
          const textImage = await Jimp.read(textBuffer)
          
          // Composite text onto QR code
          finalImage.composite(textImage, 0, 0, {
            mode: Jimp.BLEND_SOURCE_OVER,
            opacitySource: 1.0,
            opacityDest: 1.0,
          })
          
          console.log('Center text successfully added to QR code')
        } catch (sharpError) {
          console.error('Sharp SVG rendering error:', sharpError)
          // Continue without text if Sharp fails
          // Don't throw error, just log it
        }
      } catch (textError) {
        console.error('Error processing center text:', textError)
        // Don't return error - continue without center text
        // This ensures QR code is still generated even if text fails
        console.warn('Continuing QR code generation without center text due to error')
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

