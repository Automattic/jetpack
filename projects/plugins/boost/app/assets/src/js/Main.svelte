<script lang="ts">
	import ReactComponent from '$features/ReactComponent.svelte';
	import Main from './main';
	import {
		criticalCssState,
		continueGeneratingLocalCriticalCss,
		regenerateCriticalCss,
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
			isFatalError: $isFatalError,
			issues: $criticalCssIssues,
			primaryErrorSet: $primaryErrorSet,
		}}
	/>
</div>
