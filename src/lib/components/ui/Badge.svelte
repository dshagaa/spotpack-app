<script>
  let {
    children,
    label,
    color = 'keynote',
    class: className = ''
  } = $props();

  const colorMap = {
    keynote: '#60A5FA',
    tech: '#A78BFA',
    design: '#F472B6',
    business: '#FBBF24',
    workshop: '#34D399'
  };

  const labels = {
    keynote: 'Keynote',
    tech: 'Tech',
    design: 'Design',
    business: 'Business',
    workshop: 'Workshop'
  };

  let trackColor = $derived(colorMap[color] ?? colorMap.keynote);
  let displayLabel = $derived(label ?? labels[color] ?? color);
</script>

<span
  class={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider ${className}`}
  style={`--track-color: ${trackColor}`}
>
  <span class="h-1.5 w-1.5 rounded-full" style="background: var(--track-color)"></span>
  {#if children}
    {@render children()}
  {:else}
    {displayLabel}
  {/if}
</span>
