# Hello Again - RSS Dashboard

## Project Overview

A personalized information dashboard that aggregates multiple RSS feeds and displays them alongside weather, time, and historical "on this day" facts. Serves as a curated home page with a modern, minimal aesthetic.

## Tech Stack

- **Frontend**: React 18.3.1 with React Router DOM 7.0.2
- **Build Tool**: Vite 6.0.1 with @vitejs/plugin-react
- **Database**: Firebase Firestore (cloud-hosted NoSQL database)
- **Drag & Drop**: @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities (for admin feed reordering)
- **Styling**: SCSS/SASS 1.82.0
- **HTTP Client**: Axios 1.7.9
- **Utilities**: Lodash 4.17.21 (debounce)
- **SVG**: vite-plugin-svgr 4.3.0 (SVG as React components)
- **Caching**: localStorage for feeds and today events

## Architecture

### Component Hierarchy
```
App (Router)
├── Home (Main dashboard with localStorage caching)
│   ├── Header (Time & greeting)
│   ├── Weather (Current conditions)
│   ├── Today (Historical facts with manual navigation)
│   └── Feed (Dynamic feeds from Firestore)
│       └── FeedBox (Individual feed display)
└── Admin (Feed management - /admin route)
    ├── Header (shared with Home)
    ├── AddFeedForm (Add new feeds)
    ├── FeedsList (Drag-and-drop container)
    │   └── FeedItem (Individual sortable feed with edit/delete)
    └── Admin.jsx (Main orchestrator)
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
- **localStorage caching** for feeds (24-hour cache) and today events (daily cache)
- Feeds list fetched from Firestore or cache depending on validity
- Admin page performs CRUD operations on Firestore and invalidates cache

## Key Files

### Entry Points
- `/index.html` - HTML shell with #root mount point
- `/src/main.jsx` - React DOM render entry point
- `/src/containers/_App/App.jsx` - Root router component

### Configuration
- `/src/config.js` - **Centralized configuration**: API endpoints, intervals, cache settings, display constants
- `/src/firebase/config.js` - **IMPORTANT**: Firebase initialization (NOT committed to repo - copy from config.example.js)
- `/src/firebase/config.example.js` - Template for Firebase configuration
- `/src/firebase/feedService.js` - Firestore CRUD operations for feeds (includes order management)
- `/src/utils/feedCache.js` - localStorage caching for feeds (24-hour duration)
- `/src/utils/todayCache.js` - localStorage caching for today events (daily)
- `/data/feeds.json` - Backup/reference of feed data
- `/src/variables.scss` - Design tokens (colors, fonts, breakpoints, mixins)
- `/vite.config.js` - Build configuration with @/ path alias

### Main Components
- `/src/containers/Home/Home.jsx` - Main dashboard layout (fetches feeds from cache/Firestore)
- `/src/containers/Admin/Admin.jsx` - Feed management orchestrator (add/edit/delete/reorder)
- `/src/containers/Header/Header.jsx` - Time, date, greeting (time-based)
- `/src/containers/Weather/Weather.jsx` - Weather fetching and display
- `/src/containers/Today/Today.jsx` - Historical events with auto-rotation and manual navigation
- `/src/containers/Feed/Feed.jsx` - RSS feed fetching and carousel logic
- `/src/components/FeedBox/FeedBox.jsx` - Individual feed presentation
- `/src/components/AddFeedForm/AddFeedForm.jsx` - Form for adding new feeds
- `/src/components/FeedItem/FeedItem.jsx` - Sortable feed item with edit/delete
- `/src/components/FeedsList/FeedsList.jsx` - Drag-and-drop feed list container
- `/src/components/Loader/Loader.jsx` - Shared loading component

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

All intervals are configured in `/src/config.js` for easy modification:

- **Header Time**: 1 second (real-time clock)
- **Weather**: 30 minutes (configurable via `INTERVALS.WEATHER_REFRESH`)
- **Today Facts**: 19.5 seconds auto-rotation (configurable via `INTERVALS.TODAY_ROTATION`)
- **Fade Transitions**: 500ms (configurable via `INTERVALS.FADE_DURATION`)
- **RSS Feeds**: Manual refresh only (no auto-refresh)
- **Feed Cache**: 24 hours (configurable via `CACHE.FEEDS_DURATION`)
- **Today Cache**: Until date changes (daily refresh)

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
4. Copy `/src/firebase/config.example.js` to `/src/firebase/config.js`
5. Update `/src/firebase/config.js` with your credentials:
   - `apiKey`
   - `authDomain`
   - `projectId`
   - `storageBucket`
   - `messagingSenderId`
   - `appId`

### Firestore Database Structure
```
feeds (collection)
├── {auto-generated-id}: {
│     feedTitle: "MacRumors",
│     feedUrl: "https://...",
│     order: 0
│   }
├── {auto-generated-id}: {
│     feedTitle: "The Verge",
│     feedUrl: "https://...",
│     order: 1
│   }
└── ...
```

**Note**: The `order` field is automatically set when adding feeds and can be modified via drag-and-drop in the admin interface.

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
- **Edit Feed**: Click edit icon to modify existing feeds (inline editing)
- **Delete Feed**: Click delete icon with confirmation prompt
- **Drag-and-Drop Reordering**: Drag feeds to reorder them (updates Firestore)
- **Real-time Updates**: Changes immediately invalidate cache and reflect on main dashboard
- **Header Display**: Shows same header as main dashboard

### Validation
- Both title and URL are required
- URL must be valid format (checked with JavaScript URL constructor)
- Duplicate checking not implemented (user responsibility)
- Cannot drag while editing a feed

## Common Tasks

### Adding a New RSS Feed
1. Navigate to `/admin` in your browser
2. Fill in "Feed Title" and "Feed URL" in the form
3. Click "Add Feed"
4. Feed will immediately appear on the main dashboard

### Modifying Configuration Values
All configuration values are centralized in `/src/config.js`:
- **Update intervals**: Modify `INTERVALS` object
- **API endpoints**: Modify `API` object
- **Cache settings**: Modify `CACHE` object
- **Display settings**: Modify `DISPLAY` object (e.g., feed items per page)

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
- **localStorage Caching**: Added caching for feeds (24hr) and today events (daily) to minimize API calls
- **Centralized Configuration**: Created `/src/config.js` with all app constants (API endpoints, intervals, cache settings)
- **Path Aliases**: Added `@/` alias for cleaner imports (e.g., `@/components/Loader/Loader`)
- **Component Refactoring**: Split Admin into smaller, focused components (AddFeedForm, FeedItem, FeedsList)
- **Drag-and-Drop Reordering**: Added @dnd-kit for dragging feeds to reorder in admin
- **Manual Today Navigation**: Added left/right arrow buttons to manually cycle through historical facts
- **Auto-rotation Reset**: Manual navigation resets the 20-second auto-rotation timer
- **Icon Buttons**: Admin uses SVG icons for edit/delete actions instead of text buttons
- **Firebase Integration**: Migrated feed storage from static JSX file to Firebase Firestore with `order` field
- **Admin Page**: Full CRUD operations with inline editing
- **Code Cleanup**: Removed old FeedList.jsx, migration scripts, commented out debug console.logs
- **Component Structure**: Moved admin components to flat `/src/components/` structure

### Setup Required
- **Firebase Configuration**: Must add Firebase project credentials to `/src/firebase/config.js`
- **Firestore Database**: Must create `feeds` collection and seed initial data
- Without Firebase setup, the app will fail to load feeds

### Potential Improvements
1. **Weather Caching**: Add localStorage caching for weather data (similar to feeds/today)
2. **Firebase Authentication**: Protect `/admin` page with auth
3. **Duplicate Feed Checking**: Validate against existing feed URLs
4. **Bulk Operations**: Import/export functionality for feeds
5. **Test Coverage**: No tests currently implemented
6. **Accessibility**: Add ARIA labels on icon buttons and keyboard navigation
7. **TypeScript**: Could benefit from type safety
8. **Rate Limiting**: Consider rate limiting for Firestore operations
9. **Error Boundaries**: Add React error boundaries for better error handling

## Notes

- **Firebase Dependency**: App requires Firebase/Firestore to be configured to load feeds
- **Caching Strategy**: Feeds cached for 24 hours, today events cached until date changes - significantly reduces API calls
- **Cache Invalidation**: Admin changes immediately invalidate feed cache
- Admin page (`/admin`) is not linked from main page - access via direct URL
- All feeds lazy-load to improve initial page load
- Weather requires user geolocation permission
- Feed proxy is essential - direct RSS fetching would fail due to CORS
- Feed items are parsed from both RSS and ATOM formats
- "Load More" button cycles through feed items in groups of 6 (configurable in `/src/config.js`)
- Number of feeds displayed is dynamic based on Firestore data
- Today facts auto-rotate every ~20 seconds with manual navigation controls
- SVG icons imported with `?react` suffix for proper rendering as React components
- Path aliases (`@/`) configured in `vite.config.js` for cleaner imports
