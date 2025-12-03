# Hello Again - RSS Dashboard

## Project Overview

A personalized information dashboard that aggregates multiple RSS feeds and displays them alongside weather, time, and historical "on this day" facts. Serves as a curated home page with a modern, minimal aesthetic.

## Tech Stack

- **Frontend**: React 18.3.1 with React Router DOM 7.0.2
- **Build Tool**: Vite 6.0.1 with @vitejs/plugin-react
- **Database**: Firebase Firestore (cloud-hosted NoSQL database)
- **Styling**: SCSS/SASS 1.82.0
- **HTTP Client**: Axios 1.7.9
- **Utilities**: Lodash 4.17.21 (debounce)
- **SVG**: vite-plugin-svgr 4.3.0 (SVG as React components)

## Architecture

### Component Hierarchy
```
App (Router)
├── Home (Main dashboard)
│   ├── Header (Time & greeting)
│   ├── Weather (Current conditions)
│   ├── Today (Historical facts)
│   └── Feed (Dynamic feeds from Firestore)
│       └── FeedBox (Individual feed display)
└── Admin (Feed management - /admin route)
    ├── Add Feed Form
    └── Feed List (Edit/Delete)
```

### Data Sources
1. **Weather**: Open-Meteo API (geolocation-based, updates every 30 min)
2. **Historical Facts**: Zenquotes.io API (rotates every 20 seconds)
3. **RSS Feeds**: Dynamic feeds fetched from Firebase Firestore, proxied via Cloudflare Worker at `https://gigantc-com.dan-91d.workers.dev/`
4. **Feed Configuration**: Firebase Firestore `feeds` collection (managed via /admin page)

### State Management
- Local component state only (useState)
- No global state management
- Each Feed component independently manages its data and loading state
- Feeds list fetched from Firestore on Home page load
- Admin page performs CRUD operations on Firestore

## Key Files

### Entry Points
- `/index.html` - HTML shell with #root mount point
- `/src/main.jsx` - React DOM render entry point
- `/src/containers/_App/App.jsx` - Root router component

### Configuration
- `/src/firebase/config.js` - **IMPORTANT**: Firebase initialization (requires Firebase project credentials)
- `/src/firebase/feedService.js` - Firestore CRUD operations for feeds
- `/data/feeds.json` - Backup/reference of feed data (not actively used)
- `/src/variables.scss` - Design tokens (colors, fonts, breakpoints, mixins)
- `/vite.config.js` - Build configuration

### Main Components
- `/src/containers/Home/Home.jsx` - Main dashboard layout (fetches feeds from Firestore)
- `/src/containers/Admin/Admin.jsx` - Feed management interface (add/edit/delete feeds)
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

## Firebase Setup

### Initial Setup
1. Create a Firebase project at https://console.firebase.google.com/
2. Enable Firestore Database (start in test mode for development)
3. Get your Firebase config from Project Settings → General
4. Update `/src/firebase/config.js` with your credentials:
   - `apiKey`
   - `authDomain`
   - `projectId`
   - `storageBucket`
   - `messagingSenderId`
   - `appId`

### Firestore Database Structure
```
feeds (collection)
├── {auto-generated-id}: { feedTitle: "MacRumors", feedUrl: "https://..." }
├── {auto-generated-id}: { feedTitle: "The Verge", feedUrl: "https://..." }
└── ...
```

### Seeding Initial Data
You can manually add feeds via the `/admin` page, or import from `/data/feeds.json`:
1. Go to Firestore Console
2. Create collection named `feeds`
3. Add documents with fields: `feedTitle` (string) and `feedUrl` (string)

### Security Rules
For production, update Firestore security rules:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /feeds/{feedId} {
      allow read: if true;  // Anyone can read feeds
      allow write: if true; // Anyone can write (consider adding auth)
    }
  }
}
```

## Admin Page

The admin interface is available at `/admin` (not linked from main page).

### Features
- **Add New Feed**: Form to add feed title and URL
- **Edit Feed**: Click "Edit" button to modify existing feeds
- **Delete Feed**: Click "Delete" button with confirmation prompt
- **Real-time Updates**: Changes immediately reflect on main dashboard

### Validation
- Both title and URL are required
- URL must be valid format (checked with JavaScript URL constructor)
- Duplicate checking not implemented (user responsibility)

## Common Tasks

### Adding a New RSS Feed
1. Navigate to `/admin` in your browser
2. Fill in "Feed Title" and "Feed URL" in the form
3. Click "Add Feed"
4. Feed will immediately appear on the main dashboard

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

### Recent Changes
- **Firebase Integration**: Migrated feed storage from static JSX file to Firebase Firestore
- **Admin Page**: Added `/admin` route for CRUD operations on feeds (add, edit, delete)
- **Dynamic Feed Loading**: Home page now fetches feeds from Firestore on mount
- New feed rotation mechanism
- Weather now auto-updates every 30 minutes
- Facts formatting improvements (HTML entity handling)
- Mobile responsive design with touch support
- Individual feed refresh buttons added

### Setup Required
- **Firebase Configuration**: Must add Firebase project credentials to `/src/firebase/config.js`
- **Firestore Database**: Must create `feeds` collection and seed initial data
- Without Firebase setup, the app will fail to load feeds

### Potential Improvements
1. Add Firebase Authentication to protect `/admin` page
2. Implement duplicate feed checking in admin form
3. Add bulk import/export functionality for feeds
4. No test coverage
5. No accessibility (ARIA) labels on icon buttons
6. Could benefit from TypeScript
7. Consider rate limiting for Firestore operations

## Notes

- **Firebase Dependency**: App requires Firebase/Firestore to be configured to load feeds
- Feeds are dynamically fetched from Firestore on each page load
- Admin page (`/admin`) is not linked from main page - access via direct URL
- All feeds lazy-load to improve initial page load
- Weather requires user geolocation permission
- Feed proxy is essential - direct RSS fetching would fail due to CORS
- Feed items are parsed from both RSS and ATOM formats
- "Load More" button cycles through feed items in groups of 6
- Number of feeds displayed is dynamic based on Firestore data
