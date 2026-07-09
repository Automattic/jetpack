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
 * The meter has no configurable attributes, so `attributes` is empty and the
 * `example` carries none either. `help` surfaces as an info popover in the
 * widget header, explaining what counts as a billable view.
 */
export default {
	name: 'jpa/plan-usage',
	title: __( 'Plan usage', 'jetpack-premium-analytics' ),
	icon: percent,
	help: {
		content: __(
			"Billable views are the views that count toward your Stats plan's monthly limit. The bar shows how many you've used in the current billing cycle and when the count restarts.",
			'jetpack-premium-analytics'
		),
		links: [
			{
				label: __( 'Learn more', 'jetpack-premium-analytics' ),
				href: 'https://jetpack.com/support/jetpack-stats/free-or-paid/',
			},
		],
	},
	attributes: [],
	example: {
		attributes: {},
	},
};
