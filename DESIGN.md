# Umar Usmoni Portfolio — Design Contract

## 0. Research log

This document is the source of truth for the redesign. It was created before
the UI implementation so the page can evolve without drifting back to the
old cyber-security demo positioning.

### Inputs used

- Existing repository: static vanilla HTML, CSS, and JavaScript deployed on
  GitHub Pages.
- Resume: `Usmoni_Umar_Resume_2026 _1_.pdf` from the local OmniRush inbox.
- Approved brief: preserve a dark technical atmosphere, but rebuild the site
  as a premium editorial frontend portfolio.
- Frontend references read from the installed skill bundle:
  - `.../skills/frontend/references/design/README.md`
  - `.../skills/frontend/references/design/design-system-architecture.md`
  - `.../skills/frontend/references/design/redesign-skill.md`
  - `.../skills/frontend/references/design/interaction-skill.md`
  - `.../skills/frontend/references/design/ambience-skill.md`
  - `.../skills/frontend/references/perfection/README.md`

## 1. Product intent and audience

The site must make the following clear within the first viewport:

1. Umar is a **Junior Frontend / Web Developer**.
2. He builds responsive interfaces and practical digital projects.
3. He can combine frontend implementation with AI-media integration.
4. The strongest proof is the Khujand museum portal, not a simulated security
   dashboard.
5. A recruiter or client can reach him without searching through the page.

Primary audiences are recruiters, freelance clients, project collaborators,
and local organisations looking for a web/digital specialist.

## 2. Content truth and claims ledger

### Approved facts

- Location: Khujand, Tajikistan.
- Availability language from the resume: office, hybrid, or remote.
- Two years of commercial freelance work on Kwork and Workzilla, 2024–2026.
- Frontend tools: HTML5, CSS3, JavaScript, responsive and cross-browser
  layout, UI/UX, Git, GitHub Pages, and WebP optimisation.
- Digital/AI work: prompt engineering, AI-generated text/visual/audio content,
  ElevenLabs Studio AI, SMM and e-commerce media preparation.
- Museum portal: `https://khujand-museum.com`.
- Museum scale: 28,000+ exhibits, 12 halls, four historical eras, RU/TJ/EN
  content, AI audio for five halls, and 90+ images converted to WebP.
- Portfolio project: this GitHub Pages site, authored with HTML5, CSS3,
  JavaScript, and Git/GitHub Pages.
- Education: Physical-Mathematical Lyceum No. 1, 2020–2026.
- Public contact links: `zunur007@gmail.com`, `@cloudety`, GitHub, and
  LinkedIn. Phone/WhatsApp is intentionally omitted from the public page for
  now.

### Prohibited claims

Do not present these as facts or live measurements:

- cybersecurity student, future pentester, security rank, or AI engineer;
- TLS, port, firewall, uptime, ping, vulnerability, or attack-surface scans;
- “0 vulnerabilities”, “99.99% uptime”, “audit verified”, or “system secure”;
- fake lines-of-code, technology counts, or project counts;
- fabricated screenshots, museum metrics beyond the resume, or fake client
  results;
- “zero-knowledge”, “100% offline-resilient”, or “certificate hash
  authenticated” unless the page is describing a real local implementation.

## 3. Visual language

**Premium dark editorial technology.** The site should feel considered and
fast, not like a game HUD.

- Ink background with green-charcoal surfaces.
- Warm off-white text and restrained acid-lime actions.
- Muted teal for secondary metadata.
- Hairline dividers, modest radii, low-noise panels, and measured depth.
- Large left-aligned editorial headings with compact monospace metadata.
- A 12-column desktop grid and one readable column on mobile.
- Technical character comes from labels, facts, and alignment—not glitch,
  matrix rain, neon borders, or constant motion.
- Dark is the visual default. `prefers-color-scheme: light` receives a real
  light variant with the same hierarchy and contrast.

## 4. Tokens

The CSS files must consume these concepts through custom properties. No page
section should invent a one-off color, spacing value, or timing curve without
updating this contract.

| Token family | Direction |
| --- | --- |
| Background | `#0B0F0D` ink; `#121A15` surface; `#19231C` raised surface |
| Text | `#F3F0E8` primary; `#A4ADA3` muted; `#717B73` subtle |
| Accent | `#C7F36B` acid lime; `#77C9AD` muted teal |
| Lines | neutral green-gray at low alpha; stronger only for focus |
| Typography | system sans for prose/headings; system mono for metadata |
| Spacing | 4, 8, 12, 16, 24, 32, 48, 64, 96, 128px |
| Radius | 8px small, 16px medium, 24px large, pill only for status/tags |
| Container | max-width 1200px with 16–32px fluid gutters |
| Motion | 120–240ms transitions; 400–700ms reveals; ease-out only |
| Breakpoints | 390, 768, 1024, 1440, and 1920px QA widths |

