import { useEffect, useState } from 'react';
import { Snackbar } from '@wordpress/components';
import { getUpgradeURL, useConnection } from '$lib/stores/connection';
import { recordBoostEvent } from '$lib/utils/analytics';
import { BoostPricingTable } from '$features/boost-pricing-table/boost-pricing-table';
import ActivateLicense from '$features/activate-license/activate-license';
import Footer from '$layout/footer/footer';
import Header from '$layout/header/header';
import styles from './getting-started.module.scss';
import { useGettingStarted } from '$lib/stores/getting-started';
import { useNavigate } from 'react-router-dom';
import { __ } from '@wordpress/i18n';
import { usePricing } from '$lib/stores/pricing';
import { usePremiumFeatures } from '$lib/stores/premium-features';
import { useSingleModuleState } from '$features/module/lib/stores';

const GettingStarted: React.FC = () => {
	const [ selectedPlan, setSelectedPlan ] = useState< 'free' | 'premium' | false >( false );
	const [ snackbarMessage, setSnackbarMessage ] = useState< string >( '' );
	const navigate = useNavigate();

	const {
		site: { domain },
	} = Jetpack_Boost;

	const pricing = usePricing();
	const premiumFeatures = usePremiumFeatures();
	const isPremium = premiumFeatures.length > 0;

	const { shouldGetStarted, markGettingStartedComplete } = useGettingStarted();
	const [ , setCriticalCssState ] = useSingleModuleState( 'critical_css' );

	const { connection, initializeConnection } = useConnection();
	const { userConnected, wpcomBlogId } = connection || {};
	useEffect( () => {
		if ( ! shouldGetStarted && selectedPlan ) {
			// Go to the purchase flow if the user doesn't have a premium plan.
			if ( ! isPremium && selectedPlan === 'premium' ) {
				window.location.href = getUpgradeURL(
					domain,
					userConnected,
					wpcomBlogId ? wpcomBlogId.toString() : null
				);
			} else {
				if ( ! isPremium ) {
					setCriticalCssState( true );
				}
				navigate( '/', { replace: true } );
			}
		}
	}, [
		domain,
		isPremium,
		navigate,
		selectedPlan,
		setCriticalCssState,
		shouldGetStarted,
		userConnected,
		wpcomBlogId,
	] );

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

			await markGettingStartedComplete();
		} catch ( e ) {
			// Display the error in a snackbar message
			setSnackbarMessage(
				( e as Error ).message ||
					__( 'Unknown error occurred. Please reload the page and try again.', 'jetpack-boost' )
			);
		}
	}

	return (
		pricing && (
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
								<Snackbar
									children={ snackbarMessage }
									onDismiss={ () => setSnackbarMessage( '' ) }
								/>
							) }
						</div>
					</div>
				</div>

				<Footer />
			</div>
		)
	);
};

export default GettingStarted;
