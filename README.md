# Umar Usmoni — Portfolio

A dependency-light, static portfolio for **Junior Frontend / Web Developer**
work, digital projects, and practical AI media integration. The featured case
study is the Historical Museum of Sughd Region portal:
<https://khujand-museum.com>.

The site is intentionally vanilla HTML, CSS, and JavaScript so it can deploy
directly to GitHub Pages and be rebuilt on a clean Linux machine.

## Runtime

- Python `3.13.14`, pinned in `.python-version`.
- Exact Python packages are listed in `requirements.lock`.
- Chromium is installed locally only when browser QA is needed.
- The browser is not required for the static repository checks; missing local
  Chromium tests are reported as skips instead of hidden failures.

## Local setup

```bash
python3.13 -m venv .venv
source .venv/bin/activate
python -m pip install --requirement requirements.lock
python -m playwright install chromium
```

The commands above install everything inside the project virtual environment.
No global package or system-wide browser installation is required.

## Run locally

```bash
make serve
```

Open <http://127.0.0.1:8000>.

The page is also served by the Docker image:

```bash
docker build --tag umarusmoni-portfolio .
docker run --rm --publish 8000:8000 umarusmoni-portfolio
```

## Test

`make test` is the canonical offline test command:

```bash
make test
```

The suite starts a local HTTP server and checks semantic HTML, resume-accurate
content, metadata, local assets, safe external links, keyboard interactions,
responsive overflow, fake-claim removal, and runtime errors. It never fetches
external URLs. For the full container check:

```bash
make docker-test
```

`docker-test` runs the same suite with `--network=none` after the image has
installed its pinned dependencies and Chromium system packages.

## Deploy to GitHub Pages

The repository is already configured as a project page:

```text
https://github.com/UmarUsmomi/umarusmoni.github.io
```

1. Push the `main` branch to the repository above.
2. Open **Settings → Pages**.
3. Choose **Deploy from a branch**.
4. Select `main` and the repository root.
5. Save and wait for GitHub Pages to publish.

The deployed URL is:

```text
https://umarusmomi.github.io/umarusmoni.github.io/
```

The site is a static project page; the root host URL without the repository
path is not the deployment address.

## Project structure

```text
.
├── index.html
├── DESIGN.md
├── Dockerfile
├── Makefile
├── requirements.lock
├── .python-version
├── robots.txt
├── sitemap.xml
├── favicon.svg
├── assets/
│   ├── og-image.svg
│   ├── 3d/
│   │   └── hero-model.glb
│   ├── certificates/
│   ├── fonts/
│   │   ├── jetbrains-mono-latin.woff2
│   │   ├── plus-jakarta-sans-latin.woff2
│   │   └── space-grotesk-latin.woff2
│   └── video/
├── css/
│   ├── index.css
│   ├── components.css
│   ├── sections.css
│   └── animations.css
├── js/
│   ├── hero-3d.js
│   ├── main.js
│   └── vendor/
│       └── three.min.js
└── tests/
    ├── conftest.py
    ├── test_repository.py
    └── test_site.py
```

## Content and asset policy

Visible claims are recorded in `DESIGN.md` and come from the supplied resume
or the approved project brief. The museum visual is an abstract local preview,
not a fabricated screenshot. Existing certificate images are kept as local
proof assets. The video asset remains untouched and is not part of the main
flow.

Do not commit passwords, API keys, tokens, `.env` files, browser profiles,
runtime logs, `.omo/`, `.opencode/`, `.omnirush/`, `.pytest_cache/`, or `.venv/`.
Use `.env.example` only if a future integration needs documented variable
names without values.

## License

© 2026 Umar Usmoni. All rights reserved.
