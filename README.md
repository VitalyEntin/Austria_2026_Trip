# Austria 2026 Family Trip

A phone-first family trip dashboard for 16–30 August 2026.

## Included

- Weather-aware daily suggestions using Open-Meteo
- Editable itinerary saved separately on each device
- 67 curated attractions plus 26 food stops and 17 shopping/supply stops
- Separate Attractions, Food and Shopping collections with opening notes and navigation
- Interactive OpenStreetMap map with independent layer toggles
- Time-sensitive local events
- Personal checklist, visited places, export and import
- Offline caching for previously opened content
- Automatic GitHub Pages publishing

## Publish with GitHub Pages

1. Create a GitHub repository and add this project to its `main` branch.
2. In the repository, open **Settings → Pages**.
3. Set **Source** to **GitHub Actions**.
4. Push to `main`. The included workflow builds and publishes the website.

The website automatically adapts its links to the repository name, so it works
at `https://YOUR-USERNAME.github.io/YOUR-REPOSITORY/`.

## Local development

Requires Node.js 22 or newer and pnpm.

```bash
pnpm install
pnpm dev
```

Create the production GitHub Pages export with:

```bash
pnpm build
```
