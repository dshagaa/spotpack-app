<script>
  import Badge from '$lib/components/ui/Badge.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import Card from '$lib/components/ui/Card.svelte';

  let { event, attending = false, onToggle } = $props();
</script>

<Card variant="secondary" class="event-card" style={`--event-accent: ${event.accent}`}>
  <div class="event-card-topline">
    <Badge color="keynote" label={attending ? 'Attending' : 'Available'} />
    <span class="event-count">{event.itemCount} activities</span>
  </div>

  <a class="event-link" href={`/events/${event.id}`} data-event-id={event.id}>
    <h2>{event.name}</h2>
    <p>{event.subtitle}</p>
  </a>

  <div class="event-meta">
    <span>{event.dates}</span>
    <span aria-hidden="true">·</span>
    <span>{event.location}</span>
  </div>

  <div class="event-actions">
    <a class="detail-link" href={`/events/${event.id}`}>View details <span aria-hidden="true">→</span></a>
    <Button
      variant={attending ? 'secondary' : 'primary'}
      class="attend-button"
      aria-pressed={attending}
      onclick={() => onToggle(event.id)}
    >
      {attending ? 'Attending' : 'Attend'}
    </Button>
  </div>
</Card>

<style>
  :global(.event-card) {
    display: flex;
    flex-direction: column;
    gap: 12px;
    border-left: 2px solid var(--event-accent, var(--accent));
  }

  .event-card-topline,
  .event-meta,
  .event-actions {
    display: flex;
    align-items: center;
  }

  .event-card-topline,
  .event-actions {
    justify-content: space-between;
    gap: 12px;
  }

  .event-count,
  .event-meta {
    color: var(--muted);
    font-size: 10px;
  }

  .event-link {
    color: inherit;
    text-decoration: none;
  }

  .event-link h2 {
    color: var(--text-primary);
    font-family: var(--font-display);
    font-size: 20px;
    letter-spacing: -0.025em;
  }

  .event-link p {
    max-width: 34rem;
    margin-top: 5px;
    color: var(--text-secondary);
    font-size: 13px;
    line-height: 1.45;
  }

  .event-link:hover h2 {
    color: var(--accent);
  }

  .event-meta {
    flex-wrap: wrap;
    gap: 6px;
    font-family: var(--font-mono);
  }

  .event-actions {
    padding-top: 4px;
  }

  .detail-link {
    color: var(--accent);
    font-size: 11px;
    font-weight: 600;
    text-decoration: none;
  }

  .detail-link:hover {
    text-decoration: underline;
  }

  :global(.attend-button) {
    padding: 8px 12px;
    font-size: 11px;
  }
</style>
