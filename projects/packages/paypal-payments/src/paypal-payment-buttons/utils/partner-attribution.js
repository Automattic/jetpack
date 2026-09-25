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

import { sanitizePayPalUrl } from './validation';

/**
 * Append the partner attribution code to a PayPal payment URL.
 *
 * Replaces an existing `at_code` rather than appending a second one, so this
 * is safe to apply to a link that already carries attribution.
 *
 * `paymentLink` comes straight from post content, and the editor's link, copy and QR all
 * come through here, so the host is checked before the code goes on.
 *
 * Mirrored server-side by `PayPal_Payment_Buttons::add_partner_attribution()`, which
 * differs there: it returns a URL it refuses unchanged, for the caller's own escaping to
 * deal with, where this returns '' rather than show a merchant a link to copy or scan.
 *
 * @param {string} url                  - A PayPal payment URL.
 * @param {string} partnerAttributionId - The partner attribution (BN) code.
 * @return {string} The sanitized PayPal URL — with the code, when a code was given — or '' when it is from anywhere else.
 */
export function withPartnerAttribution( url, partnerAttributionId ) {
	const paypalUrl = sanitizePayPalUrl( url );

	if ( ! paypalUrl || ! partnerAttributionId ) {
		return paypalUrl;
	}

	const parsed = new URL( paypalUrl );
	parsed.searchParams.set( 'at_code', partnerAttributionId );

	return parsed.toString();
}
