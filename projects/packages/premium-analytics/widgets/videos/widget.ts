/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { video } from '@wordpress/icons';

/**
 * Configurable attributes for the Videos widget. Mirrors the `attributes`
 * declared on the widget definition below; the host passes the selected values
 * through to `render.tsx`.
 */
export type VideosAttributes = {
	/**
	 * Maximum number of videos to show. Maps to the WPCOM stats `max` param.
	 */
	max?: number;
};

/**
 * Widget type definition.
 */
export default {
	name: 'jpa/videos',
	title: __( 'Videos', 'jetpack-premium-analytics' ),
	icon: video,
	attributes: [
		{
			id: 'max',
			label: __( 'Maximum videos', 'jetpack-premium-analytics' ),
			type: 'integer' as const,
		},
	],
	example: {
		attributes: {
			max: '7',
		},
	},
};
