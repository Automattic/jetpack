/**
 * WordPress dependencies
 */
import { post } from '@wordpress/icons';
import type { WidgetAttributeField } from '@wordpress/widget-primitives';

/**
 * Widget attributes shape.
 *
 * @property authorScoped - Pick one author's latest post instead of the site's.
 *                        Set by the author detail composition; not a user-facing control.
 */
export type LatestPostAttributes = {
	authorScoped?: boolean;
};

/**
 * Widget type definition.
 *
 * Ported from the Jetpack Stats "Latest post summary" module. Shows the site's
 * most recently published post with its all-time views, likes, and comments.
 * The metrics are lifetime totals, so there is no date range or comparison
 * period.
 */
export default {
	icon: post,
	attributes: [] as WidgetAttributeField< LatestPostAttributes >[],
	example: {
		attributes: {},
	},
};
