/**
 * External dependencies
 */
import { defineReportTabs } from '@jetpack-premium-analytics/routing';
import { __ } from '@wordpress/i18n';

export type CommentsReportTabId = 'authors' | 'posts';

const DEFAULT_TAB_ID: CommentsReportTabId = 'authors';

const commentsReportTabs = defineReportTabs< CommentsReportTabId >(
	[
		{ id: 'authors', getLabel: () => __( 'Authors', 'jetpack-premium-analytics-pkg' ) },
		{ id: 'posts', getLabel: () => __( 'Posts & Pages', 'jetpack-premium-analytics-pkg' ) },
	],
	DEFAULT_TAB_ID
);

export const getCommentsReportTabs = commentsReportTabs.getTabs;
export const resolveTabId = commentsReportTabs.resolve;
