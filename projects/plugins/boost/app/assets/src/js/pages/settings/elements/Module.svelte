<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
	import Toggle from '../../../elements/Toggle.svelte';
	import { modulesState } from '../../../stores/modules';

	export let toggle = true;
	export let slug: string;

	const dispatch = createEventDispatcher();

	$: isModuleActive = $modulesState[ slug ].active;
	$: isModuleAvailable = $modulesState[ slug ].available;

	async function handleToggle() {
		const toggledState = ! isModuleActive;
		$modulesState[ slug ].active = toggledState;
		const eventName = toggledState === true ? 'enabled' : 'disabled';
		dispatch( eventName );
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
