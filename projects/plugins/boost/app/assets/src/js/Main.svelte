<script>
	import BenefitsInterstitial from './pages/benefits/BenefitsInterstitial.svelte';
	import GettingStarted from './pages/getting-started/GettingStarted.svelte';
	import Home from './pages/home/Home.svelte';
	import PurchaseSuccess from './pages/purchase-success/PurchaseSuccess.svelte';
	import { Router, Route } from './utils/router';
	import routerHistory from './utils/router-history';
</script>

<Router history={routerHistory}>
	<Route path="upgrade" component={BenefitsInterstitial} />
	<Route path="purchase-successful" component={PurchaseSuccess} />
	<Route path="getting-started" component={GettingStarted} />
	<Route path="/" component={Home} />
</Router>
