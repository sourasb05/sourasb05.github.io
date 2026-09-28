# Personal academic website

Personal homepage for Sourasekhar Banerjee, built as plain static HTML/CSS (no build step), ready for GitHub Pages.

## Structure

- `index.html` — Home (profile, research interests, education, experience, skills)
- `publications.html` — Journal, conference, workshop, book chapter, and patent listings
- `teaching.html` — Teaching experience, pedagogical training, student supervision
- `service.html` — Peer review, invited talks, grants & funding
- `contact.html` — Contact details
- `assets/css/style.css` — Shared stylesheet
- `assets/js/main.js` — Mobile menu toggle
- `assets/img/profile.png` — Profile photo
- `assets/doc/Sourasekhar_Banerjee_CV.pdf` — Downloadable CV

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
