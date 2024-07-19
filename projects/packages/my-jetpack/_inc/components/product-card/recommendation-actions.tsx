import { Button, getProductCheckoutUrl } from '@automattic/jetpack-components';
import clsx from 'clsx';
import { useMemo } from 'react';
import { getMyJetpackWindowInitialState } from '../../data/utils/get-my-jetpack-window-state';
import useMyJetpackConnection from '../../hooks/use-my-jetpack-connection';
import styles from './style.module.scss';
import usePricingData from './use-pricing-data';

const useUpsellLinks = ( slug: string, wpcomProductSlug: string ) => {
	const { isUserConnected } = useMyJetpackConnection();

	return useMemo( () => {
		const { adminUrl, siteSuffix } = getMyJetpackWindowInitialState();
		const purchaseUrl = getProductCheckoutUrl(
			wpcomProductSlug,
			siteSuffix,
			`${ adminUrl }?page=my-jetpack`,
			isUserConnected
		);
		const interstitialUrl = `#/add-${ slug }`;

		return { purchaseUrl, interstitialUrl };
	}, [ slug, wpcomProductSlug, isUserConnected ] );
};

const RecommendationActions = ( { slug }: { slug: string } ) => {
	const { wpcomProductSlug, learnMoreAction, purchaseAction } = usePricingData( slug );

	const { purchaseUrl, interstitialUrl } = useUpsellLinks( slug, wpcomProductSlug );
	return (
		<div className={ styles.actions }>
			<div className={ clsx( styles.buttons, styles.upsell ) }>
				{ purchaseAction && (
					<Button size="small" href={ purchaseUrl }>
						{ purchaseAction }
					</Button>
				) }
				<Button
					className={ styles.recommendationLink }
					size="small"
					variant="link"
					href={ interstitialUrl }
				>
					{ learnMoreAction }
				</Button>
			</div>
		</div>
	);
};

export default RecommendationActions;
