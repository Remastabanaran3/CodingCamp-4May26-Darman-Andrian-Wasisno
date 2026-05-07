/* ============================================================
   Life Dashboard — script.js
   Vanilla JS, no frameworks, no external dependencies.
   Modules: StorageService, TimeDisplay, GreetingModule,
            FocusTimer, TaskManager, QuickLinksPanel,
            ThemeManager, App
   ============================================================ */

'use strict';

/* ── 1. StorageService ────────────────────────────────────── */
const StorageService = {
  /** Storage key constants */
  KEYS: {
    TASKS:          'dashboard_tasks',
    LINKS:          'dashboard_links',
    THEME:          'dashboard_theme',
    USERNAME:       'dashboard_username',
    TIMER_DURATION: 'dashboard_timer_duration',
  },

  /** In-memory fallback when localStorage is unavailable */
  _memory: {},
  _available: true,

  /** Check localStorage availability once on init */
  init() {
    try {
      const test = '__ls_test__';
      localStorage.setItem(test, '1');
      localStorage.removeItem(test);
      this._available = true;
    } catch (e) {
      this._available = false;
      console.warn('StorageService: localStorage unavailable, using in-memory storage.', e);
    }
  },

  /**
   * Persist a value under the given key.
   * @param {string} key
   * @param {*} value  — will be JSON-serialised
   */
  save(key, value) {
    const serialised = JSON.stringify(value);
    if (this._available) {
      try {
        localStorage.setItem(key, serialised);
      } catch (e) {
        console.error('StorageService.save: failed to write to localStorage.', e);
      }
    } else {
      this._memory[key] = serialised;
    }
  },

  /**
   * Load and deserialise a value from storage.
   * Returns `fallback` if the key is missing or the JSON is invalid.
   * @param {string} key
   * @param {*} fallback
   * @returns {*}
   */
  load(key, fallback) {
    try {
      const raw = this._available
        ? localStorage.getItem(key)
        : this._memory[key];
      if (raw === null || raw === undefined) return fallback;
      return JSON.parse(raw);
    } catch (e) {
      console.error(`StorageService.load: failed to parse key "${key}".`, e);
      return fallback;
    }
  },
};

/* ── 2. TimeDisplay ───────────────────────────────────────── */
const TimeDisplay = {
  _intervalId: null,

  /** Month and weekday name arrays */
  _DAYS:   ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'],
  _MONTHS: ['January','February','March','April','May','June',
            'July','August','September','October','November','December'],

  /**
   * Format a Date as "HH:MM:SS AM/PM" (12-hour, leading zeros).
   * @param {Date} date
   * @returns {string}
   */
  formatTime(date) {
    let hours   = date.getHours();
    const mins  = date.getMinutes();
    const secs  = date.getSeconds();
    const ampm  = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;                       // convert 0 → 12
    const hh = String(hours).padStart(2, '0');
    const mm = String(mins).padStart(2, '0');
    const ss = String(secs).padStart(2, '0');
    return `${hh}:${mm}:${ss} ${ampm}`;
  },

  /**
   * Format a Date as "Weekday, Month DD, YYYY".
   * @param {Date} date
   * @returns {string}
   */
  formatDate(date) {
    const day   = this._DAYS[date.getDay()];
    const month = this._MONTHS[date.getMonth()];
    const d     = date.getDate();
    const year  = date.getFullYear();
    return `${day}, ${month} ${d}, ${year}`;
  },

  /** Update DOM with current time and date. */
  render(now) {
    const timeEl = document.getElementById('time-display');
    const dateEl = document.getElementById('date-display');
    if (timeEl) timeEl.textContent = this.formatTime(now);
    if (dateEl) dateEl.textContent = this.formatDate(now);
  },

  /** Called every second by setInterval. */
  tick() {
    this.render(new Date());
  },

  /** Start the clock. */
  init() {
    this.tick();                                     // render immediately
    this._intervalId = setInterval(() => this.tick(), 1000);
  },
};

/* ── 3. GreetingModule ────────────────────────────────────── */
const GreetingModule = {
  _username: '',

  /**
   * Return greeting string based on hour (0–23).
   * @param {number} hour
   * @returns {string}
   */
  getGreeting(hour) {
    if (hour >= 5 && hour < 12)  return 'Good Morning';
    if (hour >= 12 && hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  },

  /** Update the greeting DOM element. */
  render() {
    const el = document.getElementById('greeting-text');
    if (!el) return;
    const greeting = this.getGreeting(new Date().getHours());
    el.textContent = this._username
      ? `${greeting}, ${this._username}!`
      : `${greeting}!`;
  },

  /**
   * Persist a new username and re-render.
   * @param {string} name
   */
  setName(name) {
    this._username = name.trim();
    StorageService.save(StorageService.KEYS.USERNAME, this._username);
    this.render();
  },

  /** Load stored username and render. */
  init() {
    this._username = StorageService.load(StorageService.KEYS.USERNAME, '');

    // Pre-fill the input with stored name
    const input = document.getElementById('username-input');
    if (input && this._username) input.value = this._username;

    this.render();

    // Wire save button
    const saveBtn = document.getElementById('username-save');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        const val = document.getElementById('username-input')?.value ?? '';
        this.setName(val);
      });
    }

    // Allow pressing Enter in the name input
    if (input) {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') this.setName(input.value);
      });
    }
  },
};

