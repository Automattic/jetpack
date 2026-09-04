<?php
/**
 * Dashboard policy script-data wiring.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

use Automattic\Jetpack\Status\Visitor;

/**
 * Filter overriding the dashboard role resolved for the current user.
 *
 * @var string
 */
const DASHBOARD_ROLE_FILTER = 'jetpack_premium_analytics_dashboard_role';

/**
 * Filter adjusting the dashboard capabilities derived from a role.
 *
 * @var string
 */
const DASHBOARD_CAPABILITIES_FILTER = 'jetpack_premium_analytics_dashboard_capabilities';

/**
 * Role an identified Automattician plays on the dashboard.
 *
 * @var string
 */
const DASHBOARD_ROLE_AUTOMATTICIAN = 'automattician';

/**
 * Role of a dashboard reader without a WordPress role of their own.
 *
 * @var string
 */
const DASHBOARD_ROLE_READER = 'reader';

/**
 * The operations the dashboard policy answers for.
 *
 * @var string[]
 */
const DASHBOARD_OPERATIONS = array( 'customize', 'insert', 'remove', 'move', 'resize', 'edit', 'reset' );

/**
 * Configures the dashboard policy script data.
 *
 * @return void
 */
function configure_dashboard_policy() {
	add_filter( 'jetpack_admin_js_script_data', __NAMESPACE__ . '\\inject_dashboard_policy_script_data', 20 );
}

/**
 * Resolves the role the current user plays on the dashboard.
 *
 * An identified Automattician (WordPress.com Simple, or the a8c proxy on WoA) plays
 * `automattician`; everyone else plays their first WordPress role, or `reader` without one.
 *
 * @return string
 */
function dashboard_role() {
	if ( ( new Visitor() )->is_tracking_automattician() ) {
		$role = DASHBOARD_ROLE_AUTOMATTICIAN;
	} else {
		$roles = wp_get_current_user()->roles;
		$role  = is_array( $roles ) && $roles ? (string) reset( $roles ) : DASHBOARD_ROLE_READER;
	}

	/**
	 * Filters the role the current user plays on the Premium Analytics dashboard.
	 *
	 * @since $$next-version$$
	 *
	 * @param string $role Resolved role: `automattician`, a WordPress role, or `reader`.
	 */
	return (string) apply_filters( DASHBOARD_ROLE_FILTER, $role );
}

/**
 * Derives what a dashboard role may do, one flag per operation.
 *
 * Every role customizes its own layout; adding and removing widgets is reserved to
 * `automattician` while the dashboard composition is under evaluation.
 *
 * @param string $role Dashboard role.
 * @return array<string, bool>
 */
function dashboard_capabilities( $role ) {
	$manages_widgets        = DASHBOARD_ROLE_AUTOMATTICIAN === $role;
	$capabilities           = array_fill_keys( DASHBOARD_OPERATIONS, true );
	$capabilities['insert'] = $manages_widgets;
	$capabilities['remove'] = $manages_widgets;

	/**
	 * Filters what a role may do on the Premium Analytics dashboard.
	 *
	 * @since $$next-version$$
	 *
	 * @param array<string, bool> $capabilities One flag per operation: customize, insert, remove, move, resize, edit, reset.
	 * @param string              $role         The dashboard role the flags were derived from.
	 */
	$capabilities = apply_filters( DASHBOARD_CAPABILITIES_FILTER, $capabilities, $role );

	return array_map( 'boolval', array_intersect_key( (array) $capabilities, array_flip( DASHBOARD_OPERATIONS ) ) );
}

/**
 * Injects the dashboard role and its capabilities into JetpackScriptData.
 *
 * The role is a reporting signal rather than authorization: the dashboard policy only decides
 * what the UI offers.
 *
 * @param array $data The script data passed by the assets package.
 * @return array
 */
function inject_dashboard_policy_script_data( array $data ): array {
	if ( ! isset( $data['premium_analytics'] ) || ! is_array( $data['premium_analytics'] ) ) {
		$data['premium_analytics'] = array();
	}

	$role = dashboard_role();

	$data['premium_analytics']['dashboard'] = array(
		'role'         => $role,
		'capabilities' => dashboard_capabilities( $role ),
	);

	return $data;
}
