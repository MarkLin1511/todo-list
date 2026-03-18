# Frames & Days

A personal daybook website with two entry points:

- A guest password gate for friends to browse published 2026 blog posts
- A separate Mark-only control panel for writing, editing, and managing entries

## Features

- Guest password lock with a default password of `bowling`
- Separate Mark login with a default password of `strike`
- Clickable 2026 heatmap that opens the blog entry for that day
- Daily entries with title, excerpt, blog post, journal reflection, tags, mood, location, and photo gallery
- Admin tools for creating drafts, publishing posts, editing older entries, deleting days, and uploading images
- Backup export/import so the archive can be saved outside the browser

## Files

- `index.html`: page structure for the guest gate, archive, and Mark admin panel
- `styles.css`: visual design and responsive layout
- `app.js`: archive logic, local persistence, password gates, editing tools, and heatmap rendering

## Storage Note

This version stores data in the browser with `localStorage`, which makes it fast to prototype as a static site. Use the built-in export feature regularly if you are adding a lot of entries or photos.
