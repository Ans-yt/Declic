# Optional local OCR models

French and English compact LSTM models, fetched from Tesseract.js's documented model hosting:

- https://tessdata.projectnaptha.com/4.0.0_fast/fra.traineddata.gz
- https://tessdata.projectnaptha.com/4.0.0_fast/eng.traineddata.gz

Tesseract tessdata is Apache-2.0 licensed: https://github.com/tesseract-ocr/tessdata_fast/blob/main/LICENSE
Tesseract.js: https://github.com/naptha/tesseract.js (Apache-2.0).
The runtime is copied from installed npm packages by scripts/prepare-assets.mjs, with its licences.

OCR starts only after an explicit click and runs on the user's device. Images are not sent to an OCR service. The engine and models download from this app's own server; they are intentionally excluded from the initial JavaScript bundle. Output is a suggestion, never proof of authenticity or a verified qualification.
