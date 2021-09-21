<script>
	import Tips from './sections/Tips.svelte';
	import Score from './sections/Score.svelte';
	import urlFragment from '../../stores/url-fragment';
	import AdvancedCriticalCss from './sections/AdvancedCriticalCss.svelte';
	import Modules from './sections/Modules.svelte';
	import { derived } from 'svelte/store';

	// Map of sub-pages to display for each URL fragment.
	const subPages = {
		'#critical-css-advanced': AdvancedCriticalCss,
	};

	const subPage = derived( urlFragment, fragment => subPages[ fragment ] );
</script>

<div class="jb-section--alt jb-section--scores">
	<Score />
</div>

{#if $subPage}
	<div class="jb-section jb-section--subpage">
		<svelte:component this={$subPage} />
	</div>
{:else}
	<div class="jb-section jb-section--main">
		<Modules />
	</div>
{/if}

<div class="jb-section--alt">
	<Tips />
</div>
