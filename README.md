# Plantgram UI (prototype)

Lightweight static frontend prototype for Plantgram using Alpine.js + Tailwind.

Quick start

1. Serve the `public/` folder with a static server (Python example):

```bash
cd "C:/Users/Gilbert/Desktop/univ/ciclo5/sistemasOp/TRABAJO FINAL/plantgram-ui/public"
python -m http.server 9000
```

2. Open `http://localhost:9000`.

3. The frontend expects the API at `http://localhost:3000` by default. To point to a different API, set `window.PLANTGRAM_API_URL` before the `store/index.js` script in `public/index.html`.
