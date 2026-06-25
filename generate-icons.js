import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const svgPath = path.join(process.cwd(), 'public', 'icon.svg');
const publicDir = path.join(process.cwd(), 'public');

// Ensure public directory exists
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

async function renderIcons() {
  try {
    console.log('Generating PNG icons from SVG...');
    
    // 192x192 Icon
    await sharp(svgPath)
      .resize(192, 192)
      .toFile(path.join(publicDir, 'icon-192.png'));
    console.log('✔ Successfully created icon-192.png');

    // 512x512 Icon
    await sharp(svgPath)
      .resize(512, 512)
      .toFile(path.join(publicDir, 'icon-512.png'));
    console.log('✔ Successfully created icon-512.png');

    // Maskable Icon (adding 10% padding to guarantee no cropping on Android)
    const svgContent = fs.readFileSync(svgPath, 'utf-8');
    // We create a version of the SVG that has 15% padding around the main element
    // Let's load the SVG and scale down the inside graphic, or we can just pad the image.
    // In sharp, we can easily add padding (extend) to a resized image
    await sharp(svgPath)
      .resize(400, 400) // Scale content down slightly
      .extend({
        top: 56,
        bottom: 56,
        left: 56,
        right: 56,
        background: { r: 15, g: 23, b: 42, alpha: 1 } // slate-900 background #0f172a
      })
      .toFile(path.join(publicDir, 'maskable_icon.png'));
    console.log('✔ Successfully created maskable_icon.png');

    console.log('App icon rendering completed!');
  } catch (error) {
    console.error('Error generating icons:', error);
  }
}

renderIcons();
