// Loaded only by the private dashboard when a certificate PDF is selected.
export async function certificatePreview(file) {
 if (!file || file.size > 8 * 1024 * 1024 || file.size === 0) throw Error('invalid-pdf');
 const data = new Uint8Array(await file.arrayBuffer());
 if (new TextDecoder().decode(data.subarray(0, 5)) !== '%PDF-') throw Error('invalid-pdf');
 const pdfjs = await import('/assets/pdfjs/pdf.min.mjs');
 pdfjs.GlobalWorkerOptions.workerSrc = '/assets/pdfjs/pdf.worker.min.mjs';
 const task = pdfjs.getDocument({data, isEvalSupported:false, useWasm:false,
  cMapUrl:'/assets/pdfjs/cmaps/', cMapPacked:true,
  standardFontDataUrl:'/assets/pdfjs/standard_fonts/'});
 let canvas;
 try {
  const pdf = await task.promise;
  const page = await pdf.getPage(1);
  const base = page.getViewport({scale:1});
  const scale = Math.min(1400 / Math.max(base.width, base.height), 2);
  const viewport = page.getViewport({scale});
  canvas = document.createElement('canvas');
  canvas.width = Math.ceil(viewport.width);
  canvas.height = Math.ceil(viewport.height);
  await page.render({canvasContext:canvas.getContext('2d'),viewport,background:'#ffffff'}).promise;
  const blob = await new Promise(resolve => canvas.toBlob(resolve,'image/png'));
  if (!blob || blob.size > 8 * 1024 * 1024) throw Error('preview-failed');
  return new File([blob], 'certificate-preview.png', {type:'image/png'});
 } finally {
  await task.destroy();
  if (canvas) { canvas.width = 0; canvas.height = 0; }
 }
}

// Update form references together only after rendering and both private uploads succeed.
export async function prepareCertificate(file, {preview = certificatePreview, upload}) {
 const image = await preview(file);
 const document = await upload(file, 'certificate');
 const thumbnail = await upload(image, 'project-image');
 return {document:document.url, preview:thumbnail.url};
}
