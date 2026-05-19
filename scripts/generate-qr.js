// scripts/generate-qr.js
const QRCode = require('qrcode')
const path = require('path')

const url = process.argv[2]

if (!url) {
  console.error('Error: URL argument is required')
  console.error('Usage: node scripts/generate-qr.js <deployed-url>')
  console.error('Example: node scripts/generate-qr.js https://your-app.vercel.app')
  process.exit(1)
}

const outputPath = path.join(__dirname, '..', 'qr-code.png')

QRCode.toFile(outputPath, url, { width: 400, margin: 2 }, (err) => {
  if (err) {
    console.error('Failed to generate QR code:', err.message)
    process.exit(1)
  }
  console.log(`QR code written to: ${outputPath}`)
  console.log(`Encodes URL: ${url}`)
})
