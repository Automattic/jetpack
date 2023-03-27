/**
 * Check if a purchase is considered "Lifetime".
 *
 * @param {object} purchase - A WPCOM purchase object.
 * @returns {boolean} Returns true if a purchase is considered a lifetime purchase.
 */
export function isLifetimePurchase( purchase ) {
	if ( typeof purchase !== 'object' || ! purchase.hasOwnProperty( 'partner_slug' ) ) {
		return false;
	}

	// Any purchase with the partner_slug of 'goldenticket' is considered a golden token.
	return purchase.partner_slug === 'goldenticket';
}

/**
 * Look for a lifetime purchase in an array of purchases.
 *
 * @param {Array} purchases - An array of WPCOM purchase objects.
 * @returns {boolean} Returns true if one of the purchase is considered a lifetime purchase.
 */
export function includesLifetimePurchase( purchases ) {
	if ( ! Array.isArray( purchases ) ) {
		return false;
	}

	return purchases.filter( purchase => isLifetimePurchase( purchase ) ).length > 0;
}
