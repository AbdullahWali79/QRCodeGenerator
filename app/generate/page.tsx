'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'

type QRType = 'text' | 'url' | 'logo' | 'background'

export default function GeneratePage() {
  const [type, setType] = useState<QRType>('text')
  const [text, setText] = useState('')
  const [url, setUrl] = useState('')
  const [size, setSize] = useState(512)
  const [color, setColor] = useState('#000000')
  const [backgroundColor, setBackgroundColor] = useState('#ffffff')
  const [logo, setLogo] = useState<File | null>(null)
  const [bgImage, setBgImage] = useState<File | null>(null)
  const [qrPreview, setQrPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const logoInputRef = useRef<HTMLInputElement>(null)
  const bgInputRef = useRef<HTMLInputElement>(null)

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setLogo(e.target.files[0])
    }
  }

  const handleBgImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setBgImage(e.target.files[0])
    }
  }

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => {
        const base64 = reader.result as string
        // Remove data URL prefix
        const base64Data = base64.split(',')[1]
        resolve(base64Data)
      }
      reader.onerror = (error) => reject(error)
    })
  }

  const generateQR = async () => {
    setLoading(true)
    setError(null)
    setQrPreview(null)

    try {
      // Validate inputs
      if (type === 'text' && !text.trim()) {
        throw new Error('Please enter some text')
      }
      if (type === 'url' && !url.trim()) {
        throw new Error('Please enter a URL')
      }
      if (type === 'logo') {
        if (!logo) {
          throw new Error('Please upload a logo image')
        }
        if (!text.trim() && !url.trim()) {
          throw new Error('Please enter text or URL for the QR code')
        }
      }
      if (type === 'background') {
        if (!bgImage) {
          throw new Error('Please upload a background image')
        }
        if (!text.trim() && !url.trim()) {
          throw new Error('Please enter text or URL for the QR code')
        }
      }

      const payload: any = {
        type,
        size,
        color,
        backgroundColor,
      }

      if (type === 'text') {
        payload.text = text
      } else if (type === 'url') {
        payload.url = url
      } else if (type === 'logo' || type === 'background') {
        // For logo and background, use text or url
        if (text.trim()) {
          payload.text = text
        } else if (url.trim()) {
          payload.url = url
        }
      }

      if (type === 'logo' && logo) {
        payload.logo = await fileToBase64(logo)
      }

      if (type === 'background' && bgImage) {
        payload.bgImage = await fileToBase64(bgImage)
      }

      const response = await fetch('/api/generate-qr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to generate QR code' }))
        throw new Error(errorData.error || 'Failed to generate QR code')
      }

      const blob = await response.blob()
      const imageUrl = URL.createObjectURL(blob)
      setQrPreview(imageUrl)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const downloadQR = () => {
    if (qrPreview) {
      const link = document.createElement('a')
      link.href = qrPreview
      link.download = 'qrcode.png'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link
            href="/"
            className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
          >
            ← Back to Home
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            QR Code Generator
          </h1>

          <div className="space-y-6">
            {/* QR Type Dropdown */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                QR Code Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as QRType)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                <option value="text">Text QR</option>
                <option value="url">URL QR</option>
                <option value="logo">Logo QR</option>
                <option value="background">Background QR</option>
              </select>
            </div>

            {/* Text Input */}
            {type === 'text' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Text
                </label>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Enter text for QR code"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  rows={4}
                />
              </div>
            )}

            {/* URL Input */}
            {type === 'url' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL
                </label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            )}

            {/* Logo Upload */}
            {type === 'logo' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Content (Text or URL)
                  </label>
                  <textarea
                    value={text || url}
                    onChange={(e) => {
                      if (e.target.value.startsWith('http://') || e.target.value.startsWith('https://')) {
                        setUrl(e.target.value)
                        setText('')
                      } else {
                        setText(e.target.value)
                        setUrl('')
                      }
                    }}
                    placeholder="Enter text or URL for QR code"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Logo Image
                  </label>
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                  {logo && (
                    <p className="mt-2 text-sm text-gray-600">Selected: {logo.name}</p>
                  )}
                </div>
              </>
            )}

            {/* Background Image Upload */}
            {type === 'background' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Content (Text or URL)
                  </label>
                  <textarea
                    value={text || url}
                    onChange={(e) => {
                      if (e.target.value.startsWith('http://') || e.target.value.startsWith('https://')) {
                        setUrl(e.target.value)
                        setText('')
                      } else {
                        setText(e.target.value)
                        setUrl('')
                      }
                    }}
                    placeholder="Enter text or URL for QR code"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Background Image
                  </label>
                  <input
                    ref={bgInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleBgImageChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                  {bgImage && (
                    <p className="mt-2 text-sm text-gray-600">Selected: {bgImage.name}</p>
                  )}
                </div>
              </>
            )}

            {/* Color Pickers */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  QR Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-16 h-10 border border-gray-300 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="#000000"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Background Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={backgroundColor}
                    onChange={(e) => setBackgroundColor(e.target.value)}
                    className="w-16 h-10 border border-gray-300 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={backgroundColor}
                    onChange={(e) => setBackgroundColor(e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="#ffffff"
                  />
                </div>
              </div>
            </div>

            {/* Size Dropdown */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Size
              </label>
              <select
                value={size}
                onChange={(e) => setSize(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                <option value={256}>256px</option>
                <option value={512}>512px</option>
                <option value={1024}>1024px</option>
              </select>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Generate Button */}
            <button
              onClick={generateQR}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:transform-none"
            >
              {loading ? 'Generating...' : 'Generate QR Code'}
            </button>

            {/* QR Preview */}
            {qrPreview && (
              <div className="mt-8 p-6 bg-gray-50 rounded-lg border-2 border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 text-center">
                  QR Code Preview
                </h2>
                <div className="flex justify-center mb-4">
                  <img
                    src={qrPreview}
                    alt="QR Code"
                    className="max-w-full h-auto rounded-lg shadow-md"
                  />
                </div>
                <button
                  onClick={downloadQR}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                >
                  Download PNG
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

