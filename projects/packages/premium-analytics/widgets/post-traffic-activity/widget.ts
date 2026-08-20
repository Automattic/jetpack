/**
 * WordPress dependencies
 */
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
 * The post detail Traffic view's activity card, replacing the legacy Calypso
 * post detail months table (`post-detail-table-section`) per the new design:
 * the scoped post's daily views over the dashboard date range as a calendar
 * heatmap — week columns, weekday rows, view counts in the cells. Days without
 * traffic stay blank cells, per the design, while the grid stays complete.
 */
export default {
	icon: calendar,
	attributes: [] as WidgetAttributeField< PostTrafficActivityAttributes >[],
	example: {
		attributes: {},
	},
};
