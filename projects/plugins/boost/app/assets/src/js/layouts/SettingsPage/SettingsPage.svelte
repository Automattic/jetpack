<script lang="ts">
	import Score from './Score.svelte';
	import Tips from './Tips.svelte';
	import Footer from '../../components/sections/Footer/Footer';
	import Header from '../../components/sections/Header.svelte';
	import Support from '../../components/sections/support';
	import { hasPrioritySupport } from '../../utils/paid-plan';
	import { criticalCssState, isGenerating } from '../../stores/critical-css-state';
	import ReactComponent from '../../components/ReactComponent.svelte';
	import { modulesState } from '../../stores/modules';

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
	<Header />

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
