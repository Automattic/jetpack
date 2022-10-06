<script>
	import Footer from '../../sections/Footer.svelte';
	import Header from '../../sections/Header.svelte';
	import config from '../../stores/config';
	import { connection } from '../../stores/connection';
	import Connection from '../connection/Connection.svelte';
	import Settings from '../settings/Settings.svelte';

	export let location, navigate;
</script>

<div id="jb-settings" class="jb-settings jb-settings--main">
	<div class="jb-container">
		<Header />
	</div>

	{#if $connection.connected || ! $config.site.online}
		<Settings {location} {navigate} />
	{:else}
		<Connection />
	{/if}

	<Footer />
</div>
