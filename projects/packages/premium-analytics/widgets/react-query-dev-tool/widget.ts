/**
 * WordPress dependencies
 */
import { bug } from '@wordpress/icons';

/**
 * Widget type definition.
 *
 * Developer tool, gated to non-production server-side by the
 * `jetpack_premium_analytics_widget_types` filter (widget-availability.php).
 * This metadata only describes the type for the dashboard's widget picker.
 */
export default {
	name: 'jpa/react-query-dev-tool',
	title: 'React Query Devtools',
	icon: bug,
	presentation: 'full-bleed',
};
