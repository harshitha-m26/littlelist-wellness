# LittleList — Full Stack To-Do List

A small, responsive task manager built with HTML, CSS, JavaScript, Node.js, Express and MongoDB (optional cloud connection).

## Features
- Add, edit, complete and delete tasks
- Priority, category and due date
- Search tasks and filter by status or priority
- Dashboard counts and completion progress
- Responsive desktop/mobile layout and dark mode
- REST API with MongoDB support and automatic local JSON fallback

## Run on your computer
1. Install Node.js (LTS).
2. Open this folder in VS Code.
3. In the terminal run `npm install`.
4. Optional MongoDB Atlas setup: copy `.env.example` to `.env`, then paste your Atlas connection string after `MONGODB_URI=`.
5. Start the app using `npm start`.
6. Open **http://localhost:3000** in your browser.

If `MONGODB_URI` is blank, the server uses `data/tasks.json` so the project still works without an Atlas account. The terminal and sidebar show which storage mode is active.

## API
- `GET /api/status` — database/storage status
- `GET /api/tasks` — list tasks
- `POST /api/tasks` — create a task
- `PATCH /api/tasks/:id` — update a task
- `DELETE /api/tasks/:id` — delete a task

## Public hosting
This is a runnable project, not yet a public website. To make a link that opens for anyone, deploy the Node.js app to a hosting provider (for example Render) and configure a MongoDB Atlas URI. Then replace the placeholder in the report with the exact URL provided by the host. Do not use the localhost address as a public link.


## Deploy on Render
1. Push this project folder to a GitHub repository.
2. In Render, choose **New +** → **Web Service** and connect that repository.
3. Render can detect `render.yaml`; otherwise use build command `npm install` and start command `npm start`.
4. For persistent task storage, create a MongoDB Atlas database and set `MONGODB_URI` in the Render service's Environment settings. Do not commit a real `.env` file or database password to GitHub.
5. After deployment, open the `onrender.com` URL provided by Render and test `/api/status`, task creation, edits, and deletes.

Note: Without `MONGODB_URI`, the app falls back to a local JSON file. On typical cloud hosting, local files may be temporary and can be reset during restarts or redeploys. Configure MongoDB Atlas for persistent task data. Sleep, meal, and exercise notes are stored in the visitor's browser local storage and are not synced across devices.
