<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
	import Toggle from '../../../elements/Toggle.svelte';
	import { modulesState, modulesStateClient, updateModuleState } from '../../../stores/modules';

	export let slug;

	const dispatch = createEventDispatcher();

	let module;
	let moduleWasDisabled;
	$: {
		module = $modulesState[ slug ];

		if ( module.active && moduleWasDisabled === true ) {
			dispatch( 'enabled' );
			moduleWasDisabled = false;
		} else if ( ! module.active && moduleWasDisabled === false ) {
			dispatch( 'disabled' );
			moduleWasDisabled = true;
		}
	}
	const isPending = modulesStateClient.pending;

	function handleToggle() {
		updateModuleState( slug, ! module.active );
	}

	onMount( async () => {
		if ( module.active ) {
			dispatch( 'mountEnabled' );
		} else {
			moduleWasDisabled = true;
		}
	} );
</script>

{#if module.available}
	<div class="jb-feature-toggle">
		<div class="jb-feature-toggle__toggle">
			<Toggle
				id={`jb-feature-toggle-${ slug }`}
				checked={module.active}
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

				{#if module.active}
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
