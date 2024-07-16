import { Button, getProductCheckoutUrl } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
import { useMemo } from 'react';
import useProduct from '../../data/products/use-product';
import { getMyJetpackWindowInitialState } from '../../data/utils/get-my-jetpack-window-state';
import useMyJetpackConnection from '../../hooks/use-my-jetpack-connection';
import styles from './style.module.scss';

const useUpsellLinks = ( slug: string ) => {
	const { detail } = useProduct( slug );
	const { isUserConnected } = useMyJetpackConnection();

	return useMemo( () => {
		const { adminUrl, siteSuffix } = getMyJetpackWindowInitialState();
		const purchaseUrl = getProductCheckoutUrl(
			detail.wpcomProductSlug,
			siteSuffix,
			`${ adminUrl }?page=my-jetpack`,
			isUserConnected
		);
		const learnMoreUrl = `#/add-${ slug }`;

		return { purchaseUrl, learnMoreUrl };
	}, [ slug, detail.wpcomProductSlug, isUserConnected ] );
};

const RecommendationActions = ( { slug }: { slug: string } ) => {
	const { purchaseUrl, learnMoreUrl } = useUpsellLinks( slug );

	return (
		<div className={ styles.actions }>
			<div className={ clsx( styles.buttons, styles.upsell ) }>
				<Button size="small" href={ purchaseUrl }>
					{ __( 'Purchase', 'jetpack-my-jetpack' ) }
				</Button>
				<Button
					className={ styles.recommendationLink }
					size="small"
					variant="link"
					href={ learnMoreUrl }
				>
					{ __( 'Learn more', 'jetpack-my-jetpack' ) }
				</Button>
			</div>
		</div>
	);
};

export default RecommendationActions;
