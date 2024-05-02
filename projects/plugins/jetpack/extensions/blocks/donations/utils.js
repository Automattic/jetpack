/**
 * Return the default texts defined in `donations.php` and injected client side by assigning them
 * to the `Jetpack_DonationsBlock` attribute of the window object.
 *
 * @returns {object} Defaut texts for the block.
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
