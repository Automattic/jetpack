/**
 * WordPress dependencies
 */
import { postAuthor } from '@wordpress/icons';
import type { WidgetAttributeField } from '@wordpress/widget-primitives';

/** No configurable attributes; the empty record allows host-provided fields. */
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
