/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { postList } from '@wordpress/icons';
import type { WidgetAttributeField } from '@wordpress/widget-primitives';

/**
 * The Latest post widget has no configurable attributes: it always shows the
 * single most recently published post. `Record< never, never >` (not
 * `Record< string, never >`) so the render-only type can compose host fields
 * such as `reportParams` without collapsing them to `never`.
 */
export type LatestPostAttributes = Record< never, never >;

/**
 * Widget type definition.
 *
 * Ported from the Jetpack Stats "Latest post summary" module. Shows the site's
 * most recently published post with its all-time views, likes, and comments.
 * The metrics are lifetime totals, so there is no date range or comparison
 * period.
 */
export default {
	name: 'jpa/latest-post',
	title: __( 'Latest post', 'jetpack-premium-analytics' ),
	icon: postList,
	attributes: [] as WidgetAttributeField< LatestPostAttributes >[],
	example: {
		attributes: {},
	},
};
