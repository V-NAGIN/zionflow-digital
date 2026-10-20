/* ZionFlow Custom Demo — local export and native file sharing.
   No user files are uploaded or transmitted until the visitor chooses a share target. */
(() => {
  'use strict';

  const byId = (id) => document.getElementById(id);
  const button = byId('quoteLink');
  const status = byId('shareStatus');
  const downloads = byId('shareDownloads');
  const demo = byId('sitePreview');
  const logoInput = byId('logo');
  if (!button || !status || !downloads || !demo || !logoInput) return;

  let snapshot = null;
  let captureVersion = 0;
  let fallbackUrls = [];

  const mimeOk = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']);
  const MAX_LOGO_BYTES = 5 * 1024 * 1024;
  const MAX_PREVIEW_BYTES = 8 * 1024 * 1024;
  const MAX_COMBINED_BYTES = 10 * 1024 * 1024;
  const ZIONFLOW_WHATSAPP_NUMBER = '27833110552';

  function safeName() {
    return (byId('business').value.trim() || 'business')
      .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0,45) || 'business';
  }

  function notice(message, isError = false) {
    status.textContent = message;
    status.classList.add('show');
    status.classList.toggle('error', isError);
  }

  function getLogo() {
    const file = logoInput.files && logoInput.files[0];
    if (!file) return null;
    if (!mimeOk.has(file.type) || file.size > MAX_LOGO_BYTES || file.size === 0) {
      throw new Error('Please use a PNG, JPG, WEBP or SVG logo smaller than 5 MB.');
    }
    return file;
  }

  function message() {
    const industrySelect = byId('industry');
    const industryValue = industrySelect.value === 'other'
      ? (byId('otherIndustry').value.trim() || 'Other')
      : (industrySelect.selectedOptions[0] && industrySelect.selectedOptions[0].textContent) || 'Not specified';
    const goal = byId('goal');
    const style = byId('style');
    const lines = [
      'Hi ZionFlow, I like my custom website demo and would like to discuss the R499/month, up-to-3-page website.',
      'Business: ' + byId('business').value.trim(),
      'Industry: ' + industryValue,
      'Services: ' + byId('services').value.trim(),
      'Location: ' + (byId('location').value.trim() || 'Not provided'),
      'Phone: ' + (byId('phone').value.trim() || 'Not provided'),
      'Email: ' + (byId('email').value.trim() || 'Not provided'),
      'Goal: ' + goal.selectedOptions[0].textContent,
      'Style: ' + style.selectedOptions[0].textContent,
      'Brand colour: ' + byId('primary').value
    ];
    return lines.join('\n').slice(0, 3600);
  }

  function readDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error('Unable to prepare the logo.'));
      reader.readAsDataURL(file);
    });
  }

  async function standaloneDemo() {
    const clone = demo.cloneNode(true);
    const logo = getLogo();
    if (logo) {
      const dataURL = await readDataURL(logo);
      for (const img of clone.querySelectorAll('img')) {
        if (img.getAttribute('src') && img.getAttribute('src').startsWith('blob:')) {
          img.setAttribute('src', dataURL);
        }
      }
    }

    const css = document.querySelector('head style').textContent;
    const html = '<!doctype html>\n<html lang="en"><head><meta charset="utf-8">' +
      '<meta name="viewport" content="width=device-width,initial-scale=1">' +
      '<title>Custom demo — ZionFlow</title><style>' + css +
      '\nbody{background:#eef1f5;padding:24px}.site{width:min(900px,100%);margin:0 auto;' +
      'border-radius:14px;overflow:hidden;box-shadow:0 12px 40px rgba(17,24,39,.12)}' +
      '</style></head><body>' + clone.outerHTML + '</body></html>';
    return new File([html], safeName() + '-website-demo.html', {type: 'text/html'});
  }

  function canvasFile(canvas) {
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('The preview image could not be created.'));
        } else {
          resolve(new File([blob], safeName() + '-website-demo.png', {type: 'image/png'}));
        }
      }, 'image/png');
    });
  }

  async function captureScreenshot() {
    if (typeof window.html2canvas !== 'function') {
      throw new Error('Preview image sharing is unavailable on this browser.');
    }

    const image = demo.querySelector('img');
    if (image && !image.complete) {
      await new Promise((resolve) => {
        image.addEventListener('load', resolve, {once: true});
        image.addEventListener('error', resolve, {once: true});
        setTimeout(resolve, 2500);
      });
    }

    const canvas = await window.html2canvas(demo, {
      backgroundColor: '#ffffff',
      useCORS: true,
      logging: false,
      scale: Math.min(1.7, Math.max(1, window.devicePixelRatio || 1)),
      onclone: (doc) => {
        const css = doc.createElement('style');
        css.textContent = '.service i{background:#f6efdf!important;}';
        doc.head.appendChild(css);
      }
    });
    const file = await canvasFile(canvas);
    if (file.size > MAX_PREVIEW_BYTES) {
      throw new Error('The generated demo image is too large to share.');
    }
    return file;
  }

  async function preparedLogo() {
    const file = getLogo();
    if (!file) return null;
    if (file.type !== 'image/svg+xml') return file;

    const img = new Image();
    const objectURL = URL.createObjectURL(file);
    try {
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = objectURL;
      });
      const canvas = document.createElement('canvas');
      const ratio = Math.min(1, 700 / Math.max(img.naturalWidth || 700, img.naturalHeight || 700));
      canvas.width = Math.max(1, Math.round((img.naturalWidth || 700) * ratio));
      canvas.height = Math.max(1, Math.round((img.naturalHeight || 700) * ratio));
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      return new Promise((resolve, reject) => canvas.toBlob((blob) => {
        if (!blob) reject(new Error('Could not convert the SVG logo to an image.'));
        else resolve(new File([blob], safeName() + '-logo.png', {type:'image/png'}));
      }, 'image/png'));
    } finally {
      URL.revokeObjectURL(objectURL);
    }
  }

  function clearDownloads() {
    for (const url of fallbackUrls) URL.revokeObjectURL(url);
    fallbackUrls = [];
    downloads.replaceChildren();
  }

  function downloadLink(file, label) {
    const a = document.createElement('a');
    const url = URL.createObjectURL(file);
    fallbackUrls.push(url);
    a.href = url;
    a.download = file.name;
    a.className = 'btn btn-ghost';
    a.textContent = label;
    downloads.appendChild(a);
  }

  function whatsappUrl() {
    return 'https://wa.me/' + ZIONFLOW_WHATSAPP_NUMBER + '?text=' + encodeURIComponent(message());
  }

  function whatsappLink(label) {
    const a = document.createElement('a');
    a.href = whatsappUrl();
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.className = 'btn btn-dark';
    a.textContent = label;
    downloads.appendChild(a);
  }

  async function prepare() {
    const version = ++captureVersion;
    snapshot = null;
    clearDownloads();
    button.disabled = false;
    notice('Your demo is ready to request on WhatsApp. Preparing optional files for you to download or share…');

    try {
      getLogo();
      const [html, logo, png] = await Promise.all([
        standaloneDemo(),
        preparedLogo(),
        captureScreenshot().catch(() => null)
      ]);
      if (version !== captureVersion) return;

      if (png && logo && png.size + logo.size > MAX_COMBINED_BYTES) {
        throw new Error('Combined logo and preview size is too large. Please upload a smaller logo.');
      }
      snapshot = {png, logo, html};
      button.disabled = false;
      downloadLink(png || html, 'DOWNLOAD MY DEMO');
      if (logo) downloadLink(logo, 'DOWNLOAD MY LOGO');

      if (typeof navigator.share === 'function') {
        const shareButton = document.createElement('button');
        shareButton.type = 'button';
        shareButton.className = 'btn btn-ghost';
        shareButton.textContent = 'SHARE DEMO & LOGO';
        shareButton.addEventListener('click', shareFiles);
        downloads.appendChild(shareButton);
      }

      whatsappLink('OPEN ZIONFLOW WHATSAPP');
      notice('Tap REQUEST THIS WEBSITE to open ZionFlow WhatsApp with your enquiry filled in. Nothing is sent until you tap Send. Download and attach your demo/logo if you want to share the files.');
    } catch (error) {
      if (version !== captureVersion) return;
      button.disabled = false;
      whatsappLink('OPEN ZIONFLOW WHATSAPP');
      notice('Your WhatsApp request is ready. Optional demo-file export is unavailable; you can still request the website. ' + (error && error.message || ''), true);
    }
  }

  async function shareFiles() {
    if (!snapshot) {
      notice('Please generate your custom demo first.', true);
      return;
    }

    const files = [snapshot.png || snapshot.html, snapshot.logo].filter(Boolean);
    if (navigator.share && (!navigator.canShare || navigator.canShare({files}))) {
      try {
        await navigator.share({
          title: 'My ZionFlow custom website demo',
          text: message(),
          files
        });
        notice('Your share sheet has closed. Please confirm that you selected ZionFlow (+27 83 311 0552) and tapped Send; delivery cannot be confirmed from this page.');
        return;
      } catch (err) {
        if (err && err.name === 'AbortError') {
          notice('Sharing cancelled. You can tap SHARE DEMO & LOGO to try again.');
          return;
        }
      }
    }

    clearDownloads();
    downloadLink(snapshot.png || snapshot.html, 'DOWNLOAD MY DEMO');
    if (snapshot.logo) downloadLink(snapshot.logo, 'DOWNLOAD MY LOGO');
    whatsappLink('OPEN ZIONFLOW WHATSAPP');
    notice('This browser cannot send attachments directly into WhatsApp. Download the files below, then attach them to your WhatsApp message. Nothing has been sent yet.');
  }

  function requestDemo() {
    if (!byId('demoWrap').classList.contains('show') || !byId('demoForm').reportValidity()) {
      notice('Please generate your custom demo and check your business details first.', true);
      return;
    }

    // A direct, user-initiated navigation. Embedded pages must not try
    // to display WhatsApp inside their own iframe.
    const url = whatsappUrl();
    notice('Opening ZionFlow WhatsApp with your request filled in. Check the message and tap Send in WhatsApp. Demo/logo files must be attached separately.');
    try {
      const opened = window.open(url, '_blank');
      if (opened) {
        try { opened.opener = null; } catch (_) {}
      } else {
        window.location.assign(url);
      }
    } catch (_) {
      window.location.assign(url);
    }
  }

  document.addEventListener('zf-demo-rendered', prepare);
  button.addEventListener('click', requestDemo);
})();
