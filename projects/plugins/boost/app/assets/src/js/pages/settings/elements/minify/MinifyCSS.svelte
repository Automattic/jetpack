<script lang="ts">
	import { __ } from '@wordpress/i18n';
	import { minifyCssExcludesClient } from '../../../../stores/minify';
	import SaveableInput from './ExcludesInput.svelte';

	let value: string;
	const excludes = minifyCssExcludesClient.store;
</script>

<SaveableInput
	id="css-excludes-list"
	inputLabel={__( 'Exclude CSS Strings:', 'jetpack-boost' )}
	buttonText={__( 'Exclude CSS Strings', 'jetpack-boost' )}
	placeholder={__( 'Use comma to separate them', 'jetpack-boost' )}
	initialValue={$excludes}
	on:click={() => ( $excludes = value )}
	bind:value
/>
