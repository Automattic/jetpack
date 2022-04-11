<script>
	/**
	 * WordPress dependencies
	 */
	import { __ } from '@wordpress/i18n';

	/**
	 * Internal dependencies
	 */
	import { criticalCssStatus } from '../../../stores/critical-css-status';
	import CriticalCssStatus from './CriticalCssStatus.svelte';
	import generateCriticalCss from '../../../utils/generate-critical-css';
</script>

<CriticalCssStatus
	on:retry={generateCriticalCss}
	on:retryShowStopper={() => generateCriticalCss( true, true )}
>
	<div class="jb-critical-css-progress" slot="progress">
		<span class="jb-critical-css-progress__label">
			{__( 'Generating Critical CSS…', 'jetpack-boost' )}
		</span>
		<div
			role="progressbar"
			aria-valuemax="100"
			aria-valuemin="0"
			aria-valuenow={$criticalCssStatus.progress}
			class="jb-progress-bar"
		>
			<div
				class="jb-progress-bar__filler"
				aria-hidden="true"
				style={`width: ${ $criticalCssStatus.progress }%;`}
			/>
		</div>
	</div>
</CriticalCssStatus>