/* ── 4. FocusTimer ────────────────────────────────────────── */
const FocusTimer = {
  duration:   25,    // minutes
  remaining:  0,     // seconds
  running:    false,
  _intervalId: null,

  /**
   * Format seconds as zero-padded "MM:SS".
   * @param {number} seconds  0–3599
   * @returns {string}
   */
  formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  },

  /** Update the timer display DOM element. */
  render() {
    const el = document.getElementById('timer-display');
    if (el) el.textContent = this.formatTime(this.remaining);
  },

  /** Show or hide the completion notification. */
  _setNotification(visible) {
    const el = document.getElementById('timer-notification');
    if (!el) return;
    if (visible) {
      el.removeAttribute('hidden');
    } else {
      el.setAttribute('hidden', '');
    }
  },

  /** Called when countdown reaches zero. */
  onComplete() {
    this.stop();
    this._setNotification(true);
    // Auto-hide notification after 8 seconds
    setTimeout(() => this._setNotification(false), 8000);
    this.remaining = this.duration * 60;
    this.render();
  },

  /** Decrement remaining by 1 second. */
  tick() {
    if (this.remaining <= 0) {
      this.onComplete();
      return;
    }
    this.remaining -= 1;
    this.render();
  },

  /** Start the countdown. */
  start() {
    if (this.running) return;
    this._setNotification(false);
    this.running = true;
    this._intervalId = setInterval(() => this.tick(), 1000);
  },

  /** Pause the countdown (preserves remaining time). */
  stop() {
    if (!this.running) return;
    clearInterval(this._intervalId);
    this._intervalId = null;
    this.running = false;
  },

  /** Reset to configured duration. */
  reset() {
    this.stop();
    this._setNotification(false);
    this.remaining = this.duration * 60;
    this.render();
  },

  /**
   * Set a custom duration (clamped to 1–60 minutes).
   * @param {number|string} minutes
   */
  setDuration(minutes) {
    const parsed = parseInt(minutes, 10);
    if (isNaN(parsed)) return;                       // reject non-numeric
    this.duration = Math.min(60, Math.max(1, parsed));
    StorageService.save(StorageService.KEYS.TIMER_DURATION, this.duration);
    this.reset();
  },

  /** Load stored duration, wire buttons, and render. */
  init() {
    this.duration  = StorageService.load(StorageService.KEYS.TIMER_DURATION, 25);
    this.remaining = this.duration * 60;
    this.render();

    // Pre-fill duration input
    const durInput = document.getElementById('timer-duration-input');
    if (durInput) durInput.value = this.duration;

    // Wire control buttons
    document.getElementById('timer-start')
      ?.addEventListener('click', () => this.start());
    document.getElementById('timer-stop')
      ?.addEventListener('click', () => this.stop());
    document.getElementById('timer-reset')
      ?.addEventListener('click', () => this.reset());

    // Wire duration save
    document.getElementById('timer-duration-save')
      ?.addEventListener('click', () => {
        const val = document.getElementById('timer-duration-input')?.value;
        this.setDuration(val);
        if (durInput) durInput.value = this.duration;
      });

    // Allow Enter in duration input
    if (durInput) {
      durInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          this.setDuration(durInput.value);
          durInput.value = this.duration;
        }
      });
    }
  },
};

