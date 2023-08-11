/**
 * Return the highest discount amongst all suggested products.
 *
 * @param {object} discountData - Informations about the discount
 * @param {object[]} introOffers - Set of product offering information
 * @param {object[]} suggestions - Suggested products
 * @returns {number|undefined} Max discount
 */
export const computeMaxSuggestedDiscount = ( discountData, introOffers, suggestions ) => {
	if ( ! discountData || ! introOffers || ! suggestions ) {
		return undefined;
	}

	const discount = parseInt( discountData?.discount, 10 );

	if ( Number.isNaN( discount ) ) {
		return undefined;
	}

	const slugs = suggestions.map( ( { slug } ) => slug );
	const offers = introOffers.filter( ( { product_slug: slug } ) => slugs.includes( slug ) );
	const discounts = offers
		.map( ( { original_price: originalPrice, raw_price: introPrice } ) => {
			if ( ! originalPrice ) {
				return undefined;
			}

			const finalPrice = introPrice * ( 1 - discount / 100 );
			const totalDiscount = ( originalPrice - finalPrice ) / originalPrice;

			return Math.round( totalDiscount * 100 );
		} )
		.filter( Boolean );

	if ( ! discounts.length ) {
		return undefined;
	}

	return Math.max( ...discounts );
};
