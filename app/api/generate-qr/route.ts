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

    // Handle center text - use Jimp to draw white circle and simple text representation
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
        
        // Parse text color
        const textColor = centerTextColor || '#000000'
        const rgb = textColor.replace('#', '').match(/.{2}/g) || ['00', '00', '00']
        const r = parseInt(rgb[0], 16)
        const g = parseInt(rgb[1], 16)
        const b = parseInt(rgb[2], 16)
        const textColorInt = Jimp.rgbaToInt(r, g, b, 255)
        const whiteColor = Jimp.rgbaToInt(255, 255, 255, 255)
        const borderColor = Jimp.rgbaToInt(204, 204, 204, 255)
        
        // Create overlay image with white circle
        const overlay = new Jimp(size, size, 0x00000000) // Transparent
        
        // Draw white circle
        for (let y = 0; y < size; y++) {
          for (let x = 0; x < size; x++) {
            const distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2))
            if (distance <= finalRadius) {
              if (distance > finalRadius - 2) {
                overlay.setPixelColor(borderColor, x, y) // Border
              } else {
                overlay.setPixelColor(whiteColor, x, y) // White fill
              }
            }
          }
        }
        
        // Draw text using simple bitmap method - create visible text blocks
        const startY = centerY - (totalHeight / 2)
        const charWidth = fontSize * 0.55
        const charHeight = fontSize * 0.8
        
        lines.forEach((line: string, lineIndex: number) => {
          const lineY = Math.floor(startY + (lineIndex * lineHeight))
          const lineWidth = line.length * charWidth
          const startX = centerX - (lineWidth / 2)
          
          // Draw each character as a visible block
          line.split('').forEach((char: string, charIndex: number) => {
            const charX = Math.floor(startX + (charIndex * charWidth))
            
            // Draw character as a filled rectangle with rounded edges for visibility
            const drawPixel = (px: number, py: number, color: number) => {
              if (px >= 0 && px < size && py >= 0 && py < size) {
                overlay.setPixelColor(color, px, py)
              }
            }
            
            // Draw text block - simple representation
            for (let py = 0; py < charHeight; py++) {
              for (let px = 0; px < charWidth; px++) {
                const pxPos = charX + px
                const pyPos = lineY + py
                
                // Create a simple block pattern for text
                const marginX = charWidth * 0.15
                const marginY = charHeight * 0.2
                
                if (px > marginX && px < charWidth - marginX && 
                    py > marginY && py < charHeight - marginY) {
                  // Draw main text block
                  drawPixel(pxPos, pyPos, textColorInt)
                  
                  // Add bold effect by drawing extra pixels
                  if (centerTextBold) {
                    drawPixel(pxPos + 1, pyPos, textColorInt)
                    drawPixel(pxPos, pyPos + 1, textColorInt)
                  }
                }
              }
            }
          })
        })
        
        // Composite overlay onto QR code
        finalImage.composite(overlay, 0, 0, {
          mode: Jimp.BLEND_SOURCE_OVER,
          opacitySource: 1.0,
          opacityDest: 1.0,
        })
        
        console.log('Center text successfully added using Jimp bitmap method')
      } catch (textError) {
        console.error('Error processing center text:', textError)
        // Continue without text
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

