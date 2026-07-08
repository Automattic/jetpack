import { useProductCheckoutWorkflow } from '@automattic/jetpack-connection';
import { __ } from '@wordpress/i18n';
import { Button } from '@wordpress/ui';
import { useCallback, type FC } from 'react';
import useProduct from '../../data/products/use-product';
import { getMyJetpackWindowInitialState } from '../../data/utils/get-my-jetpack-window-state';
import { useRedirectToReferrer } from '../../hooks/use-redirect-to-referrer';

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

	const { detail, isLoading: isProductLoading } = useProduct( slug );

	const { pricingForUi, postCheckoutUrl } = detail;

	const { wpcomProductSlug, tiers } = pricingForUi || {};
	// Boost pricing information is stored in the `tiers` object
	const productSlug = slug !== 'boost' ? wpcomProductSlug : tiers?.upgraded?.wpcomProductSlug;

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
			productSlug,
			redirectUrl: checkoutRedirectUrl,
			siteSuffix,
			adminUrl,
			connectAfterCheckout: true,
			from: 'my-jetpack',
			quantity,
			useBlogIdSuffix: true,
		} );

	const isDisabled = disabled || isProductLoading;
	const isLoading = isProductLoading || hasMainCheckoutStarted;
	const label = buttonLabel || __( 'Upgrade', 'jetpack-my-jetpack' );

	if ( href ) {
		return (
			<Button
				variant="solid"
				loading={ isLoading }
				onClick={ mainCheckoutRedirect }
				disabled={ isDisabled }
				nativeButton={ false }
				render={
					<a
						href={ href }
						{ ...( isExternalLink && {
							target: '_blank',
							rel: 'noopener noreferrer',
						} ) }
					/>
				}
			>
				{ label }
			</Button>
		);
	}

	return (
		<Button
			variant="solid"
			loading={ isLoading }
			onClick={ mainCheckoutRedirect }
			disabled={ isDisabled }
		>
			{ label }
		</Button>
	);
};

export default ProductInterstitialModalCta;
