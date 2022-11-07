<script lang="ts">
	import BenefitsInterstitial from './pages/benefits/BenefitsInterstitial.svelte';
	import Connection from './pages/connection/Connection.svelte';
	import GettingStarted from './pages/getting-started/GettingStarted.svelte';
	import PurchaseSuccess from './pages/purchase-success/PurchaseSuccess.svelte';
	import Settings from './pages/settings/Settings.svelte';
	import config from './stores/config';
	import { connection } from './stores/connection';
	import { Router, Route } from './utils/router';
	import routerHistory from './utils/router-history';
</script>

{#if $connection.connected || ! $config.site.online}
	<Router history={routerHistory}>
		<Route path="upgrade" component={BenefitsInterstitial} />
		<Route path="purchase-successful" component={PurchaseSuccess} />
		<Route path="getting-started" component={GettingStarted} />
		<Route component={Settings} />
	</Router>
{:else}
	<Connection />
{/if}
