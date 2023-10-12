<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
	import Toggle from '../../../elements/Toggle.svelte';

	export let toggle = true;
	export let slug: string;
	export let isActive: boolean;

	const dispatch = createEventDispatcher();

	$: isModuleActive = isActive;

	async function handleToggle() {
		isActive = ! isModuleActive;

		dispatch( 'toggle', {
			active: isActive,
			slug,
		} );
	}

	onMount( async () => {
		if ( isModuleActive ) {
			dispatch( 'mountEnabled' );
		}
	} );
</script>

<div class="jb-feature-toggle">
	<div class="jb-feature-toggle__toggle">
		{#if toggle}
			<Toggle id={`jb-feature-toggle-${ slug }`} checked={isModuleActive} on:click={handleToggle} />
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

<style>
	.jb-feature-toggle__toggle {
		min-width: 36px;
	}
</style>
