/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { calendar } from '@wordpress/icons';
import type { WidgetAttributeField } from '@wordpress/widget-primitives';

/**
 * The Traffic activity widget has no configurable attributes: it always shows
 * the daily view heatmap of the post the page is scoped to (via
 * `reportParams.post_id`). `Record< never, never >` (not
 * `Record< string, never >`) so the render-only type can compose host fields
 * such as `reportParams` without collapsing them to `never`.
 */
export type PostTrafficActivityAttributes = Record< never, never >;

/**
 * Widget type definition.
 *
 * The post detail Traffic view's activity card, replacing the legacy Calypso
 * post detail months table (`post-detail-table-section`) per the new design:
 * the scoped post's daily views over the dashboard date range as a calendar
 * heatmap — week columns, weekday rows, view counts in the cells. Days the
 * endpoint omits are zero-filled so the grid stays complete.
 */
export default {
	name: 'jpa/post-traffic-activity',
	title: __( 'Traffic activity', 'jetpack-premium-analytics' ),
	help: {
		content: __(
			'Daily views for the post or page being viewed, as a calendar heatmap.',
			'jetpack-premium-analytics'
		),
	},
	icon: calendar,
	attributes: [] as WidgetAttributeField< PostTrafficActivityAttributes >[],
	example: {
		attributes: {},
	},
};
