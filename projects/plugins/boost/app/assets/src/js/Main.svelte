<script lang="ts">
	import AdvancedCriticalCss from './routes/critical-css-advanced/CriticalCssAdvanced.svelte';
	import GettingStarted from './routes/getting-started/GettingStarted.svelte';
	import RecommendationsPage from './routes/image-size-analysis/ImageSizeAnalysis.svelte';
	import Index from './routes/index/Index.svelte';
	import PurchaseSuccess from './routes/purchase-success/purchase-success';
	import Upgrade from './routes/upgrade/Upgrade.svelte';
	import ReactComponent from '$features/ReactComponent.svelte';
	import Redirect from '$features/Redirect.svelte';
	import SettingsPage from '$layout/SettingsPage/SettingsPage.svelte';
	import config from '$lib/stores/config';
	import { connection } from '$lib/stores/connection';
	import { criticalCssIssues } from '$lib/stores/critical-css-state-errors';
	import { modulesState } from '$lib/stores/modules';
	import { recordBoostEvent } from '$lib/utils/analytics';
	import debounce from '$lib/utils/debounce';
	import { Route, Router } from '$lib/utils/router';
	import routerHistory from '$lib/utils/router-history';

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

	$: siteDomain = $config.site.domain;
	$: userConnected = $connection.userConnected;
	$: isPremium = $config.isPremium;
	$: isImageGuideActive = $modulesState.image_guide.active;
	$: isImageSizeAnalysisAvailable = $modulesState.image_size_analysis.available;
	$: isImageSizeAnalysisActive = $modulesState.image_size_analysis.active;

	$: shouldGetStarted = ! $connection.connected && $config.site.online;
</script>

<Router history={routerHistory}>
	<Route path="upgrade" let:location let:navigate>
		<Upgrade {location} {navigate} {pricing} {siteDomain} {userConnected} />
	</Route>

	<Route
		path="getting-started"
		component={GettingStarted}
		{userConnected}
		{pricing}
		{isPremium}
		domain={siteDomain}
	/>

	<Route path="purchase-successful">
		<ReactComponent this={PurchaseSuccess} {isImageGuideActive} />
	</Route>

	<Route path="critical-css-advanced">
		<Redirect when={shouldGetStarted} to="/getting-started">
			<SettingsPage>
				<AdvancedCriticalCss issues={$criticalCssIssues} />
			</SettingsPage>
		</Redirect>
	</Route>

	<Route path="/">
		<Redirect when={shouldGetStarted} to="/getting-started">
			<SettingsPage>
				<Index />
			</SettingsPage>
		</Redirect>
	</Route>

	{#if isImageSizeAnalysisAvailable && isImageSizeAnalysisActive}
		<Route path="image-size-analysis/:group/:page" component={RecommendationsPage} />
	{/if}
</Router>

<style lang="scss">
	.jb-section--main {
		z-index: 14;
	}
</style>
