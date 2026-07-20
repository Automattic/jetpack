/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { comment } from '@wordpress/icons';
import type { WidgetAttributeField } from '@wordpress/widget-primitives';

/**
 * The Latest comments widget has no configurable attributes: it always lists
 * comments for the post the page is scoped to (via `reportParams.post_id`).
 */
export type PostCommentsAttributes = Record< never, never >;

/**
 * Widget type definition for the post detail Traffic view's Latest comments
 * card. The list is a lifetime roster and is not date-scoped.
 */
export default {
	name: 'jpa/post-comments',
	title: __( 'Latest comments', 'jetpack-premium-analytics' ),
	help: {
		content: __(
			'The latest comments on the post or page being viewed.',
			'jetpack-premium-analytics'
		),
	},
	icon: comment,
	attributes: [] as WidgetAttributeField< PostCommentsAttributes >[],
	example: {
		attributes: {},
	},
};
