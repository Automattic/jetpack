/**
 * WordPress dependencies
 */
import { people } from '@wordpress/icons';
import type { WidgetAttributeField } from '@wordpress/widget-primitives';

/**
 * The Latest subscribers widget has no configurable attributes: it requests
 * the shared `WIDGET_ROW_LIMIT` rows and renders as many of them as its tile
 * fits.
 *
 * `Record< never, never >` (not `Record< string, never >`) so the render-only
 * type can compose host fields such as `reportParams` without collapsing them
 * to `never`.
 */
export type SubscribersListAttributes = Record< never, never >;

/**
 * Widget type definition.
 */
export default {
	icon: people,
	attributes: [] as WidgetAttributeField< SubscribersListAttributes >[],
	example: {
		attributes: {},
	},
};
