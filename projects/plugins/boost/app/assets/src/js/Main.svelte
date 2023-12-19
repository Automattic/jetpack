<script lang="ts">
	import ReactComponent from '$features/ReactComponent.svelte';
	import Main from './main';
	import config from '$lib/stores/config';
	import { connection } from '$lib/stores/connection';
	import { modulesState } from '$lib/stores/modules';
	import { recordBoostEvent } from '$lib/utils/analytics';
	import debounce from '$lib/utils/debounce';
	import routerHistory from '$lib/utils/router-history';
	import {
		criticalCssState,
		continueGeneratingLocalCriticalCss,
		regenerateCriticalCss,
		criticalCssProgress,
		isFatalError,
		criticalCssIssues,
		primaryErrorSet,
	} from '$features/critical-css';

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

	$: siteDomain = $config.site.domain;
	$: userConnected = $connection.userConnected;
	$: isPremium = $config.isPremium;
	$: isImageGuideActive = $modulesState.image_guide.active;
	$: isImageSizeAnalysisAvailable = $modulesState.image_size_analysis.available;
	$: isImageSizeAnalysisActive = $modulesState.image_size_analysis.active;

	$: shouldGetStarted = ! $connection.connected && $config.site.online;
</script>

<div>
	<ReactComponent
		this={Main}
		upgradeProps={{
			siteDomain,
			userConnected,
		}}
		gettingStartedProps={{
			userConnected,
			isPremium,
			domain: siteDomain,
		}}
		purchaseSuccessProps={{
			isImageGuideActive,
		}}
		criticalCssAdvancedProps={{
			issues: $criticalCssIssues,
		}}
		indexProps={{
			criticalCss: {
				criticalCssState: $criticalCssState,
				continueGeneratingLocalCriticalCss,
				regenerateCriticalCss,
				criticalCssProgress: $criticalCssProgress,
				isFatalError: $isFatalError,
				criticalCssIssues: $criticalCssIssues,
				primaryErrorSet: $primaryErrorSet,
			},
		}}
	/>
	<!-- <Router history={routerHistory}>
		<Route path="upgrade">
			<ReactComponent this={Upgrade} {siteDomain} {userConnected} />
		</Route>

		<Route path="getting-started">
			<ReactComponent this={GettingStarted} {userConnected} {isPremium} domain={siteDomain} />
		</Route>

		<Route path="purchase-successful">
			<ReactComponent this={PurchaseSuccess} {isImageGuideActive} />
		</Route>

		<Route path="critical-css-advanced">
			<Redirect when={shouldGetStarted} to="/getting-started">
				<SettingsPage>
					<ReactComponent this={AdvancedCriticalCss} issues={$criticalCssIssues} />
				</SettingsPage>
			</Redirect>
		</Route>

		<Route path="/">
			<Redirect when={shouldGetStarted} to="/getting-started">
				<SettingsPage>
					<ReactComponent
						this={Index}
						criticalCss={{
							criticalCssState: $criticalCssState,
							continueGeneratingLocalCriticalCss,
							regenerateCriticalCss,
							criticalCssProgress: $criticalCssProgress,
							isFatalError: $isFatalError,
							criticalCssIssues: $criticalCssIssues,
							primaryErrorSet: $primaryErrorSet,
						}}
					/>
				</SettingsPage>
			</Redirect>
		</Route>

		{#if isImageSizeAnalysisAvailable && isImageSizeAnalysisActive}
			<Route path="image-size-analysis/:group/:page" component={RecommendationsPage} />
		{/if}
	</Router> -->
</div>
