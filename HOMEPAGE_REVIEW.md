# Homepage Improvement Review

## 1. Clarify first-view value proposition
- Add one concise sentence near the hero section that says what visitors should do next (e.g., “See publications”, “View open-source projects”, “Contact for collaboration”).
- The site has rich content, but first-time visitors may benefit from stronger guidance to the next action.

## 2. Strengthen SEO basics
- Add `<meta name="description" ...>` for each page.
- Add Open Graph and X/Twitter card tags so links render better when shared.
- Add `canonical` URLs and a simple `sitemap.xml`/`robots.txt`.

## 3. Improve accessibility
- Add a skip link (`Skip to main content`) at the beginning of each page.
- Ensure visible keyboard focus styles for buttons/links.
- Add more descriptive `alt` text where images carry meaning.
- Review heading hierarchy and landmark usage across pages.

## 4. Improve contact conversion
- Keep the anti-scraping displayed email format, but add a clear one-click `mailto:` fallback in case clipboard API is blocked.
- Optionally add expected response time and preferred inquiry topics next to contact methods.

## 5. Content freshness and trust signals
- Add “Last updated” date on important pages.
- Surface selected impact metrics (citations, downloads, stars) with update cadence.
- Consider adding short summaries for selected publications/projects (problem → method → outcome).

## 6. Performance and resilience
- Add `defer` to non-blocking scripts when possible.
- Consider self-hosting or preconnecting font resources to reduce render delay.
- Add lazy-loading for non-critical images if additional media is introduced.

## 7. International audience optimization
- Since `name_ja` exists in data, consider a lightweight bilingual switch (EN/JA), at least for hero/about/contact.
- If not fully bilingual, add a short Japanese summary section for local visitors.

## 8. UX polish opportunities
- Add active-page announcements for screen readers (e.g., `aria-current="page"` on current nav link).
- Improve publication discoverability with filters (year, venue, role) and quick anchor links.
- Add optional “Back to top” button on long pages.
