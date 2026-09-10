<script>
  import { onMount } from 'svelte';
  import EventCard from '$lib/components/EventCard.svelte';
  import ThemeToggle from '$lib/components/ui/ThemeToggle.svelte';
  import { readAttendance, toggleAttendance, writeAttendance } from '$lib/attendance.js';

  let { data } = $props();
  let attendingIds = $state([]);
  let events = $derived(data.events ?? []);

  onMount(() => {
    const validEventIds = new Set(events.map((event) => event.id));
    attendingIds = readAttendance().filter((id) => validEventIds.has(id));
  });

  function handleToggle(eventId) {
    attendingIds = toggleAttendance(attendingIds, eventId);
    writeAttendance(attendingIds);
  }
</script>

<svelte:head>
  <title>Available events · SpotPack</title>
  <meta name="description" content="Find events, build your schedule, and stay in sync." />
</svelte:head>

<div class="events-shell">
  <header class="events-header">
    <div class="header-row">
      <div class="brand-lockup">
        <div class="brand-mark" aria-hidden="true">S</div>
        <div>
          <div class="brand-name">SpotPack</div>
          <div class="brand-caption">Your event companion</div>
        </div>
      </div>
      <ThemeToggle />
    </div>

    <div class="header-copy">
      <span class="eyebrow">Discover · Attend · Plan</span>
      <h1>Find your next<br /><em>favorite event.</em></h1>
      <p>Choose one event or build a season of experiences. Your attendance list stays with you on this device.</p>
    </div>
  </header>

  <main class="events-content">
    {#if data.error}
      <section class="state-card" role="alert">
        <span class="eyebrow">Unable to load events</span>
        <h2>We could not reach the schedule service.</h2>
        <p>{data.error}</p>
      </section>
    {:else if events.length === 0}
      <section class="state-card">
        <span class="eyebrow">No published events</span>
        <h2>There are no events available yet.</h2>
        <p>Check back after an organizer publishes the next schedule.</p>
      </section>
    {:else}
      <section class="events-toolbar" aria-labelledby="available-events-heading">
        <div>
          <span class="eyebrow">Your calendar</span>
          <h2 id="available-events-heading">Available events</h2>
        </div>
        <div class="attendance-summary" aria-live="polite">
          <strong>{attendingIds.length}</strong>
          <span>attending</span>
        </div>
      </section>

      <div class="event-list">
        {#each events as event}
          <EventCard event={event} attending={attendingIds.includes(event.id)} onToggle={handleToggle} />
        {/each}
      </div>

      <section class="selection-note" aria-label="How attendance works">
        <div class="note-icon" aria-hidden="true">+</div>
        <div>
          <strong>Build a flexible agenda</strong>
          <p>Attend as many events as you like. Open any card to enter its detailed schedule.</p>
        </div>
      </section>
    {/if}
  </main>
</div>

<style>
  .events-shell {
    min-height: 100vh;
    background: var(--background);
  }

  .events-header {
    position: relative;
    overflow: hidden;
    background: linear-gradient(145deg, #1a0a3a 0%, #0d1a3a 52%, #07111f 100%);
  }

  .events-header::after {
    position: absolute;
    right: -40px;
    bottom: -100px;
    width: 280px;
    height: 280px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(139, 92, 246, 0.2) 0%, transparent 70%);
    content: '';
    pointer-events: none;
  }

  .header-row,
  .brand-lockup,
  .events-toolbar,
  .attendance-summary,
  .selection-note {
    display: flex;
    align-items: center;
  }

  .header-row {
    position: relative;
    z-index: 1;
    justify-content: space-between;
    width: min(100%, 480px);
    margin: 0 auto;
    padding: 18px 20px 0;
  }

  .brand-lockup {
    gap: 9px;
  }

  .brand-mark {
    display: grid;
    width: 30px;
    height: 30px;
    place-items: center;
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 9px;
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
    font-family: var(--font-display);
    font-size: 15px;
    font-weight: 800;
  }

  .brand-name {
    color: #f8fafc;
    font-size: 13px;
    font-weight: 700;
  }

  .brand-caption {
    margin-top: 1px;
    color: rgba(148, 163, 184, 0.75);
    font-size: 10px;
  }

  .header-copy {
    position: relative;
    z-index: 1;
    width: min(100%, 480px);
    margin: 0 auto;
    padding: 58px 20px 42px;
  }

  .eyebrow {
    display: block;
    margin-bottom: 6px;
    color: var(--muted);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  .header-copy .eyebrow {
    color: #34d399;
    font-family: var(--font-mono);
  }

  h1,
  h2,
  p {
    margin: 0;
  }

  h1 {
    color: #fff;
    font-family: var(--font-display);
    font-size: clamp(2.3rem, 11vw, 3.2rem);
    font-weight: 800;
    letter-spacing: -0.055em;
    line-height: 1.02;
  }

  h1 em {
    color: #a78bfa;
    font-style: normal;
  }

  .header-copy p {
    max-width: 350px;
    margin-top: 14px;
    color: rgba(148, 163, 184, 0.9);
    font-size: 13px;
    line-height: 1.55;
  }

  .events-content {
    width: min(100%, 480px);
    margin: 0 auto;
    padding: 28px 16px 36px;
  }

  .events-toolbar {
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 14px;
  }

  h2 {
    color: var(--text-primary);
    font-family: var(--font-display);
    font-size: 20px;
    letter-spacing: -0.025em;
  }

  .attendance-summary {
    gap: 5px;
    color: var(--muted);
    font-family: var(--font-mono);
    font-size: 10px;
    text-transform: uppercase;
  }

  .attendance-summary strong {
    color: var(--accent);
    font-size: 16px;
  }

  .event-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .state-card {
    padding: 28px 18px;
    border: 1px dashed var(--border);
    border-radius: 14px;
    background: var(--panel);
    text-align: center;
  }

  .state-card h2 {
    color: var(--text-primary);
    font-family: var(--font-display);
    font-size: 20px;
  }

  .state-card p {
    max-width: 320px;
    margin: 8px auto 0;
    color: var(--text-secondary);
    font-size: 12px;
    line-height: 1.5;
  }

  .selection-note {
    align-items: flex-start;
    gap: 12px;
    margin-top: 22px;
    padding: 14px;
    border: 1px solid var(--border);
    border-radius: 12px;
    background: var(--panel);
  }

  .note-icon {
    display: grid;
    width: 27px;
    height: 27px;
    flex: 0 0 auto;
    place-items: center;
    border-radius: 8px;
    background: var(--accent-soft);
    color: var(--accent);
    font-size: 20px;
    line-height: 1;
  }

  .selection-note strong {
    color: var(--text-primary);
    font-size: 12px;
  }

  .selection-note p {
    margin-top: 3px;
    color: var(--muted);
    font-size: 11px;
    line-height: 1.45;
  }

  @media (min-width: 520px) {
    .events-shell {
      width: min(100%, 480px);
      margin: 0 auto;
      border-right: 1px solid var(--border);
      border-left: 1px solid var(--border);
    }
  }
</style>
