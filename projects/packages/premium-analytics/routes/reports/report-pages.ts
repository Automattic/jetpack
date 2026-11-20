/**
 * External dependencies
 */
/**
 * Internal dependencies
 */
import AnnualInsightsPage from './annual-insights/page';
import AuthorsPage from './authors/page';
import ClicksPage from './clicks/page';
import CommentFollowersPage from './comment-followers/page';
import CommentsPage from './comments/page';
import DownloadsPage from './downloads/page';
import EarningsPage from './earnings/page';
import EmailsPage from './emails/page';
import LocationsPage from './locations/page';
import PostsPage from './posts/page';
import ReferrersPage from './referrers/page';
import SearchTermsPage from './search-terms/page';
import TagsPage from './tags/page';
import UtmPage from './utm/page';
import VideosPage from './videos/page';
import type { ComponentType } from 'react';

/**
 * Report page components keyed by report id.
 *
 * Keep this separate from `registry.ts`: route guards import that metadata,
 * while this component registry belongs only in the route's content bundle.
 */
export const REPORT_PAGES: Record< string, ComponentType > = {
	'annual-insights': AnnualInsightsPage,
	authors: AuthorsPage,
	'comment-followers': CommentFollowersPage,
	clicks: ClicksPage,
	comments: CommentsPage,
	downloads: DownloadsPage,
	earnings: EarningsPage,
	emails: EmailsPage,
	locations: LocationsPage,
	posts: PostsPage,
	'search-terms': SearchTermsPage,
	tags: TagsPage,
	videos: VideosPage,
	utm: UtmPage,
	referrers: ReferrersPage,
};

/**
 * Look up the component for a registered report.
 *
 * @param id - A report id from the metadata registry.
 * @return The report page, or `undefined` for an id with no page.
 */
export function getReportPage( id: string ): ComponentType | undefined {
	return Object.hasOwn( REPORT_PAGES, id ) ? REPORT_PAGES[ id ] : undefined;
}
