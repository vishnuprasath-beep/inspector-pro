import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.resolve(__dirname, '../dist');

if (fs.existsSync(distDir)) {
  const indexPath = path.join(distDir, 'index.html');
  const spa200Path = path.join(distDir, '200.html');
  const redirectsPath = path.join(distDir, '_redirects');

  if (fs.existsSync(indexPath)) {
    fs.copyFileSync(indexPath, spa200Path);
    console.log('[Postbuild] Created dist/200.html for Surge SPA routing');
  }

  fs.writeFileSync(redirectsPath, '/* /index.html 200\n', 'utf-8');
  console.log('[Postbuild] Created dist/_redirects for Netlify / Cloudflare routing');
}
