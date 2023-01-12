<script lang="ts">
	import { __ } from '@wordpress/i18n';
	import { criticalCssStatus, showError } from '../../../stores/critical-css-status';
	import { requestCloudCss, retryCloudCss } from '../../../utils/cloud-css';
	import CriticalCssShowStopperError from './CriticalCssShowStopperError.svelte';
	import CriticalCssSuccess from './CriticalCssSuccess.svelte';
</script>

{#if $criticalCssStatus.status === 'requesting'}
	<div class="jb-critical-css__meta">
		<div class="summary">
			<div class="generating">
				{__( 'Jetpack Boost will generate Critical CSS for you automatically.', 'jetpack-boost' )}
			</div>
		</div>
	</div>
{:else if $criticalCssStatus.status === 'success'}
	<CriticalCssSuccess on:retry={requestCloudCss} />
{:else if $showError}
	<CriticalCssShowStopperError
		supportLink="https://jetpackme.wordpress.com/contact-support/"
		on:retry={retryCloudCss}
	/>
{/if}
