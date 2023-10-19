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
