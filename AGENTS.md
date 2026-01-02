# AGENTS.md

This file documents agent-specific instructions for this repo. Replace the
placeholders with real values.

## Project Summary
- Name: Hero Mob (Epic War Saga clone)
- Purpose: Browser-based battle prototype for a Hero Mob-style game.
- Primary stack: Vue 3 (ESM, no bundler), Vue Router, vanilla HTML/CSS/JS; Go static file server for local dev.

## Repository Structure
- Root directories: components/, game/, instruction docs/, lib/, public/, router/, server/
- Entry points: public/index.html, public/app.js, components/App.js, router/index.js, server/server.go

## Development Workflow
- Setup steps: Install Go; for PowerShell use `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`.
- Run commands: `.\Launch.ps1` (builds the Go server and serves `public/` on http://localhost:5173/).
- Build commands: `go build -o server/server.exe server/server.go`
- Test commands: None found.

## Coding Conventions
- File organization: UI in components/, routing in router/, game logic in game/, static assets in public/ and public/assets/, vendor libs in lib/, dev server in server/.

## Tooling & Integrations
- External services: Google Fonts (fonts.googleapis.com/fonts.gstatic.com).

## Contacts
- Maintainers: Bil
- Preferred communication: WBilliam(github)