/* ── 5. TaskManager ───────────────────────────────────────── */
const TaskManager = {
  tasks: [],

  /** Generate a simple unique ID. */
  _uid() {
    return (typeof crypto !== 'undefined' && crypto.randomUUID)
      ? crypto.randomUUID()
      : Date.now().toString(36) + Math.random().toString(36).slice(2);
  },

  /**
   * Add a new task.
   * @param {string} text
   */
  add(text) {
    const trimmed = text.trim();
    if (!trimmed) return;                            // reject whitespace-only
    this.tasks.push({
      id:        this._uid(),
      text:      trimmed,
      completed: false,
      createdAt: Date.now(),
    });
    this.save();
    this.render();
  },

  /**
   * Update task text.
   * @param {string} id
   * @param {string} newText
   */
  edit(id, newText) {
    const trimmed = newText.trim();
    if (!trimmed) return;
    const task = this.tasks.find(t => t.id === id);
    if (!task) return;
    task.text = trimmed;
    this.save();
    this.render();
  },

  /**
   * Toggle completed status.
   * @param {string} id
   */
  toggleComplete(id) {
    const task = this.tasks.find(t => t.id === id);
    if (!task) return;
    task.completed = !task.completed;
    this.save();
    this.render();
  },

  /**
   * Remove a task.
   * @param {string} id
   */
  delete(id) {
    this.tasks = this.tasks.filter(t => t.id !== id);
    this.save();
    this.render();
  },

  /** Persist tasks array to storage. */
  save() {
    StorageService.save(StorageService.KEYS.TASKS, this.tasks);
  },

  /**
   * Build a single task list item element.
   * @param {{ id:string, text:string, completed:boolean }} task
   * @returns {HTMLLIElement}
   */
  renderTask(task) {
    const li = document.createElement('li');
    li.className = 'task-item' + (task.completed ? ' task-item--completed' : '');
    li.dataset.id = task.id;

    // Checkbox
    const checkbox = document.createElement('input');
    checkbox.type      = 'checkbox';
    checkbox.className = 'task-item__checkbox';
    checkbox.checked   = task.completed;
    checkbox.setAttribute('aria-label', `Mark "${task.text}" as ${task.completed ? 'incomplete' : 'complete'}`);
    checkbox.addEventListener('change', () => this.toggleComplete(task.id));

    // Text span
    const textSpan = document.createElement('span');
    textSpan.className   = 'task-item__text';
    textSpan.textContent = task.text;

    // Actions container
    const actions = document.createElement('div');
    actions.className = 'task-item__actions';

    // Edit button
    const editBtn = document.createElement('button');
    editBtn.className   = 'task-item__btn';
    editBtn.textContent = '✏️';
    editBtn.setAttribute('aria-label', `Edit task: ${task.text}`);
    editBtn.addEventListener('click', () => this._startEdit(li, task));

    // Delete button
    const delBtn = document.createElement('button');
    delBtn.className   = 'task-item__btn task-item__btn--delete';
    delBtn.textContent = '🗑️';
    delBtn.setAttribute('aria-label', `Delete task: ${task.text}`);
    delBtn.addEventListener('click', () => this.delete(task.id));

    actions.appendChild(editBtn);
    actions.appendChild(delBtn);

    li.appendChild(checkbox);
    li.appendChild(textSpan);
    li.appendChild(actions);

    return li;
  },

  /**
   * Replace text span with an inline edit input.
   * @param {HTMLLIElement} li
   * @param {{ id:string, text:string }} task
   */
  _startEdit(li, task) {
    const textSpan = li.querySelector('.task-item__text');
    const actions  = li.querySelector('.task-item__actions');
    if (!textSpan || !actions) return;

    // Build inline input
    const input = document.createElement('input');
    input.type      = 'text';
    input.className = 'task-item__edit-input';
    input.value     = task.text;
    input.setAttribute('aria-label', 'Edit task text');

    // Save button
    const saveBtn = document.createElement('button');
    saveBtn.className   = 'task-item__btn task-item__btn--save';
    saveBtn.textContent = '✔️';
    saveBtn.setAttribute('aria-label', 'Save edit');

    // Cancel button
    const cancelBtn = document.createElement('button');
    cancelBtn.className   = 'task-item__btn';
    cancelBtn.textContent = '✖️';
    cancelBtn.setAttribute('aria-label', 'Cancel edit');

    const commit = () => {
      this.edit(task.id, input.value);
    };

    saveBtn.addEventListener('click', commit);
    cancelBtn.addEventListener('click', () => this.render());
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter')  commit();
      if (e.key === 'Escape') this.render();
    });

    // Swap text span for input
    li.replaceChild(input, textSpan);

    // Swap edit/delete buttons for save/cancel
    actions.innerHTML = '';
    actions.appendChild(saveBtn);
    actions.appendChild(cancelBtn);

    input.focus();
    input.select();
  },

  /** Rebuild the entire task list DOM. */
  render() {
    const list = document.getElementById('task-list');
    if (!list) return;
    list.innerHTML = '';

    if (this.tasks.length === 0) {
      const empty = document.createElement('li');
      empty.className   = 'task-empty';
      empty.textContent = 'No tasks yet. Add one above!';
      list.appendChild(empty);
      return;
    }

    this.tasks.forEach(task => list.appendChild(this.renderTask(task)));
  },

  /** Load tasks from storage and render. */
  init() {
    this.tasks = StorageService.load(StorageService.KEYS.TASKS, []);
    this.render();

    // Wire add form
    const form  = document.getElementById('task-form');
    const input = document.getElementById('task-input');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        if (input) {
          this.add(input.value);
          input.value = '';
        }
      });
    }
  },
};

