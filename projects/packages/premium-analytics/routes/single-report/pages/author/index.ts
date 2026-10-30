/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { authorHeaderSlots } from './author-header-slots';
import { useAuthorSummary } from './use-author-summary';
import type { SingleReportAdapter } from '../adapter';
import type { AuthorSummary } from './use-author-summary';

/**
 * The author page: the author's name, avatar and first content from `stats/author`, the
 * published post count from the posts endpoint, and All time anchored on the first content.
 */
export const authorAdapter: SingleReportAdapter< AuthorSummary > = {
	useSummary: useAuthorSummary,
	headerSlots: authorHeaderSlots,
	notFoundDescription: () => __( "We couldn't find this author.", 'jetpack-premium-analytics-pkg' ),
};

export { useAuthorSummary, authorHeaderSlots, type AuthorSummary };
