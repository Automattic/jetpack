<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
	import { __ } from '@wordpress/i18n';
	import ErrorNotice from '../../../elements/ErrorNotice.svelte';
	import Toggle from '../../../elements/Toggle.svelte';
	import {
		isModuleAvailableStore,
		isModuleEnabledStore,
		moduleStates,
		updateModuleState,
	} from '../../../stores/modules';

	export let slug;

	const dispatch = createEventDispatcher();

	const isEnabled = isModuleEnabledStore( slug );
	const isAvailable = isModuleAvailableStore( slug );
	const isSaving = moduleStates[ slug ].pending;
	const errors = moduleStates[ slug ].errors;

	isEnabled.subscribe( value => {
		if ( value ) {
			dispatch( 'enabled' );
		} else {
			dispatch( 'disabled' );
		}
	} );

	function handleToggle() {
		updateModuleState( slug, ! $isEnabled );
	}

	onMount( async () => {
		if ( $isEnabled ) {
			dispatch( 'mountEnabled' );
		}
	} );
</script>

{#if $isAvailable}
	<div class="jb-feature-toggle">
		<div class="jb-feature-toggle__toggle">
			<Toggle
				id={`jb-feature-toggle-${ slug }`}
				checked={$isEnabled}
				disabled={$isSaving}
				on:click={handleToggle}
			/>
		</div>
		<div class="jb-feature-toggle__content">
			<slot name="title" />

			<div class="jb-feature-toggle__text">
				<slot name="description" />
			</div>

			<div class="jb-feature-toggle__content">
				<slot />

				{#if $errors.length > 0}
					{@const  error = $errors[ 0 ] }
					<ErrorNotice
						title={__( 'Failed to toggle feature', 'jetpack-boost' )}
						error={error.message}
					/>
				{/if}

				{#if $isEnabled}
					<slot name="meta" />
				{/if}

				<slot name="notice" />

				<slot name="cta" />
			</div>
		</div>
	</div>
{/if}
