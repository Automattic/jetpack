import { useState } from 'react';
import { Snackbar } from '@wordpress/components';
import { getUpgradeURL, initializeConnection } from '../../../stores/connection';
import { recordBoostEvent } from '../../../utils/analytics';
import { navigate } from '../../../utils/navigate';
import { BoostPricingTable } from '../../BoostPricingTable';
import ActivateLicense from '../../components/activate-license';
import styles from './styles.module.scss';

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

	if ( false !== selectedPlan ) {
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
			// @todo - fix when react routing
			// navigate( '/', { replace: true } );
			navigate( '/' );
		} catch ( e ) {
			// Display the error in a snackbar message
			setSnackbarMessage( e.message || 'Unknown error occurred during the plan selection.' );
		} finally {
			setSelectedPlan( false );
		}
	}

	return (
		<div id="jb-dashboard" className="jb-dashboard jb-dashboard--main">
			{ /* <Header> */ }
			<ActivateLicense />
			{ /* </Header> */ }

			<div className="jb-section jb-section--alt">
				<div className="jb-container">
					<div className={ styles[ 'pricing-table' ] }>
						<BoostPricingTable
							pricing={ pricing }
							onPremiumCTA={ () => setSelectedPlan( 'premium' ) }
							onFreeCTA={ () => setSelectedPlan( 'free' ) }
							chosenFreePlan={ selectedPlan === 'free' }
							chosenPaidPlan={ selectedPlan === 'premium' }
						/>
						{ snackbarMessage !== '' && (
							<Snackbar children={ snackbarMessage } onDismiss={ () => setSnackbarMessage( '' ) } />
						) }
					</div>
				</div>
			</div>

			{ /* <Footer /> */ }
		</div>
	);
};

export default GettingStarted;
