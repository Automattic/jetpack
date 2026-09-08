/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { page } from '@wordpress/icons';
import type { WidgetAttributeField } from '@wordpress/widget-primitives';

/**
 * Internal dependencies
 */
import { SelectField } from '@jetpack-premium-analytics/fields';

/**
 * Mirrors the widget definition's `attributes` below. The date range is
 * owned by the dashboard picker, not by these attributes.
 */
export type TopPostsAttributes = {
	/**
	 * Which report the widget shows: published posts and pages (including the
	 * homepage entry, via `skip_archives=1`), or archive pages (taxonomy,
	 * post-type, search, and date archives).
	 */
	contentView?: 'posts' | 'archives';
};

/**
 * Ported from the Jetpack Stats "Most viewed" card. The active view is the
 * `contentView` attribute (`relevance: 'high'`), so the widget host renders
 * its control in the frame header.
 */
export default {
	icon: page,
	attributes: [
		{
			id: 'contentView',
			label: __( 'View', 'jetpack-premium-analytics-pkg' ),
			type: 'text',
			Edit: SelectField,
			elements: [
				{ label: __( 'Posts & pages', 'jetpack-premium-analytics-pkg' ), value: 'posts' },
				{ label: __( 'Archives', 'jetpack-premium-analytics-pkg' ), value: 'archives' },
			],
			relevance: 'high',
		},
	] as WidgetAttributeField< TopPostsAttributes >[],
	example: {
		attributes: {
			contentView: 'posts',
		},
	},
};
