<script lang="ts">
	import { __ } from '@wordpress/i18n';
	import ProgressBar from '../../../elements/ProgressBar.svelte';
	import {
		criticalCssProgress,
		criticalCssState,
		isFatalError,
	} from '../../../stores/critical-css-state';
	import CriticalCssShowStopperError from './CriticalCssShowStopperError.svelte';
	import CriticalCssStatus from './CriticalCssStatus.svelte';
</script>

{#if $criticalCssState.status === 'pending'}
	<div class="jb-critical-css-progress">
		<ProgressBar progress={$criticalCssProgress}>
			{__(
				'Generating Critical CSS. Please don’t leave this page until completed.',
				'jetpack-boost'
			)}
		</ProgressBar>
	</div>
{:else if $isFatalError}
	<CriticalCssShowStopperError />
{:else}
	<CriticalCssStatus />
{/if}
