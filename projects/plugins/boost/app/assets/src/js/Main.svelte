<script>
	import Connection from './pages/connection/Connection.svelte';
	import Settings from './pages/settings/Settings.svelte';
	import Footer from './sections/Footer.svelte';
	import Header from './sections/Header.svelte';
	import { connection } from './stores/connection';
	import config from './stores/config';
</script>

<div id="jb-admin-settings">
	<div id="jb-settings" class="jb-settings">
		<div class="jb-container">
			<Header />
		</div>

		{#if $connection.connected || ! config.site.online}
			<Settings />
		{:else}
			<Connection />
		{/if}

		<Footer />
	</div>
</div>
