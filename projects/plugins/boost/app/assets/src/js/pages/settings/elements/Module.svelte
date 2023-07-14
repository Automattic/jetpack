<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
	import Toggle from '../../../elements/Toggle.svelte';
	import { modulesState, modulesStatePending } from '../../../stores/modules';

	export let toggle = true;
	export let slug: string;

	const dispatch = createEventDispatcher();

	$: isModuleActive = $modulesState[ slug ].active;
	$: isModuleAvailable = $modulesState[ slug ].available;

	async function handleToggle() {
		const toggledState = ! isModuleActive;
		const eventName = toggledState === true ? 'enabled' : 'disabled';

		// Toggle the module.
		$modulesState[ slug ].active = toggledState;

		// Attach a listener to the modulesStatePending store to dispatch an event after the pending state is resolved.
		const unsubscribe = modulesStatePending.subscribe( isPending => {
			if ( ! isPending ) {
				dispatch( eventName );
				unsubscribe();
			}
		} );
	}

	onMount( async () => {
		if ( isModuleAvailable && isModuleActive ) {
			dispatch( 'mountEnabled' );
		}
	} );
</script>

{#if isModuleAvailable}
	<div class="jb-feature-toggle">
		<div class="jb-feature-toggle__toggle">
			{#if toggle}
				<Toggle
					id={`jb-feature-toggle-${ slug }`}
					checked={isModuleActive}
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
