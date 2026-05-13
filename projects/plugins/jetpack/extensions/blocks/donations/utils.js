/**
 * Returns the first interval shown in the form, in priority order: one-time, monthly, annual.
 *
 * @param {boolean} oneTimeShown - Whether the one-time interval is shown.
 * @param {boolean} monthlyShown - Whether the monthly interval is shown.
 * @param {boolean} annualShown  - Whether the annual interval is shown.
 * @return {?string} The first interval shown, or null if none are shown.
 */
export function firstShownInterval( oneTimeShown, monthlyShown, annualShown ) {
	if ( oneTimeShown ) return 'one-time';
	if ( monthlyShown ) return '1 month';
	if ( annualShown ) return '1 year';
	return null;
}

/**
 * Returns an error message if amount falls outside the configured min/max range, or null if valid.
 *
 * @param {number}      amount    - The donation amount to check.
 * @param {number|null} minAmount - Admin-configured minimum (null = no limit).
 * @param {number|null} maxAmount - Admin-configured maximum (null = no limit).
 * @param {string}      minError  - Pre-translated error string for below-minimum.
 * @param {string}      maxError  - Pre-translated error string for above-maximum.
 * @return {string|null} Error message, or null if amount is within range.
 */
export function checkAmountRange( amount, minAmount, maxAmount, minError, maxError ) {
	if ( minAmount !== null && amount < minAmount ) {
		return minError;
	}
	if ( maxAmount !== null && amount > maxAmount ) {
		return maxError;
	}
	return null;
}

/**
 * Return the default texts defined in `donations.php` and injected client side by assigning them
 * to the `Jetpack_DonationsBlock` attribute of the window object.
 *
 * @return {object} Defaut texts for the block.
 */
export function getDefaultTexts() {
	if ( 'undefined' === typeof window ) {
		return {};
	}

	const texts = window.Jetpack_DonationsBlock?.defaultTexts;

	if ( 'object' !== typeof texts ) {
		return {};
	}

	return texts;
}
