import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center px-4">
      <div className="text-center max-w-2xl mx-auto">
        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
          Easy QR Code Generator
        </h1>
        <p className="text-sm md:text-base text-gray-500 mb-2">
          Designed by Muhammad Abdullah Ai Developer
        </p>
        <p className="text-sm md:text-base text-gray-500 mb-2">
          Contact # +923046983794
        </p>
        <p className="text-xl md:text-2xl text-gray-600 mb-8">
          Create colored and background-based QR codes instantly.
        </p>
        <Link
          href="/generate"
          className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-8 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
        >
          Open QR Generator
        </Link>
      </div>
    </div>
  )
}

