<script>
  let {
    children,
    variant = 'primary',
    class: className = '',
    ...rest
  } = $props();

  const variants = {
    primary: 'bg-panel border border-white/8 shadow-card',
    secondary: 'bg-panel-raised border border-white/6 hover:border-accent-border'
  };

  let variantClass = $derived(variants[variant] ?? variants.primary);
</script>

<div class={`rounded-xl p-4 transition-colors ${variantClass} ${className}`} {...rest}>
  {@render children?.()}
</div>
