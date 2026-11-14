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
  const heroPhotoInput = byId('heroPhoto');
  const builderForm = byId('demoForm');
  const demoWrap = byId('demoWrap');
  if (!button || !status || !preview || !logoInput || !builderForm || !demoWrap) return;

  const ZIONFLOW_WHATSAPP_NUMBER = '27833110552';
  const SUBMISSION_ENDPOINT = 'https://formsubmit.co/hello@zionflow.co.za';
  const ALLOWED_LOGO_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']);
  const MAX_LOGO_BYTES = 5 * 1024 * 1024;
  const MAX_PREVIEW_BYTES = 8 * 1024 * 1024;
  const MAX_COMBINED_BYTES = 9 * 1024 * 1024;
  // One reference appears in both the WhatsApp message and the private email.
  const REQUEST_REFERENCE = 'ZF-WEB-' + Date.now().toString(36).toUpperCase() + '-' +
    Math.random().toString(36).slice(2, 7).toUpperCase();

  let captureVersion = 0;
  let snapshot = null;
  let snapshotPromise = null;
  let pendingRequestVersion = -1;
  let pendingRequestKind = 'request';
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

  // WhatsApp click-to-chat accepts prefilled text, not automatic file attachments.
  // Include the full bounded customer brief and the current generated concept metadata.
  function message(kind = 'request') {
    const field = id => (byId(id)?.value || '').trim();
    const selected = id => {
      const el = byId(id);
      return (el?.selectedOptions?.[0]?.textContent || el?.value || 'Not specified').trim();
    };
    const shown = id => (byId(id)?.textContent || '').trim();
    const industryValue = field('industry') === 'other'
      ? (field('otherIndustry') || 'Other')
      : selected('industry');
    const selectedLogo = logoInput.files?.[0];
    const lines = [
      kind === 'help'
        ? 'Hi ZionFlow, I would like help building the website shown in my demo.'
        : 'Hi ZionFlow, I like my custom website demo and would like to discuss the R499/month, up-to-3-page website.',
      'Reference: ' + REQUEST_REFERENCE,
      '',
      '*WEBSITE REQUEST — CUSTOMER DETAILS*',
      'Business: ' + field('business'),
      'Industry: ' + industryValue,
      'Services: ' + field('services'),
      'Location: ' + (field('location') || 'Not provided'),
      'Phone / WhatsApp: ' + (field('phone') || 'Not provided'),
      'Email: ' + (field('email') || 'Not provided'),
      '',
      '*DESIGN CHOICES*',
      'Goal: ' + selected('goal'),
      'Style: ' + selected('style'),
      'Brand colour: ' + (field('primary') || 'Not specified'),
      'Logo uploaded: ' + (selectedLogo ? 'Yes (' + selectedLogo.name + ')' : 'No'),
      'Business photo uploaded: ' + (heroPhotoInput?.files?.[0] ? 'Yes (' + heroPhotoInput.files[0].name + ')' : 'No'),
      'Heading typography: ' + selected('headingFont'),
      'Photography style: ' + selected('imageMood'),
      '',
      '*CUSTOM WEBSITE CONTENT*',
      'Headline: ' + (field('customHeadline') || 'Designer suggestion'),
      'Main message: ' + (field('customSubheading') || 'Designer suggestion'),
      'About your business: ' + (field('aboutStory') || 'Designer suggestion'),
      'Service details: ' + (field('serviceDetails') || 'Not provided'),
      'Reasons to choose you: ' + (field('whyChoose') || 'Not provided'),
      'Frequently asked questions: ' + (field('faqDetails') || 'Not provided'),
      'Ideal customers: ' + (field('targetAudience') || 'Not provided'),
      'Business hours: ' + (field('businessHours') || 'Not provided'),
      'Requested website button: ' + (field('buttonText') || 'Designer suggestion'),
      '',
      '*PREVIEW CREATED*',
      'Preview: ' + (shown('demoIndustry') || 'Custom website concept'),
      'Website headline: ' + (shown('heroTitle') || 'Not available'),
      'Website button: ' + (shown('heroPrimary') || 'Not available'),
      '',
      '*CUSTOMER NOTES*',
      field('customerMessage') || 'No additional message',
      '',
      'This is a website concept request, not a completed website order.'
    ];
    return lines.join('\n');
  }

  function whatsappUrl() {
    return 'https://wa.me/' + ZIONFLOW_WHATSAPP_NUMBER + '?text=' + encodeURIComponent(message());
  }

  // The assistance path is available even before a preview exists or all form
  // fields are complete. It never triggers the private file submission.
  function assistanceMessage() {
    const val = id => (byId(id)?.value || '').trim();
    const select = id => (byId(id)?.selectedOptions?.[0]?.textContent || '').trim();
    const rows = [
      'Hi ZionFlow, I would like help creating a website for my business. Please guide me through the next steps.',
      '',
      'Reference: ' + REQUEST_REFERENCE,
      '*WHAT I HAVE SO FAR*'
    ];
    function add(label, value) { if (value) rows.push(label + ': ' + value); }
    add('Business', val('business'));
    add('Industry', !val('industry') ? '' : val('industry') === 'other'
      ? val('otherIndustry') || 'Other' : select('industry'));
    add('What we do', val('services'));
    add('Location', val('location'));
    add('Phone / WhatsApp', val('phone'));
    add('Email', val('email'));
    add('Website goal', val('industry') || val('business') ? select('goal') : '');
    add('Preferred design style', val('industry') || val('business') ? select('style') : '');
    add('Brand colour', val('primary'));
    add('Heading typography', val('industry') || val('business') ? select('headingFont') : '');
    add('Photography style', val('industry') || val('business') ? select('imageMood') : '');
    add('Website headline', val('customHeadline'));
    add('Website message', val('customSubheading'));
    add('About the business', val('aboutStory'));
    add('Service details', val('serviceDetails'));
    add('Reasons to choose us', val('whyChoose'));
    add('FAQs', val('faqDetails'));
    add('Ideal customers', val('targetAudience'));
    add('Business hours', val('businessHours'));
    add('Preferred website button', val('buttonText'));
    add('Customer note', val('customerMessage'));
    add('Logo chosen', logoInput.files?.[0]?.name || '');
    add('Business photo chosen', heroPhotoInput?.files?.[0]?.name || '');
    if (demoWrap.classList.contains('show')) {
      add('Website preview', (byId('demoIndustry')?.textContent || '').trim());
      add('Generated headline', (byId('heroTitle')?.textContent || '').trim());
      add('Generated button', (byId('heroPrimary')?.textContent || '').trim());
    }
    rows.push('', 'I may need help with the website wording, images or layout.');
    return rows.join('\n');
  }

  function requestAssistance() {
    if (demoWrap.classList.contains('show')) {
      // Preview help is a submission too: archive the current design and all
      // supplied details, rather than sending only a text WhatsApp enquiry.
      if (previewStale && builderForm.checkValidity?.()) byId('regenerate')?.click();
      pendingRequestVersion = captureVersion;
      pendingRequestKind = 'help';
      if (snapshot) archiveRequest(snapshot, captureVersion, 'help');
      if (captureFailed) notice('WhatsApp is ready. We will send your full written brief, but the preview image may need to be shared in chat.', true);
    }
    const url = 'https://wa.me/' + ZIONFLOW_WHATSAPP_NUMBER +
      '?text=' + encodeURIComponent(assistanceMessage());
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

  window.ZionFlowWebsiteAssistance = Object.freeze({open:requestAssistance});

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
    const images = Array.from(preview.querySelectorAll('img'));
    await Promise.all(images.filter(image => !image.complete).map(image =>
      new Promise(resolve => {
        image.addEventListener('load', resolve, {once: true});
        image.addEventListener('error', resolve, {once: true});
        setTimeout(resolve, 2500);
      })
    ));
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

  function preparedHeroPhoto() {
    const file = heroPhotoInput?.files?.[0] || null;
    if (!file) return null;
    if (file.size < 1 || file.size > 2 * 1024 * 1024 ||
        !['image/png','image/jpeg','image/webp'].includes(file.type)) {
      throw new Error('The selected business photo is invalid or exceeds 2 MB.');
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
    const essentialSize = files.png.size + (files.logo ? files.logo.size : 0);
    if (essentialSize > MAX_COMBINED_BYTES) {
      notice('WhatsApp is ready. The demo image and logo were too large for automatic delivery.', true);
      return;
    }
    const photoForDelivery = files.hero && essentialSize + files.hero.size <= MAX_COMBINED_BYTES
      ? files.hero : null;
    if (files.hero && !photoForDelivery) {
      notice('WhatsApp is ready. Please send your business photo in the chat as it exceeded the attachment limit.', true);
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
    appendHidden(form, 'business_photo_file', files.hero ? files.hero.name : 'No business photo uploaded');

    try {
      appendAttachment(form, 'demo_preview', files.png);
      if (files.logo) appendAttachment(form, 'logo_attachment', files.logo);
      if (photoForDelivery) appendAttachment(form, 'business_photo', photoForDelivery);
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

    snapshotPromise = Promise.all([captureScreenshot(), preparedLogo(), preparedHeroPhoto()])
      .then(([png, logo, hero]) => {
        if (version !== captureVersion) return;
        snapshot = {png, logo, hero};
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
