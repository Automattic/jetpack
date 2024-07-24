import { __ } from '@wordpress/i18n';
import { PRODUCT_STATUSES } from '../../constants';
import useProduct from '../../data/products/use-product';
import { ProductCamelCase } from '../../data/types';

const parsePricingData = ( pricingForUi: ProductCamelCase[ 'pricingForUi' ] ) => {
	const { tiers } = pricingForUi;

	if ( pricingForUi.tiers ) {
		const { discountPrice, fullPrice, currencyCode, wpcomProductSlug, quantity } = tiers.upgraded;
		const hasDiscount = discountPrice && discountPrice !== fullPrice;
		return {
			wpcomProductSlug: ! quantity ? wpcomProductSlug : `${ wpcomProductSlug }:-q-${ quantity }`,
			discountPrice: hasDiscount ? discountPrice / 12 : null,
			fullPrice: fullPrice / 12,
			currencyCode,
		};
	}

	const {
		discountPricePerMonth,
		fullPricePerMonth,
		currencyCode,
		isIntroductoryOffer,
		wpcomProductSlug,
	} = pricingForUi;
	return {
		wpcomProductSlug,
		discountPrice: isIntroductoryOffer ? discountPricePerMonth : null,
		fullPrice: fullPricePerMonth,
		currencyCode,
	};
};

const getPurchaseAction = ( detail: ProductCamelCase ) => {
	const isUpgradable =
		detail.status === PRODUCT_STATUSES.ACTIVE &&
		( detail.isUpgradableByBundle.length || detail.isUpgradable );
	const upgradeHasPrice =
		detail.pricingForUi.fullPrice || detail.pricingForUi.tiers?.upgraded?.fullPrice;

	if ( detail.status === PRODUCT_STATUSES.CAN_UPGRADE || isUpgradable ) {
		if ( upgradeHasPrice ) {
			return __( 'Upgrade', 'jetpack-my-jetpack' );
		}
		return null;
	}

	return __( 'Purchase', 'jetpack-my-jetpack' );
};

const getLearnMoreAction = ( detail: ProductCamelCase ) => {
	const isNotActiveOrNeedsExplicitFreePlan =
		! detail.isPluginActive || detail.status === PRODUCT_STATUSES.NEEDS_PURCHASE_OR_FREE;
	const hasFreeTierOrFreeOffering = detail.tiers.includes( 'free' ) || detail.hasFreeOffering;

	if ( isNotActiveOrNeedsExplicitFreePlan && hasFreeTierOrFreeOffering ) {
		return __( 'Start for free', 'jetpack-my-jetpack' );
	}

	return __( 'Learn more', 'jetpack-my-jetpack' );
};

const usePricingData = ( slug: string ) => {
	const { detail } = useProduct( slug );
	return {
		learnMoreAction: getLearnMoreAction( detail ),
		purchaseAction: getPurchaseAction( detail ),
		...parsePricingData( detail.pricingForUi ),
	};
};

export default usePricingData;
