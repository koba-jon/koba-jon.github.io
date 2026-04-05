Homepage: https://koba-jon.github.io

## Analytics (lightweight)

This site uses a lightweight, privacy-conscious page/event counter powered by CountAPI.

- Config file: `data/analytics.json`
- Pageview metric: `page.<slug>`
- Navigation metrics (for funnel optimization): `nav.to-projects`, `nav.to-publications`
- Outbound metrics on key pages: `projects.outbound`, `publications.outbound`

You can disable tracking by setting `"enabled": false` in `data/analytics.json`.
