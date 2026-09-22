/**
 * PayPal partner attribution (BN code) helper.
 *
 * Every route a merchant can use to hand a payment link to a buyer has to
 * carry the same `at_code`, or the resulting sales aren't attributed to us.
 * The server renders and emails links with it already appended; this covers
 * the links the editor copies to the clipboard.
 *
 * @package
 */

/**
 * Append the partner attribution code to a PayPal payment URL.
 *
 * Replaces an existing `at_code` rather than appending a second one, so this
 * is safe to apply to a link that already carries attribution.
 *
 * @param {string} url                  - A PayPal payment URL.
 * @param {string} partnerAttributionId - The partner attribution (BN) code.
 * @return {string} The URL with the attribution code, or the input unchanged when either argument is missing or the URL can't be parsed.
 */
export function withPartnerAttribution( url, partnerAttributionId ) {
	if ( ! url || ! partnerAttributionId ) {
		return url;
	}

	try {
		const parsed = new URL( url );
		parsed.searchParams.set( 'at_code', partnerAttributionId );
		return parsed.toString();
	} catch {
		// Not a URL we can parse — hand it back untouched rather than
		// corrupting whatever the merchant has stored.
		return url;
	}
}
