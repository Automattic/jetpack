<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
	import Toggle from '../../../elements/Toggle.svelte';
	import { type ModuleState } from '../../../stores/modules';

	export let toggle = true;
	export let slug: string;
	export let state: ModuleState;

	const dispatch = createEventDispatcher();

	$: isModuleActive = state.active;
	$: isModuleAvailable = state.available;

	async function handleToggle() {
		state.active = ! isModuleActive;
		if ( state.active ) {
			dispatch( 'enabled' );
		} else {
			dispatch( 'disabled' );
		}

		dispatch( 'toggle', {
			active: state.active,
			slug,
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
