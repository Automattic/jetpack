/**
 * Remove shown admin notices.
 *
 * @param {string} moduleSlug Module Slug
 */
export function removeShownAdminNotices( moduleSlug: string ): void {
	// eslint-disable-next-line camelcase
	for ( const adminNoticeId of Jetpack_Boost.shownAdminNoticeIds ) {
		if ( adminNoticeId.includes( moduleSlug ) ) {
			const notice = document.getElementById( adminNoticeId );
			if ( notice ) {
				notice.remove();
			}
		}
	}
}
