/**
 * WordPress dependencies
 */
import { calendar } from '@wordpress/icons';
import type { WidgetAttributeField } from '@wordpress/widget-primitives';

/**
 * No configurable attributes: the widget always shows the post the page is
 * scoped to (via `reportParams.post_id`). `Record< never, never >` so the
 * render-only type can compose host fields such as `reportParams`.
 */
export type PostAllTimeTrafficAttributes = Record< never, never >;

export default {
	icon: calendar,
	attributes: [] as WidgetAttributeField< PostAllTimeTrafficAttributes >[],
	example: {
		attributes: {},
	},
};
