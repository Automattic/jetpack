/**
 * Build a Forms dashboard URL for editor return navigation.
 *
 * @param sourceId - Optional form ID for single-form responses route.
 * @return Dashboard URL for Forms or single-form responses.
 */
export const getFormsReturnUrl = ( sourceId?: string | null ): string => {
	const { origin, pathname } = window.location;
	const wpAdminIndex = pathname.indexOf( '/wp-admin/' );
	const adminBase =
		wpAdminIndex >= 0 ? pathname.slice( 0, wpAdminIndex + '/wp-admin/'.length ) : '/wp-admin/';
	const dashboardBase = `${ origin }${ adminBase }admin.php?page=jetpack-forms-responses-wp-admin`;

	if ( ! sourceId ) {
		const returnPath = '/forms';
		return `${ dashboardBase }&p=${ encodeURIComponent( returnPath ) }`;
	}

	const returnPath = `/responses/inbox?sourceId=${ encodeURIComponent( sourceId ) }`;
	return `${ dashboardBase }&p=${ encodeURIComponent( returnPath ) }`;
};
