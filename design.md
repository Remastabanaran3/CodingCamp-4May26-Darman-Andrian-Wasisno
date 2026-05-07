# Design Document: To-Do List Life Dashboard

## Overview

The To-Do List Life Dashboard is a single-page web application built with vanilla HTML, CSS, and JavaScript. It provides a unified dashboard experience with five core modules: time/date display, dynamic greeting, Pomodoro focus timer, task management, and quick links. All state is persisted to the browser's Local Storage API. The application requires no build step and deploys directly to GitHub Pages.

The design prioritizes simplicity and maintainability: one HTML file, one CSS file, one JavaScript file. No external dependencies. The JavaScript is organized into self-contained module objects that each own their DOM interactions, state, and storage keys.

---

## Architecture

The application follows a **module-per-feature** pattern within a single JavaScript file. Each feature is encapsulated in a plain object (or IIFE) with `init`, `render`, and `save`/`load` methods. A top-level `App` object bootstraps all modules on `DOMContentLoaded`.

```
index.html
├── <link> → css/style.css
└── <script> → js/script.js
    ├── StorageService       (read/write Local Storage, JSON serialization)
    ├── TimeDisplay          (clock + date, setInterval)
    ├── GreetingModule       (time-based greeting + custom name)
    ├── FocusTimer           (Pomodoro countdown, start/stop/reset)
    ├── TaskManager          (CRUD tasks, persistence)
    ├── QuickLinksPanel      (CRUD links, persistence)
    ├── ThemeManager         (light/dark toggle, persistence)
    └── App                  (init all modules, wire global events)
```

### Data Flow

```
User Interaction
      │
      ▼
  DOM Event
      │
      ▼
  Module Handler ──► StorageService.save(key, data)
      │
      ▼
  Module.render()
      │
      ▼
  DOM Update
```

On page load, each module calls `StorageService.load(key)` to restore its state, then calls its own `render()` to populate the DOM.

---

## Components and Interfaces

### StorageService

Centralizes all Local Storage access. Handles JSON serialization/deserialization and catches parse errors.

```javascript
StorageService = {
  KEYS: {
    TASKS:    'dashboard_tasks',
    LINKS:    'dashboard_links',
    THEME:    'dashboard_theme',
    USERNAME: 'dashboard_username',
    TIMER_DURATION: 'dashboard_timer_duration',
  },
  save(key, value): void,       // JSON.stringify + localStorage.setItem
  load(key, fallback): any,     // localStorage.getItem + JSON.parse, returns fallback on error
}
```

### TimeDisplay

Renders current time (12-hour + AM/PM) and date (weekday, month, day). Updates every second via `setInterval`.

```javascript
TimeDisplay = {
  init(): void,       // start setInterval(tick, 1000)
  tick(): void,       // read Date(), call render()
  render(now: Date): void,  // update #time-display and #date-display DOM nodes
  formatTime(date: Date): string,   // returns "HH:MM:SS AM/PM" with leading zeros
  formatDate(date: Date): string,   // returns "Weekday, Month DD"
}
```

### GreetingModule

Determines greeting text from current hour and appends stored user name.

```javascript
GreetingModule = {
  init(): void,       // load username, render
  getGreeting(hour: number): string,  // returns "Good Morning/Afternoon/Evening"
  render(): void,     // update #greeting-text
  setName(name: string): void,  // save to StorageService, re-render
}
```

### FocusTimer

Manages Pomodoro countdown. Stores configured duration. Uses `setInterval` for countdown ticks.

```javascript
FocusTimer = {
  duration: number,   // minutes, default 25
  remaining: number,  // seconds
  running: boolean,
  intervalId: number | null,

  init(): void,
  start(): void,
  stop(): void,
  reset(): void,
  tick(): void,
  onComplete(): void,   // show notification, stop timer
  render(): void,       // update #timer-display in MM:SS
  formatTime(seconds: number): string,  // "MM:SS" with leading zeros
  setDuration(minutes: number): void,   // validate 1–60, save, reset
}
```

### TaskManager

Manages an array of Task objects. Handles add, edit, toggle-complete, and delete.

