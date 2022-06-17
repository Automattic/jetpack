<script>
	import { createEventDispatcher, onMount } from 'svelte';
	import { derived } from 'svelte/store';
	import { __ } from '@wordpress/i18n';
	import ErrorNotice from '../../../elements/ErrorNotice.svelte';
	import Toggle from '../../../elements/Toggle.svelte';
	import { modules, updateModuleState } from '../../../stores/modules';

	export let slug;

	const dispatch = createEventDispatcher();

	const isEnabled = derived( modules, $modules => $modules[ slug ] && $modules[ slug ].enabled );
	const isAvailable = derived( modules, $modules => typeof $modules[ slug ] !== 'undefined' );

	let error = null;
	let isLoading = false;

	async function handleToggle() {
		if ( isLoading ) {
			return;
		}

		error = null;
		isLoading = true;

		try {
			if ( await updateModuleState( slug, ! $isEnabled ) ) {
				dispatch( 'enabled' );
			} else {
				dispatch( 'disabled' );
			}
		} catch ( caughtError ) {
			error = caughtError;
		}

		isLoading = false;
	}

	onMount( async () => {
		if ( $isEnabled ) {
			dispatch( 'mountEnabled' );
		}
	} );
</script>

{#if $isAvailable}
	<div class="jb-feature-toggle">
		<div class="jb-feature-toggle__toggle">
			<Toggle
				id={`jb-feature-toggle-${ slug }`}
				checked={$isEnabled}
				bind:disabled={isLoading}
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

				{#if error}
					<ErrorNotice title={__( 'Failed to toggle feature', 'jetpack-boost' )} {error} />
				{/if}

				{#if $isEnabled}
					<slot name="meta" />
				{/if}
			</div>
		</div>
	</div>
{/if}
