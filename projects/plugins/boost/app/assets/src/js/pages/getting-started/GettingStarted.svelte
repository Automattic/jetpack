<script lang="ts">
	import { onMount } from 'svelte';
	import { get, writable } from 'svelte/store';
	import ReactComponent from '../../elements/ReactComponent.svelte';
	import { BoostPricingTable } from '../../react-components/BoostPricingTable';
	import Header from '../../sections/Header.svelte';
	import config, { markGetStartedComplete } from '../../stores/config';
	import { connection } from '../../stores/connection';
	import { updateModuleState } from '../../stores/modules';
	import { recordBoostEvent } from '../../utils/analytics';
	import { getUpgradeURL } from '../../utils/upgrade';

	$: pricing = $config.pricing;

	// svelte-ignore unused-export-let - Ignored values supplied by svelte-navigator.
	export let navigate, location;

	const chosenFreePlan = writable( false );
	const chosenPaidPlan = writable( false );

	const chooseFreePlan = async () => {
		chosenFreePlan.set( true );

		await Promise.all( [
			recordBoostEvent( 'free_cta_from_getting_started_page_in_plugin', {} ),
			await ( async () => {
				try {
					await connection.initialize();

					const connectionStore = get( connection );
					if ( ! connectionStore.connected ) {
						throw new Error( connectionStore.error );
					}

					// Allow opening the boost settings page. The actual flag is changed in the backend by enabling the critical-css module below.
					markGetStartedComplete();

					// Need to await in this case because the generation request needs to go after the backend has enabled the module.
					await updateModuleState( 'critical-css', true );
					navigate( '/' );
				} catch ( e ) {
					// eslint-disable-next-line no-console
					console.error( e );
				} finally {
					chosenFreePlan.set( false );
				}
			} )(),
		] );
	};

	const choosePaidPlan = async () => {
		chosenPaidPlan.set( true );

		await Promise.all( [
			await recordBoostEvent( 'premium_cta_from_getting_started_page_in_plugin', {} ),
			await ( async () => {
				try {
					await connection.initialize();

					const connectionStore = get( connection );
					if ( ! connectionStore.connected ) {
						throw new Error( connectionStore.error );
					}

					window.location.href = getUpgradeURL();
				} catch ( e ) {
					// eslint-disable-next-line no-console
					console.error( e );
				} finally {
					chosenPaidPlan.set( false );
				}
			} )(),
		] );
	};

	onMount( () => {
		// If we don't have pricing data, we should skip the page and go directly to settings.
		if ( typeof pricing.yearly === 'undefined' ) {
			// Allow opening the boost settings page.
			markGetStartedComplete();

			navigate( '/', { replace: true } );
		}
	} );
</script>

<div id="jb-settings" class="jb-settings jb-settings--main">
	<div class="jb-container">
		<Header />
	</div>

	{#if pricing.yearly}
		<div class="jb-section jb-section--alt">
			<div class="jb-container">
				<ReactComponent
					this={BoostPricingTable}
					{pricing}
					onPremiumCTA={choosePaidPlan}
					onFreeCTA={chooseFreePlan}
					chosenFreePlan={$chosenFreePlan}
					chosenPaidPlan={$chosenPaidPlan}
				/>
			</div>
		</div>
	{/if}
</div>
