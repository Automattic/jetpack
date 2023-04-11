<script lang="ts">
	import { __ } from '@wordpress/i18n';
	import { minifyCssExcludesState } from '../../../../stores/minify';
	import SaveableInput from './SaveableInput.svelte';

	let value: string;
</script>

<SaveableInput
	id="css-excludes-list"
	inputLabel={__( 'Exclude CSS Strings:', 'jetpack-boost' )}
	buttonText={__( 'Exclude CSS Strings', 'jetpack-boost' )}
	initialValue={$minifyCssExcludesState}
	placeholder={__( 'Use comma to separate them', 'jetpack-boost' )}
	on:click={() => ( $minifyCssExcludesState = value )}
	bind:value
/>
