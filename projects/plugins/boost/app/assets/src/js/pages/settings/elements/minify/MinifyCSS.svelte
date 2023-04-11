<script lang="ts">
	import { __ } from '@wordpress/i18n';
	import { minifyCssExcludesClient } from '../../../../stores/minify';
	import ExcludesInput from './ExcludesInput.svelte';
	const excludes = minifyCssExcludesClient.store;
</script>

<ExcludesInput
	id="css-excludes-list"
	inputLabel={__( 'Exclude CSS Strings:', 'jetpack-boost' )}
	buttonText={__( 'Exclude CSS Strings', 'jetpack-boost' )}
	placeholder={__( 'Use comma to separate them', 'jetpack-boost' )}
	value={$excludes}
	on:update={e => ( $excludes = e.detail )}
/>