```javascript
// Task shape
{ id: string, text: string, completed: boolean, createdAt: number }

TaskManager = {
  tasks: Task[],

  init(): void,         // load from storage, render
  add(text: string): void,
  edit(id: string, newText: string): void,
  toggleComplete(id: string): void,
  delete(id: string): void,
  save(): void,         // StorageService.save(TASKS, tasks)
  render(): void,       // rebuild #task-list DOM
  renderTask(task: Task): HTMLElement,
}
```

### QuickLinksPanel

Manages an array of Link objects. Handles add, open, and delete.

```javascript
// Link shape
{ id: string, name: string, url: string }

QuickLinksPanel = {
  links: Link[],

  init(): void,
  add(name: string, url: string): void,   // normalizes URL protocol
  delete(id: string): void,
  open(url: string): void,    // window.open(url, '_blank')
  normalizeUrl(url: string): string,  // prepend https:// if no protocol
  save(): void,
  render(): void,
  renderLink(link: Link): HTMLElement,
}
```

### ThemeManager

Toggles a `data-theme` attribute on `<body>` between `"light"` and `"dark"`. CSS variables handle all color changes.

```javascript
ThemeManager = {
  current: 'light' | 'dark',

  init(): void,     // load from storage, apply
  toggle(): void,   // flip current, save, apply
  apply(): void,    // set document.body.dataset.theme = current
}
```

---

## Data Models

### Task

```javascript
{
  id: string,          // crypto.randomUUID() or Date.now().toString()
  text: string,        // non-empty task description
  completed: boolean,  // false on creation
  createdAt: number,   // Date.now() timestamp
}
```

### Link

```javascript
{
  id: string,    // crypto.randomUUID() or Date.now().toString()
  name: string,  // display label
  url: string,   // normalized URL (always has protocol)
}
```

### Storage Schema

| Key | Type | Default |
|-----|------|---------|
| `dashboard_tasks` | `Task[]` | `[]` |
| `dashboard_links` | `Link[]` | `[]` |
| `dashboard_theme` | `"light" \| "dark"` | `"light"` |
| `dashboard_username` | `string` | `""` |
| `dashboard_timer_duration` | `number` (minutes) | `25` |

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Time format correctness

*For any* `Date` object, `TimeDisplay.formatTime(date)` SHALL produce a string matching the pattern `HH:MM:SS AM/PM` where hours are in 1–12 range, minutes and seconds are zero-padded to two digits, and the suffix is either "AM" or "PM".

**Validates: Requirements 1.1, 1.4**

### Property 2: Greeting covers all hours

*For any* integer hour in the range 0–23, `GreetingModule.getGreeting(hour)` SHALL return exactly one of "Good Morning", "Good Afternoon", or "Good Evening" — never an empty string or an unrecognized value.

**Validates: Requirements 2.1, 2.2, 2.3**

### Property 3: Task addition round-trip

*For any* non-empty task text string, after calling `TaskManager.add(text)` and then `StorageService.load(TASKS)`, the returned array SHALL contain an entry whose `text` field equals the original string and whose `completed` field is `false`.

**Validates: Requirements 4.1, 4.6, 6.1, 6.3**

### Property 4: Whitespace task rejection

*For any* string composed entirely of whitespace characters (spaces, tabs, newlines), `TaskManager.add(text)` SHALL leave the task list unchanged.

**Validates: Requirements 4.1**

### Property 5: Task toggle idempotence pair

*For any* task in the list, calling `TaskManager.toggleComplete(id)` twice SHALL return the task to its original `completed` state.

**Validates: Requirements 4.3**

### Property 6: Data serialization round-trip

*For any* array of Task objects or Link objects, serializing via `StorageService.save(key, data)` and then deserializing via `StorageService.load(key)` SHALL produce a value deeply equal to the original array.

**Validates: Requirements 6.3, 6.4**

### Property 7: URL normalization

*For any* URL string that does not begin with `http://` or `https://`, `QuickLinksPanel.normalizeUrl(url)` SHALL return a string that begins with `https://` and contains the original URL as a suffix.

*For any* URL string that already begins with `http://` or `https://`, `QuickLinksPanel.normalizeUrl(url)` SHALL return the string unchanged.

**Validates: Requirements 5.6**

### Property 8: Timer format correctness

*For any* integer number of seconds in the range 0–3599, `FocusTimer.formatTime(seconds)` SHALL produce a string matching the pattern `MM:SS` where both components are zero-padded to two digits.

