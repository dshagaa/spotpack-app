<script>
  import Router from 'svelte-spa-router'
  import EventList from './routes/EventList.svelte'
  import EventDetail from './routes/EventDetail.svelte'
  import MyAgenda from './routes/MyAgenda.svelte'

  const routes = {
    '/': EventList,
    '/event/:id': EventDetail,
    '/agenda': MyAgenda,
  }

  let currentPath = $state(location.pathname)
  let toast = $state({ show: false, message: '', type: '' })
  let toastTimer = null

  function updatePath() {
    currentPath = location.pathname
  }

  function showToast(message, type = '') {
    toast = { show: true, message, type }
    clearTimeout(toastTimer)
    toastTimer = setTimeout(() => { toast = { show: false, message: '', type: '' } }, 4200)
  }

  window.showToast = showToast
</script>

<svelte:window onpopstate={updatePath} />

<div class="min-h-screen bg-[#1A1025] text-[#F5F0FA] font-sans antialiased">

  <!-- Toast -->
  {#if toast.show}
    <div class="fixed z-[100] left-4 right-4 bottom-20 md:left-auto md:right-6 md:bottom-6 md:max-w-sm bg-[#2D1B3D] rounded-2xl px-4 py-3 shadow-2xl {toast.type === 'warning' ? 'border border-yellow-500/50' : ''}" role="status">
      <p class="text-sm">{toast.message}</p>
    </div>
  {/if}

  <!-- Header -->
  <header class="max-w-4xl mx-auto px-4 pt-5 md:pt-8">
    <div class="flex items-center justify-between gap-3">
      <a href="/" onclick={updatePath} class="flex items-center gap-3 min-h-11" aria-label="SpotPack, inicio">
        <span class="grid place-items-center w-10 h-10 rounded-2xl bg-[#E87D3E] text-2xl">🐆</span>
        <span>
          <span class="block text-lg font-black tracking-tight">SpotPack</span>
          <span class="hidden sm:block text-[11px] text-[#9B8EAB] tracking-wide">TU AGENDA DE CONVENCIÓN</span>
        </span>
      </a>
    </div>

    <!-- Nav -->
    <nav class="flex items-center gap-1 mt-8" aria-label="Principal">
      <a href="/" onclick={updatePath} class="px-4 py-2 rounded-xl text-sm {currentPath === '/' ? 'bg-[#3D2552] text-[#F5F0FA]' : 'text-[#9B8EAB] hover:text-[#F5F0FA]'}">Eventos</a>
      <a href="/agenda" onclick={updatePath} class="px-4 py-2 rounded-xl text-sm {currentPath === '/agenda' ? 'bg-[#3D2552] text-[#F5F0FA]' : 'text-[#9B8EAB] hover:text-[#F5F0FA]'}">Mi agenda</a>
    </nav>
  </header>

  <!-- Main -->
  <main class="max-w-4xl mx-auto px-4 pt-8 md:pt-10" id="main-content">
    <Router {routes} onconditionsfailed={updatePath} />
  </main>

  <!-- Mobile nav -->
  <nav class="fixed z-40 bottom-0 left-0 right-0 bg-[#1A1025]/95 backdrop-blur-lg border-t border-[#3D2552] px-3 pt-2 pb-safe" aria-label="Navegación móvil">
    <a href="/" onclick={updatePath} class="flex-1 min-h-12 grid place-items-center rounded-2xl text-xs gap-0.5 {currentPath === '/' ? 'text-[#E87D3E]' : 'text-[#9B8EAB]'}">
      <span class="text-lg">⌂</span>
      <span>Eventos</span>
    </a>
    <a href="/agenda" onclick={updatePath} class="flex-1 min-h-12 grid place-items-center rounded-2xl text-xs gap-0.5 {currentPath === '/agenda' ? 'text-[#E87D3E]' : 'text-[#9B8EAB]'}">
      <span class="text-lg">●</span>
      <span>Mi agenda</span>
    </a>
  </nav>
</div>
