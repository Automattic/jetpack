<script lang="ts" context="module">
	let nextIdIndex = 0;
</script>

<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { __, sprintf } from '@wordpress/i18n';
	import PencilIcon from '../../../svg/pencil.svg';

	export let inputLabel: string;
	export let buttonText: string;
	export let placeholder: string;

	export let value: string[];

	let inputValue = prettyValue();
	let savedValue = inputValue;
	let isEditing = false;
	const htmlId = `minify-meta-exclude-list-${ nextIdIndex++ }`;

	const dispatch = createEventDispatcher();

	/**
	 * Helper method to format the value for display (as a comma separated list).
	 */
	function prettyValue() {
		return value.join( ', ' );
	}

	/**
	 * Save changes.
	 */
	function save() {
		// Sanitize input and save.
		value = inputValue
			.split( ',' )
			.map( v => v.trim() )
			.filter( Boolean );
		dispatch( 'save', value );
		isEditing = false;

		// Beautify the input field.
		inputValue = prettyValue();
		savedValue = inputValue;
	}

	function handleKeyPress( e ) {
		if ( savedValue !== inputValue && e.key === 'Enter' ) {
			save();
		}
	}
</script>

<div class="jb-critical-css__meta">
	{#if isEditing}
		<div class="manage-excludes">
			<label for={htmlId}>{inputLabel}</label>
			<input
				type="text"
				bind:value={inputValue}
				{placeholder}
				id={htmlId}
				on:keypress={handleKeyPress}
			/>
			<div class="buttons-container">
				<button disabled={savedValue === inputValue} on:click={save}
					>{__( 'Save', 'jetpack-boost' )}</button
				>
				<button
					on:click={() => {
						isEditing = false;
					}}>{__( 'Cancel', 'jetpack-boost' )}</button
				>
			</div>
		</div>
	{:else}
		<div class="summary">
			{#if value.length}
				<div class="successes">
					{sprintf(
						/* Translators: %s refers to the list of excluded items. */
						__( 'Except: %s', 'jetpack-boost' ),
						prettyValue()
					)}
				</div>
			{/if}
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

	.buttons-container button[disabled] {
		border-color: $gray-5;
		background-color: $gray-5;
		color: $gray-20;
		cursor: not-allowed;
	}
</style>
