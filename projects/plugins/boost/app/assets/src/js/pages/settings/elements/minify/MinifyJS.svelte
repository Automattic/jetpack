<script lang="ts">
	import { __ } from '@wordpress/i18n';
	import { minifyJsExcludesState } from '../../../../stores/minify';
	import SaveableInput from './SaveableInput.svelte';

	let value: string;
</script>

<SaveableInput
	id="js-excludes-list"
	inputLabel={__( 'Exclude JS Strings:', 'jetpack-boost' )}
	buttonText={__( 'Exclude JS Strings', 'jetpack-boost' )}
	initialValue={$minifyJsExcludesState}
	placeholder={__( 'Use comma to separate them', 'jetpack-boost' )}
	on:click={() => ( $minifyJsExcludesState = value )}
	bind:value
/>
