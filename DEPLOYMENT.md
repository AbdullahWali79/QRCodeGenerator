# Vercel Deployment Guide

## Step-by-Step Instructions

### Method 1: GitHub se Deploy (Recommended)

#### Step 1: GitHub Repository Create Karein

1. **GitHub account** banayein (agar nahi hai): https://github.com
2. **New Repository** create karein:
   - GitHub par jao
   - "New" button click karein
   - Repository name: `QRCodeGenerator` (ya koi bhi naam)
   - Public ya Private select karein
   - "Create repository" click karein

#### Step 2: Code GitHub par Push Karein

Terminal mein yeh commands run karein:

```bash
# Git initialize karein (agar nahi kiya)
git init

# Sab files add karein
git add .

# Commit karein
git commit -m "Initial commit - QR Code Generator"

# GitHub repository URL add karein (apna URL use karein)
git remote add origin https://github.com/YOUR_USERNAME/QRCodeGenerator.git

# Code push karein
git branch -M main
git push -u origin main
```

#### Step 3: Vercel par Deploy Karein

1. **Vercel account** banayein: https://vercel.com
   - "Sign Up" click karein
   - GitHub account se sign in karein (easiest way)

2. **New Project** create karein:
   - Dashboard par "Add New Project" click karein
   - Apna GitHub repository select karein
   - "Import" click karein

3. **Project Settings**:
   - Framework Preset: **Next.js** (auto-detect hoga)
   - Root Directory: `./` (default)
   - Build Command: `npm run build` (auto)
   - Output Directory: `.next` (auto)
   - Install Command: `npm install` (auto)

4. **Environment Variables** (agar koi chahiye):
   - Abhi koi environment variable nahi chahiye
   - Skip karein

5. **Deploy**:
   - "Deploy" button click karein
   - 2-3 minutes wait karein
   - Deployment complete ho jayega!

6. **Live URL**:
   - Deployment ke baad apko live URL milega
   - Example: `https://qr-code-generator.vercel.app`

---

### Method 2: Vercel CLI se Deploy

#### Step 1: Vercel CLI Install Karein

```bash
npm install -g vercel
```

#### Step 2: Login Karein

```bash
vercel login
```

#### Step 3: Deploy Karein

```bash
# Project root directory mein
vercel

# Production deploy ke liye
vercel --prod
```

---

## Important Notes

### ✅ Vercel Automatic Configuration:
- Next.js automatically detect hoga
- API routes automatically work karengi
- No database setup needed
- Serverless functions automatically configured

### ✅ Dependencies:
- `sharp` - Vercel par automatically install hoga
- `@napi-rs/canvas` - Vercel par work karega
- `jimp` - Serverless environment mein work karega

### ✅ Build Settings:
- Build Command: `npm run build`
- Output Directory: `.next`
- Node.js Version: 18.x (auto)

---

## Troubleshooting

### Agar Build Fail Ho:

1. **Check Build Logs**:
   - Vercel dashboard mein "Deployments" section mein jao
   - Failed deployment click karein
   - Build logs check karein

2. **Common Issues**:
   - **Sharp installation issue**: Vercel automatically handle karega
   - **Canvas issue**: `next.config.js` mein configuration already hai
   - **Memory limit**: Vercel free tier mein 1GB limit hai (enough hai)

3. **Fix Karein**:
   - `package.json` check karein
   - Dependencies properly install ho rahi hain ya nahi
   - `next.config.js` properly configured hai

---

## Post-Deployment

### Custom Domain (Optional):
1. Vercel dashboard mein project select karein
2. "Settings" > "Domains" par jao
3. Apna domain add karein

### Environment Variables (Agar Future Mein Chahiye):
1. "Settings" > "Environment Variables"
2. Variables add karein

---

## Success! 🎉

Agar sab kuch sahi hai, to:
- ✅ Website live ho jayegi
- ✅ QR Code Generator kaam karega
- ✅ API routes work karengi
- ✅ Center text feature work karega

---

## Support

Agar koi issue aaye:
1. Vercel build logs check karein
2. GitHub repository check karein
3. Local build test karein: `npm run build`

