import { useState } from 'react';
import { Snackbar } from '@wordpress/components';
import { initializeConnection, getUpgradeURL } from '$lib/stores/connection';
import { recordBoostEvent } from '$lib/utils/analytics';
import { navigate } from '$lib/utils/navigate';
import { BoostPricingTable } from '$features/boost-pricing-table/boost-pricing-table';
import ActivateLicense from '$features/activate-license/activate-license';
import Footer from '$layout/footer/footer';
import Header from '$layout/header/header';
import styles from './getting-started.module.scss';

type GettingStartedProps = {
	userConnected: boolean;
	pricing: ( typeof Jetpack_Boost )[ 'pricing' ];
	isPremium: boolean;
	domain: string;
};

const GettingStarted: React.FC< GettingStartedProps > = ( {
	userConnected,
	pricing,
	isPremium,
	domain,
} ) => {
	const [ selectedPlan, setSelectedPlan ] = useState< 'free' | 'premium' | false >( false );
	const [ snackbarMessage, setSnackbarMessage ] = useState< string >( '' );

	async function initialize(
		plan: 'free' | 'premium',
		isPremiumValue: boolean,
		domainValue: string,
		userConnectedValue: boolean
	) {
		setSelectedPlan( plan );

		try {
			// Make sure there is a Jetpack connection
			await initializeConnection();

			// Record this selection. This must be done after the connection is initialized.
			// Possible Events:
			// * free_cta_from_getting_started_page_in_plugin
			// * premium_cta_from_getting_started_page_in_plugin
			await recordBoostEvent( `${ plan }_cta_from_getting_started_page_in_plugin`, {} );

			// Go to the purchase flow if the user doesn't have a premium plan.
			if ( ! isPremiumValue && plan === 'premium' ) {
				window.location.href = getUpgradeURL( domainValue, userConnectedValue );
			} else {
				// Otherwise go to dashboard home.
				// @todo - fix when react routing
				// navigate( '/', { replace: true } );
				navigate( '/' );
			}
		} catch ( e ) {
			// Display the error in a snackbar message
			setSnackbarMessage( e.message || 'Unknown error occurred during the plan selection.' );
		}
	}

	return (
		<div id="jb-dashboard" className="jb-dashboard jb-dashboard--main">
			<Header>
				<ActivateLicense />
			</Header>

			<div className="jb-section jb-section--alt">
				<div className="jb-container">
					<div className={ styles[ 'pricing-table' ] }>
						<BoostPricingTable
							pricing={ pricing }
							onPremiumCTA={ () => initialize( 'premium', isPremium, domain, userConnected ) }
							onFreeCTA={ () => initialize( 'free', isPremium, domain, userConnected ) }
							chosenFreePlan={ selectedPlan === 'free' }
							chosenPaidPlan={ selectedPlan === 'premium' }
						/>
						{ snackbarMessage !== '' && (
							<Snackbar children={ snackbarMessage } onDismiss={ () => setSnackbarMessage( '' ) } />
						) }
					</div>
				</div>
			</div>

			<Footer />
		</div>
	);
};

export default GettingStarted;