**Validates: Requirements 3.6**

### Property 9: Theme toggle round-trip

*For any* initial theme state, calling `ThemeManager.toggle()` twice SHALL restore `ThemeManager.current` to its original value.

**Validates: Requirements 7.2**

---

## Error Handling

### Local Storage Parse Errors

`StorageService.load(key, fallback)` wraps `JSON.parse` in a try/catch. On any error it logs to `console.error` and returns the provided fallback value (typically `[]` for arrays, `""` for strings, or a default primitive). This satisfies Requirement 6.5.

### Invalid Timer Duration

`FocusTimer.setDuration(minutes)` clamps the input to the range [1, 60] before saving. Non-numeric input is rejected and the current duration is preserved.

### Empty Task / Link Submission

Both `TaskManager.add` and `QuickLinksPanel.add` trim whitespace from inputs and return early (no-op) if the result is empty. No error is thrown; the UI simply does not change.

### Missing URL Protocol

`QuickLinksPanel.normalizeUrl` checks for `http://` or `https://` prefix using a simple string test and prepends `https://` if absent.

### Timer Completion

When `FocusTimer.remaining` reaches 0, the timer stops its interval, calls `onComplete()` which displays a browser `alert()` or updates a visible notification element, and resets to the configured duration.

### Browser API Unavailability

If `localStorage` is unavailable (e.g., private browsing with storage blocked), `StorageService` catches the `SecurityError` and operates in a degraded in-memory-only mode, logging a warning to the console.

---

## Testing Strategy

### Unit Tests (Example-Based)

Each module's pure functions are tested with concrete examples:

- `TimeDisplay.formatTime` — specific Date inputs produce expected strings
- `TimeDisplay.formatDate` — weekday/month/day formatting
- `GreetingModule.getGreeting` — boundary hours (0, 5, 12, 17, 23)
- `FocusTimer.formatTime` — 0 seconds → "00:00", 90 seconds → "01:30", 3599 → "59:59"
- `QuickLinksPanel.normalizeUrl` — URLs with and without protocol
- `StorageService.load` — corrupted JSON returns fallback, valid JSON returns parsed value

### Property-Based Tests

Property-based testing is applicable to this feature because the core logic consists of pure transformation functions (time formatting, greeting selection, URL normalization, serialization) and stateful operations (task CRUD, toggle) with clear universal invariants.

**Library**: [fast-check](https://github.com/dubzzz/fast-check) (JavaScript property-based testing library)

**Configuration**: Minimum 100 iterations per property test.

**Tag format**: `// Feature: todo-life-dashboard, Property N: <property_text>`

Each correctness property maps to one property-based test:

| Property | Test Description | Generators |
|----------|-----------------|------------|
| P1: Time format | `fc.date()` → formatTime output matches regex | `fc.date()` |
| P2: Greeting coverage | Any hour 0–23 returns valid greeting | `fc.integer({min:0, max:23})` |
| P3: Task add round-trip | Add task, load storage, find task | `fc.string({minLength:1})` filtered non-whitespace |
| P4: Whitespace rejection | Whitespace strings never add tasks | `fc.string()` mapped to whitespace |
| P5: Toggle idempotence | Double-toggle restores state | `fc.boolean()` initial state |
| P6: Serialization round-trip | save then load equals original | `fc.array(fc.record({...}))` |
| P7: URL normalization | No-protocol URLs get https://, protocol URLs unchanged | `fc.webUrl()`, `fc.string()` |
| P8: Timer format | Any 0–3599 seconds → valid MM:SS | `fc.integer({min:0, max:3599})` |
| P9: Theme toggle round-trip | Double-toggle restores theme | `fc.constantFrom('light','dark')` |

### Integration / Smoke Tests

- Page loads without JavaScript errors in each target browser
- Local Storage keys are created on first interaction
- Theme persists across page reload (manual or automated with Playwright)
- Tasks and links persist across page reload

### Accessibility

- All interactive elements have visible focus indicators
- Color contrast meets WCAG AA in both light and dark themes
- Timer completion notification is announced (use `role="alert"` on notification element)

> Note: Full WCAG compliance requires manual testing with assistive technologies and expert accessibility review.
