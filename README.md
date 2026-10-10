# Personal academic website

Personal homepage for Sourasekhar Banerjee, built as plain static HTML/CSS (no build step), ready for GitHub Pages.

## Structure

- `index.html` — Home (profile, recent news, research interests, experience, education, skills)
- `news.html` — Full news list with category filters
- `resources.html` — Tools, cheat sheets and tutorials
- `conferences.html` — Upcoming AI, IoT/security and communications conferences
- `publications.html` — Journal, conference, workshop, book chapter, and patent listings
- `teaching.html` — Teaching experience, pedagogical training, student supervision
- `service.html` — Peer review, invited talks, grants & funding
- `contact.html` — Contact details
- `assets/css/style.css` — Shared stylesheet
- `assets/js/main.js` — Mobile menu, dark-mode toggle, news rendering
- `assets/js/news.js` — **News items — edit this file to add activities** (newest first)
- `assets/img/profile.png` — Profile photo
- `assets/doc/Sourasekhar_Banerjee_CV.pdf` — Downloadable CV

## Conference list

`assets/js/conferences.js` is generated — don't edit it by hand.

- It is refreshed every Monday by the GitHub Action in `.github/workflows/update-conferences.yml`
  (or run it manually from the repo's **Actions** tab → *Update conferences* → *Run workflow*).
- To refresh locally: `pip install pyyaml && python3 scripts/update_conferences.py`
- To add or remove a conference from ccf-deadlines, edit `SELECTED` in `scripts/update_conferences.py`.
- Conferences not in ccf-deadlines (e.g. IoTDI, EWSN, EuCNC) live in `data/conferences_extra.yml`.

## Local preview

```sh
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Deploying to GitHub Pages

1. Create a GitHub repository named `<your-username>.github.io` (for a user site) or any name (for a project site).
2. Push this repo to it.
3. In GitHub repo Settings → Pages, set the source to the `main` branch, root folder.
4. The site will be live at `https://<your-username>.github.io/` (user site) or `https://<your-username>.github.io/<repo-name>/` (project site).
