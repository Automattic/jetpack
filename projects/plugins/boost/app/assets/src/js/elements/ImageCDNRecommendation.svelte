<script lang="ts">
	import { __, sprintf } from '@wordpress/i18n';
	import TemplatedString from './TemplatedString.svelte';
</script>

<p>
	<TemplatedString
		template={sprintf(
			// translators: %s is Image CDN.
			__(
				'A lot of the reported issues can be easily fixed by enabling the %s feature.',
				'jetpack-boost'
			),
			'<b>' + __( 'Image CDN', 'jetpack-boost' ) + '</b>'
		)}
		vars={{
			b: [ 'strong', {}, '' ],
		}}
	/>
</p>
<p><small>{__( 'You`ll need to analyze again if you enable it.', 'jetpack-boost' )}</small></p>

<style lang="scss">
	p {
		margin-top: 0 !important;
	}

	p:last-of-type {
		margin-bottom: 0 !important;
	}
</style>
