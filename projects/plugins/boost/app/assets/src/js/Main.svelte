<script lang="ts">
	import Redirect from './elements/Redirect.svelte';
	import ReactComponent from './elements/ReactComponent.svelte';
	import RecommendationsPage from './routes/image-size-analysis/ImageSizeAnalysis.svelte';
	import Upgrade from './routes/upgrade/Upgrade.svelte';
	import GettingStarted from './routes/getting-started/GettingStarted.svelte';
	import PurchaseSuccess from './routes/purchase-success/PurchaseSuccess';
	import Score from './pages/settings/sections/Score.svelte';
	import Tips from './pages/settings/sections/Tips.svelte';
	import AdvancedCriticalCss from './routes/critical-css-advanced/CriticalCssAdvanced.svelte';
	import Index from './routes/Index.svelte';
	import Footer from './sections/footer';
	import config from './stores/config';
	import Header from './sections/Header.svelte';
	import Support from './sections/support';
	import { connection } from './stores/connection';
	import { criticalCssState, isGenerating } from './stores/critical-css-state';
	import { criticalCssIssues } from './stores/critical-css-state-errors';
	import { modulesState } from './stores/modules';
	import { recordBoostEvent } from './utils/analytics';
	import debounce from './utils/debounce';
	import { hasPrioritySupport } from './utils/paid-plan';
	import { Route, Router } from './utils/router';
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
	{#if isImageSizeAnalysisAvailable && isImageSizeAnalysisActive}
		<Route path="image-size-analysis/:group/:page" component={RecommendationsPage} />
	{/if}
	<Route>
		<Redirect when={shouldGetStarted} to="/getting-started">
			<div id="jb-dashboard" class="jb-dashboard jb-dashboard--main">
				<Header />

				<div class="jb-section jb-section--alt jb-section--scores">
					<Score {activeModules} {criticalCssCreated} {criticalCssIsGenerating} />
				</div>

				<Router>
					<div class="jb-section jb-section--main">
						<Route
							path="critical-css-advanced"
							component={AdvancedCriticalCss}
							issues={$criticalCssIssues}
						/>
						<Route path="/" component={Index} />
					</div>
				</Router>

				<Tips />

				{#if $hasPrioritySupport}
					<ReactComponent this={Support} />
				{/if}

				<ReactComponent this={Footer} />
			</div>
		</Redirect>
	</Route>
</Router>

<style lang="scss">
	.jb-section--main {
		z-index: 14;
	}
</style>
