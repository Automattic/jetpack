/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { video } from '@wordpress/icons';
import type { WidgetAttributeField } from '@wordpress/widget-primitives';

/**
 * Default number of videos shown when the `max` attribute is unset or invalid.
 */
export const DEFAULT_MAX = 7;

/**
 * Configurable attributes for the Videos widget. Mirrors the `attributes`
 * declared on the widget definition below; the host passes the selected values
 * through to `render.tsx`.
 */
export type VideosAttributes = {
	/**
	 * Maximum number of videos to show; `0` means all. Maps to the WPCOM stats
	 * `max` param. Integer form controls can serialize the value to a string, so
	 * the render entry accepts either.
	 */
	max?: string | number;
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
			type: 'integer',
		},
	] as WidgetAttributeField< VideosAttributes >[],
	example: {
		attributes: {
			max: DEFAULT_MAX,
		},
	},
};
