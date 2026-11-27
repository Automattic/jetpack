/**
 * External dependencies
 */
import { defineReportTabs } from '@jetpack-premium-analytics/routing';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import type { TagsReportSection } from '@jetpack-premium-analytics/widgets-toolkit';

export type TagsReportTabId = TagsReportSection;

// Labelled as the widget's View toggle, whose View all opens the matching tab.
const tagsReportTabs = defineReportTabs< TagsReportTabId >(
	[
		{ id: 'all', getLabel: () => __( 'All', 'jetpack-premium-analytics-pkg' ) },
		{ id: 'tags', getLabel: () => __( 'Tags', 'jetpack-premium-analytics-pkg' ) },
		{ id: 'categories', getLabel: () => __( 'Categories', 'jetpack-premium-analytics-pkg' ) },
	],
	'all'
);

/**
 * Build the ordered, translated Tags report tabs.
 */
export const getReportTagsTabs = tagsReportTabs.getTabs;

/** Get the translated label for a tab, which also heads its section. */
export const getTabLabel = tagsReportTabs.getTabLabel;

/**
 * Resolve a raw section value to a Tags report tab.
 */
export const resolveSection = tagsReportTabs.resolve;
