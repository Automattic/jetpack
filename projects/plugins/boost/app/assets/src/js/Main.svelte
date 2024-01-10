<script lang="ts">
	import ReactComponent from '$features/ReactComponent.svelte';
	import Main from './main';
	import { criticalCssState, criticalCssIssues, primaryErrorSet } from '$features/critical-css';
</script>

<div>
	<ReactComponent
		this={Main}
		criticalCss={{
			criticalCssState: $criticalCssState,
			issues: $criticalCssIssues,
			primaryErrorSet: $primaryErrorSet,
		}}
	/>
</div>
