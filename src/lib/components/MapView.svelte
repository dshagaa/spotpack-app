<script>
  import Badge from '$lib/components/ui/Badge.svelte';
  import Card from '$lib/components/ui/Card.svelte';

  let { event, focusLocation = null } = $props();
  let selectedSpaceId = $state('all');

  const positions = [
    { x: 22, y: 26 },
    { x: 66, y: 22 },
    { x: 28, y: 65 },
    { x: 72, y: 66 },
    { x: 49, y: 46 },
    { x: 14, y: 48 }
  ];

  function toSpaceId(name) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  $effect(() => {
    if (focusLocation) selectedSpaceId = toSpaceId(focusLocation);
  });

  function getSpaceType(name) {
    const normalized = name.toLowerCase();
    if (normalized.includes('stage') || normalized.includes('hall')) return 'main';
    if (normalized.includes('workshop') || normalized.includes('lab')) return 'workshop';
    return 'room';
  }

  let mapSpaces = $derived(
    [...new Set([
      ...event.activities.map((activity) => activity.location),
      ...(event.nextUp?.location ? [event.nextUp.location] : [])
    ])]
      .map((name, index) => ({
        id: toSpaceId(name),
        name,
        type: getSpaceType(name),
        position: positions[index % positions.length]
      }))
  );

  let selectedSpace = $derived(mapSpaces.find((space) => space.id === selectedSpaceId) ?? null);
  let visibleActivities = $derived(
    selectedSpaceId === 'all'
      ? event.activities
      : event.activities.filter((activity) => toSpaceId(activity.location) === selectedSpaceId)
  );

  function selectSpace(spaceId) {
    selectedSpaceId = spaceId;
  }
</script>

