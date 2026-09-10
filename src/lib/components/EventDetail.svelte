<script>
  import { onMount } from 'svelte';
  import Badge from '$lib/components/ui/Badge.svelte';
  import Card from '$lib/components/ui/Card.svelte';
  import ThemeToggle from '$lib/components/ui/ThemeToggle.svelte';
  import MapView from '$lib/components/MapView.svelte';
  import { readAttendance, toggleAttendance, writeAttendance } from '$lib/attendance.js';
  import { readTracked, toggleTracked, writeTracked } from '$lib/tracking.js';
  import { filterActivities } from '$lib/event-model.js';

  let { event } = $props();

  const tracks = {
    keynote: { label: 'Keynote', color: '#60A5FA' },
    tech: { label: 'Tech', color: '#A78BFA' },
    design: { label: 'Design', color: '#F472B6' },
    business: { label: 'Other', color: '#FBBF24' },
    workshop: { label: 'Workshop', color: '#34D399' }
  };

  const navItems = [
    { id: 'home', label: 'Home' },
    { id: 'schedule', label: 'Schedule' },
    { id: 'map', label: 'Map' },
    { id: 'group', label: 'Group' }
  ];

  const emptyActivity = {
    id: 'empty',
    title: 'No sessions published yet',
    speaker: '',
    time: '',
    location: 'Check back later',
    track: 'business'
  };

  let activeTab = $state('home');
  let selectedDay = $state('all');
  let trackFilter = $state('all');
  let scheduleView = $state('all');
  let expandedId = $state(null);
  let attending = $state(false);
  let trackedIds = $state([]);
  let mapFocusLocation = $state(null);

  let validTrackedIds = $derived(
    trackedIds.filter((id) => event.activities.some((activity) => activity.id === id))
  );
  let filteredActivities = $derived(filterActivities(event.activities, {
    day: selectedDay,
    category: trackFilter,
    trackedOnly: scheduleView === 'tracked',
    trackedIds: validTrackedIds
  }));
  let homeActivities = $derived(
    validTrackedIds.length > 0
      ? event.activities.filter((activity) => validTrackedIds.includes(activity.id))
      : event.activities
  );
  let homeNextActivity = $derived(homeActivities[0] ?? event.nextUp ?? emptyActivity);
  let homeHasTrackedActivities = $derived(validTrackedIds.length > 0);

  $effect(() => {
    if (event.days.length > 0 && !event.days.some((day) => day.value === selectedDay)) {
      selectedDay = event.days[0].value;
    }
  });

  onMount(() => {
    attending = readAttendance().includes(event.id);
    trackedIds = readTracked(event.id);
  });

  function toggleEventAttendance() {
    const ids = toggleAttendance(readAttendance(), event.id);
    writeAttendance(ids);
    attending = ids.includes(event.id);
  }

  function toggleActivity(activityId) {
    trackedIds = toggleTracked(trackedIds, activityId);
    writeTracked(event.id, trackedIds);
  }

  function openActivityOnMap(activity) {
    mapFocusLocation = activity.location;
    activeTab = 'map';
  }
</script>

<svelte:head>
  <title>{event.name} · SpotPack</title>
  <meta name="description" content={event.subtitle} />
</svelte:head>

