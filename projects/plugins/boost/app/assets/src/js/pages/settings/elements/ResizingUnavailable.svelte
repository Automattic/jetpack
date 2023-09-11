<script lang="ts">
	import { __ } from '@wordpress/i18n';
</script>

<div class="jetpack-boost-notice">
	<h2>{__( 'Image resizing is unavailable', 'jetpack-boost' )}</h2>
	<p>
		{__(
			"It looks like your server doesn't have Imagick or GD extensions installed.",
			'jetpack-boost'
		)}
	</p>
	<p>
		{__(
			"Jetpack Boost is able to work without these extensions, but it's likely that it's going to be difficult for you to optimize the images that the Image Guide will identify without one of these extensions.",
			'jetpack-boost'
		)}
	</p>
	<p>
		{__(
			'Please contact your hosting provider or system administrator and ask them to install or activate one of these extensions.',
			'jetpack-boost'
		)}
	</p>
</div>

<style lang="scss">
	.jetpack-boost-notice {
		border: 2px solid var( --jp-green );
		padding: 24px 24px;
		margin: 0 -24px;
		border-radius: 4px;
	}
</style>
