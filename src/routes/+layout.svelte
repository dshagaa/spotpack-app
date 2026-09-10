<script>
  import { onMount } from 'svelte';
  import '../app.css';

  let { children } = $props();

  onMount(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // Offline support is best effort.
      });
    }
  });
</script>

<div class="min-h-screen bg-background text-text-primary transition-colors duration-300">
	{@render children()}
</div>
