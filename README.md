# Momentum Desk

A small vanilla JavaScript productivity app that combines a habit tracker and a to-do list in one tabbed dashboard.

## Main Site

Open `index.html` in a browser to use the app, or visit the deployed Vercel site.

## Features

- Switch between a `Habit tracker` tab and a `To-do list` tab
- Add habits, mark them complete once per day, and see yearly heatmaps
- Track streaks and total habit check-ins
- Add tasks, filter by status, and clear completed items
- Persist all habit and task data with `localStorage`

## Project Structure

- `index.html`, `styles.css`, `app.js`: main productivity app
- `habit-tracker/`: standalone copy of the habit tracker
- `todo-list/`: standalone copy of the to-do list
