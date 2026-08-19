/**
 * WordPress dependencies
 */
import { mobile } from '@wordpress/icons';
import type { WidgetAttributeField } from '@wordpress/widget-primitives';

/**
 * The Devices widget has no configurable attributes: it requests
 * the shared `WIDGET_ROW_LIMIT` rows and renders as many of them as its tile
 * fits.
 *
 * `Record< never, never >` (not `Record< string, never >`) so the render-only
 * type can compose host fields such as `reportParams` without collapsing them
 * to `never`.
 */
export type DevicesAttributes = Record< never, never >;

/**
 * Devices widget type definition.
 *
 * Shows screen size breakdown (Desktop / Mobile / Tablet) via the PA proxy
 * at `stats/devices/screensize`. Date range comes from WidgetRoot's
 * reportParams (the shared dashboard date picker).
 */
export default {
	icon: mobile,
	attributes: [] as WidgetAttributeField< DevicesAttributes >[],
	example: {
		attributes: {},
	},
};
