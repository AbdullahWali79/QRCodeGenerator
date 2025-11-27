# Code Push Karne Ke Instructions

## Problem:
GitHub par abhi purana code hai. Naya code push karna hai.

## Solution:

### Method 1: GitHub Desktop (Easiest)

1. **GitHub Desktop** open karein
2. Left side par **"QRCodeGenerator"** repository select karein
3. Top par **"Changes"** tab par jao
4. Sab files selected honge automatically
5. Bottom left mein **commit message** type karein:
   ```
   Fix Buffer type error - convert to Uint8Array
   ```
6. **"Commit to main"** button click karein
7. Top par **"Push origin"** button click karein
8. Done! ✅

### Method 2: VS Code Source Control

1. VS Code open karein
2. Left side par **Source Control** icon (Ctrl+Shift+G) click karein
3. **"+"** icon se sab files stage karein
4. Top par **commit message** type karein:
   ```
   Fix Buffer type error - convert to Uint8Array
   ```
5. **"✓ Commit"** button click karein
6. **"..."** menu se **"Push"** select karein
7. Done! ✅

### Method 3: Terminal (Agar Git installed hai)

```bash
# Project folder mein jao
cd C:\Users\premier\Documents\GitHub\QRCodeGenerator

# Changes add karein
git add .

# Commit karein
git commit -m "Fix Buffer type error - convert to Uint8Array"

# Push karein
git push origin main
```

## After Pushing:

1. Vercel automatically naya deployment start karega
2. 2-3 minutes wait karein
3. Build successfully ho jayega ✅

## Verify:

- GitHub repository mein jao
- Latest commit check karein
- `app/api/generate-qr/route.ts` file mein line 266 check karein
- `new Uint8Array(pngBuffer)` hona chahiye

