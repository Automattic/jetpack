import { __ } from '@wordpress/i18n';
import { PRODUCT_STATUSES } from '../../constants';
import useProduct from '../../data/products/use-product';
import { ProductCamelCase } from '../../data/types';

const parsePricingData = ( pricingForUi: ProductCamelCase[ 'pricingForUi' ] ) => {
	const { tiers } = pricingForUi;

	if ( pricingForUi.tiers ) {
		const { discountPrice, fullPrice, currencyCode, wpcomProductSlug } = tiers.upgraded;
		const hasDiscount = discountPrice && discountPrice !== fullPrice;
		return {
			wpcomProductSlug,
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
	if ( detail.status === PRODUCT_STATUSES.CAN_UPGRADE ) {
		return __( 'Upgrade', 'jetpack-my-jetpack' );
	}
	if ( ! [ PRODUCT_STATUSES.ACTIVE ].includes( detail.status ) ) {
		return __( 'Purchase', 'jetpack-my-jetpack' );
	}

	return null;
};

const getLearnMoreAction = ( detail: ProductCamelCase ) => {
	if ( detail.status !== PRODUCT_STATUSES.ACTIVE && detail.tiers.includes( 'free' ) ) {
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
