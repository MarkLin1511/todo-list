# Frames & Days

A personal daybook website with two entry points:

- A guest password gate for friends to browse published 2026 blog posts
- A separate Mark-only control panel for writing, editing, and managing entries
- A Vercel-backed backend for entries, passwords, and uploaded photos

## Features

- Guest password lock with a default password of `bowling`
- Separate Mark login with a default password of `strike`
- Real backend sessions with HTTP-only cookies instead of browser-only auth state
- Encrypted Vercel-backed storage for entries and settings
- Vercel Blob-backed photo uploads
- Clickable 2026 heatmap that opens the blog entry for that day
- Daily entries with title, excerpt, blog post, journal reflection, tags, mood, location, and photo gallery
- Admin tools for creating drafts, publishing posts, editing older entries, deleting days, and uploading images
- Backup export/import so the archive can be saved outside the browser

## Files

- `index.html`: page structure for the guest gate, archive, and Mark admin panel
- `styles.css`: visual design and responsive layout
- `app.js`: frontend state, rendering, API calls, photo compression, and editor flows
- `api/`: Vercel serverless functions for auth, entries, backups, settings, and uploads
- `package.json`: backend dependency for Vercel Blob
- `.env.example`: required environment variables for local and hosted backend setup

## Backend Note

This version expects:

- A `BLOB_READ_WRITE_TOKEN` for Vercel Blob
- A `SESSION_SECRET` for signed auth cookies and encrypted archive storage

On first boot, the backend seeds the default guest password `bowling` and Mark password `strike` unless you override them with `DEFAULT_GUEST_PASSWORD` and `DEFAULT_MARK_PASSWORD`.
