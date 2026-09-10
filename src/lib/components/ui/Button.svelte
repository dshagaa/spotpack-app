<script>
  let {
    children,
    variant = 'primary',
    type = 'button',
    class: className = '',
    ...rest
  } = $props();

  const variants = {
    primary: 'bg-accent text-white shadow-lg shadow-accent/20 hover:brightness-110',
    secondary: 'bg-panel text-text-primary border border-white/8 hover:bg-panel-raised',
    ghost: 'bg-transparent text-text-secondary hover:bg-panel-raised hover:text-text-primary'
  };

  let variantClass = $derived(variants[variant] ?? variants.primary);
</script>

<button {type} class={`rounded-lg px-4 py-2 font-medium transition-all active:scale-95 ${variantClass} ${className}`} {...rest}>
  {@render children?.()}
</button>
