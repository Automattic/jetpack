import useProduct from '../../data/products/use-product';

const usePricingData = ( slug: string ) => {
	const { detail } = useProduct( slug );

	if ( detail.tiers.length === 0 ) {
		const {
			pricingForUi: { discountPricePerMonth, fullPricePerMonth, currencyCode },
		} = detail;
		return { discountPrice: discountPricePerMonth, fullPrice: fullPricePerMonth, currencyCode };
	}

	if ( detail.tiers.includes( 'upgraded' ) ) {
		const { discountPrice, fullPrice, currencyCode } = detail.pricingForUi.tiers.upgraded;
		const hasDiscount = discountPrice && discountPrice !== fullPrice;
		return {
			discountPrice: hasDiscount ? discountPrice / 12 : null,
			fullPrice: fullPrice / 12,
			currencyCode,
		};
	}

	return { discountPrice: 0, fullPrice: 0, currencyCode: '' };
};

export default usePricingData;
