<script lang="ts">
	import { Snackbar } from '@wordpress/components';
	import ActivateLicense from '../../elements/ActivateLicense.svelte';
	import ReactComponent from '../../elements/ReactComponent.svelte';
	import { BoostPricingTable } from '../../react-components/BoostPricingTable';
	import Footer from '../../sections/Footer.svelte';
	import Header from '../../sections/Header.svelte';
	import { markGetStartedComplete } from '../../stores/config';
	import {
		initializeConnection,
		type ConnectionStatus,
		getUpgradeURL,
	} from '../../stores/connection';
	import { recordBoostEvent } from '../../utils/analytics';

	// svelte-ignore unused-export-let - Ignored values supplied by svelte-navigator.
	export let navigate, location;
	export let connection: ConnectionStatus;
	export let pricing: ( typeof Jetpack_Boost )[ 'pricing' ];
	export let isPremium: boolean;
	export let domain: string;

	let initiatingFreePlan = false;
	let initiatingPaidPlan = false;

	let snackbarDismissed = false;
	let snackbarMessage: string;

	$: if ( ! snackbarDismissed && ! connection.connected && connection.error?.message ) {
		snackbarMessage = connection.error.message;
	}

	/**
	 * User clicked "Free plan"
	 */
	async function chooseFreePlan() {
		initiatingFreePlan = true;

		try {
			// Make sure there is a Jetpack connection
			await initializeConnection();

			// Record this selection. This must be done after the connection is initialized.
			recordBoostEvent( 'free_cta_from_getting_started_page_in_plugin', {} );
			markGetStartedComplete();

			// Head to the settings page.
			navigate( '/', { replace: true } );
		} catch ( e ) {
			// Un-dismiss snackbar on error. Actual error comes from connection object.
			snackbarDismissed = false;
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
			// Make sure there is a Jetpack connection
			await initializeConnection();

			// Record this selection. This must be done after the connection is initialized.
			recordBoostEvent( 'premium_cta_from_getting_started_page_in_plugin', {} );
			markGetStartedComplete();

			// Check if the site is already on a premium plan and go directly to settings if so.
			if ( isPremium ) {
				navigate( '/', { replace: true } );
				return;
			}
			// Go to the purchase flow.
			window.location.href = getUpgradeURL( domain, connection.userConnected );
		} catch ( e ) {
			// Un-dismiss snackbar on error. Actual error comes from connection object.
			snackbarDismissed = false;
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
				{#if snackbarMessage && ! snackbarDismissed}
					<ReactComponent
						this={Snackbar}
						children={snackbarMessage}
						onDismiss={() => ( snackbarDismissed = true )}
					/>
				{/if}
			</div>
		</div>
	</div>

	<Footer />
</div>

<style lang="scss">
	.jb-pricing-table {
		isolation: isolate;
	}
</style>
