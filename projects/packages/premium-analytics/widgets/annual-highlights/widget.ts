/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { calendar } from '@wordpress/icons';

/**
 * The Annual highlights widget has no configurable settings: it always shows the
 * most recent year's totals, and it has no date range (the insights endpoint is
 * not period-scoped). Declared as `Record< never, never >` so the render-only
 * type can compose it with host fields without collapsing them to `never`.
 */
export type AnnualHighlightsAttributes = Record< never, never >;

/**
 * Widget type definition.
 */
export default {
	name: 'jpa/annual-highlights',
	title: __( 'Annual highlights', 'jetpack-premium-analytics' ),
	icon: calendar,
};
