import { mkdirSync, copyFileSync, readdirSync } from 'node:fs';
mkdirSync('assets/vendor/ocr', { recursive: true });
copyFileSync('node_modules/tesseract.js/dist/worker.min.js', 'assets/vendor/ocr/worker.min.js');
copyFileSync('node_modules/tesseract.js/LICENSE.md', 'assets/vendor/ocr/LICENSE-tesseract.txt');
copyFileSync('node_modules/tesseract.js-core/LICENSE', 'assets/vendor/ocr/LICENSE-core.txt');
for (const file of readdirSync('node_modules/tesseract.js-core')) if (/\.wasm(?:\.js)?$/.test(file)) copyFileSync('node_modules/tesseract.js-core/' + file, 'assets/vendor/ocr/' + file);
