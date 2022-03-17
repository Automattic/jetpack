<script>
	/**
	 * Internal dependencies
	 */
	import BackButton from '../../elements/BackButton.svelte';

	/**
	 * WordPress dependencies
	 */
	import { __ } from '@wordpress/i18n';
</script>

<div id="jb-settings" class="jb-settings jb-settings--padded">
	<div class="jb-container">
		<BackButton />
		<h3>
			{__( 'Critical CSS advanced recommendations', 'jetpack-boost' )}
		</h3>
	</div>
</div>
