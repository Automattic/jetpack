<script>
	import { __ } from '@wordpress/i18n';
	import { criticalCssStatus, showError } from '../../../stores/critical-css-status';
	import generateCriticalCss from '../../../utils/generate-critical-css';
	import CriticalCssShowStopperError from './CriticalCssShowStopperError.svelte';
	import CriticalCssStatus from './CriticalCssStatus.svelte';
	import ProgressBar from './ProgressBar.svelte';
</script>

{#if $criticalCssStatus.status === 'requesting'}
	<div class="jb-critical-css-progress">
		<span class="jb-critical-css-progress__label">
			{__( 'Generating Critical CSS…', 'jetpack-boost' )}
		</span>
		<ProgressBar progress={$criticalCssStatus.progress} />
	</div>
{:else if $showError}
	<CriticalCssShowStopperError on:retry={() => generateCriticalCss( true, true )} />
{:else}
	<CriticalCssStatus on:retry={generateCriticalCss} />
{/if}
