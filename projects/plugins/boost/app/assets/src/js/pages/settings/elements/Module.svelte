<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
	import Toggle from '../../../elements/Toggle.svelte';
	import { modulesState, modulesStateClient, updateModuleState } from '../../../stores/modules';

	export let slug;

	const dispatch = createEventDispatcher();

	$: isModuleActive = $modulesState[ slug ].active;
	$: isModuleAvailable = $modulesState[ slug ].available;
	$: if ( isModuleActive ) {
		dispatch( 'enabled' );
	} else {
		dispatch( 'disabled' );
	}
	const isPending = modulesStateClient.pending;

	function handleToggle() {
		updateModuleState( slug, ! isModuleActive );
	}

	onMount( async () => {
		if ( isModuleActive ) {
			dispatch( 'mountEnabled' );
		}
	} );
</script>

{#if isModuleAvailable}
	<div class="jb-feature-toggle">
		<div class="jb-feature-toggle__toggle">
			<Toggle
				id={`jb-feature-toggle-${ slug }`}
				checked={isModuleActive}
				disabled={$isPending}
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

				{#if isModuleActive}
					<div class="jb-feature-toggle__meta">
						<slot name="meta" />
					</div>
				{/if}

				<slot name="notice" />

				<slot name="cta" />
			</div>
		</div>
	</div>
{/if}
