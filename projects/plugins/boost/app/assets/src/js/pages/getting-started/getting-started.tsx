import { useEffect, useState } from 'react';
import { Snackbar } from '@wordpress/components';
import { getUpgradeURL, useConnection } from '$lib/stores/connection';
import { recordBoostEvent } from '$lib/utils/analytics';
import { BoostPricingTable } from '$features/boost-pricing-table/boost-pricing-table';
import ActivateLicense from '$features/activate-license/activate-license';
import Footer from '$layout/footer/footer';
import Header from '$layout/header/header';
import styles from './getting-started.module.scss';
import { useConfig } from '$lib/stores/config-ds';
import { useGettingStarted } from '$lib/stores/getting-started';
import { useNavigate } from 'react-router-dom';
import { __ } from '@wordpress/i18n';

const GettingStarted: React.FC = () => {
	const [ selectedPlan, setSelectedPlan ] = useState< 'free' | 'premium' | false >( false );
	const [ snackbarMessage, setSnackbarMessage ] = useState< string >( '' );
	const navigate = useNavigate();

	const {
		pricing,
		is_premium: isPremium,
		site: { domain },
	} = useConfig();

	const { shouldGetStarted, markGettingStartedComplete } = useGettingStarted();

	const {
		connection: { userConnected },
		initializeConnection,
	} = useConnection();

	useEffect( () => {
		if ( ! shouldGetStarted && selectedPlan ) {
			// Go to the purchase flow if the user doesn't have a premium plan.
			if ( ! isPremium && selectedPlan === 'premium' ) {
				window.location.href = getUpgradeURL( domain, userConnected );
			} else {
				navigate( '/', { replace: true } );
			}
		}
	}, [ domain, isPremium, navigate, selectedPlan, shouldGetStarted, userConnected ] );

	async function initialize( plan: 'free' | 'premium' ) {
		setSelectedPlan( plan );

		try {
			// Make sure there is a Jetpack connection
			await initializeConnection();

			// Record this selection. This must be done after the connection is initialized.
			// Possible Events:
			// * free_cta_from_getting_started_page_in_plugin
			// * premium_cta_from_getting_started_page_in_plugin
			await recordBoostEvent( `${ plan }_cta_from_getting_started_page_in_plugin`, {} );

			markGettingStartedComplete();
		} catch ( e ) {
			// Display the error in a snackbar message
			setSnackbarMessage(
				( e as Error ).message ||
					__( 'Unknown error occurred. Please reload the page and try again.', 'jetpack-boost' )
			);
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
							onPremiumCTA={ () => initialize( 'premium' ) }
							onFreeCTA={ () => initialize( 'free' ) }
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
