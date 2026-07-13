/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { video } from '@wordpress/icons';

/**
 * Configurable attributes for the Video embeds widget.
 *
 * The widget is scoped to a single video and has no own settings: the video is
 * chosen by the host, which composes the report params with a `post_id` (the
 * VideoPress post ID), the same single-resource scope other detail widgets use.
 * A zero-attribute widget must be typed as `Record< never, never >` so the
 * render-only type can still compose host fields like `reportParams`.
 */
export type VideoDetailEmbedsAttributes = Record< never, never >;

/**
 * Widget type definition.
 *
 * Ported from the Jetpack Stats "Video Details" module (`stats/video/%d`). Lists
 * the pages where the selected video is embedded. It has no meaning without a
 * selected video, so the host scopes it through `reportParams.post_id` rather
 * than a widget attribute.
 */
export default {
	name: 'jpa/video-detail-embeds',
	title: __( 'Video embeds', 'jetpack-premium-analytics' ),
	description: __(
		'Pages where the selected video is embedded, sourced from Jetpack Stats.',
		'jetpack-premium-analytics'
	),
	help: {
		content: __(
			'Lists every page on your site where the selected video is embedded, so you can see where it is being watched.',
			'jetpack-premium-analytics'
		),
		links: [
			{
				label: __( 'Learn more', 'jetpack-premium-analytics' ),
				href: 'https://jetpack.com/support/jetpack-stats/',
			},
		],
	},
	icon: video,
};
