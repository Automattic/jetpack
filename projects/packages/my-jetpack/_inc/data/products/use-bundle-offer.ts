import useProduct from './use-product';

/**
 * Pick the bundle to offer beside a product whose configured bundle may have been retired.
 *
 * @param legacyBundle - The bundle the product page was designed around.
 * @return The offered bundle slug, whether it replaces the legacy one, and whether that is still unknown.
 */
const useBundleOffer = ( legacyBundle?: string ) => {
	const { detail: proDetail, isLoading } = useProduct( 'pro' );
	const { detail: legacyDetail } = useProduct( legacyBundle );
	const proIsOnSale = proDetail?.pricingForUi?.catalogAvailable === true;
	const legacyIsRetired = legacyDetail?.pricingForUi?.available === false;
	const preferredBundle =
		proDetail?.pricingForUi?.available === true && ! proDetail?.hasPaidPlanForProduct
			? 'pro'
			: 'complete';
	const fallbackBundle =
		legacyIsRetired && ! legacyDetail?.hasPaidPlanForProduct
			? legacyDetail?.purchaseReplacement?.slug
			: legacyBundle;

	return {
		bundleSlug: legacyBundle && proIsOnSale ? preferredBundle : fallbackBundle,
		isNewBundleOffer: proIsOnSale || legacyIsRetired,
		// Pricing only arrives with the products request, so the page-load data would pick the legacy bundle.
		isResolving: Boolean( legacyBundle ) && isLoading,
	};
};

export default useBundleOffer;
