# Tasks

## Task List

- [x] 1. Set up project file structure
  - [x] 1.1 Create `index.html` with semantic HTML skeleton (head, body, section placeholders for each module)
  - [x] 1.2 Create `css/style.css` with CSS custom properties for light and dark themes
  - [x] 1.3 Create `js/script.js` with module scaffolding (empty module objects and App bootstrap)

- [x] 2. Implement StorageService
  - [x] 2.1 Define `StorageService.KEYS` constants for all five storage keys
  - [x] 2.2 Implement `StorageService.save(key, value)` using `JSON.stringify` and `localStorage.setItem`
  - [x] 2.3 Implement `StorageService.load(key, fallback)` with try/catch around `JSON.parse`, returning fallback on error and logging to `console.error`
  - [x] 2.4 Handle `SecurityError` when `localStorage` is unavailable (private browsing), log warning and operate in-memory

- [x] 3. Implement TimeDisplay module
  - [x] 3.1 Implement `TimeDisplay.formatTime(date)` returning 12-hour time string with AM/PM and leading zeros
  - [x] 3.2 Implement `TimeDisplay.formatDate(date)` returning weekday, month name, and day number
  - [x] 3.3 Implement `TimeDisplay.tick()` to read current `Date` and call `render()`
  - [x] 3.4 Implement `TimeDisplay.init()` to call `tick()` immediately and start `setInterval(tick, 1000)`
  - [x] 3.5 Wire `#time-display` and `#date-display` DOM elements in `index.html`

- [x] 4. Implement GreetingModule
  - [x] 4.1 Implement `GreetingModule.getGreeting(hour)` mapping hour ranges to "Good Morning", "Good Afternoon", "Good Evening"
  - [x] 4.2 Implement `GreetingModule.render()` to update `#greeting-text` with greeting plus stored username
  - [x] 4.3 Implement `GreetingModule.setName(name)` to persist username via `StorageService` and re-render
  - [x] 4.4 Implement `GreetingModule.init()` to load username from storage and render
  - [x] 4.5 Add `#greeting-text` and username input/save controls to `index.html`

- [x] 5. Implement FocusTimer module
  - [x] 5.1 Implement `FocusTimer.formatTime(seconds)` returning zero-padded `MM:SS` string
  - [x] 5.2 Implement `FocusTimer.start()` to begin `setInterval` countdown and set `running = true`
  - [x] 5.3 Implement `FocusTimer.stop()` to clear interval and set `running = false`, preserving `remaining`
  - [x] 5.4 Implement `FocusTimer.reset()` to restore `remaining` to `duration * 60` and call `render()`
  - [x] 5.5 Implement `FocusTimer.tick()` to decrement `remaining` and call `onComplete()` when it reaches zero
  - [x] 5.6 Implement `FocusTimer.onComplete()` to stop the timer and display a completion notification using `role="alert"`
  - [x] 5.7 Implement `FocusTimer.setDuration(minutes)` to clamp input to [1, 60], persist via `StorageService`, and reset
  - [x] 5.8 Implement `FocusTimer.init()` to load stored duration, initialize `remaining`, and render
  - [x] 5.9 Add `#timer-display`, start/stop/reset buttons, and duration input to `index.html`

- [x] 6. Implement TaskManager module
  - [x] 6.1 Implement `TaskManager.add(text)` to trim input, reject whitespace-only strings, create a Task object with `id`, `text`, `completed: false`, `createdAt`, and call `save()` and `render()`
  - [x] 6.2 Implement `TaskManager.edit(id, newText)` to find task by id, update `text`, call `save()` and `render()`
  - [x] 6.3 Implement `TaskManager.toggleComplete(id)` to flip `completed` on the matching task, call `save()` and `render()`
  - [x] 6.4 Implement `TaskManager.delete(id)` to remove task from array, call `save()` and `render()`
  - [x] 6.5 Implement `TaskManager.save()` to persist `tasks` array via `StorageService`
  - [x] 6.6 Implement `TaskManager.renderTask(task)` to create a list item with complete toggle, edit, and delete controls; apply visual distinction (strikethrough/opacity) for completed tasks
  - [x] 6.7 Implement `TaskManager.render()` to rebuild `#task-list` from current `tasks` array
  - [x] 6.8 Implement `TaskManager.init()` to load tasks from storage and render
  - [x] 6.9 Add `#task-list`, task input field, and add button to `index.html`

