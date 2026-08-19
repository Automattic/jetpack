/**
 * WordPress dependencies
 */
import { postAuthor } from '@wordpress/icons';
import type { WidgetAttributeField } from '@wordpress/widget-primitives';

/**
 * The Authors widget has no configurable attributes: it requests
 * the shared `WIDGET_ROW_LIMIT` rows and renders as many of them as its tile
 * fits.
 *
 * `Record< never, never >` (not `Record< string, never >`) so the render-only
 * type can compose host fields such as `reportParams` without collapsing them
 * to `never`.
 */
export type AuthorsAttributes = Record< never, never >;

/**
 * Widget type definition.
 */
export default {
	icon: postAuthor,
	attributes: [] as WidgetAttributeField< AuthorsAttributes >[],
	example: {
		attributes: {},
	},
};
