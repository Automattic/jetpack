/**
 * WordPress dependencies
 */
import { video } from '@wordpress/icons';
import type { WidgetAttributeField } from '@wordpress/widget-primitives';

/**
 * The VideoPress widget has no configurable attributes: it requests
 * the shared `WIDGET_ROW_LIMIT` rows and renders as many of them as its tile
 * fits.
 *
 * `Record< never, never >` (not `Record< string, never >`) so the render-only
 * type can compose host fields such as `reportParams` without collapsing them
 * to `never`.
 */
export type VideoPressAttributes = Record< never, never >;

export default {
	icon: video,
	attributes: [] as WidgetAttributeField< VideoPressAttributes >[],
	example: {
		attributes: {},
	},
};
