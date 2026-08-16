<script>
  import { getEvents } from '../lib/api.js'
  import { getSnapshot, setSnapshot, invalidateAll } from '../lib/cache.js'

  let events = $state([])
  let loading = $state(true)
  let error = $state(null)
  let stale = $state(false)
  let cachedAt = $state(null)

  async function fetchEvents(force = false) {
    loading = true
    error = null
    const cached = force ? null : getSnapshot('events')

    if (cached && !cached.stale) {
      events = cached.data.events || []
      cachedAt = cached.cachedAt
      stale = false
      loading = false
      return
    }

    if (cached) {
      events = cached.data.events || []
      cachedAt = cached.cachedAt
      stale = true
      loading = false
    }

    try {
      const data = await getEvents()
      setSnapshot('events', '', data)
      events = data.events || []
      stale = false
      cachedAt = Date.now()
    } catch (e) {
      if (!cached) error = e.message
      else stale = true
    } finally {
      loading = false
    }
  }

  function dateRange(e) {
    if (!e?.start_date) return 'Fechas pendientes'
    if (e.start_date === e.end_date) return formatDate(e.start_date)
    return `${formatDate(e.start_date)} – ${formatDate(e.end_date)}`
  }

  function formatDate(d) {
    if (!d) return ''
    return new Date(d + 'T00:00:00').toLocaleDateString('es-MX', { month: 'short', day: 'numeric' })
  }

  let showCreate = $state(false)

  // Load on mount
  fetchEvents()
</script>

<div>
  <div class="flex items-end justify-between gap-4 mb-6">
    <div>
      <p class="text-xs uppercase tracking-[.2em] text-[#E87D3E] font-bold">Tu pack</p>
      <h1 class="text-3xl md:text-4xl font-black tracking-tight mt-1">Tus eventos</h1>
      <p class="text-[#9B8EAB] text-sm mt-2">Todo lo que no querés perderte.</p>
    </div>
    <button onclick={() => showCreate = true} class="min-h-11 min-w-11 shrink-0 px-4 rounded-2xl bg-[#E87D3E] text-sm font-bold shadow-lg hover:bg-orange-500 transition-colors">
      <span class="text-lg leading-none">＋</span>
      <span class="hidden sm:inline ml-1">Crear</span>
    </button>
  </div>

  <div class="flex items-center justify-between min-h-8 mb-4">
    {#if stale}
      <p class="text-xs text-[#FFC107]">Datos guardados</p>
    {/if}
    <button onclick={() => fetchEvents(true)} disabled={loading} class="ml-auto min-h-11 px-3 rounded-xl bg-[#2D1B3D] text-xs text-[#9B8EAB] hover:text-[#F5F0FA] disabled:opacity-50">
      ↻ Actualizar
    </button>
  </div>

  <!-- Loading -->
  {#if loading && events.length === 0}
    <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {#each [1,2,3] as i}
        <div class="bg-[#2D1B3D] rounded-3xl p-5 h-36 animate-pulse"></div>
      {/each}
    </div>
  {/if}

  <!-- Error -->
  {#if error}
    <div class="bg-[#2D1B3D] rounded-3xl p-6 border border-red-500/30">
      <p class="text-[#F44336] text-sm">{error}</p>
      <button onclick={() => fetchEvents(true)} class="mt-4 px-4 py-2 rounded-xl bg-[#E87D3E] text-sm font-bold">Reintentar</button>
    </div>
  {/if}

  <!-- Empty -->
  {#if !loading && !error && events.length === 0}
    <div class="bg-[#2D1B3D] rounded-3xl p-8 text-center">
      <div class="text-4xl">✦</div>
      <h2 class="font-bold text-lg mt-3">Todavía no hay eventos</h2>
      <p class="text-[#9B8EAB] text-sm mt-2">Creá tu primer evento para empezar a armar tu agenda.</p>
      <button onclick={() => showCreate = true} class="mt-5 px-5 py-3 rounded-2xl bg-[#E87D3E] text-sm font-bold">Crear evento</button>
    </div>
  {/if}

  <!-- Cards -->
  {#if events.length > 0}
    <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {#each events as event (event.id)}
        <a href="/event/{event.id}" class="bg-[#2D1B3D] rounded-3xl p-5 min-h-36 flex flex-col justify-between hover:border-[#E87D3E]/70 hover:-translate-y-0.5 transition-all">
          <div>
            <p class="text-lg font-bold leading-tight">{event.name}</p>
            <p class="text-[#9B8EAB] text-sm mt-2">{dateRange(event)}</p>
          </div>
          <div class="flex items-center justify-between gap-3 mt-4">
            {#if event.location}
              <span class="text-[#9B8EAB] text-xs truncate">{event.location}</span>
            {/if}
            <span class="ml-auto shrink-0 px-2.5 py-1 rounded-lg bg-[#E87D3E]/10 text-[#E87D3E] text-xs font-semibold">{event.item_count || 0} items</span>
          </div>
        </a>
      {/each}
    </div>
  {/if}
</div>
