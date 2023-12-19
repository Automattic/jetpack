<script lang="ts">
	import SpeedScore from '../../features/speed-score/speed-score';
	import Support from './support/support';
	import Tips from './tips/tips';
	import ReactComponent from '$features/ReactComponent.svelte';
	import Footer from '$layout/footer/footer';
	import Header from '$layout/header/header';
	import { criticalCssState, isGenerating } from '$features/critical-css';
	import { modulesState } from '$lib/stores/modules';
	import { hasPrioritySupport } from '$lib/utils/paid-plan';

	$: criticalCssCreated = $criticalCssState.created;
	$: criticalCssIsGenerating = $isGenerating;
	$: performanceHistoryNeedsUpgrade = ! $modulesState.performance_history.available;
</script>

<div id="jb-dashboard" class="jb-dashboard jb-dashboard--main">
	<ReactComponent this={Header} />

	<div class="jb-section jb-section--alt jb-section--scores">
		<ReactComponent
			this={SpeedScore}
			{criticalCssCreated}
			{criticalCssIsGenerating}
			{performanceHistoryNeedsUpgrade}
		/>
	</div>

	<div class="jb-section jb-section--main">
		<slot />
	</div>

	<ReactComponent this={Tips} />

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
