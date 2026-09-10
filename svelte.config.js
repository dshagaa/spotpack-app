import adapter from '@sveltejs/adapter-cloudflare';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),

	kit: {
		// adapter-auto only supports Vite projects, see https://kit.svelte.dev/docs/adapter for more info
		// If you are deploying to Cloudflare Pages, it's recommended to use @sveltejs/adapter-cloudflare
		adapter: adapter()
	}
};

export default config;
