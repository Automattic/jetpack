<script lang="ts">
	import ReactComponent from '$features/ReactComponent.svelte';
	import Main from './main';
	import { connection } from '$lib/stores/connection';
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
		connection={$connection}
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
