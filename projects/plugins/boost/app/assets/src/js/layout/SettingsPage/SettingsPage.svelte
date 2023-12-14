<script lang="ts">
	import SpeedScore from '../../features/speed-score/speed-score';
	import Support from './support/support';
	import Tips from './Tips.svelte';
	import ReactComponent from '$features/ReactComponent.svelte';
	import Footer from '$layout/footer/footer';
	import Header from '$layout/header/header';
	import { criticalCssState, isGenerating } from '$features/critical-css';
	import { modulesState } from '$lib/stores/modules';
	import { hasPrioritySupport } from '$lib/utils/paid-plan';

	$: criticalCssCreated = $criticalCssState.created;
	$: criticalCssIsGenerating = $isGenerating;
	$: moduleStates = Object.entries( $modulesState ).reduce( ( acc, [ key, value ] ) => {
		if ( key !== 'image_guide' && key !== 'image_size_analysis' ) {
			acc.push( value.active );
		}
		return acc;
	}, [] );
	$: performanceHistoryNeedsUpgrade = ! $modulesState.performance_history.available;
</script>

<div id="jb-dashboard" class="jb-dashboard jb-dashboard--main">
	<ReactComponent this={Header} />

	<div class="jb-section jb-section--alt jb-section--scores">
		<ReactComponent
			this={SpeedScore}
			{moduleStates}
			{criticalCssCreated}
			{criticalCssIsGenerating}
			{performanceHistoryNeedsUpgrade}
		/>
	</div>

	<div class="jb-section jb-section--main">
		<slot />
	</div>

	<Tips />

	{#if $hasPrioritySupport}
		<ReactComponent this={Support} />
	{/if}

	<ReactComponent this={Footer} />
</div>

<style lang="scss">
	.jb-section--main {
		z-index: 14;
	}
</style>
