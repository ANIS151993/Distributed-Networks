# Implementation Guide

## Purpose

This repository has been rebuilt as a static, GitHub Pages-ready research artifact for the paper:

**Auction-Based Dynamic Resource Allocation for Optimized Edge Computing in Distributed Networks**

The implementation focuses on:

- preserving facts from the local PDF
- exposing the paper through a polished `docs/` portal
- keeping deployment simple with plain HTML, CSS, and JavaScript
- making chart assumptions explicit when the PDF provides figures but not raw numeric tables

---

## Audit Summary

Initial local contents:

- `codex.md`
- `Auction_Based_Dynamic_Resource_Allocation_for_Optimized_Edge_Computing_in_Distributed_Networks.pdf`
- `Auction_Based_Dynamic_Resource_Allocation_for_Optimized_Edge_Computing_in_Distributed_Networks.pdf:Zone.Identifier`

What was extracted from the local PDF:

- title, authors, affiliations, and abstract
- methodology and equations
- experimental setup
- task demand table
- task-to-node allocation table
- average performance metrics
- embedded paper figures

Reference material also inspected:

- follow-up repository structure from `Serverless-Intelligent-Firewall-Research-2`

---

## Repository Layout

```text
.
├── docs/
│   ├── index.html
│   ├── report.html
│   ├── poster.html
│   ├── styles.css
│   ├── script.js
│   └── assets/
│       ├── data/
│       │   └── research-data.json
│       ├── images/
│       └── papers/
│           └── distributed-networks-ieee-paper.pdf
├── scripts/
│   └── check-js.sh
├── README.md
├── IMPLEMENTATION_GUIDE.md
└── .gitignore
```

---

## Data Model

The shared data source is:

- [`docs/assets/data/research-data.json`](docs/assets/data/research-data.json)

It stores:

- project metadata and links
- author information
- abstract and contribution text
- task demand values
- allocation mappings
- average metrics from the paper
- representative-run values derived from figure labels
- approximate task-volume efficiency values digitized from Figure 6
- integrity notes and BibTeX citation

### Important integrity note

The PDF includes:

- average metrics across 20 randomized trials
- representative-run visual figures

Those are not forced into a single synthetic dataset. The site keeps them separate and labels the figure-derived values clearly.

---

## Pages

### `docs/index.html`

Primary research portal with:

- landing hero
- overview and motivation
- framework explanation
- experimental setup
- interactive analytics
- results gallery
- video embed
- citation and publication links

### `docs/report.html`

Long-form HTML report with:

- abstract and contributions
- experiment tables
- reproduced allocation/performance tables
- extracted paper figures
- citation block

### `docs/poster.html`

Poster-style summary page for:

- portfolio display
- quick review
- conference-style web presentation

---

## Local Preview

Run a simple HTTP server from the repository root:

```bash
python3 -m http.server 8000
```

Open:

- <http://localhost:8000/docs/>
- <http://localhost:8000/docs/report.html>
- <http://localhost:8000/docs/poster.html>

Why an HTTP server is required:

- `docs/script.js` fetches `docs/assets/data/research-data.json`
- opening `index.html` directly from the filesystem may block `fetch()` in some browsers

---

## JavaScript Sanity Check

Run:

```bash
bash scripts/check-js.sh
```

Optional custom Node path:

```bash
NODE_BIN=/absolute/path/to/node bash scripts/check-js.sh
```

---

## GitHub Pages Deployment

1. Push the repository to GitHub.
2. Go to `Settings -> Pages`.
3. Choose `Deploy from a branch`.
4. Select branch `main`.
5. Select folder `/docs`.
6. Save.
7. Wait for the Pages build to complete.

Expected URL:

```text
https://anis151993.github.io/Distributed-Networks/
```

---

## Updating Content

### To edit narrative content

Modify:

- `docs/index.html`
- `docs/report.html`
- `docs/poster.html`
- `README.md`

### To update structured research data

Modify:

- `docs/assets/data/research-data.json`

This automatically feeds:

- abstract text
- contribution list
- task table
- integrity notes
- task explorer
- chart inputs
- citation block

### To replace visual assets

Store images in:

- `docs/assets/images/`

Store downloadable papers in:

- `docs/assets/papers/`

---

## Chart Notes

The portal uses Plotly from a CDN because the requested chart set includes:

- DistPlot
- Pie chart
- ViolinPlot
- HeatMap
- PairPlot
- JointPlot

This avoids introducing a local bundler or framework while keeping the site GitHub Pages compatible.

---

## Security and Publishing Notes

- `.gitignore` excludes `codex.md` so local-only prompt instructions do not need to be published.
- The repository should avoid publishing secrets or private tokens in source files.
- The Windows `Zone.Identifier` artifact is ignored.

---

## Suggested Next Step

After pushing to GitHub Pages, verify:

1. `docs/` is the selected deployment folder.
2. The paper PDF downloads correctly from the live site.
3. All external links open as expected.
4. The YouTube embed works on the published domain.
5. The portal is readable on mobile and desktop.
