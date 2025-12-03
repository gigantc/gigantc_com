# Hello Again - RSS Dashboard

## Project Overview

A personalized information dashboard that aggregates multiple RSS feeds and displays them alongside weather, time, and historical "on this day" facts. Serves as a curated home page with a modern, minimal aesthetic.

## Tech Stack

- **Frontend**: React 18.3.1 with React Router DOM 7.0.2
- **Build Tool**: Vite 6.0.1 with @vitejs/plugin-react
- **Styling**: SCSS/SASS 1.82.0
- **HTTP Client**: Axios 1.7.9
- **Utilities**: Lodash 4.17.21 (debounce)
- **SVG**: vite-plugin-svgr 4.3.0 (SVG as React components)

## Architecture

### Component Hierarchy
```
App (Router)
└── Home (Main dashboard)
    ├── Header (Time & greeting)
    ├── Weather (Current conditions)
    ├── Today (Historical facts)
    └── Feed (24 RSS feeds in lazy-loaded grid)
        └── FeedBox (Individual feed display)
```

### Data Sources
1. **Weather**: Open-Meteo API (geolocation-based, updates every 30 min)
2. **Historical Facts**: Zenquotes.io API (rotates every 20 seconds)
3. **RSS Feeds**: 24 configured feeds via Cloudflare Worker proxy at `https://gigantc-com.dan-91d.workers.dev/`

### State Management
- Local component state only (useState)
- No global state management
- Each Feed component independently manages its data and loading state

## Key Files

### Entry Points
- `/index.html` - HTML shell with #root mount point
- `/src/main.jsx` - React DOM render entry point
- `/src/containers/_App/App.jsx` - Root router component

### Configuration
- `/src/containers/Feed/FeedList.jsx` - **IMPORTANT**: Array of 24 RSS feed configurations
- `/src/variables.scss` - Design tokens (colors, fonts, breakpoints, mixins)
- `/vite.config.js` - Build configuration

### Main Components
- `/src/containers/Home/Home.jsx` - Main dashboard layout
- `/src/containers/Header/Header.jsx` - Time, date, greeting (time-based)
- `/src/containers/Weather/Weather.jsx` - Weather fetching and display
- `/src/containers/Today/Today.jsx` - Historical events rotation
- `/src/containers/Feed/Feed.jsx` - RSS feed fetching and carousel logic
- `/src/components/FeedBox/FeedBox.jsx` - Individual feed presentation

## Design System

### Colors (variables.scss)
- Primary: `#1a232d` (dark blue-gray)
- Highlight: `#1b516a` (teal/blue)
- Text: `#cfe6ce` (pale green)
- Box background: `rgba(#1b516a, 0.11)` (semi-transparent)

### Typography
- Red Hat Display (headings)
- Roboto (body text)

### Breakpoints
- Desktop: Full flexbox grid
- Mobile/Tablet: `max-width: 1000px` (stacked layout)

## Update Intervals

- **Header Time**: 1 second (real-time clock)
- **Weather**: 30 minutes (1,800,000ms)
- **Today Facts**: 20 seconds with 500ms fade transition
- **RSS Feeds**: Manual refresh only (no auto-refresh)

## RSS Feed Proxy

The Cloudflare Worker proxy at `https://gigantc-com.dan-91d.workers.dev/` handles CORS for RSS feeds:
- Accepts `?url={encodeURIComponent(feedUrl)}` parameter
- Fetches the feed and adds appropriate CORS headers
- Required because most RSS feeds don't have CORS headers for browser access

## Common Tasks

### Adding a New RSS Feed
1. Edit `/src/containers/Feed/FeedList.jsx`
2. Add object to array: `{ feedTitle: "Name", feedUrl: "https://..." }`
3. Feed will automatically appear in the grid

### Modifying Weather Update Interval
- Edit line 36 in `/src/containers/Weather/Weather.jsx`
- Change `1800000` (30 minutes) to desired milliseconds

### Changing Color Scheme
- Edit variables in `/src/variables.scss`
- All components use these SCSS variables for consistency

### Development
```bash
npm run dev          # Start dev server (Vite HMR)
npm run build        # Production build to /dist
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

## Current State

### Recent Changes (Git History)
- New feed rotation mechanism
- Weather now auto-updates every 30 minutes
- Facts formatting improvements (HTML entity handling)
- Mobile responsive design with touch support
- Individual feed refresh buttons added

### Uncommitted Changes
- Modified `/src/containers/Feed/FeedList.jsx` (The Quietus → Consequence)

### Potential Improvements
1. Error handling could be more informative
2. No test coverage
3. No accessibility (ARIA) labels on icon buttons
4. Could benefit from TypeScript
5. Console.log statements in production code
6. Performance optimization for 24 concurrent feeds

## Notes

- All 24 feeds lazy-load to improve initial page load
- Weather requires user geolocation permission
- Feed proxy is essential - direct RSS fetching would fail due to CORS
- Feed items are parsed from both RSS and ATOM formats
- "Load More" button cycles through feed items in groups of 6
