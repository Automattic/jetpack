<script lang="ts">
	import { __ } from '@wordpress/i18n';
	import {
		criticalCssProgress,
		criticalCssStatus,
		isFatalError,
	} from '../../../stores/critical-css-status';
	import CriticalCssShowStopperError from './CriticalCssShowStopperError.svelte';
	import CriticalCssStatus from './CriticalCssStatus.svelte';
</script>

{#if $criticalCssStatus.status === 'pending'}
	<div class="jb-critical-css-progress">
		<span class="jb-critical-css-progress__label">
			{__(
				'Generating Critical CSS. Please don’t leave this page until completed.',
				'jetpack-boost'
			)}
		</span>
		<div
			role="progressbar"
			aria-valuemax={100}
			aria-valuemin={0}
			aria-valuenow={$criticalCssProgress}
			class="jb-progress-bar"
		>
			<div
				class="jb-progress-bar__filler"
				aria-hidden="true"
				style={`width: ${ $criticalCssProgress }%;`}
			/>
		</div>
	</div>
{:else if $isFatalError}
	<CriticalCssShowStopperError />
{:else}
	<CriticalCssStatus />
{/if}
