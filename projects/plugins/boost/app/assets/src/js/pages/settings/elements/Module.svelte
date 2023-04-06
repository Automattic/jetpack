<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
	import Toggle from '../../../elements/Toggle.svelte';
	import { modulesState, modulesStateClient, updateModuleState } from '../../../stores/modules';

	export let slug: string;

	const dispatch = createEventDispatcher();

	$: isModuleActive = $modulesState[ slug ].active;
	$: isModuleAvailable = $modulesState[ slug ].available;

	const isPending = modulesStateClient.pending;

	async function handleToggle() {
		const previousState = isModuleActive;
		const result = await updateModuleState( slug, ! isModuleActive );
		const state = result[ slug ].active;

		if ( previousState !== state ) {
			const eventName = state === true ? 'enable' : 'disable';
			dispatch( eventName );
		}
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
					<slot name="meta" />

					<slot name="notice" />

					<slot name="cta" />
				{/if}
			</div>
		</div>
	</div>
{/if}
