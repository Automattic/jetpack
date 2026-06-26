/**
 * WordPress dependencies
 */
import { bug } from '@wordpress/icons';

/**
 * Widget type definition.
 *
 * Developer tool, exposed only outside production. Availability is enforced
 * server-side by the `jetpack_premium_analytics_widget_types` filter (see
 * `src/widget-availability.php`); this metadata only describes the type for the
 * dashboard's widget picker.
 */
export default {
	name: 'jpa/react-query-dev-tool',
	title: 'React Query Devtools',
	icon: bug,
	presentation: 'full-bleed',
};
