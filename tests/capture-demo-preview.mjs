import { chromium } from 'playwright-core';
import { mkdir, access } from 'node:fs/promises';

const pageUrl = 'https://app.zionflow.co.za/website-demo-builder/';
const binaries = ['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium','/usr/bin/chromium-browser'];
let executablePath = '';
for (const path of binaries) {
  try { await access(path); executablePath = path; break; } catch {}
}
if (!executablePath) throw new Error('Browser not available on runner');

await mkdir('artifacts', { recursive: true });
const browser = await chromium.launch({ headless: true, executablePath, args: ['--no-sandbox','--disable-dev-shm-usage'] });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 980 }, deviceScaleFactor: 1 });
  await page.goto(pageUrl, { waitUntil: 'domcontentloaded', timeout: 40000 });
  await page.locator('#demoForm').waitFor({ timeout: 15000 });
  await page.locator('#business').fill('Example Plumbing Co.');
  await page.locator('#industry').selectOption('local');
  await page.locator('#services').fill('Emergency plumbing, geyser repairs, leak detection');
  await page.locator('#location').fill('Johannesburg');
  await page.locator('#goal').selectOption('enquiries');
  await page.locator('#style').selectOption('premium');
  await page.locator('#primary').fill('#174a76');
  await page.locator('#phone').fill('012 000 0000');
  await page.locator('#email').fill('hello@example.test');

  const svg = [
    '<svg xmlns="http://www.w3.org/2000/svg" width="320" height="160" viewBox="0 0 320 160">',
    '<rect width="320" height="160" rx="16" fill="#153450"/>',
    '<circle cx="65" cy="80" r="39" fill="#C9A227"/>',
    '<text x="65" y="91" text-anchor="middle" font-family="Arial" font-size="30" font-weight="bold" fill="#102a43">EP</text>',
    '<text x="119" y="73" font-family="Arial" font-size="24" font-weight="bold" fill="white">EXAMPLE</text>',
    '<text x="119" y="100" font-family="Arial" font-size="17" fill="#F0DDAC">PLUMBING</text>',
    '</svg>'
  ].join('');

  await page.locator('#logo').setInputFiles({
    name: 'fictional-sample-logo.svg',
    mimeType: 'image/svg+xml',
    buffer: Buffer.from(svg),
  });
  await page.locator('#demoForm button[type="submit"]').click();
  await page.locator('#demoWrap.show').waitFor({ timeout: 10000 });

  // The captured screen is the actual published Shopify-linked designer's rendered preview.
  await page.locator('#demoWrap').screenshot({
    path: 'artifacts/zionflow-demo-preview-sample.png',
    animations: 'disabled',
    timeout: 20000,
  });

  const detail = {
    previewVisible: await page.locator('#demoWrap.show').count() > 0,
    logoVisible: await page.locator('#previewMark img').count() > 0,
    requestButtonText: await page.locator('#quoteLink').textContent(),
    requestButtonEnabled: await page.locator('#quoteLink').isEnabled(),
    downloadControls: await page.locator('#shareDownloads').count(),
    extraConsent: await page.locator('#shareConsent').count(),
  };
  console.log('Live website preview screenshot captured:', JSON.stringify(detail));
  if (!detail.logoVisible || !detail.previewVisible) throw new Error('Logo or preview missing from rendered screen');
  if (detail.downloadControls || detail.extraConsent) throw new Error('Obsolete download or form confirmation controls remain');

  // Browser-test actual client-side composition changes for three distinct combinations.
  // No live enquiries are sent during this visual test.
  const variations = [
    {industry: 'beauty', goal: 'bookings', style: 'modern', business: 'Sample Studio', services: 'Haircut, Styling, Colour'},
    {industry: 'restaurant', goal: 'sales', style: 'bold', business: 'Sample Kitchen', services: 'Lunch, Dinner, Catering'},
    {industry: 'construction', goal: 'showcase', style: 'minimal', business: 'Sample Build Co', services: 'Renovations, New Builds, Extensions'},
  ];
  const designSignatures = new Set();
  for (const variant of variations) {
    await page.locator('#business').fill(variant.business);
    await page.locator('#services').fill(variant.services);
    await page.locator('#industry').selectOption(variant.industry);
    await page.locator('#goal').selectOption(variant.goal);
    await page.locator('#style').selectOption(variant.style);
    await page.locator('#regenerate').click();
    await page.locator('#sitePreview.industry-' + variant.industry + '.goal-' + variant.goal + '.style-' + variant.style).waitFor();
    await page.locator('#zfGoalSpotlight .zf-feature-intro h3').waitFor();

    const signature = await page.evaluate(() => {
      const preview = document.querySelector('#sitePreview');
      const hero = preview.querySelector('.hero');
      const heading = document.querySelector('#heroTitle');
      return {
        classes: preview.className,
        headline: heading.textContent,
        background: getComputedStyle(hero).backgroundImage + '|' + getComputedStyle(hero).backgroundColor,
        feature: document.querySelector('#zfGoalSpotlight .zf-feature-intro h3').textContent,
        visual: !!document.querySelector('#zfHeroVisual .zf-visual-frame'),
        cards: document.querySelectorAll('#serviceCards .service').length,
      };
    });
    if (!signature.visual || signature.cards !== 3) throw new Error('Personalized sections missing: ' + JSON.stringify(signature));
    const fingerprint = [signature.classes, signature.headline, signature.background, signature.feature].join('|');
    if (designSignatures.has(fingerprint)) throw new Error('Two choices generated the same preview: ' + fingerprint);
    designSignatures.add(fingerprint);
    await page.locator('#demoWrap').screenshot({
      path: 'artifacts/zionflow-demo-' + variant.industry + '-' + variant.goal + '-' + variant.style + '.png',
      animations: 'disabled',
      timeout: 20000
    });
    console.log('Distinct visual preview verified:', JSON.stringify(signature));
  }
  if (designSignatures.size !== variations.length) throw new Error('Demo variations are not distinct');

  // Restore the original fictional test form before checking the unchanged WhatsApp workflow.
  await page.locator('#business').fill('Example Plumbing Co.');
  await page.locator('#services').fill('Emergency plumbing, geyser repairs, leak detection');
  await page.locator('#industry').selectOption('local');
  await page.locator('#goal').selectOption('enquiries');
  await page.locator('#style').selectOption('premium');
  await page.locator('#regenerate').click();

  // Verify the public page really opens the prefilled WhatsApp enquiry.
  // Intercept file delivery to avoid sending a fake test lead to ZionFlow.
  const intakeRequests = [];
  await page.route('https://formsubmit.co/**', async route => {
    const request = route.request();
    if (request.method() === 'POST') {
      intakeRequests.push({
        url: request.url(),
        body: request.postDataBuffer()?.toString('utf8') || '',
      });
    }
    await route.fulfill({ status: 200, contentType: 'text/html', body: '<!doctype html><title>Test intercepted</title>' });
  });
  await page.evaluate(() => {
    window.__zfWhatsAppOpened = [];
    window.open = (url, target) => {
      window.__zfWhatsAppOpened.push({ url, target });
      return { opener: null };
    };
  });

  await page.locator('#quoteLink').click();
  const whatsapp = await page.evaluate(() => window.__zfWhatsAppOpened);
  if (whatsapp.length !== 1 || !whatsapp[0].url.startsWith('https://wa.me/27833110552?text=')) {
    throw new Error('REQUEST THIS WEBSITE did not open the established ZionFlow WhatsApp');
  }
  if (!decodeURIComponent(whatsapp[0].url).includes('R499/month, up-to-3-page website')) {
    throw new Error('The established WhatsApp enquiry message changed');
  }

  for (let attempt = 0; attempt < 30 && !intakeRequests.length; attempt++) {
    await page.waitForTimeout(300);
  }
  if (intakeRequests.length !== 1) {
    throw new Error('Expected one private background screenshot/logo request; got ' + intakeRequests.length);
  }
  const multipart = intakeRequests[0].body;
  if (!multipart.includes('name="demo_preview"') || !multipart.includes('name="logo_attachment"')) {
    throw new Error('Background request did not contain both demo screenshot and uploaded logo');
  }
  console.log('Public one-click WhatsApp and privately intercepted screenshot/logo upload: OK');
} finally {
  await browser.close();
}
