<script lang="ts">
	import RecommendationsPage from './modules/image-size-analysis/RecommendationsPage.svelte';
	import BenefitsInterstitial from './pages/benefits/BenefitsInterstitial.svelte';
	import GettingStarted from './pages/getting-started/GettingStarted.svelte';
	import PurchaseSuccess from './pages/purchase-success/PurchaseSuccess.svelte';
	import Settings from './pages/settings/Settings.svelte';
	import config from './stores/config';
	import { criticalCssState, isGenerating } from './stores/critical-css-state';
	import { modulesState } from './stores/modules';
	import { recordBoostEvent } from './utils/analytics';
	import debounce from './utils/debounce';
	import { Router, Route } from './utils/router';
	import routerHistory from './utils/router-history';

	routerHistory.listen(
		debounce( history => {
			// Event names must conform to the following regex: ^[a-z_][a-z0-9_]*$
			let path = history.location.pathname.replace( /[-/]/g, '_' );
			if ( path === '_' ) {
				path = '_settings';
			}

			recordBoostEvent( `page_view${ path }`, {
				path: history.location.pathname,
			} );
		}, 10 )
	);

	$: pricing = $config.pricing;
	$: activeModules = Object.entries( $modulesState ).reduce( ( acc, [ key, value ] ) => {
		if ( key !== 'image_guide' && key !== 'image_size_analysis' ) {
			acc.push( value.active );
		}
		return acc;
	}, [] );
</script>

<Router history={routerHistory}>
	<Route path="upgrade" let:location let:navigate>
		<BenefitsInterstitial {location} {navigate} {pricing} />
	</Route>
	<Route path="purchase-successful" let:location let:navigate>
		<PurchaseSuccess {location} {navigate} isImageGuideActive={$modulesState.image_guide.active} />
	</Route>
	<Route path="getting-started" component={GettingStarted} />
	{#if $modulesState.image_size_analysis.available && $modulesState.image_size_analysis.active}
		<Route path="image-size-analysis/:group/:page" component={RecommendationsPage} />
	{/if}
	<Route>
		<Settings
			{activeModules}
			criticalCssCreated={$criticalCssState.created}
			criticalCssIsGenerating={$isGenerating}
		/>
	</Route>
</Router>
