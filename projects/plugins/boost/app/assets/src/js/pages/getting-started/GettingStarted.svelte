<script lang="ts">
	import { Snackbar } from '@wordpress/components';
	import ActivateLicense from '../../elements/ActivateLicense.svelte';
	import ReactComponent from '../../elements/ReactComponent.svelte';
	import { BoostPricingTable } from '../../react-components/BoostPricingTable';
	import Footer from '../../sections/Footer.svelte';
	import Header from '../../sections/Header.svelte';
	import { initializeConnection, getUpgradeURL } from '../../stores/connection';
	import { recordBoostEvent } from '../../utils/analytics';

	// svelte-ignore unused-export-let - Ignored values supplied by svelte-navigator.
	export let navigate, location;
	export let userConnected: boolean;
	export let pricing: ( typeof Jetpack_Boost )[ 'pricing' ];
	export let isPremium: boolean;
	export let domain: string;

	let snackbarMessage: string;
	let selectedPlan: 'free' | 'premium' | false = false;
	$: if ( selectedPlan !== false ) {
		initialize( selectedPlan );
	}

	async function initialize( plan: 'free' | 'premium' ) {
		try {
			// Make sure there is a Jetpack connection
			await initializeConnection();

			// Record this selection. This must be done after the connection is initialized.
			// Possible Events:
			// * free_cta_from_getting_started_page_in_plugin
			// * premium_cta_from_getting_started_page_in_plugin
			recordBoostEvent( `${ plan }_cta_from_getting_started_page_in_plugin`, {} );

			// Go to the purchase flow if the user doesn't have a premium plan.
			if ( ! isPremium && plan === 'premium' ) {
				window.location.href = getUpgradeURL( domain, userConnected );
			}
			// Otherwise go to dashboard home.
			navigate( '/', { replace: true } );
		} catch ( e ) {
			// Display the error in a snackbar message
			snackbarMessage = e.message || 'Unknown error occurred during the plan selection.';
		} finally {
			selectedPlan = false;
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
					onPremiumCTA={() => ( selectedPlan = 'premium' )}
					onFreeCTA={() => ( selectedPlan = 'free' )}
					chosenFreePlan={selectedPlan === 'free'}
					chosenPaidPlan={selectedPlan === 'premium'}
				/>
				{#if snackbarMessage}
					<ReactComponent
						this={Snackbar}
						children={snackbarMessage}
						onDismiss={() => ( snackbarMessage = '' )}
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
