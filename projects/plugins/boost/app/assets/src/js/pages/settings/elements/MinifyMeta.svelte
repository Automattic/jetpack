<script lang="ts">
	import { __, sprintf } from '@wordpress/i18n';
	import {
		minifyJsExcludesState,
		updateminifyJsExcludesState,
		minifyCssExcludesState,
		updateminifyCssExcludesState,
	} from '../../../stores/minify';
	import PencilIcon from '../../../svg/pencil.svg';

	export let type: string;
	export let inputLabel: string;
	export let buttonText: string;

	let isEditing = true;
	const editingJs = 'js' === type;

	$: value = editingJs ? $minifyJsExcludesState : $minifyCssExcludesState;

	async function handleUpdate() {
		if ( editingJs ) {
			await updateminifyJsExcludesState( value );
		} else {
			await updateminifyCssExcludesState( value );
		}
	}
</script>

<div class="jb-critical-css__meta">
	{#if isEditing}
		<p>{inputLabel}</p>
		<input
			type="text"
			bind:value
			placeholder={__( 'Use comma to separate them', 'jetpack-boost' )}
		/>
		<div class="button-container">
			<button on:click={handleUpdate}>Save</button>
			<button
				on:click={() => {
					isEditing = false;
				}}>Cancel</button
			>
		</div>
	{:else}
		<div class="summary">
			<div class="successes">
				{sprintf(
					/* Translators: %s refers to the list of excluded items. */
					__( 'Except: %s', 'jetpack-boost' ),
					value
				)}
			</div>
		</div>

		<button
			type="button"
			class="components-button is-link"
			on:click={() => {
				isEditing = true;
			}}
		>
			<PencilIcon />
			{buttonText}
		</button>
	{/if}
</div>
