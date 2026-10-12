/**
 * The WordPress.com plans page for the site, returning here after a purchase.
 *
 * @param domain   - The site's domain.
 * @param args     - Extra query args, e.g. the feature being upsold.
 * @param interval - Open on the yearly plans rather than the default.
 * @return The URL.
 */
export function getPlansUrl(
	domain: string,
	args: Record< string, string > = {},
	interval?: 'yearly'
): string {
	const path = interval ? `plans/${ interval }` : 'plans';
	const query = new URLSearchParams( { ...args, redirect_to: window.location.href } );

	return `https://wordpress.com/${ path }/${ encodeURIComponent( domain ) }?${ query }`;
}
