/**
 * WordPress dependencies
 */
import { trendingUp } from '@wordpress/icons';
import type { WidgetAttributeField } from '@wordpress/widget-primitives';

/**
 * Widget attributes shape.
 *
 * @property authorScoped - Rank one author's posts over the page range instead
 *                        of the site's over the last 12 months. Set by the
 *                        author detail composition; not a user-facing control.
 */
export type PopularPostAttributes = {
	authorScoped?: boolean;
};

/**
 * The Insights "Most popular post" module: the site's most-viewed post of the
 * last 12 months. The window only picks the winner — the views, likes, and
 * comments shown for it are all-time totals.
 */
export default {
	icon: trendingUp,
	attributes: [] as WidgetAttributeField< PopularPostAttributes >[],
	example: {
		attributes: {},
	},
};
