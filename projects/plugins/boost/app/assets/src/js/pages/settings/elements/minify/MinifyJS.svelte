<script lang="ts">
	import { __ } from '@wordpress/i18n';
	import { minifyJsExcludesClient } from '../../../../stores/minify';
	import SaveableInput from './ExcludesInput.svelte';

	let value: string;
	const excludes = minifyJsExcludesClient.store;
</script>

<SaveableInput
	id="js-excludes-list"
	inputLabel={__( 'Exclude JS Strings:', 'jetpack-boost' )}
	buttonText={__( 'Exclude JS Strings', 'jetpack-boost' )}
	placeholder={__( 'Use comma to separate them', 'jetpack-boost' )}
	initialValue={$excludes}
	on:click={() => ( $excludes = value )}
	bind:value
/>
