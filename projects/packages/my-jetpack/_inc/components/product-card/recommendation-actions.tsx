import { Button } from '@automattic/jetpack-components';
import { useProductCheckoutWorkflow } from '@automattic/jetpack-connection';
import clsx from 'clsx';
import { useCallback } from 'react';
import { getMyJetpackWindowInitialState } from '../../data/utils/get-my-jetpack-window-state';
import useMyJetpackConnection from '../../hooks/use-my-jetpack-connection';
import styles from './style.module.scss';
import usePricingData from './use-pricing-data';

const RecommendationActions = ( { slug }: { slug: string } ) => {
	const { isUserConnected } = useMyJetpackConnection();
	const { wpcomProductSlug, learnMoreAction, purchaseAction } = usePricingData( slug );

	const { myJetpackUrl, siteSuffix } = getMyJetpackWindowInitialState();
	const { run: runCheckout } = useProductCheckoutWorkflow( {
		from: 'my-jetpack',
		productSlug: wpcomProductSlug,
		redirectUrl: myJetpackUrl,
		connectAfterCheckout: ! isUserConnected,
		siteSuffix,
	} );

	const handleCheckout = useCallback( () => {
		if ( slug === 'crm' ) {
			window.open( 'https://jetpackcrm.com/pricing/', '_blank' );
			return;
		}
		runCheckout();
	}, [ runCheckout, slug ] );

	return (
		<div className={ styles.actions }>
			<div className={ clsx( styles.buttons, styles.upsell ) }>
				{ purchaseAction && (
					<Button size="small" onClick={ handleCheckout }>
						{ purchaseAction }
					</Button>
				) }
				<Button size="small" variant="secondary" href={ `#/add-${ slug }` }>
					{ learnMoreAction }
				</Button>
			</div>
		</div>
	);
};

export default RecommendationActions;