- [x] 7. Implement QuickLinksPanel module
  - [x] 7.1 Implement `QuickLinksPanel.normalizeUrl(url)` to prepend `https://` when no protocol prefix is present
  - [x] 7.2 Implement `QuickLinksPanel.add(name, url)` to trim inputs, normalize URL, create a Link object, call `save()` and `render()`
  - [x] 7.3 Implement `QuickLinksPanel.delete(id)` to remove link from array, call `save()` and `render()`
  - [x] 7.4 Implement `QuickLinksPanel.open(url)` using `window.open(url, '_blank')`
  - [x] 7.5 Implement `QuickLinksPanel.save()` to persist `links` array via `StorageService`
  - [x] 7.6 Implement `QuickLinksPanel.renderLink(link)` to create a link item with name, clickable URL, and delete control
  - [x] 7.7 Implement `QuickLinksPanel.render()` to rebuild `#links-list` from current `links` array
  - [x] 7.8 Implement `QuickLinksPanel.init()` to load links from storage and render
  - [x] 7.9 Add `#links-list`, name/URL input fields, and add button to `index.html`

- [x] 8. Implement ThemeManager module
  - [x] 8.1 Implement `ThemeManager.apply()` to set `document.body.dataset.theme` to `current`
  - [x] 8.2 Implement `ThemeManager.toggle()` to flip `current` between `"light"` and `"dark"`, persist via `StorageService`, and call `apply()`
  - [x] 8.3 Implement `ThemeManager.init()` to load stored theme (defaulting to `"light"`) and call `apply()`
  - [x] 8.4 Add theme toggle button to `index.html`
  - [x] 8.5 Define CSS custom properties for light and dark themes in `style.css` using `[data-theme="dark"]` selector

- [x] 9. Implement App bootstrap
  - [x] 9.1 Implement `App.init()` to call `init()` on all modules in order: `StorageService`, `ThemeManager`, `TimeDisplay`, `GreetingModule`, `FocusTimer`, `TaskManager`, `QuickLinksPanel`
  - [x] 9.2 Attach `App.init()` to `DOMContentLoaded` event

- [x] 10. Style the dashboard
  - [x] 10.1 Implement base layout in `style.css` with CSS Grid or Flexbox for the dashboard sections
  - [x] 10.2 Style each module section with consistent spacing, typography (minimum 14px body text), and visual hierarchy
  - [x] 10.3 Implement responsive layout supporting viewport widths from 320px to 1920px
  - [x] 10.4 Style interactive elements with clear affordances (hover, focus, active states)
  - [x] 10.5 Ensure focus indicators are visible for keyboard navigation
  - [x] 10.6 Apply completed-task visual distinction (strikethrough and reduced opacity)

- [ ] 11. Write unit tests
  - [ ] 11.1 Set up a test runner (e.g., Vitest or Jest with jsdom) and configure it to import `js/script.js` module exports
  - [ ] 11.2 Write example-based unit tests for `TimeDisplay.formatTime` covering boundary cases (midnight, noon, single-digit hours/minutes)
  - [ ] 11.3 Write example-based unit tests for `TimeDisplay.formatDate` covering weekday and month name output
  - [ ] 11.4 Write example-based unit tests for `GreetingModule.getGreeting` at boundary hours (0, 5, 12, 17, 23)
  - [ ] 11.5 Write example-based unit tests for `FocusTimer.formatTime` at 0, 90, and 3599 seconds
  - [ ] 11.6 Write example-based unit tests for `QuickLinksPanel.normalizeUrl` with and without protocol prefixes
  - [ ] 11.7 Write example-based unit tests for `StorageService.load` with corrupted JSON (verify fallback returned and `console.error` called)
  - [ ] 11.8 Write example-based unit test for `ThemeManager` default theme (verify `"light"` when no stored value)
  - [ ] 11.9 Write example-based unit test for `GreetingModule` with empty username (verify no name suffix)

- [ ] 12. Write property-based tests
  - [ ] 12.1 Install `fast-check` as a dev dependency
  - [ ] 12.2 Write property test for Property 1 (time format correctness): for any `Date`, `formatTime` output matches `HH:MM:SS AM/PM` pattern
  - [ ] 12.3 Write property test for Property 2 (greeting coverage): for any hour 0–23, `getGreeting` returns one of the three valid strings
  - [ ] 12.4 Write property test for Property 3 (task addition round-trip): for any non-empty non-whitespace string, add then load returns task with matching text and `completed: false`
  - [ ] 12.5 Write property test for Property 4 (whitespace task rejection): for any whitespace-only string, `add` leaves task list unchanged
  - [ ] 12.6 Write property test for Property 5 (task toggle idempotence): for any task, double-toggle restores original `completed` state
  - [ ] 12.7 Write property test for Property 6 (serialization round-trip): for any array of Task or Link objects, save then load produces deeply equal result
  - [ ] 12.8 Write property test for Property 7 (URL normalization): for any URL without protocol, `normalizeUrl` prepends `https://`; for any URL with protocol, it is returned unchanged
  - [ ] 12.9 Write property test for Property 8 (timer format correctness): for any integer 0–3599, `formatTime` output matches `MM:SS` pattern with zero-padding
  - [ ] 12.10 Write property test for Property 9 (theme toggle round-trip): for any initial theme, double-toggle restores original value
