<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
	import Toggle from '../../../elements/Toggle.svelte';

	export let toggle = true;
	export let slug: string;
	export let isActive: boolean;
	export let isAvailable: boolean;

	const dispatch = createEventDispatcher();
	let lastToggledState = isActive;

	function handleToggle( newState ) {
		if ( lastToggledState === newState ) {
			return;
		}

		lastToggledState = newState;

		dispatch( lastToggledState ? 'enabled' : 'disabled', {
			active: newState,
			slug,
		} );
	}

	onMount( async () => {
		if ( isAvailable && isActive ) {
			dispatch( 'mountEnabled' );
		}
	} );
</script>

{#if isAvailable}
	<div class="jb-feature-toggle">
		<div class="jb-feature-toggle__toggle">
			{#if toggle}
				<Toggle
					id={`jb-feature-toggle-${ slug }`}
					checked={isActive}
					on:click={() => handleToggle( ! isActive )}
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

				{#if isActive}
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
