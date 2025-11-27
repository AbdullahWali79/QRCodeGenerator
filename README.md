# QR Code Generator

A modern, full-featured QR Code Generator built with Next.js and Tailwind CSS, deployable on Vercel.

## Features

- 🎨 **Multiple QR Code Types**
  - Text QR codes
  - URL QR codes
  - Logo QR codes (with embedded logo)
  - Background QR codes (QR code over background image)

- 🎨 **Customization**
  - Custom QR color
  - Custom background color
  - Multiple sizes (256px, 512px, 1024px)

- 📱 **Modern UI**
  - Responsive design
  - Clean, minimal interface
  - Smooth transitions and animations

- ⚡ **Fast & Serverless**
  - API route for QR generation
  - No database required
  - Optimized for Vercel deployment

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd QRCodeGenerator
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
QRCodeGenerator/
├── app/
│   ├── api/
│   │   └── generate-qr/
│   │       └── route.ts      # API route for QR generation
│   ├── generate/
│   │   └── page.tsx          # QR Generator page
│   ├── globals.css           # Global styles with Tailwind
│   ├── layout.tsx            # Root layout
│   └── page.tsx              # Landing page
├── package.json
├── next.config.js
├── tailwind.config.js
└── tsconfig.json
```

## Deployment to Vercel

1. Push your code to GitHub
2. Import your repository in [Vercel](https://vercel.com)
3. Vercel will automatically detect Next.js and configure the build settings
4. Deploy!

The project is ready for Vercel deployment with no additional configuration needed.

## Usage

1. **Landing Page**: Visit `/` to see the hero section
2. **Generator Page**: Click "Open QR Generator" or visit `/generate`
3. **Select Type**: Choose from Text, URL, Logo, or Background QR
4. **Customize**: Set colors, size, and upload images (for logo/background types)
5. **Generate**: Click "Generate QR Code" to create your QR code
6. **Download**: Click "Download PNG" to save your QR code

## Technologies Used

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS framework
- **qrcode** - QR code generation library
- **jimp** - Image processing library

## License

MIT