/* ── 6. QuickLinksPanel ───────────────────────────────────── */
const QuickLinksPanel = {
  links: [],

  /** Generate a simple unique ID. */
  _uid() {
    return (typeof crypto !== 'undefined' && crypto.randomUUID)
      ? crypto.randomUUID()
      : Date.now().toString(36) + Math.random().toString(36).slice(2);
  },

  /**
   * Ensure URL has a protocol prefix.
   * @param {string} url
   * @returns {string}
   */
  normalizeUrl(url) {
    const trimmed = url.trim();
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    return 'https://' + trimmed;
  },

  /**
   * Add a new link.
   * @param {string} name
   * @param {string} url
   */
  add(name, url) {
    const trimName = name.trim();
    const trimUrl  = url.trim();
    if (!trimName || !trimUrl) return;
    this.links.push({
      id:   this._uid(),
      name: trimName,
      url:  this.normalizeUrl(trimUrl),
    });
    this.save();
    this.render();
  },

  /**
   * Remove a link.
   * @param {string} id
   */
  delete(id) {
    this.links = this.links.filter(l => l.id !== id);
    this.save();
    this.render();
  },

  /**
   * Open a URL in a new tab.
   * @param {string} url
   */
  open(url) {
    window.open(url, '_blank', 'noopener,noreferrer');
  },

  /** Persist links array to storage. */
  save() {
    StorageService.save(StorageService.KEYS.LINKS, this.links);
  },

  /**
   * Build a single link item element.
   * @param {{ id:string, name:string, url:string }} link
   * @returns {HTMLLIElement}
   */
  renderLink(link) {
    const li = document.createElement('li');
    li.className = 'link-item';
    li.dataset.id = link.id;

    // Clickable name button
    const btn = document.createElement('button');
    btn.className   = 'link-item__btn';
    btn.textContent = link.name;
    btn.setAttribute('aria-label', `Open ${link.name} (${link.url})`);
    btn.title = link.url;
    btn.addEventListener('click', () => this.open(link.url));

    // Delete button
    const delBtn = document.createElement('button');
    delBtn.className   = 'link-item__delete';
    delBtn.textContent = '✕';
    delBtn.setAttribute('aria-label', `Remove link: ${link.name}`);
    delBtn.addEventListener('click', () => this.delete(link.id));

    li.appendChild(btn);
    li.appendChild(delBtn);

    return li;
  },

  /** Rebuild the links list DOM. */
  render() {
    const list = document.getElementById('links-list');
    if (!list) return;
    list.innerHTML = '';

    if (this.links.length === 0) {
      const empty = document.createElement('li');
      empty.className   = 'task-empty';
      empty.textContent = 'No links yet. Add one above!';
      list.appendChild(empty);
      return;
    }

    this.links.forEach(link => list.appendChild(this.renderLink(link)));
  },

  /** Load links from storage and render. */
  init() {
    this.links = StorageService.load(StorageService.KEYS.LINKS, []);
    this.render();

    // Wire add form
    const form    = document.getElementById('link-form');
    const nameIn  = document.getElementById('link-name-input');
    const urlIn   = document.getElementById('link-url-input');

    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        if (nameIn && urlIn) {
          this.add(nameIn.value, urlIn.value);
          nameIn.value = '';
          urlIn.value  = '';
        }
      });
    }
  },
};

/* ── 7. ThemeManager ──────────────────────────────────────── */
const ThemeManager = {
  current: 'light',

  /** Apply current theme to <body> via data-theme attribute. */
  apply() {
    document.body.dataset.theme = this.current;
    // Update toggle button icon
    const icon = document.getElementById('theme-icon');
    if (icon) icon.textContent = this.current === 'dark' ? '☀️' : '🌙';
  },

  /** Flip between light and dark, persist, and apply. */
  toggle() {
    this.current = this.current === 'light' ? 'dark' : 'light';
    StorageService.save(StorageService.KEYS.THEME, this.current);
    this.apply();
  },

  /** Load stored theme (default: light) and apply. */
  init() {
    this.current = StorageService.load(StorageService.KEYS.THEME, 'light');
    this.apply();

    document.getElementById('theme-toggle')
      ?.addEventListener('click', () => this.toggle());
  },
};

/* ── 8. App Bootstrap ─────────────────────────────────────── */
const App = {
  init() {
    StorageService.init();
    ThemeManager.init();
    TimeDisplay.init();
    GreetingModule.init();
    FocusTimer.init();
    TaskManager.init();
    QuickLinksPanel.init();
  },
};

document.addEventListener('DOMContentLoaded', () => App.init());
