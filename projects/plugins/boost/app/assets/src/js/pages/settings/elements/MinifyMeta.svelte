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
	const excludesHtmlId = `${ type }-excludes-list`;

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
		<div class="manage-excludes">
			<label for={excludesHtmlId}>{inputLabel}</label>
			<input
				type="text"
				bind:value
				placeholder={__( 'Use comma to separate them', 'jetpack-boost' )}
				id={excludesHtmlId}
			/>
			<div class="buttons-container">
				<button on:click={handleUpdate}>Save</button>
				<button
					on:click={() => {
						isEditing = false;
					}}>Cancel</button
				>
			</div>
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

<style lang="scss">
	@use '../../../../css/main/variables.scss' as *;

	.manage-excludes {
		display: flex;
		flex-direction: column;
		align-items: center;
		width: 100%;
	}

	.manage-excludes label {
		display: block;
		text-align: left;
		margin-bottom: 16px;
		font-weight: bold;
		width: 100%;
	}

	.manage-excludes input[type='text'] {
		width: 100%;
		padding: 10px;
		border-radius: 4px;
		border: 1px solid $gray_10;
		margin-bottom: 16px;
	}

	.buttons-container {
		display: flex;
		flex-direction: row;
		justify-content: flex-start;
		width: 100%;
	}

	.buttons-container button {
		margin-right: 10px;
		padding: 8px 24px;
		border: 1px solid $primary-black;
		border-radius: 4px;
		cursor: pointer;
		color: $primary-black;
	}

	.buttons-container button:first-child {
		background-color: $primary-black;
		color: $primary-white;
	}

	.buttons-container button:last-child {
		margin-right: 0;
		background-color: transparent;
	}
</style>
