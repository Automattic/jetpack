/**
 * Check if coupon is valid.
 *
 * @param {object} data - Coupon information.
 * @returns {boolean} Whether coupon is valid.
 */
export const isCouponValid = data => {
	if ( 'object' !== typeof data ) {
		return false;
	}

	const { discount, is_used: isUsed, expiry_date: expiryDate } = data;

	return !! discount && ! isUsed && new Date( expiryDate ).valueOf() - Date.now() > 0;
};