<div class="detail-shell">
  <header class="hero">
    <div class="hero-glow hero-glow-right"></div>
    <div class="hero-glow hero-glow-left"></div>

    <div class="hero-content">
      <div class="topbar">
        <a class="back-link" href="/" aria-label="Back to available events">← <span>All events</span></a>
        <div class="hero-actions">
          <ThemeToggle />
          <button class:attending class="attend-button" type="button" aria-pressed={attending} onclick={toggleEventAttendance}>
            {attending ? 'Attending' : 'Attend'}
          </button>
        </div>
      </div>

      <div class="live-status"><span class="live-dot"></span><span>{event.status}</span></div>
      <h1>{event.name}</h1>
      <p>{event.subtitle}</p>
    </div>
  </header>

  <main class="content">
    {#if activeTab === 'home'}
      <div data-event-view="home">
        {#if attending}
          <section class="stats-grid" aria-label="Event overview">
            <Card variant="secondary" class="stat-card"><strong>{homeHasTrackedActivities ? homeActivities.length : event.itemCount}</strong><span>{homeHasTrackedActivities ? 'Tracked' : 'Activities'}</span></Card>
            <Card variant="secondary" class="stat-card"><strong>{homeHasTrackedActivities ? homeActivities.length : event.activities.length}</strong><span>{homeHasTrackedActivities ? 'In your schedule' : 'Day 1'}</span></Card>
            <Card variant="secondary" class="stat-card"><strong>{event.members.length || '—'}</strong><span>Group size</span></Card>
          </section>

          <section class="section-block">
            <div class="section-heading"><div><span class="eyebrow">{homeHasTrackedActivities ? 'Your next tracked activity' : `Next up · ${selectedDay}`}</span><h2>Keep your day moving</h2></div><span class="section-index">01</span></div>
            <Card variant="primary" class="next-card">
              <div class="next-card-content"><Badge color={homeNextActivity.track} /><h3>{homeNextActivity.title}</h3><p>{homeNextActivity.speaker}</p><div class="meta-row"><span class="time mono">{homeNextActivity.time}</span><span>·</span><span>{homeNextActivity.location}</span></div></div>
              <button class="next-arrow" type="button" aria-label={`Show ${homeNextActivity.title} on the map`} onclick={() => openActivityOnMap(homeNextActivity)}>↗</button>
            </Card>
          </section>

          <section class="section-block">
            <div class="section-heading compact"><div><span class="eyebrow">{homeHasTrackedActivities ? 'Your tracked activities' : `Today · ${selectedDay}`}</span><h2>{homeHasTrackedActivities ? 'Your schedule highlights' : 'Schedule highlights'}</h2></div><button class="text-action" type="button" onclick={() => (activeTab = 'schedule')}>View all <span aria-hidden="true">→</span></button></div>
            <div class="activity-list">
              {#each homeActivities.slice(0, 3) as activity}
                <Card variant="secondary" class="activity-card" style={`--track-color: ${tracks[activity.track].color}`}>
                  <span class="activity-time mono">{activity.time}</span>
                  <div class="activity-copy"><div class="activity-title-row"><strong>{activity.title}</strong><Badge color={activity.track} /></div><span class="activity-subtitle">{activity.speaker} <span>· {activity.location}</span></span></div>
                </Card>
              {/each}
            </div>
          </section>

          <section class="section-block group-section">
            <div class="section-heading compact"><div><span class="eyebrow">Your group</span><h2>Stay in sync</h2></div><span class="section-index">03</span></div>
            <div class="member-grid">
              {#if event.members.length > 0}
                {#each event.members as member}<Card variant="secondary" class="member-card"><div class="avatar" style={`--member-color: ${member.color}`}>{member.initials}</div><strong>{member.name}</strong><span>{member.activities} acts.</span></Card>{/each}
              {:else}
                <div class="group-unavailable">Group schedules are not available for this event yet.</div>
              {/if}
            </div>
          </section>
        {:else}
          <section class="not-attending">
            <span class="eyebrow">Personal event home</span>
            <h2>Attend this event to unlock your home</h2>
            <p>Your overview, next-up session, highlights, and group view will appear here after you add this event.</p>
            <button type="button" onclick={toggleEventAttendance}>Attend this event</button>
          </section>
        {/if}
      </div>
    {:else if activeTab === 'schedule'}
      <div data-event-view="schedule">
        <section class="section-block schedule-view">
          <div class="section-heading compact"><div><span class="eyebrow">Schedule</span><h2>Find your sessions</h2></div><span class="section-index">01</span></div>

          <div class="view-tabs" role="tablist" aria-label="Activity views">
            <button type="button" role="tab" data-activity-view="all" aria-selected={scheduleView === 'all'} class:active={scheduleView === 'all'} onclick={() => (scheduleView = 'all')}>All activities</button>
            <button type="button" role="tab" data-activity-view="tracked" aria-selected={scheduleView === 'tracked'} class:active={scheduleView === 'tracked'} onclick={() => (scheduleView = 'tracked')}>My tracked <span>{validTrackedIds.length}</span></button>
          </div>

          <div class="day-tabs" role="tablist" aria-label="Event days">
            {#each event.days as day}<button type="button" role="tab" aria-selected={selectedDay === day.value} class:active={selectedDay === day.value} onclick={() => (selectedDay = day.value)}><span>{day.label}</span><small>{day.dateLabel}</small></button>{/each}
          </div>

          <div class="filter-row" aria-label="Filter activities by track">
            <button type="button" class:active={trackFilter === 'all'} onclick={() => (trackFilter = 'all')}>All</button>
            {#each Object.entries(tracks) as [key, track]}<button type="button" class:active={trackFilter === key} style={`--filter-color: ${track.color}`} onclick={() => (trackFilter = key)}>{track.label}</button>{/each}
          </div>

          <div class="activity-list">
            {#each filteredActivities as activity}
              <Card variant="secondary" class="activity-card" style={`--track-color: ${tracks[activity.track].color}`} data-activity-id={activity.id}>
                <span class="activity-time mono">{activity.time}</span>
                <button class="activity-main" type="button" aria-expanded={expandedId === activity.id} onclick={() => (expandedId = expandedId === activity.id ? null : activity.id)}><span class="activity-title-row"><strong>{activity.title}</strong><Badge color={activity.track} /></span><span class="activity-subtitle">{activity.speaker} <span>· {activity.location}</span></span>{#if expandedId === activity.id}<span class="activity-description">A focused session for attendees who want practical ideas, useful context, and time to connect.</span>{/if}</button>
                <button class:tracked={trackedIds.includes(activity.id)} class="track-button" type="button" aria-label={trackedIds.includes(activity.id) ? 'Untrack this activity' : 'Track this activity'} aria-pressed={trackedIds.includes(activity.id)} onclick={() => toggleActivity(activity.id)}>{#if trackedIds.includes(activity.id)}✓{:else}+{/if}</button>
              </Card>
            {/each}
            {#if filteredActivities.length === 0}<div class="empty-state"><strong>{scheduleView === 'tracked' ? 'No tracked activities yet' : 'No activities match your filters'}</strong><span>{scheduleView === 'tracked' ? 'Switch to All activities and tap + to build your personal schedule.' : 'Try another track or day.'}</span></div>{/if}
          </div>
        </section>
      </div>
    {:else if activeTab === 'map'}
      <div data-event-view="map">
        <MapView event={event} focusLocation={mapFocusLocation} />
      </div>
    {:else}
      <div class="placeholder-view" data-event-view={activeTab}>
        <span class="eyebrow">{activeTab}</span>
        <h2>{activeTab === 'map' ? 'Event map' : 'Group schedules'}</h2>
        <p>This event view is ready for its schedule data. Continue in Home or Schedule for the available functionality.</p>
      </div>
    {/if}
  </main>

  <nav class="bottom-nav" aria-label="Event navigation">
    {#each navItems as item}
      <button type="button" data-event-view={item.id} class:active={activeTab === item.id} aria-current={activeTab === item.id ? 'page' : undefined} onclick={() => (activeTab = item.id)}>
        {#if item.id === 'home'}<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V10Z" /><path d="M9 21v-7h6v7" /></svg>
        {:else if item.id === 'schedule'}<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M8 2v4M16 2v4M3 10h18M8 14h2M14 14h2M8 17h2" /></svg>
        {:else if item.id === 'map'}<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18-6 3V6l6-3 6 3 6-3v15l-6 3-6-3Z" /><path d="M9 3v15M15 6v15" /></svg>
        {:else}<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="8" r="3" /><circle cx="17" cy="9" r="2" /><path d="M3 20a6 6 0 0 1 12 0M15 16a5 5 0 0 1 6 4" /></svg>{/if}
        <span>{item.label}</span>
      </button>
    {/each}
  </nav>
</div>

<style>
  .detail-shell { min-height: 100vh; padding-bottom: 84px; background: var(--background); }
  .hero { position: relative; overflow: hidden; background: linear-gradient(145deg, #1a0a3a 0%, #0d1a3a 52%, #07111f 100%); }
  .hero-content { position: relative; z-index: 1; width: min(100%, 480px); margin: 0 auto; padding: 18px 20px 28px; }
  .hero-glow { position: absolute; border-radius: 50%; pointer-events: none; }
  .hero-glow-right { top: -60px; right: -40px; width: 200px; height: 200px; background: radial-gradient(circle, rgba(139,92,246,.22) 0%, transparent 70%); }
  .hero-glow-left { bottom: -54px; left: 18%; width: 150px; height: 150px; background: radial-gradient(circle, rgba(96,165,250,.14) 0%, transparent 70%); }
  .topbar, .hero-actions, .live-status, .meta-row, .activity-title-row { display: flex; align-items: center; }
  .topbar { justify-content: space-between; gap: 12px; margin-bottom: 34px; }
  .hero-actions { gap: 8px; }
  .back-link { color: rgba(226,232,240,.82); font-size: 12px; text-decoration: none; }
  .back-link:hover { color: #fff; }
  .attend-button { padding: 7px 11px; border: 1px solid rgba(255,255,255,.2); border-radius: 8px; background: rgba(255,255,255,.08); color: #fff; cursor: pointer; font-size: 11px; font-weight: 700; }
  .attend-button:hover, .attend-button.attending { border-color: rgba(167,139,250,.6); background: rgba(139,92,246,.26); }
  .live-status { gap: 8px; margin-bottom: 10px; color: #34d399; font-family: var(--font-mono); font-size: 10px; font-weight: 600; letter-spacing: .06em; text-transform: uppercase; }
  .live-dot { width: 7px; height: 7px; border-radius: 50%; background: #34d399; box-shadow: 0 0 9px #34d399; }
  h1, h2, h3, p { margin: 0; }
  .hero h1 { max-width: 350px; color: #fff; font-family: var(--font-display); font-size: clamp(2rem, 9vw, 2.7rem); font-weight: 800; letter-spacing: -.045em; line-height: 1.08; }
  .hero p { max-width: 340px; margin-top: 9px; color: rgba(148,163,184,.9); font-size: 13px; line-height: 1.5; }
  .content { width: min(100%, 480px); margin: 0 auto; padding: 0 16px 20px; }
  .stats-grid, .member-grid { display: grid; gap: 10px; }
  .stats-grid { grid-template-columns: repeat(3, 1fr); margin: 16px 0 30px; }
  :global(.stat-card) { display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 14px 8px; text-align: center; }
  :global(.stat-card strong) { font-family: var(--font-display); font-size: 24px; }
  :global(.stat-card span), :global(.member-card span) { color: var(--muted); font-size: 10px; }
  .section-block { margin-bottom: 30px; }
  .section-heading { display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; margin-bottom: 10px; }
  .section-heading.compact { align-items: center; }
  .eyebrow { display: block; margin-bottom: 4px; color: var(--muted); font-size: 10px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; }
  h2 { color: var(--text-primary); font-family: var(--font-display); font-size: 18px; letter-spacing: -.02em; }
  .section-index { color: var(--accent); font-family: var(--font-mono); font-size: 10px; }
  :global(.next-card) { display: flex; justify-content: space-between; gap: 16px; border-color: var(--accent-border); background: linear-gradient(135deg, var(--accent-soft) 0%, var(--panel) 72%); box-shadow: 0 0 30px rgba(139,92,246,.08); }
  .next-card-content { min-width: 0; }
  :global(.next-card h3) { margin: 9px 0 4px; color: var(--text-primary); font-family: var(--font-display); font-size: 17px; line-height: 1.25; }
  :global(.next-card p) { color: var(--text-secondary); font-size: 12px; }
  .meta-row { flex-wrap: wrap; gap: 6px; margin-top: 8px; color: var(--muted); font-size: 11px; }
  .time { color: var(--accent); font-weight: 500; }
  .next-arrow { display: grid; width: 30px; height: 30px; flex: 0 0 auto; place-items: center; padding: 0; border: 1px solid var(--accent-border); border-radius: 50%; background: transparent; color: var(--accent); cursor: pointer; font-size: 17px; }
  .next-arrow:hover { background: var(--accent-soft); }
  .view-tabs { display: grid; grid-template-columns: repeat(2, 1fr); gap: 5px; margin-bottom: 10px; padding: 4px; border: 1px solid var(--border); border-radius: 10px; background: var(--panel); }
  .view-tabs button { padding: 8px 6px; border: 0; border-radius: 7px; background: transparent; color: var(--muted); cursor: pointer; font-size: 11px; font-weight: 700; }
  .view-tabs button.active { background: var(--accent-soft); color: var(--text-primary); box-shadow: inset 0 0 0 1px var(--accent-border); }
  .view-tabs button span { margin-left: 3px; color: var(--accent); font-family: var(--font-mono); font-size: 10px; }
  .day-tabs { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; margin-bottom: 10px; }
  .day-tabs button, .filter-row button { border: 0; border-radius: 9px; background: var(--panel-raised); color: var(--muted); cursor: pointer; }
  .day-tabs button { padding: 8px 4px; font-size: 11px; font-weight: 700; }
  .day-tabs button small { display: block; margin-top: 2px; opacity: .7; font-size: 9px; font-weight: 400; }
  .day-tabs button.active { background: var(--accent); color: #fff; }
  .filter-row { display: flex; gap: 6px; overflow-x: auto; padding-bottom: 4px; }
  .filter-row button { flex: 0 0 auto; padding: 6px 10px; font-size: 10px; font-weight: 700; }
  .filter-row button.active { background: var(--accent-soft); color: var(--filter-color, var(--accent)); }
  .activity-list { display: flex; flex-direction: column; gap: 8px; margin-top: 12px; }
  :global(.activity-card) { display: flex; align-items: flex-start; gap: 12px; border-left: 2px solid var(--track-color, var(--accent)); padding: 12px 14px; }
  .activity-time { min-width: 42px; padding-top: 2px; color: var(--muted); font-size: 10px; }
  .activity-main { min-width: 0; flex: 1; padding: 0; border: 0; background: transparent; color: inherit; cursor: pointer; text-align: left; }
  .track-button { display: grid; width: 26px; height: 26px; flex: 0 0 auto; place-items: center; border: 1px solid var(--border); border-radius: 50%; background: var(--panel-raised); color: var(--muted); cursor: pointer; font-size: 16px; line-height: 1; }
  .track-button:hover, .track-button.tracked { border-color: var(--accent-border); background: var(--accent-soft); color: var(--accent); }
  .empty-state { display: flex; flex-direction: column; gap: 5px; padding: 28px 16px; border: 1px dashed var(--border); border-radius: 12px; color: var(--muted); text-align: center; }
  .empty-state strong { color: var(--text-secondary); font-size: 13px; }
  .empty-state span { font-size: 11px; line-height: 1.45; }
  .activity-title-row { align-items: flex-start; justify-content: space-between; gap: 8px; }
  .activity-title-row strong { color: var(--text-primary); font-size: 13px; line-height: 1.35; }
  .activity-subtitle { display: block; margin-top: 4px; color: var(--muted); font-size: 11px; }
  .activity-description { display: block; margin-top: 9px; color: var(--text-secondary); font-size: 11px; line-height: 1.5; }
  .activity-subtitle span { opacity: .8; }
  .member-grid { grid-template-columns: repeat(4, 1fr); }
  .group-unavailable { grid-column: 1 / -1; padding: 14px; border: 1px dashed var(--border); border-radius: 10px; color: var(--muted); font-size: 11px; line-height: 1.45; text-align: center; }
  :global(.member-card) { display: flex; flex-direction: column; align-items: center; gap: 5px; padding: 12px 6px; text-align: center; }
  :global(.member-card strong) { max-width: 100%; overflow: hidden; color: var(--text-secondary); font-size: 11px; font-weight: 600; text-overflow: ellipsis; white-space: nowrap; }
  .avatar { display: grid; width: 36px; height: 36px; place-items: center; border: 1.5px solid color-mix(in srgb, var(--member-color) 50%, transparent); border-radius: 50%; background: color-mix(in srgb, var(--member-color) 14%, transparent); color: var(--member-color); font-size: 10px; font-weight: 700; }
  .bottom-nav { position: fixed; right: 0; bottom: 0; left: 0; z-index: 10; display: flex; width: 100%; justify-content: center; padding-bottom: env(safe-area-inset-bottom, 0px); border-top: 1px solid var(--border); background: color-mix(in srgb, var(--background) 90%, transparent); backdrop-filter: blur(16px); }
  .bottom-nav button { display: flex; width: min(25%, 120px); flex-direction: column; align-items: center; gap: 5px; padding: 11px 8px 10px; border: 0; background: transparent; color: var(--muted); cursor: pointer; font-size: 10px; transition: color 160ms ease, transform 160ms ease; }
  .bottom-nav button:hover, .bottom-nav button.active { color: var(--accent); }
  .bottom-nav button:active { transform: translateY(1px); }
  .bottom-nav svg { width: 19px; height: 19px; fill: none; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; stroke-width: 1.8; }
  @media (min-width: 520px) { .detail-shell { width: min(100%, 480px); margin: 0 auto; border-right: 1px solid var(--border); border-left: 1px solid var(--border); } .bottom-nav { right: auto; left: 50%; width: min(100%, 480px); transform: translateX(-50%); } }

  .not-attending, .placeholder-view { padding: 28px 18px; border: 1px dashed var(--border); border-radius: 14px; background: var(--panel); text-align: center; }
  .not-attending h2, .placeholder-view h2 { color: var(--text-primary); font-family: var(--font-display); font-size: 20px; }
  .not-attending p, .placeholder-view p { max-width: 300px; margin: 8px auto 18px; color: var(--text-secondary); font-size: 12px; line-height: 1.5; }
  .not-attending button { padding: 9px 14px; border: 0; border-radius: 9px; background: var(--accent); color: #fff; cursor: pointer; font-size: 11px; font-weight: 700; }
  .not-attending button:hover { filter: brightness(1.1); }
  .placeholder-view { margin-top: 16px; }
</style>
