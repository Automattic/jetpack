/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { postHeaderActions } from './header-actions';
import { postHeaderSlots } from './post-header-slots';
import { usePostSections } from './use-post-sections';
import { usePostSummary } from './use-post-summary';
import type { SingleReportAdapter } from '../adapter';
import type { PostSummary } from './use-post-summary';

/**
 * The post page: the post's identity from the Stats `post` payload and core-data, the View
 * post action, and the email sections pinned to the send window.
 */
export const postAdapter: SingleReportAdapter< PostSummary > = {
	useSummary: usePostSummary,
	headerSlots: postHeaderSlots,
	headerActions: postHeaderActions,
	useSections: usePostSections,
	notFoundDescription: () => __( "We couldn't find this post.", 'jetpack-premium-analytics-pkg' ),
};

export { usePostSummary, postHeaderSlots, usePostSections, type PostSummary };