<div class="map-view" data-map-view>
  <section class="map-intro">
    <div>
      <span class="eyebrow">Orientation</span>
      <h2>Find your way around</h2>
      <p>{event.name} · {event.location}</p>
    </div>
    <div class="compass" aria-label="North">N<span>↑</span></div>
  </section>

  <section class="map-panel" aria-labelledby="map-title">
    <div class="section-heading compact">
      <div><span class="eyebrow">Venue guide</span><h2 id="map-title">Venue floor plan</h2></div>
      <span class="map-status"><span></span> Live guide</span>
    </div>

    <div class="floor-plan" aria-label="Interactive schematic venue floor plan">
      <div class="floor-grid"></div>
      <div class="floor-building building-top"></div>
      <div class="floor-building building-left"></div>
      <div class="floor-building building-right"></div>
      <div class="floor-building building-bottom"></div>
      <div class="floor-courtyard"><span>Central<br />lounge</span></div>
      <div class="floor-path path-horizontal"></div>
      <div class="floor-path path-vertical"></div>
      <div class="floor-label label-entry">Main entrance</div>
      <div class="floor-label label-info">Info desk</div>

      {#each mapSpaces as space}
        <button
          type="button"
          class:active={selectedSpaceId === space.id}
          class="map-marker"
          data-map-space={space.id}
          style={`left: ${space.position.x}%; top: ${space.position.y}%`}
          aria-pressed={selectedSpaceId === space.id}
          onclick={() => selectSpace(space.id)}
        >
          <span class={`marker-dot marker-${space.type}`}></span>
          <span class="marker-label">{space.name}</span>
        </button>
      {/each}
    </div>

    <div class="map-controls" aria-label="Map filters">
      <button type="button" class:active={selectedSpaceId === 'all'} onclick={() => selectSpace('all')}>All spaces <span>{event.activities.length}</span></button>
      {#each mapSpaces as space}
        <button type="button" class:active={selectedSpaceId === space.id} onclick={() => selectSpace(space.id)}>{space.name}</button>
      {/each}
    </div>
  </section>

  <section class="map-activities">
    <div class="section-heading compact">
      <div><span class="eyebrow">{selectedSpace ? 'Selected space' : 'Event spaces'}</span><h2>{selectedSpace?.name ?? 'Activities here'}</h2></div>
      <span class="section-index">{visibleActivities.length}</span>
    </div>

    {#if visibleActivities.length > 0}
      <div class="activity-list">
        {#each visibleActivities as activity}
          <Card variant="secondary" class="map-activity-card" data-map-activity-id={activity.id}>
            <span class="activity-time mono">{activity.time}</span>
            <div class="activity-copy">
              <div class="activity-title-row"><strong>{activity.title}</strong><Badge color={activity.track} /></div>
              <span class="activity-subtitle">{activity.location} <span>· {activity.speaker}</span></span>
            </div>
          </Card>
        {/each}
      </div>
    {:else}
      <div class="empty-state"><strong>No scheduled activities in this space</strong><span>Select another marker to explore the venue.</span></div>
    {/if}
  </section>
</div>

<style>
  .map-view { padding-top: 16px; }
  .map-intro { display: flex; align-items: flex-start; justify-content: space-between; gap: 18px; margin-bottom: 20px; }
  .map-intro h2 { margin-bottom: 5px; }
  .map-intro p { color: var(--muted); font-size: 11px; }
  .compass { display: grid; width: 38px; height: 38px; flex: 0 0 auto; place-items: center; border: 1px solid var(--border); border-radius: 50%; color: var(--accent); font-family: var(--font-mono); font-size: 9px; font-weight: 700; }
  .compass span { display: block; margin-top: -4px; font-size: 15px; line-height: 12px; }
  .map-panel { margin-bottom: 28px; }
  .section-heading { display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; margin-bottom: 10px; }
  .section-heading.compact { align-items: center; }
  .eyebrow { display: block; margin-bottom: 4px; color: var(--muted); font-size: 10px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; }
  h2 { color: var(--text-primary); font-family: var(--font-display); font-size: 18px; letter-spacing: -.02em; }
  .section-index { color: var(--accent); font-family: var(--font-mono); font-size: 10px; }
  .map-status { display: inline-flex; align-items: center; gap: 5px; color: #34d399; font-family: var(--font-mono); font-size: 9px; text-transform: uppercase; }
  .map-status span { width: 6px; height: 6px; border-radius: 50%; background: #34d399; box-shadow: 0 0 8px #34d399; }
  .floor-plan { position: relative; overflow: hidden; height: 290px; border: 1px solid var(--border); border-radius: 16px; background: #0b1422; box-shadow: inset 0 0 40px rgba(0,0,0,.22); }
  .floor-grid { position: absolute; inset: 0; opacity: .3; background-image: linear-gradient(rgba(148,163,184,.08) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,.08) 1px, transparent 1px); background-size: 24px 24px; }
  .floor-building { position: absolute; border: 1px solid rgba(167,139,250,.36); border-radius: 8px; background: linear-gradient(135deg, rgba(139,92,246,.18), rgba(96,165,250,.06)); box-shadow: 0 0 20px rgba(139,92,246,.08); }
  .building-top { top: 9%; left: 10%; width: 80%; height: 23%; }
  .building-left { top: 39%; left: 9%; width: 28%; height: 46%; }
  .building-right { top: 39%; right: 9%; width: 28%; height: 46%; }
  .building-bottom { right: 35%; bottom: 8%; left: 35%; height: 18%; }
  .floor-courtyard { position: absolute; top: 43%; left: 42%; display: grid; width: 16%; height: 26%; place-items: center; border: 1px dashed rgba(52,211,153,.55); border-radius: 10px; background: rgba(52,211,153,.08); color: rgba(167,243,208,.82); font-size: 8px; text-align: center; text-transform: uppercase; }
  .floor-path { position: absolute; background: rgba(148,163,184,.22); }
  .path-horizontal { top: 36%; right: 7%; left: 7%; height: 2px; }
  .path-vertical { top: 27%; bottom: 8%; left: calc(50% - 1px); width: 2px; }
  .floor-label { position: absolute; color: rgba(148,163,184,.65); font-family: var(--font-mono); font-size: 8px; letter-spacing: .05em; text-transform: uppercase; }
  .label-entry { bottom: 3%; left: 10%; }
  .label-info { top: 34%; right: 11%; }
  .map-marker { position: absolute; display: flex; align-items: center; gap: 4px; max-width: 38%; padding: 0; transform: translate(-50%, -50%); border: 0; background: transparent; color: var(--text-secondary); cursor: pointer; font-family: var(--font-mono); font-size: 8px; text-align: left; }
  .map-marker:hover, .map-marker.active { color: #fff; }
  .marker-dot { display: block; width: 11px; height: 11px; flex: 0 0 auto; border: 2px solid #0b1422; border-radius: 50%; background: var(--accent); box-shadow: 0 0 0 1px var(--accent), 0 0 12px var(--accent); }
  .marker-main { --accent: #60a5fa; }
  .marker-workshop { --accent: #34d399; }
  .marker-room { --accent: #f472b6; }
  .map-marker.active .marker-dot { width: 14px; height: 14px; box-shadow: 0 0 0 2px var(--accent), 0 0 18px var(--accent); }
  .marker-label { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .map-controls { display: flex; gap: 6px; overflow-x: auto; padding: 10px 1px 3px; }
  .map-controls button { flex: 0 0 auto; padding: 7px 10px; border: 1px solid var(--border); border-radius: 8px; background: var(--panel-raised); color: var(--muted); cursor: pointer; font-size: 10px; font-weight: 700; }
  .map-controls button span { margin-left: 3px; color: var(--accent); font-family: var(--font-mono); font-size: 9px; }
  .map-controls button:hover, .map-controls button.active { border-color: var(--accent-border); background: var(--accent-soft); color: var(--text-primary); }
  .map-activities { margin-bottom: 20px; }
  .activity-list { display: flex; flex-direction: column; gap: 8px; margin-top: 12px; }
  :global(.map-activity-card) { display: flex; align-items: flex-start; gap: 12px; border-left: 2px solid var(--accent); padding: 12px 14px; }
  .activity-time { min-width: 42px; padding-top: 2px; color: var(--muted); font-size: 10px; }
  .activity-copy { min-width: 0; flex: 1; }
  .activity-title-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; }
  .activity-title-row strong { color: var(--text-primary); font-size: 13px; line-height: 1.35; }
  .activity-subtitle { display: block; margin-top: 4px; color: var(--muted); font-size: 11px; }
  .activity-subtitle span { opacity: .8; }
  .empty-state { display: flex; flex-direction: column; gap: 5px; padding: 28px 16px; border: 1px dashed var(--border); border-radius: 12px; color: var(--muted); text-align: center; }
  .empty-state strong { color: var(--text-secondary); font-size: 13px; }
  .empty-state span { font-size: 11px; line-height: 1.45; }
</style>
