<script lang="ts">
	import ReactComponent from '$features/ReactComponent.svelte';
	import Main from './main';
	import {
		criticalCssState,
		continueGeneratingLocalCriticalCss,
		regenerateCriticalCss,
		criticalCssProgress,
		isFatalError,
		criticalCssIssues,
		primaryErrorSet,
	} from '$features/critical-css';
</script>

<div>
	<ReactComponent
		this={Main}
		criticalCss={{
			criticalCssState: $criticalCssState,
			continueGeneratingLocalCriticalCss,
			regenerateCriticalCss,
			criticalCssProgress: $criticalCssProgress,
			isFatalError: $isFatalError,
			issues: $criticalCssIssues,
			primaryErrorSet: $primaryErrorSet,
		}}
	/>
</div>
