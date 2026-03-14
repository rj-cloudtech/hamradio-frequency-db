# Ham Radio Frequency Database

A browser-based frequency database application built for personal use. Designed to run on a Raspberry Pi.

## About

Built to replace scattered notes and spreadsheets with a clean, searchable database of radio frequencies.

## Features

- **Add / edit / delete** frequency records
- **Import and export** data from/to files
- **Customizable column names** — rename any column to fit your workflow
- **Per-record fields:**
  - Name
  - RX Frequency (receive)
  - TX Frequency (transmit)
  - Shift
  - Tone
  - Setting
  - Description
  - Country
  - Location
  - Category
  - Website

## Tech Stack

- [React](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vitejs.dev/)

## Usage
```bash
# Install dependencies
npm install

# Run in development mode
npm run dev
```

Then open your browser and navigate to `http://localhost:5173`.

> **Note:** Currently runs on localhost only. Future plans include exposing the app over the internet via port forwarding or a reverse proxy.

## Notes

Built for personal use. Not intended as a production application.
