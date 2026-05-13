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
