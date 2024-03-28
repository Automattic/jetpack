import type { Purchase } from '../data/types';

/**
 * Check if a purchase is considered "Lifetime".
 *
 * @param {Purchase} purchase - A WPCOM purchase object.
 * @param {string} purchase.partner_slug - A partner that issued the purchase.
 * @returns {boolean} Returns true if a purchase is considered a lifetime purchase.
 */
export const isLifetimePurchase = ( { partner_slug }: Purchase ) => {
	if ( ! partner_slug ) {
		return false;
	}

	// Any purchase with the partner_slug of 'goldenticket' is considered a golden token.
	return partner_slug === 'goldenticket';
};

/**
 * Look for a lifetime purchase in an array of purchases.
 *
 * @param {Array} purchases - An array of WPCOM purchase objects.
 * @returns {boolean} Returns true if one of the purchase is considered a lifetime purchase.
 */
export function includesLifetimePurchase( purchases: Array< Purchase > ) {
	if ( ! Array.isArray( purchases ) ) {
		return false;
	}

	return purchases.filter( purchase => isLifetimePurchase( purchase ) ).length > 0;
}