## 5. Primitive inventory

Build and style these reusable primitives rather than styling each section as
an isolated visual:

- `site-header` / `mobile-nav`
- `button-primary`, `button-secondary`, and text links
- `section-intro` with eyebrow, title, and supporting copy
- `proof-strip` and `metric-rail`
- `case-study-card` / `project-card`
- `tag-list` and `meta-row`
- `capability-card`
- `certificate-card` and accessible certificate dialog
- `contact-link-group`
- `site-footer`

Every interactive primitive needs default, hover, focus-visible, pressed, and
disabled states. Touch targets are at least 44px.

## 6. Page anatomy and content jobs

1. **Header:** orient, offer direct navigation, and provide a real mobile
   menu.
2. **Hero:** name, role, location, availability, one primary CTA, one direct
   contact path.
3. **Proof strip:** show the actual frontend/AI/media toolkit without inflated
   counts.
4. **Featured work:** make the museum portal the dominant case study and show
   scale, multilingual UX, audio, and media optimisation.
5. **Selected work:** present this portfolio and any other verified project as
   honest, concise work samples.
6. **Capabilities:** group frontend, UI/UX, AI/media, and digital operations
   into understandable client-facing categories.
7. **Experience/education:** add context without turning the page into a CV
   dump.
8. **Certificates:** compact proof section using existing local assets.
9. **Contact:** direct, low-friction email/social links; no fake submission
   success state.

## 7. Interaction and motion contract

- Mobile navigation synchronises `aria-expanded`, focus, body scroll lock,
  Escape, close button, and focus return.
- Certificate previews use real buttons and a focus-managed dialog.
- Anchor navigation uses `scroll-margin-top` and respects reduced motion.
- Optional scroll reveals never hide content when JavaScript is disabled or
  reduced motion is requested.
- No preloader, custom cursor, synthetic sound, fake command terminal, fake
  scan, or continuous particle loop.
- Dynamic values use `textContent`; do not inject untrusted HTML.
- Any animation must be short, interruptible, and justified by arrival or
  state change.

## 8. Responsive and accessibility constraints

- At 390px: no horizontal overflow, no clipped labels, no tiny controls, and
  no forced two-column layout.
- At 768px: navigation becomes the mobile dialog and case-study metrics stack.
- At 1024px: preserve comfortable reading measure and stable card heights.
- At 1440/1920px: use the full editorial grid without stretching paragraphs.
- Use semantic `header`, `nav`, `main`, `section`, `article`, and `footer`.
- Exactly one visible `h1`; heading levels must be sequential.
- Every form control has a visible or screen-reader label.
- Every image has useful alt text and intrinsic dimensions.
- Every keyboard focus state is visible; motion is disabled under
  `prefers-reduced-motion: reduce`.
- Contrast must remain readable in both dark and light system themes.

## 9. SEO, performance, and asset policy

- Canonical URL: `https://umarusmomi.github.io/umarusmoni.github.io/`.
- Provide local `assets/og-image.svg`, `robots.txt`, and `sitemap.xml`.
- Do not load fonts, scripts, forms, analytics, or images from remote CDNs at
  runtime; the static site must render without network access.
- Preserve existing certificate images. Do not fabricate a museum screenshot;
  use an HTML/CSS editorial visual until an approved local image exists.
- Keep `assets/video/influentty.mp4` untouched and out of the primary flow
  unless it is explicitly reintroduced.
- Avoid layout shift with intrinsic image dimensions and no dynamic preloader.

## 10. Accepted debt

GitHub Pages is static hosting. The first redesign uses direct email/Telegram/
LinkedIn contact links instead of promising server-side form delivery. A real
form may be added later only with an approved provider and secret handling.

## 11. QA evidence contract

The release is not complete until the project can show:

- `make test` passes offline and discovers real tests;
- semantic, metadata, link-safety, claim-ledger, and local-asset checks pass;
- mobile menu and certificate dialog pass keyboard tests;
- no console/runtime errors and no external runtime requests;
- no horizontal overflow at all required widths;
- dark/light and reduced-motion captures are reviewed;
- `git diff --check` passes and runtime/attachment directories remain
  untracked and ignored.
