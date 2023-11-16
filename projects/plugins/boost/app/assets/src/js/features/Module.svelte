<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
	import Toggle from '$features/ui/Toggle.svelte';
	import { modulesState, modulesStatePending } from '$lib/stores/modules';

	export let toggle = true;
	export let slug: string;

	const dispatch = createEventDispatcher();

	$: isModuleActive = $modulesState[ slug ].active;
	$: isModuleAvailable = $modulesState[ slug ].available;

	async function handleToggle() {
		$modulesState[ slug ].active = ! isModuleActive;
	}

	/**
	 * Watch for changes in state and dispatch an event when the state is no longer pending.
	 */
	let lastToggledState = $modulesState[ slug ].active;
	$: {
		if ( ! $modulesStatePending ) {
			const newState = $modulesState[ slug ].active;
			if ( lastToggledState !== newState ) {
				lastToggledState = newState;
				dispatch( newState ? 'enabled' : 'disabled' );
			}
		}
	}

	onMount( async () => {
		if ( isModuleAvailable && isModuleActive ) {
			dispatch( 'mountEnabled' );
		}
	} );
</script>

{#if isModuleAvailable || slug === 'lazy_images'}
	<div class="jb-feature-toggle">
		<div class="jb-feature-toggle__toggle">
			{#if toggle}
				<Toggle
					id={`jb-feature-toggle-${ slug }`}
					checked={isModuleActive}
					disabled={! isModuleAvailable}
					on:click={handleToggle}
				/>
			{/if}
		</div>

		<div class="jb-feature-toggle__content">
			<slot name="title" />

			<div class="jb-feature-toggle__text">
				<slot name="description" />
			</div>

			<div class="jb-feature-toggle__content">
				<slot />

				{#if isModuleActive}
					<slot name="meta" />

					<slot name="notice" />

					<slot name="cta" />
				{/if}
			</div>
		</div>
	</div>
{/if}

<style>
	.jb-feature-toggle__toggle {
		min-width: 36px;
	}
</style>
