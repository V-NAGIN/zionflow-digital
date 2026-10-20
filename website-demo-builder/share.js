/* ZionFlow Custom Demo — customer-initiated quote submissions with demo/logo attachments.
   No files leave the browser until the visitor consents and requests the website. */
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
  const MAX_COMBINED_BYTES = 9 * 1024 * 1024; // Applies to optional email attachments only.
  const SUBMISSION_ENDPOINT = 'https://formsubmit.co/hello@zionflow.co.za';
  const ZIONFLOW_WHATSAPP_NUMBER = '27833110552'; // Existing ZionFlow WhatsApp target.

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
      'Brand colour: ' + byId('primary').value,
      'Logo uploaded: ' + (logoInput.files && logoInput.files.length ? 'Yes' : 'No'),
      'Customer message: ' + (byId('customerMessage').value.trim() || 'No additional message')
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
    const existing = downloads.querySelector && downloads.querySelector('[data-zf-whatsapp]');
    if (existing) {
      existing.href = whatsappUrl();
      existing.textContent = label;
      return;
    }

    const a = document.createElement('a');
    a.href = whatsappUrl();
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.className = 'btn btn-dark';
    a.textContent = label;
    a.setAttribute('data-zf-whatsapp', 'true');
    downloads.appendChild(a);
  }

  function emailOption() {
    const emailButton = document.createElement('button');
    emailButton.type = 'button';
    emailButton.className = 'btn btn-ghost';
    emailButton.textContent = 'EMAIL DEMO & LOGO';
    emailButton.addEventListener('click', emailRequestDemo);
    downloads.appendChild(emailButton);
  }

  async function prepare() {
    const version = ++captureVersion;
    snapshot = null;
    clearDownloads();

    // Requesting through WhatsApp does not depend on screenshot capture.
    button.disabled = false;
    notice('Your website demo is ready. REQUEST THIS WEBSITE opens ZionFlow WhatsApp with your enquiry filled in. Optional demo files are being prepared.');

    try {
      getLogo();
      const [html, logo, png] = await Promise.all([
        standaloneDemo(),
        preparedLogo(),
        captureScreenshot()
      ]);
      if (version !== captureVersion) return;

      if (png.size + (logo ? logo.size : 0) > MAX_COMBINED_BYTES) {
        throw new Error('Your preview and logo are too large to email together.');
      }

      snapshot = {png, logo, html};
      downloadLink(html, 'DOWNLOAD INTERACTIVE DEMO');
      downloadLink(png, 'DOWNLOAD DEMO IMAGE');
      if (logo) downloadLink(logo, 'DOWNLOAD MY LOGO');
      emailOption();
      addDeviceShareOption();
      notice('Ready. Tap REQUEST THIS WEBSITE to open ZionFlow WhatsApp. To send your demo image or logo, attach the downloaded files in WhatsApp or use the optional email button.');
    } catch (error) {
      if (version !== captureVersion) return;
      snapshot = null;
      button.disabled = false;
      notice('Your WhatsApp request is ready. Optional demo-file sharing is unavailable in this browser; you can still tap REQUEST THIS WEBSITE.');
    }
  }

  function appendHidden(form, name, value) {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = name;
    input.value = String(value || '');
    form.appendChild(input);
  }

  function appendAttachment(form, fieldName, file) {
    if (typeof DataTransfer !== 'function') {
      throw new Error('This browser cannot attach the files automatically. Use another recent browser or send them using the sharing options.');
    }
    const input = document.createElement('input');
    input.type = 'file';
    input.name = fieldName;
    input.hidden = true;

    const files = new DataTransfer();
    files.items.add(file);
    input.files = files.files;
    if (!input.files || input.files.length !== 1) {
      throw new Error('Could not attach the demo files. Please retry in another browser.');
    }

    form.appendChild(input);
  }

  function requestDemo() {
    if (!byId('demoWrap').classList.contains('show') || !byId('demoForm').reportValidity()) {
      notice('Please generate your demo and check your business details first.', true);
      return;
    }

    // A direct user-initiated WhatsApp navigation, including when this builder
    // is embedded in another page. No email upload happens from this button.
    const url = whatsappUrl();
    whatsappLink('OPEN ZIONFLOW WHATSAPP');
    notice('Opening ZionFlow WhatsApp with your request prefilled. Review it and tap Send in WhatsApp. Demo files are not automatically attached.');

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

  function emailRequestDemo() {
    if (!snapshot || !snapshot.png) {
      notice('Please generate your preview and wait for the demo image to finish preparing.', true);
      return;
    }

    const consent = byId('shareConsent');
    if (!consent || !consent.checked) {
      notice('Please tick the consent box before sending your logo and website demo to ZionFlow.', true);
      if (consent) consent.focus();
      return;
    }

    if (!byId('demoForm').reportValidity()) {
      notice('Please check your business details before requesting the website.', true);
      return;
    }

    if (!byId('phone').value.trim() && !byId('email').value.trim()) {
      notice('Please provide a contact phone number or email so ZionFlow can reply to your request.', true);
      byId('phone').focus();
      return;
    }

    const combinedSize = snapshot.png.size + (snapshot.logo ? snapshot.logo.size : 0);
    if (combinedSize > MAX_COMBINED_BYTES) {
      notice('Your attachments exceed the email limit. Please upload a smaller logo and update your preview.', true);
      return;
    }

    const form = document.createElement('form');
    form.method = 'POST';
    form.action = SUBMISSION_ENDPOINT;
    form.enctype = 'multipart/form-data';
    form.target = '_blank';
    form.rel = 'noopener';
    form.hidden = true;

    appendHidden(form, '_subject', 'ZionFlow website demo request - ' + safeName());
    appendHidden(form, '_template', 'table');
    appendHidden(form, '_honey', '');
    appendHidden(form, 'business_name', byId('business').value.trim());
    appendHidden(form, 'email', byId('email').value.trim());
    appendHidden(form, 'phone', byId('phone').value.trim());
    appendHidden(form, 'message', message());
    appendHidden(form, 'source_page', window.location.origin + window.location.pathname);
    appendHidden(form, 'attachments', 'demo_preview and uploaded business logo');

    try {
      appendAttachment(form, 'demo_preview', snapshot.png);
      if (snapshot.logo) appendAttachment(form, 'logo_attachment', snapshot.logo);
    } catch (error) {
      notice(error.message || 'Could not prepare attachments.', true);
      clearDownloads();
      downloadLink(snapshot.png, 'DOWNLOAD MY DEMO');
      if (snapshot.logo) downloadLink(snapshot.logo, 'DOWNLOAD MY LOGO');
      whatsappLink('OPEN ZIONFLOW WHATSAPP');
      return;
    }

    document.body.appendChild(form);
    try {
      // A normal multipart form is used so both uploaded files reach the email
      // service. The provider may show CAPTCHA or first-time activation.
      form.submit();
      clearDownloads();
      downloadLink(snapshot.html, 'DOWNLOAD INTERACTIVE DEMO');
      whatsappLink('FOLLOW UP ON WHATSAPP');
      addDeviceShareOption();

      notice('Your submission has opened in a new tab. Complete any verification shown there to send the message, website demo image and uploaded logo together to ZionFlow. A WhatsApp follow-up is optional.');
    } catch (error) {
      notice('The request could not be opened. Please try again or use the sharing options below.', true);
      clearDownloads();
      downloadLink(snapshot.png, 'DOWNLOAD MY DEMO');
      if (snapshot.logo) downloadLink(snapshot.logo, 'DOWNLOAD MY LOGO');
      whatsappLink('OPEN ZIONFLOW WHATSAPP');
    } finally {
      window.setTimeout(() => form.remove(), 1000);
    }
  }

  function addDeviceShareOption() {
    if (!snapshot || !snapshot.png || typeof navigator.share !== 'function') return;
    const files = [snapshot.png, snapshot.logo].filter(Boolean);
    if (navigator.canShare && !navigator.canShare({files})) return;

    const shareButton = document.createElement('button');
    shareButton.type = 'button';
    shareButton.className = 'btn btn-ghost';
    shareButton.textContent = 'SHARE DEMO & LOGO';
    shareButton.addEventListener('click', async () => {
      try {
        await navigator.share({
          title: 'My ZionFlow custom website demo',
          text: message(),
          files
        });
        notice('The device share sheet has closed. Select the ZionFlow contact and tap Send in your chosen app. File delivery cannot be confirmed from this page.');
      } catch (error) {
        if (error && error.name === 'AbortError') return;
        notice('This device could not share the attachments. You can still download the files or use the optional email button.', true);
      }
    });
    downloads.appendChild(shareButton);
  }

  const originalForm = byId('demoForm');
  originalForm.addEventListener('input', (event) => {
    if (event.target && event.target.id === 'logo') return;
    if (!byId('demoWrap').classList.contains('show')) return;
    snapshot = null;
    captureVersion += 1;
    button.disabled = true;
    notice('Your business details changed. Tap UPDATE PREVIEW to make sure ZionFlow receives the exact demo you approve.');
  });
  document.addEventListener('zf-demo-rendered', prepare);
  button.addEventListener('click', requestDemo);
})();
