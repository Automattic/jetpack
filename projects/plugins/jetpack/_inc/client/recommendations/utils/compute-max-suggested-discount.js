/**
 * Return the highest discount amongst all suggested products.
 *
 * @param {Object} discountData - Informations about the discount
 * @param {Object[]} introOffers - Set of product offering information
 * @param {Object[]} suggestions - Suggested products
 * @returns {number} Max discount
 */
export const computeMaxSuggestedDiscount = ( discountData, introOffers, suggestions ) => {
	if ( ! discountData || ! introOffers || ! suggestions ) {
		return;
	}

	const discount = parseInt( discountData?.discount, 10 );

	if ( Number.isNaN( discount ) ) {
		return;
	}

	const slugs = suggestions.map( ( { slug } ) => slug );
	const offers = introOffers.filter( ( { product_slug: slug } ) => slugs.includes( slug ) );
	const discounts = offers
		.map( ( { original_price: originalPrice, raw_price: introPrice } ) => {
			if ( ! originalPrice ) {
				return;
			}

			const finalPrice = introPrice * ( 1 - discount / 100 );
			const totalDiscount = ( originalPrice - finalPrice ) / originalPrice;

			return Math.round( totalDiscount * 100 );
		} )
		.filter( Boolean );

	if ( ! discounts.length ) {
		return;
	}

	return Math.max( ...discounts );
};
