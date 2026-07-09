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
 * widget header; its copy mirrors the Stats "Plan usage" infotip explaining
 * how billable views are counted and when an upgrade is needed.
 */
export default {
	name: 'jpa/plan-usage',
	title: __( 'Plan usage', 'jetpack-premium-analytics' ),
	icon: percent,
	help: {
		content: __(
			"Billable views are your total views minus your two highest-traffic days each billing cycle, so big spikes won't count against your limit. You'll only need to upgrade if you exceed your limit for three cycles in a row.",
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
