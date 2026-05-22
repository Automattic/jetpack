import { getAdminUrl } from '@automattic/jetpack-script-data';

/**
 * Odyssey Stats URL for a single email/post opens detail view.
 *
 * @param postId - Post ID for the sent email.
 * @return Admin URL with stats hash route.
 */
export function getEmailStatsDetailUrl( postId: number ): string {
	const statsPage = getAdminUrl( 'admin.php?page=stats' ) ?? 'admin.php?page=stats';
	return `${ statsPage }#!/stats/email/opens/day/${ postId }`;
}
