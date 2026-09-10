<script>
  import EventDetail from '$lib/components/EventDetail.svelte';

  let { data } = $props();
</script>

{#if data.event}
  {#if data.error}
    <p class="cache-note" role="status">{data.error}</p>
  {/if}
  <EventDetail event={data.event} />
{:else}
  <main class="missing-event" role="alert">
    <span>Event unavailable</span>
    <h1>{data.error ?? 'This event could not be loaded.'}</h1>
    <a href="/">Back to events</a>
  </main>
{/if}

<style>
  .cache-note { margin: 14px auto 0; max-width: 980px; padding: 8px 14px; color: var(--muted); font-size: 11px; text-align: center; }
  .missing-event { display: grid; gap: 10px; place-items: center; min-height: 50vh; padding: 24px; text-align: center; }
  .missing-event span { color: var(--accent); font-size: 11px; font-weight: 700; letter-spacing: .16em; text-transform: uppercase; }
  .missing-event h1 { max-width: 420px; color: var(--text); font-size: clamp(24px, 5vw, 42px); }
  .missing-event a { color: var(--accent); font-weight: 700; }
</style>
