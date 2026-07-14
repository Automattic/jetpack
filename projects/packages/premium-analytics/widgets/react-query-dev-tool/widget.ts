/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { bug } from '@wordpress/icons';

/**
 * The widget has no user-configurable attributes: the devtools panel takes no
 * configuration and binds directly to the shared query client.
 */
export type ReactQueryDevToolAttributes = Record< never, never >;

/**
 * Widget type definition.
 *
 * Developer tool, dropped from production at registration time by the
 * `jetpack_premium_analytics_registrable_widget_types` filter
 * (widget-availability.php). This metadata only describes the type for the
 * dashboard's widget picker.
 */
export default {
	name: 'jpa/react-query-dev-tool',
	title: __( 'React Query Devtools', 'jetpack-premium-analytics' ),
	icon: bug,
};
