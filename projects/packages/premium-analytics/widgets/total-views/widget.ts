/**
 * WordPress dependencies
 */
import { seen } from '@wordpress/icons';

/**
 * Configurable attributes for the Total views widget. There are none: the
 * metric is fixed and the date range comes from the dashboard picker.
 */
export type TotalViewsAttributes = Record< never, never >;

/**
 * Widget type definition.
 *
 * Ported from the Jetpack Stats Insights "Total views" card: the period total as
 * a large figure over an area sparkline of the trend.
 */
export default {
	icon: seen,
};
