/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { people } from '@wordpress/icons';
import type { WidgetAttributeField } from '@wordpress/widget-primitives';

/**
 * The Reach widget has no configurable attributes: it always shows the
 * subscriber totals across every channel. `Record< never, never >` (not
 * `Record< string, never >`) so the render-only type can compose host fields
 * such as `reportParams` without collapsing them to `never`.
 */
export type ReachAttributes = Record< never, never >;

/**
 * Widget type definition.
 *
 * Ported from the Jetpack Stats "Reach" module. Combines the WordPress.com and
 * email follower totals with each connected social (Publicize) service into a
 * single ranked list. The follower and Publicize modules report lifetime
 * totals, so there is no date range or comparison period.
 */
export default {
	name: 'jpa/reach',
	title: __( 'Reach', 'jetpack-premium-analytics' ),
	icon: people,
	attributes: [] as WidgetAttributeField< ReachAttributes >[],
	example: {
		attributes: {},
	},
};
