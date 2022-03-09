<script>
	/**
	 * WordPress dependencies
	 */
	import { __, _n, sprintf } from '@wordpress/i18n';

	/**
	 * Internal dependencies
	 */
	import { requestCloudCss } from '../../../utils/cloud-css';
	import { cloudCssStatus } from '../../../stores/cloud-css-status';
	import RefreshIcon from '../../../svg/refresh.svg';
	import TimeAgo from '../../../elements/TimeAgo.svelte';
</script>

<div class="jb-cloud-css-meta">
	<div class="meta-description">
		{#if $cloudCssStatus.completed === 0}
			{__( 'Jetpack Boost will generate Critical CSS for you automatically.', 'jetpack-boost' )}
		{:else}
			{sprintf(
				/* translators: %d is a number of CSS Files which were successfully generated */
				_n( '%d file generated', '%d files generated', $cloudCssStatus.completed, 'jetpack-boost' ),
				$cloudCssStatus.completed
			)}
			<TimeAgo time={new Date( $cloudCssStatus.updated * 1000 )} />.
			{#if $cloudCssStatus.pending}
				{__( 'Jetpack Boost is generating more Critical CSS.', 'jetpack-boost' )}
			{/if}
		{/if}
	</div>
	<button type="button" class="components-button is-link" on:click={requestCloudCss}>
		<RefreshIcon />
		{__( 'Regenerate', 'jetpack-boost' )}
	</button>
</div>
