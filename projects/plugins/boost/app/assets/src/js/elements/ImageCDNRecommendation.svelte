<script lang="ts">
	import { __ } from '@wordpress/i18n';
	import TemplatedString from './TemplatedString.svelte';
</script>

<p>
	<TemplatedString
		template={__( 'We recommend enabling the <b>Image CDN</b>.', 'jetpack-boost' )}
	/>
</p>
<p>
	<small>
		{__(
			"Jetpack Boost's Image CDN can automatically resize many images to the correct size for you.",
			'jetpack-boost'
		)}
	</small>
</p>

<style lang="scss">
	p {
		margin-top: 0 !important;
	}

	p:last-of-type {
		margin-bottom: 0 !important;
	}
</style>
