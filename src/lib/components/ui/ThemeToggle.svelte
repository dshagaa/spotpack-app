<script>
  import { onMount } from 'svelte';
  import {
    THEME_MODES,
    THEME_STORAGE_KEY,
    applyTheme
  } from '$lib/theme.js';

  let mode = $state('system');
  let systemQuery;

  function selectMode(nextMode) {
    mode = nextMode;
    localStorage.setItem(THEME_STORAGE_KEY, nextMode);
    applyTheme(nextMode);
  }

  onMount(() => {
    const storedMode = localStorage.getItem(THEME_STORAGE_KEY);
    mode = THEME_MODES.some((item) => item.value === storedMode) ? storedMode : 'system';
    applyTheme(mode);

    systemQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemChange = () => {
      if (mode === 'system') applyTheme(mode);
    };

    systemQuery.addEventListener?.('change', handleSystemChange);
    return () => systemQuery.removeEventListener?.('change', handleSystemChange);
  });
</script>

<div class="theme-toggle" aria-label="Appearance" role="group">
  <span class="sr-only">Appearance</span>
  {#each THEME_MODES as item}
    <button
      type="button"
      data-theme-mode={item.value}
      class:active={mode === item.value}
      aria-pressed={mode === item.value}
      aria-label={item.description}
      title={item.description}
      onclick={() => selectMode(item.value)}
    >
      {#if item.value === 'day'}
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </svg>
      {:else if item.value === 'night'}
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M20.5 15.2A8.5 8.5 0 0 1 8.8 3.5 8.5 8.5 0 1 0 20.5 15.2Z" />
        </svg>
      {:else}
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <path d="M12 4v16" />
        </svg>
      {/if}
      <span class="sr-only">{item.label}</span>
    </button>
  {/each}
</div>

<style>
  .theme-toggle {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    padding: 3px;
    border: 1px solid var(--border);
    border-radius: 10px;
    background: var(--panel);
  }

  button {
    display: grid;
    width: 30px;
    height: 28px;
    place-items: center;
    border: 0;
    border-radius: 7px;
    color: var(--muted);
    cursor: pointer;
    transition: background 160ms ease, color 160ms ease, transform 160ms ease;
  }

  button:hover,
  button:focus-visible {
    color: var(--text-primary);
    background: var(--panel-raised);
  }

  button:active {
    transform: scale(0.94);
  }

  button.active {
    color: var(--text-primary);
    background: var(--accent-soft);
    box-shadow: inset 0 0 0 1px var(--accent-border);
  }

  svg {
    width: 15px;
    height: 15px;
    fill: none;
    stroke: currentColor;
    stroke-linecap: round;
    stroke-linejoin: round;
    stroke-width: 1.8;
  }
</style>
