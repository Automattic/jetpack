/**
 * PayPal Payment Buttons — When a payment link was created.
 *
 * @package
 */

/**
 * The day a payment link was created, in the browser's locale.
 *
 * @param {object} resource - A payment resource from the REST routes.
 * @return {string} The date, or an empty string when the link has none.
 */
export function linkDate( resource ) {
	const time = resource?.create_time ? new Date( resource.create_time ) : null;
	if ( ! time || Number.isNaN( time.getTime() ) ) {
		return '';
	}
	return time.toLocaleDateString( undefined, { year: 'numeric', month: 'short', day: 'numeric' } );
}
