# MS Learn Focus Timers

A lightweight local web application that queries the official Microsoft Learn Catalog API to generate independent study timers for each module within a learning path, complete with customizable reading buffers and audio alerts.

---

## Features

- **Official Catalog API Integration**: Pulls accurate, unit-aggregated durations directly from Microsoft's public Catalog API with no HTML scraping.
- **Search & Autocomplete**: Search paths by name through an autocomplete list, or paste an MS Learn URL/slug directly.
- **Independent Module Timers**: Run, pause, reset, or add buffer extensions (+5m) to individual module cards simultaneously.
- **Configurable Buffer**: Automatically scales expected reading times (default: +30%) to account for practical exercises and note-taking.
- **Web Audio Chimes**: Synthesizes a completion chime using the Web Audio API without requiring external sound files.
- **Drift-Free Precision**: Employs timestamp-delta tracking so timers stay accurate even when the browser tab is backgrounded.

---

## Tech Stack

- **Backend**: Node.js, Express
- **Frontend**: Vanilla HTML5, JavaScript, Tailwind CSS (via CDN)
- **Data Source**: [Microsoft Learn Catalog API](https://learn.microsoft.com/api/catalog/)

---

## Project Structure

```text
learning-path-timers/
├── public/
│   └── index.html      # Single-page UI, timer controls & audio engine
├── package.json        # Dependencies & configuration
├── server.js           # Express server & API catalog proxy
└── README.md
```

---

## Installation

### Prerequisites

- [Node.js](https://nodejs.org/) (version 18 or newer recommended for native `fetch` support)
- npm (bundled with Node.js)

### Setup Steps

1. **Clone or create your project directory:**
   ```bash
   mkdir learning-path-timers && cd learning-path-timers
   ```

2. **Initialize the project and install dependencies:**
   ```bash
   npm init -y
   npm install express
   ```

3. **Enable ES module imports:**
   Open `package.json` and ensure `"type": "module"` is present:
   ```json
   {
     "name": "learning-path-timers",
     "type": "module",
     "dependencies": {
       "express": "^4.19.2"
     }
   }
   ```

4. **Verify project files:**
   Ensure `server.js` resides in the root directory and `index.html` is placed inside a `public/` directory.

---

## Usage

### 1. Start the Server

Run the application locally:

```bash
node server.js
```

The terminal will confirm:
```text
Timer app running at http://localhost:3000
```

### 2. Open the Dashboard

Open your web browser and navigate to:
```text
http://localhost:3000
```

### 3. Load a Learning Path

1. **Search or Input**:
   - Begin typing a path name (e.g., `GitHub Advanced Security`, `AZ-900`) to choose from the loaded suggestions.
   - Alternatively, paste a complete MS Learn URL directly (e.g., `https://learn.microsoft.com/en-gb/training/paths/github-advanced-security/`).
2. **Adjust Buffer**: Change the buffer percentage (default is `30%`) to allocate more or less reading time.
3. **Load Timers**: Click **Load Timers** to populate the module cards.

### 4. Manage Timers

- **Start / Pause**: Click **Start** to run a timer. Timers run completely independent of one another.
- **+5m**: Click to extend the remaining duration when you need extra time on a tough section.
- **Reset**: Reset a specific module back to its initial buffered duration.
- **Reset All Timers**: Reset every card on the page simultaneously using the top control button.