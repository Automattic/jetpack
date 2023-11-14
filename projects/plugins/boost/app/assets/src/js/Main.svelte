<script lang="ts">
	import Redirect from './components/Redirect.svelte';
	import ReactComponent from './components/ReactComponent.svelte';
	import RecommendationsPage from './routes/image-size-analysis/ImageSizeAnalysis.svelte';
	import Upgrade from './routes/upgrade/Upgrade.svelte';
	import GettingStarted from './routes/getting-started/GettingStarted.svelte';
	import PurchaseSuccess from './routes/purchase-success/PurchaseSuccess';

	import AdvancedCriticalCss from './routes/critical-css-advanced/CriticalCssAdvanced.svelte';
	import Index from './routes/Index.svelte';

	import config from './stores/config';

	import { connection } from './stores/connection';

	import { criticalCssIssues } from './stores/critical-css-state-errors';
	import { modulesState } from './stores/modules';
	import { recordBoostEvent } from './utils/analytics';
	import debounce from './utils/debounce';

	import { Route, Router } from './utils/router';
	import routerHistory from './utils/router-history';
	import SettingsPage from './layouts/SettingsPage/SettingsPage.svelte';

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
