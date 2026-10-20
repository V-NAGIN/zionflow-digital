/* ZionFlow Custom Website Demo
 * Primary customer action: open the established WhatsApp enquiry.
 * Separately archive the generated screenshot and uploaded logo for ZionFlow
 * when the visitor requests the website. No extra customer-facing download flow.
 */
(() => {
  'use strict';

  const byId = id => document.getElementById(id);
  const button = byId('quoteLink');
  const status = byId('shareStatus');
  const preview = byId('sitePreview');
  const logoInput = byId('logo');
  const builderForm = byId('demoForm');
  const demoWrap = byId('demoWrap');
  if (!button || !status || !preview || !logoInput || !builderForm || !demoWrap) return;

  const ZIONFLOW_WHATSAPP_NUMBER = '27833110552';
  const SUBMISSION_ENDPOINT = 'https://formsubmit.co/hello@zionflow.co.za';
  const ALLOWED_LOGO_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']);
  const MAX_LOGO_BYTES = 5 * 1024 * 1024;
  const MAX_PREVIEW_BYTES = 8 * 1024 * 1024;
  const MAX_COMBINED_BYTES = 9 * 1024 * 1024;

  let captureVersion = 0;
  let snapshot = null;
  let snapshotPromise = null;
  let pendingRequestVersion = -1;
  let submittedVersion = -1;
  let previewStale = false;
  let captureFailed = false;

  function safeName() {
    return (byId('business').value.trim() || 'business').toLowerCase()
      .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 45) || 'business';
  }

  function notice(message, isError = false) {
    status.textContent = message;
    status.classList.toggle('show', !!message);
    status.classList.toggle('error', !!message && isError);
  }

  function logoFile() {
    const file = logoInput.files && logoInput.files[0];
    if (!file) return null;
    if (file.size < 1 || file.size > MAX_LOGO_BYTES || !ALLOWED_LOGO_TYPES.has(file.type)) {
      throw new Error('Please choose a PNG, JPG, WEBP or SVG logo under 5 MB.');
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

  function whatsappUrl() {
    return 'https://wa.me/' + ZIONFLOW_WHATSAPP_NUMBER + '?text=' + encodeURIComponent(message());
  }

  function canvasFile(canvas) {
    return new Promise((resolve, reject) => {
      canvas.toBlob(blob => {
        if (!blob) return reject(new Error('Could not create the preview image.'));
        resolve(new File([blob], safeName() + '-website-demo.png', {type: 'image/png'}));
      }, 'image/png');
    });
  }

  async function captureScreenshot() {
    if (typeof window.html2canvas !== 'function') {
      throw new Error('The preview capture service did not load.');
    }
    const image = preview.querySelector('img');
    if (image && !image.complete) {
      await new Promise(resolve => {
        image.addEventListener('load', resolve, {once: true});
        image.addEventListener('error', resolve, {once: true});
        setTimeout(resolve, 2500);
      });
    }
    const canvas = await window.html2canvas(preview, {
      backgroundColor: '#ffffff',
      useCORS: true,
      logging: false,
      scale: Math.min(1.7, Math.max(1, window.devicePixelRatio || 1)),
      onclone: doc => {
        const css = doc.createElement('style');
        css.textContent = '.service i{background:#f6efdf!important;}';
        doc.head.appendChild(css);
      }
    });
    const file = await canvasFile(canvas);
    if (file.size < 1 || file.size > MAX_PREVIEW_BYTES) {
      throw new Error('The website preview image is too large to send.');
    }
    return file;
  }

  async function preparedLogo() {
    const file = logoFile();
    if (!file || file.type !== 'image/svg+xml') return file;

    const image = new Image();
    const objectUrl = URL.createObjectURL(file);
    try {
      await new Promise((resolve, reject) => {
        image.onload = resolve;
        image.onerror = () => reject(new Error('Could not read the uploaded logo.'));
        image.src = objectUrl;
      });
      const canvas = document.createElement('canvas');
      const longest = Math.max(image.naturalWidth || 700, image.naturalHeight || 700);
      const ratio = Math.min(1, 700 / longest);
      canvas.width = Math.max(1, Math.round((image.naturalWidth || 700) * ratio));
      canvas.height = Math.max(1, Math.round((image.naturalHeight || 700) * ratio));
      canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
      return await canvasFileFromLogo(canvas);
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  }

  function canvasFileFromLogo(canvas) {
    return new Promise((resolve, reject) => canvas.toBlob(blob => {
      if (!blob) return reject(new Error('Could not convert the uploaded logo.'));
      resolve(new File([blob], safeName() + '-logo.png', {type: 'image/png'}));
    }, 'image/png'));
  }

  function appendHidden(form, name, value) {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = name;
    input.value = String(value ?? '');
    form.appendChild(input);
  }

  function appendAttachment(form, fieldName, file) {
    if (typeof DataTransfer !== 'function') throw new Error('File attachment support is unavailable.');
    const input = document.createElement('input');
    input.type = 'file';
    input.name = fieldName;
    input.hidden = true;
    const transfer = new DataTransfer();
    transfer.items.add(file);
    input.files = transfer.files;
    if (!input.files || input.files.length !== 1) throw new Error('The file could not be attached.');
    form.appendChild(input);
  }

  // Native multipart upload in a non-visible frame preserves attachment support.
  // Unlike the old implementation, the visitor never has to visit FormSubmit.
  // FormSubmit does not provide a delivery receipt here; do not claim delivery.
  function archiveRequest(files, version) {
    if (!files || !files.png || submittedVersion === version) return;
    if (files.png.size + (files.logo ? files.logo.size : 0) > MAX_COMBINED_BYTES) {
      notice('WhatsApp is ready. The demo image and logo were too large for automatic delivery.', true);
      return;
    }

    const frame = document.createElement('iframe');
    frame.name = 'zf-demo-intake-' + Date.now() + '-' + Math.round(Math.random() * 1e6);
    frame.title = 'ZionFlow background request delivery';
    frame.setAttribute('aria-hidden', 'true');
    frame.tabIndex = -1;
    frame.style.cssText = 'position:absolute;width:0;height:0;border:0;opacity:0;pointer-events:none;';
    document.body.appendChild(frame);

    const form = document.createElement('form');
    form.method = 'POST';
    form.action = SUBMISSION_ENDPOINT;
    form.target = frame.name;
    form.enctype = 'multipart/form-data';
    form.hidden = true;

    appendHidden(form, '_subject', 'ZionFlow website preview and logo - ' + safeName());
    appendHidden(form, '_template', 'table');
    appendHidden(form, '_captcha', 'false');
    appendHidden(form, '_honey', '');
    appendHidden(form, 'business_name', byId('business').value.trim());
    appendHidden(form, 'email', byId('email').value.trim());
    appendHidden(form, 'phone', byId('phone').value.trim());
    appendHidden(form, 'message', message());
    appendHidden(form, 'source_page', window.location.origin + window.location.pathname);
    appendHidden(form, 'preview_image_file', files.png.name);
    appendHidden(form, 'logo_image_file', files.logo ? files.logo.name : 'No logo uploaded');

    try {
      appendAttachment(form, 'demo_preview', files.png);
      if (files.logo) appendAttachment(form, 'logo_attachment', files.logo);
      document.body.appendChild(form);
      submittedVersion = version;
      form.submit();
      // Leave the form/frame alive long enough for the multipart POST to finish.
      window.setTimeout(() => { form.remove(); frame.remove(); }, 120000);
    } catch (_) {
      submittedVersion = -1;
      form.remove();
      frame.remove();
      notice('WhatsApp is ready, but the demo files could not be delivered automatically. ZionFlow can request them in the chat.', true);
    }
  }

  async function prepare() {
    const version = ++captureVersion;
    snapshot = null;
    previewStale = false;
    captureFailed = false;
    button.disabled = false;
    button.textContent = 'REQUEST THIS WEBSITE';
    notice('');

    snapshotPromise = Promise.all([captureScreenshot(), preparedLogo()])
      .then(([png, logo]) => {
        if (version !== captureVersion) return;
        snapshot = {png, logo};
        if (pendingRequestVersion === version) archiveRequest(snapshot, version);
      })
      .catch(() => {
        if (version !== captureVersion) return;
        snapshot = null;
        captureFailed = true;
        if (pendingRequestVersion === version) {
          notice('WhatsApp is ready. We could not automatically save your preview image; ZionFlow can request it in the chat.', true);
        }
      });
    await snapshotPromise;
  }

  function requestDemo() {
    if (!demoWrap.classList.contains('show') || !builderForm.reportValidity()) {
      notice('Please generate your preview and check your business details first.', true);
      return;
    }

    if (previewStale) {
      // Ensure the saved screenshot matches the newest form entries.
      byId('regenerate').click();
    }

    const version = captureVersion;
    pendingRequestVersion = version;

    // Start file archiving without sending visitors to a third-party form.
    // If preview capture is still running, archiveRequest runs after it finishes.
    if (snapshot) archiveRequest(snapshot, version);
    if (captureFailed) {
      notice('WhatsApp is ready. We could not automatically save your preview image; ZionFlow can request it in the chat.', true);
    }

    // Preserve the original one-click WhatsApp journey and exact established
    // WhatsApp message. The customer reviews and taps Send in WhatsApp.
    const url = whatsappUrl();
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

  builderForm.addEventListener('input', event => {
    if (!demoWrap.classList.contains('show')) return;
    if (event.target && event.target.id === 'logo') return;
    previewStale = true;
  });

  document.addEventListener('zf-demo-rendered', prepare);
  button.addEventListener('click', requestDemo);
})();
