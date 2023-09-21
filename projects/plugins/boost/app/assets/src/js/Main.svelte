<script lang="ts">
	import RecommendationsPage from './modules/image-size-analysis/RecommendationsPage.svelte';
	import BenefitsInterstitial from './pages/benefits/BenefitsInterstitial.svelte';
	import GettingStarted from './pages/getting-started/GettingStarted.svelte';
	import PurchaseSuccess from './pages/purchase-success/PurchaseSuccess.svelte';
	import Settings from './pages/settings/Settings.svelte';
	import config from './stores/config';
	import { connection } from './stores/connection';
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
	$: siteDomain = $config.site.domain;
	$: userConnected = $connection.userConnected;
	$: isPremium = $config.isPremium;
	$: isImageGuideActive = $modulesState.image_guide.active;
	$: isImageSizeAnalysisAvailable = $modulesState.image_size_analysis.available;
	$: isImageSizeAnalysisActive = $modulesState.image_size_analysis.active;
	$: criticalCssCreated = $criticalCssState.created;
	$: criticalCssIsGenerating = $isGenerating;
</script>

<Router history={routerHistory}>
	<Route path="upgrade" let:location let:navigate>
		<BenefitsInterstitial {location} {navigate} {pricing} {siteDomain} {userConnected} />
	</Route>
	<Route
		path="getting-started"
		component={GettingStarted}
		{userConnected}
		{pricing}
		{isPremium}
		domain={siteDomain}
	/>
	<Route path="purchase-successful" let:location let:navigate>
		<PurchaseSuccess {location} {navigate} {isImageGuideActive} />
	</Route>
	{#if isImageSizeAnalysisAvailable && isImageSizeAnalysisActive}
		<Route path="image-size-analysis/:group/:page" component={RecommendationsPage} />
	{/if}
	<Route>
		<Settings {activeModules} {criticalCssCreated} {criticalCssIsGenerating} />
	</Route>
</Router>
