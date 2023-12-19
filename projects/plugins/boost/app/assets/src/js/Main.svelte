<script lang="ts">
	import ReactComponent from '$features/ReactComponent.svelte';
	import Main from './main';
	import config from '$lib/stores/config';
	import { connection } from '$lib/stores/connection';
	import { modulesState } from '$lib/stores/modules';
	import {
		criticalCssState,
		continueGeneratingLocalCriticalCss,
		regenerateCriticalCss,
		criticalCssProgress,
		isFatalError,
		criticalCssIssues,
		primaryErrorSet,
	} from '$features/critical-css';

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
</div>
