import { Button } from '@automattic/jetpack-components';
import { useProductCheckoutWorkflow } from '@automattic/jetpack-connection';
import { __ } from '@wordpress/i18n';
import { useCallback, type FC } from 'react';
import useProduct from '../../data/products/use-product';
import { getMyJetpackWindowInitialState } from '../../data/utils/get-my-jetpack-window-state';
import { useRedirectToReferrer } from '../../hooks/use-redirect-to-referrer';
import styles from './style.module.scss';

interface ProductInterstitialModalCtaProps {
	slug: string;
	buttonLabel?: string;
	disabled?: boolean;
	isExternalLink?: boolean;
	href?: string;
}

// Component to handle the CTA for the product upgrades
const ProductInterstitialModalCta: FC< ProductInterstitialModalCtaProps > = ( {
	slug,
	buttonLabel,
	disabled,
	isExternalLink,
	href,
} ) => {
	const quantity = null;

	const {
		siteSuffix = '',
		adminUrl = '',
		myJetpackCheckoutUri = '',
	} = getMyJetpackWindowInitialState();

	const { detail } = useProduct( slug );

	const { pricingForUi, postCheckoutUrl } = detail;

	const { wpcomProductSlug } = pricingForUi;

	// Redirect to the referrer URL when the `redirect_to_referrer` query param is present.
	const referrerURL = useRedirectToReferrer();

	/*
	 * Function to handle the redirect URL selection.
	 * - postCheckoutUrl is the URL provided by the product API and is the preferred URL
	 * - referrerURL is the referrer URL, in case the redirect_to_referrer flag was provided
	 * - myJetpackCheckoutUri is the default URL
	 */
	const getCheckoutRedirectUrl = useCallback( () => {
		if ( postCheckoutUrl ) {
			return postCheckoutUrl;
		}

		if ( referrerURL ) {
			return referrerURL;
		}

		return myJetpackCheckoutUri;
	}, [ postCheckoutUrl, referrerURL, myJetpackCheckoutUri ] );

	const checkoutRedirectUrl = getCheckoutRedirectUrl();

	const { run: mainCheckoutRedirect, hasCheckoutStarted: hasMainCheckoutStarted } =
		useProductCheckoutWorkflow( {
			productSlug: wpcomProductSlug,
			redirectUrl: checkoutRedirectUrl,
			siteSuffix,
			adminUrl,
			connectAfterCheckout: true,
			from: 'my-jetpack',
			quantity,
			useBlogIdSuffix: true,
		} );

	return (
		<Button
			variant="primary"
			className={ styles[ 'action-button' ] }
			isLoading={ hasMainCheckoutStarted }
			onClick={ mainCheckoutRedirect }
			isExternalLink={ isExternalLink }
			href={ href }
			disabled={ disabled }
		>
			{ buttonLabel || __( 'Upgrade', 'jetpack-my-jetpack' ) }
		</Button>
	);
};

export default ProductInterstitialModalCta;
