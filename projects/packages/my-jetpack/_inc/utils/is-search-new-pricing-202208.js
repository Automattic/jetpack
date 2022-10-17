/**
 * Check whether the search new pricing is launched.
 *
 * @returns {boolean} true if the search new pricing is launched.
 */
export default function () {
	return (
		URLSearchParams && !! new URLSearchParams( window.location?.search ).get( 'new_pricing_202208' )
	);
}
