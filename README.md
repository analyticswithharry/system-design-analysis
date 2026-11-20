# CN7039 Systems Analysis Quiz

A quiz site. Questions are JSON files and diagrams are image files, all stored in this repo. Node.js is used for local preview and for checking your data before each deploy.

## Folder layout
```
package.json
server.js              local preview server (npm run dev)
scripts/validate.js    build check for JSON and image paths
netlify.toml / vercel.json
public/                everything the website serves
  index.html, results.html
  assets/css, assets/js
  assets/data/cn7039/  weeks.json + one JSON file per week
  assets/images/       week_01/, week_02/, ... (diagrams)
```

## Run locally
```
npm run dev        # http://localhost:3000
npm run validate   # check all JSON and image paths
```

## How a diagram gets into a question
1. Put the image in `public/assets/images/week_04/cache_flow.png`
2. In the week JSON, write its path from `public/`:
```json
{
  "id": 1,
  "question": "What does the diagram show?",
  "image": "assets/images/week_04/cache_flow.png",
  "imageAlt": "Short description of the diagram",
  "imageCaption": "Optional caption",
  "options": ["A", "B", "C", "D"],
  "correctAnswer": "A",
  "explanation": "Why A is right."
}
```
Optional: `"optionImages": ["assets/images/...", ...]` with one path per option.
Paths are case-sensitive on Netlify and Vercel (`Cache.PNG` is not `cache.png`). `npm run build` checks this and fails the deploy with a clear message if a path is wrong.

## Add a new week
1. Create `public/assets/data/cn7039/week_04_topic.json`
2. Add `{ "name": "Week 4 - Topic", "file": "week_04_topic.json" }` to `weeks.json`

## Deploy (free)
Push to GitHub, then:
- **Netlify:** Add new site > Import from Git > pick the repo. Settings are read from `netlify.toml`.
- **Vercel:** Add New > Project > import the repo. Settings are read from `vercel.json`.

Every `git push` redeploys automatically.

Question data must not contain emoji (the build fails if it does). Icons come from Font Awesome in the page.
