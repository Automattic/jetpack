<script lang="ts">
	import { derived, writable } from 'svelte/store';
	import { Snackbar } from '@wordpress/components';
	import ActivateLicense from '../../elements/ActivateLicense.svelte';
	import ReactComponent from '../../elements/ReactComponent.svelte';
	import { BoostPricingTable } from '../../react-components/BoostPricingTable';
	import Header from '../../sections/Header.svelte';
	import config, { markGetStartedComplete } from '../../stores/config';
	import { connection } from '../../stores/connection';
	import { recordBoostEvent } from '../../utils/analytics';
	import { getUpgradeURL } from '../../utils/upgrade';

	$: pricing = $config.pricing;

	// svelte-ignore unused-export-let - Ignored values supplied by svelte-navigator.
	export let navigate, location;

	let initiatingFreePlan = false;
	let initiatingPaidPlan = false;
	const dismissedSnackbar = writable( false );

	const snackbarMessage = derived(
		[ connection, dismissedSnackbar ],
		( [ $connection, $dismissedSnackbar ] ) => {
			if ( ! $dismissedSnackbar && ! $connection.connected && $connection.error?.message ) {
				return $connection.error.message;
			}

			return null;
		}
	);

	/**
	 * Mark that getting started is completed, and head to the next page.
	 *
	 * @param {string} externalPage If specified, head to the external page instead of staying on the dashboard.
	 */
	function finishGettingStarted( externalPage?: string ) {
		markGetStartedComplete();

		if ( externalPage ) {
			window.location.href = externalPage;
		} else {
			navigate( '/', { replace: true } );
		}
	}

	/**
	 * User clicked "Free plan"
	 */
	async function chooseFreePlan() {
		initiatingFreePlan = true;

		try {
			// Make sure there is a Jetpack connection and record this selection.
			await Promise.all( [
				connection.initialize(),
				recordBoostEvent( 'free_cta_from_getting_started_page_in_plugin', {} ),
			] );

			// Head to the settings page.
			finishGettingStarted();
		} catch ( e ) {
			// Un-dismiss snackbar on error. Actual error comes from connection object.
			dismissedSnackbar.set( false );
		} finally {
			initiatingFreePlan = false;
		}
	}

	/**
	 * User clicked Premium.
	 */
	async function choosePaidPlan() {
		initiatingPaidPlan = true;

		try {
			// Make sure there is a Jetpack connection and record this selection.
			await Promise.all( [
				connection.initialize(),
				recordBoostEvent( 'premium_cta_from_getting_started_page_in_plugin', {} ),
			] );

			// Check if the site is already on a premium plan and go directly to settings if so.
			if ( $config.isPremium ) {
				finishGettingStarted();
				return;
			}

			// Go to the purchase flow.
			finishGettingStarted( getUpgradeURL() );
		} catch ( e ) {
			// Un-dismiss snackbar on error. Actual error comes from connection object.
			dismissedSnackbar.set( false );
		} finally {
			initiatingPaidPlan = false;
		}
	}
</script>

<div id="jb-dashboard" class="jb-dashboard jb-dashboard--main">
	<Header>
		<ActivateLicense />
	</Header>

	<div class="jb-section jb-section--alt">
		<div class="jb-container">
			<div class="jb-pricing-table">
				<ReactComponent
					this={BoostPricingTable}
					{pricing}
					onPremiumCTA={choosePaidPlan}
					onFreeCTA={chooseFreePlan}
					chosenFreePlan={initiatingFreePlan}
					chosenPaidPlan={initiatingPaidPlan}
				/>
				{#if $snackbarMessage}
					<ReactComponent
						this={Snackbar}
						children={$snackbarMessage}
						onDismiss={() => dismissedSnackbar.set( true )}
					/>
				{/if}
			</div>
		</div>
	</div>
</div>

<style lang="scss">
	.jb-pricing-table {
		isolation: isolate;
	}
</style>
