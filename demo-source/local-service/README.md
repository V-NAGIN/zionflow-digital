# ZionFlow — local-service master demo

A frontend-first, static Vite / HTML / CSS / JavaScript template. The initial fictional brand is **FORGE — Property Specialists**, a premium Johannesburg contractor concept. This is new work, not the old barber demo.

## Preview locally

Use Node 24 (Node 22.12+ also supported) and pnpm 11:

```sh
pnpm install --frozen-lockfile
pnpm build
pnpm check
pnpm preview
```

For editing, `pnpm dev`. Output is `dist/`. No backend, database, paid API, external font service, analytics, cookie dependency or runtime subscription is required. CSS depth runs only with a fine pointer and reduced motion disabled; there is no heavy 3D engine or continuous render loop.

## Personalize a lead

Edit `src/site.config.js`: brand, descriptor, city, heading, content, verified public phone / WhatsApp, services, project content, reviews, areas and imagery. Starter vocabulary for plumbers, electricians, mechanics, cleaners, contractors and driving schools is included as `industryPresets`; use it to replace the service objects, then adapt the surrounding copy and images. The active design is a contractor example, not six completed industry demos.

Edit `src/tokens.css` for brand colours and `public/favicon.svg` for the mark. The current F mark in `src/render.js` is illustrative; replace it with the prospect’s approved logo. Hero images have 1600px and 800px versions. Replace both and update alt text. All marketing copy is compiled into HTML for readability without client-side rendering. Dynamic copy uses textContent; template text is HTML-escaped.

Keep only approved public business facts in configuration. Do not copy HubSpot private notes, contact histories, tokens or personal lead information into this public repository. Use one separate branch/copy per prospect and track the HubSpot association outside public source.

## Enquiry behaviour

The current demo does not send, store or transmit enquiries. It validates required fields and email/phone format, prepares a review dialog and optionally downloads a text copy locally. Call and WhatsApp buttons explain demo mode because no real number is configured. A selected service pre-fills the quote; selecting a suburb pre-fills location. Choosing another area clears the previous suburb.

After inserting a verified E.164 phone (`+27…`) or WhatsApp international digits, click-to-call / WhatsApp links can work. Review these numbers before activation. With `demo:false` and a verified WhatsApp number, the quote preview offers a user-initiated handoff to WhatsApp; the user still reviews and sends there. It is not a hosted form inbox. If a future backend is needed, handle validation, abuse controls, retention and consent separately. No API secrets belong in the frontend.

## Demo truthfulness and launch checklist

FORGE is fictional. The architectural image is AI-generated. Project details, coverage and testimonials are explicitly illustrative; no client ratings or completed project statistics are claimed. This build is intentionally blocked from indexing.

Before any live-business launch:

- Replace fictional branding, imagery and testimonials with approved business assets and verifiable customer proof; update demo disclosures thoughtfully.
- Set `site.demo`, title/description and the real HTTPS `canonical` in `src/site.config.js`.
- Review `public/_headers` and remove the demo `X-Robots-Tag: noindex, nofollow` only when indexing is intended.
- Change `public/robots.txt` from `Disallow: /`, then add an accurate sitemap once the real URL is known. Current demo deliberately has no invented canonical, sitemap URL or LocalBusiness address/rating markup.
- Confirm contacts, areas, actual services and any delivery promises. The preview is not an emergency service.
- Review privacy wording and real data handling; update demo-only footer/dialog language in `src/render.js` and `src/main.js`.
- Run `pnpm check`, `pnpm build`, then preview on target devices. A local preview does not validate Cloudflare response headers or Core Web Vitals on the deployed origin.

## GitHub source and Cloudflare Pages

This folder is an isolated local Git source project, ready for a dedicated GitHub repository. GitHub publication is pending: no remote repository has been created or updated. No deployment workflow is configured, so committing source does not deploy it by itself. Do not push this over the existing ZionFlow production website.

After the local preview is approved, connect the intended GitHub repository to a new Cloudflare Pages project. Use build command `pnpm build` and output directory `dist`; choose this directory as the root if using a monorepo. Select Node 24 and enable pnpm / Corepack as required by the build image. Use a free `pages.dev` hostname for the demo; no custom domain purchase is required. Static Pages can use the free tier, subject to Cloudflare’s current limits. Avoid enabling paid add-ons.

`public/_headers` is copied into the output and supplies a CSP, anti-framing, MIME sniffing prevention, privacy-sensitive feature restrictions and cache policy. Inline styles are permitted for the tiny pointer transform; inline scripts and remote scripts are not. The policy should be evaluated on Cloudflare before launch. The local Vite server does not apply Pages `_headers`.

References: [Pages Vite build configuration](https://developers.cloudflare.com/pages/framework-guides/deploy-a-vite3-project/), [Pages response headers](https://developers.cloudflare.com/pages/configuration/headers/), [Pages limits](https://developers.cloudflare.com/pages/platform/limits/).

## Assets

`public/images/architecture-*.webp` were derived from one built-in image-generation result commissioned for this demo. They illustrate a fictional architectural concept, not actual contractor work. No stock-image hotlinks, external trackers or old barber assets are used.
