/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { starEmpty } from '@wordpress/icons';
import type { WidgetAttributeField } from '@wordpress/widget-primitives';

/**
 * The Latest likes widget has no configurable attributes: it always lists the
 * likers of the post the page is scoped to (via `reportParams.post_id`).
 * `Record< never, never >` (not `Record< string, never >`) so the render-only
 * type can compose host fields such as `reportParams` without collapsing them
 * to `never`.
 */
export type PostLikesAttributes = Record< never, never >;

/**
 * Widget type definition.
 *
 * Ported from the Jetpack Stats post detail "Post likes" card. Lists the
 * scoped post's likers — avatar and name, most recent first, with an "N more"
 * footer when the total exceeds the rows shown. The likes endpoint reports
 * lifetime likers with no timestamps, so the list is not date-scoped and rows
 * carry no relative time.
 */
export default {
	name: 'jpa/post-likes',
	title: __( 'Latest likes', 'jetpack-premium-analytics' ),
	description: __(
		'The people who liked the post or page being viewed.',
		'jetpack-premium-analytics'
	),
	icon: starEmpty,
	attributes: [] as WidgetAttributeField< PostLikesAttributes >[],
	example: {
		attributes: {},
	},
};
