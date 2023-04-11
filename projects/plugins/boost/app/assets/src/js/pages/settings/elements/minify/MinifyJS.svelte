<script lang="ts">
	import { __ } from '@wordpress/i18n';
	import { minifyJsExcludesClient } from '../../../../stores/minify';
	import ExcludesInput from './ExcludesInput.svelte';
	const excludes = minifyJsExcludesClient.store;
</script>

<ExcludesInput
	id="js-excludes-list"
	inputLabel={__( 'Exclude JS Strings:', 'jetpack-boost' )}
	buttonText={__( 'Exclude JS Strings', 'jetpack-boost' )}
	placeholder={__( 'Use comma to separate them', 'jetpack-boost' )}
	value={$excludes}
	on:update={e => ( $excludes = e.detail )}
/>
