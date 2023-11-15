<script lang="ts">
	import Score from './Score.svelte';
	import Support from './Support/Support';
	import Tips from './Tips.svelte';
	import ReactComponent from '$components/ReactComponent.svelte';
	import Footer from '$components/sections/Footer/Footer';
	import Header from '$components/sections/Header/Header';
	import { criticalCssState, isGenerating } from '$lib/stores/critical-css-state';
	import { modulesState } from '$lib/stores/modules';
	import { hasPrioritySupport } from '$lib/utils/paid-plan';

	$: criticalCssCreated = $criticalCssState.created;
	$: criticalCssIsGenerating = $isGenerating;
	$: activeModules = Object.entries( $modulesState ).reduce( ( acc, [ key, value ] ) => {
		if ( key !== 'image_guide' && key !== 'image_size_analysis' ) {
			acc.push( value.active );
		}
		return acc;
	}, [] );
</script>

<div id="jb-dashboard" class="jb-dashboard jb-dashboard--main">
	<ReactComponent this={Header} />

	<div class="jb-section jb-section--alt jb-section--scores">
		<Score {activeModules} {criticalCssCreated} {criticalCssIsGenerating} />
	</div>

	<slot />

	<Tips />

	{#if $hasPrioritySupport}
		<ReactComponent this={Support} />
	{/if}

	<ReactComponent this={Footer} />
</div>
