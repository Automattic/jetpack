<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
	import { get } from 'svelte/store';
	import Toggle from '../../../elements/Toggle.svelte';
	import { modulesState, modulesStateClient, updateModuleState } from '../../../stores/modules';

	export let slug;

	const dispatch = createEventDispatcher();

	$: isEnabled = $modulesState[ slug ].active;
	$: isAvailable = $modulesState[ slug ].available;
	$: isSaving = get( modulesStateClient.pending );

	if ( isEnabled ) {
		dispatch( 'enabled' );
	} else {
		dispatch( 'disabled' );
	}

	function handleToggle() {
		updateModuleState( slug, ! isEnabled );
	}

	onMount( async () => {
		if ( isEnabled ) {
			dispatch( 'mountEnabled' );
		}
	} );
</script>

{#if isAvailable}
	<div class="jb-feature-toggle">
		<div class="jb-feature-toggle__toggle">
			<Toggle
				id={`jb-feature-toggle-${ slug }`}
				checked={isEnabled}
				disabled={isSaving}
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

				{#if isEnabled}
					<slot name="meta" />
				{/if}

				<slot name="notice" />

				<slot name="cta" />
			</div>
		</div>
	</div>
{/if}
