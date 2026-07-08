/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { percent } from '@wordpress/icons';

/**
 * Configurable attributes for the Plan usage widget.
 *
 * The widget is a point-in-time gauge of the site's billable views against the
 * plan's monthly limit. It has no own settings — the reading is fixed by the
 * connected plan, not by the dashboard date picker — so its attribute shape is
 * empty. It is typed as `Record< never, never >` (not `Record< string, never >`)
 * so composing it with host fields like `reportParams` in `render.tsx` does not
 * collapse those fields to `never`.
 */
export type PlanUsageAttributes = Record< never, never >;

/**
 * Widget type definition.
 *
 * The gauge has no configurable attributes, so `attributes` is empty and the
 * `example` carries none either.
 */
export default {
	name: 'jpa/plan-usage',
	title: __( 'Plan usage', 'jetpack-premium-analytics' ),
	icon: percent,
	attributes: [],
	example: {
		attributes: {},
	},
};
