# Three premium ZionFlow demos

Routes: /local-service-demo/, /restaurant-demo/, /beauty-demo/.

The existing app.zionflow.co.za domain is served by GitHub Pages from checkpoint/verified-growth-pro. Both that publishing branch and main receive only these added folders. Existing application files and CNAME are preserved.

Local-service source is in demo-source/local-service. Run pnpm install --frozen-lockfile, pnpm check, pnpm build there and copy dist into local-service-demo at repository root. The restaurant and beauty folders are directly editable static source; no build required. Personalization instructions accompany each folder. Public demos deliberately use noindex. No paid services, database, booking provider or private HubSpot data are included. Real-client launch requires verified content, working contact/booking integration and indexing configuration.

Validation: recovered local-service DOM interaction suite passes. Browser QA covers desktop/mobile rendering, images, navigation, café filtering and local request previews. Public verification is recorded separately in the ZionFlow project status after deployment.
