<script>
	/**
	 * WordPress dependencies
	 */
	import { __ } from '@wordpress/i18n';

	/**
	 * Internal dependencies
	 */
	import { CriticalCssStatus } from './CriticalCssStatus.svelte';
	import { requestCloudCss } from '../../../utils/cloud-css';
</script>

<CriticalCssStatus on:retry={requestCloudCss} on:retryShowStopper={requestCloudCss}>
	<p slot="generating">
		{__( 'Jetpack Boost will generate Critical CSS for you automatically.', 'jetpack-boost' )}
	</p>
	<p slot="generating-more">
		{__( 'Jetpack Boost is generating more Critical CSS.', 'jetpack-boost' )}
	</p>
</CriticalCssStatus>
