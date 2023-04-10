<script lang="ts">
	import {
		minifyJsExcludesState,
		updateminifyJsExcludesState,
		minifyCssExcludesState,
		updateminifyCssExcludesState,
	} from '../../../stores/minify';
	import PencilIcon from '../../../svg/pencil.svg';

	export let type: string;
	export let summary: string;
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
		<p>Exclude JS Strings:</p>
		<input type="text" bind:value placeholder="Use comma to separate them" />
		<button on:click={handleUpdate}>Save</button>
		<button
			on:click={() => {
				isEditing = false;
			}}>Cancel</button
		>
	{:else}
		<div class="summary">
			<div class="successes">
				{summary}
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
