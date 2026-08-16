<script>
  let { params } = $props()
  let id = $derived(params?.id || '')
</script>

<div>
  <a href="/" class="inline-flex items-center text-sm text-[#9B8EAB] hover:text-[#E87D3E] min-h-11">← Eventos</a>
  <div class="bg-[#2D1B3D] rounded-3xl p-8 text-center mt-6">
    <div class="text-4xl">✦</div>
    <h2 class="font-bold text-lg mt-3">Evento {id}</h2>
    <p class="text-[#9B8EAB] text-sm mt-2">Detalle del evento — próximamente.</p>
  </div>
</div>
