<script>
	/**
	 * WordPress dependencies
	 */
	import { __ } from '@wordpress/i18n';

	/**
	 * Internal dependencies
	 */
	import CriticalCssStatus from './CriticalCssStatus.svelte';
	import { requestCloudCss } from '../../../utils/cloud-css';
</script>

<CriticalCssStatus on:retry={requestCloudCss} on:retryShowStopper={requestCloudCss}>
	<svelte:fragment slot="generating">
		{__( 'Jetpack Boost will generate Critical CSS for you automatically.', 'jetpack-boost' )}
	</svelte:fragment>
	<svelte:fragment slot="generating-more">
		{__( 'Jetpack Boost is generating more Critical CSS.', 'jetpack-boost' )}
	</svelte:fragment>
</CriticalCssStatus>
