<?php
/**
 * A single place for hosts to force, default, or hide Jetpack features.
 *
 * @package automattic/jetpack-status
 */

namespace Automattic\Jetpack;

/**
 * Reads `jetpack_feature_policy` and feeds it into the filters that already own each decision.
 *
 * Activation goes through `jetpack_active_modules`, defaults through `jetpack_get_default_modules`,
 * and visibility through `jetpack_my_jetpack_feature_visibility`, so every existing reader,
 * including forced-module detection, sees the policy without knowing it exists.
 */
class Feature_Policy {

	/**
	 * The policy filter's name.
	 *
	 * @var string
	 */
	const FILTER = 'jetpack_feature_policy';

	const ACTIVATION_DEFAULT     = 'default';
	const ACTIVATION_FORCED_ON   = 'forced-on';
	const ACTIVATION_FORCED_OFF  = 'forced-off';
	const ACTIVATION_DEFAULT_ON  = 'default-on';
	const ACTIVATION_DEFAULT_OFF = 'default-off';

	const VISIBILITY_VISIBLE = 'visible';
	const VISIBILITY_HIDDEN  = 'hidden';

	/**
	 * Runs after other callbacks so the policy has the last word.
	 *
	 * @var int
	 */
	const PRIORITY = PHP_INT_MAX;

	/**
	 * Bridged filters, mapped to the callback and argument count each takes.
	 *
	 * @var array
	 */
	const BRIDGES = array(
		'jetpack_active_modules'                => array( 'filter_active_modules', 1 ),
		'jetpack_get_default_modules'           => array( 'filter_default_modules', 5 ),
		'jetpack_my_jetpack_feature_visibility' => array( 'filter_visibility', 1 ),
	);

	/**
	 * Registers the bridge callbacks once something uses the policy filter.
	 *
	 * Called by each reader rather than at load, because the status package has no bootstrap.
	 * Waiting for a policy keeps `has_filter( 'jetpack_active_modules' )` false on sites without one.
	 *
	 * @return void
	 */
	public static function ensure_hooks() {
		if ( ! has_filter( self::FILTER ) ) {
			return;
		}

		foreach ( self::BRIDGES as $hook => list( $method, $accepted_args ) ) {
			if ( false === has_filter( $hook, array( __CLASS__, $method ) ) ) {
				add_filter( $hook, array( __CLASS__, $method ), self::PRIORITY, $accepted_args );
			}
		}
	}

	/**
	 * Removes the bridge callbacks. For tests.
	 *
	 * @return void
	 */
	public static function reset() {
		foreach ( self::BRIDGES as $hook => list( $method ) ) {
			remove_filter( $hook, array( __CLASS__, $method ), self::PRIORITY );
		}
	}

	/**
	 * The validated policy.
	 *
	 * @return array Map of slug to an array with `activation` and `visibility`, either of which may be null.
	 */
	public static function get_policy() {
		/**
		 * Filters how Jetpack treats each feature on this site.
		 *
		 * Keys are module slugs for `activation`. For `visibility`, keys are anything the My Jetpack
		 * Features page answers to: product, module, or feature slugs. Each value is an array with
		 * either or both of:
		 *
		 * - `activation`: 'forced-on' or 'forced-off' pin the module on every request, the same as
		 *   `jetpack_active_modules`. 'default-on' or 'default-off' change what Jetpack turns on when
		 *   it activates its default modules, which happens at connection and upgrade, not on an
		 *   existing site. 'default' leaves it alone.
		 * - `visibility`: 'hidden' keeps the item off My Jetpack; 'visible' lists it.
		 *
		 * Standalone plugin products (Akismet, Boost, CRM, Protect) take `visibility` only: WordPress
		 * decides which plugins load before Jetpack runs, so forcing one needs `option_active_plugins`
		 * in an mu-plugin.
		 *
		 * @since $$next-version$$
		 *
		 * @param array $policy Map of slug to policy, empty until a host adds to it.
		 */
		$policy = apply_filters( self::FILTER, array() );

		if ( ! is_array( $policy ) ) {
			return array();
		}

		$activations  = array( self::ACTIVATION_DEFAULT, self::ACTIVATION_FORCED_ON, self::ACTIVATION_FORCED_OFF, self::ACTIVATION_DEFAULT_ON, self::ACTIVATION_DEFAULT_OFF );
		$visibilities = array( self::VISIBILITY_VISIBLE, self::VISIBILITY_HIDDEN );
		$valid        = array();

		foreach ( $policy as $slug => $entry ) {
			if ( ! is_string( $slug ) || '' === $slug || ! is_array( $entry ) ) {
				continue;
			}

			$activation = $entry['activation'] ?? null;
			$visibility = $entry['visibility'] ?? null;

			$valid[ $slug ] = array(
				'activation' => in_array( $activation, $activations, true ) ? $activation : null,
				'visibility' => in_array( $visibility, $visibilities, true ) ? $visibility : null,
			);
		}

		return $valid;
	}

	/**
	 * Adds forced-on modules to the active list and drops forced-off ones.
	 *
	 * @param array $active Active module slugs.
	 * @return array
	 */
	public static function filter_active_modules( $active ) {
		if ( ! is_array( $active ) ) {
			return $active;
		}

		$policy = self::get_policy();
		$active = array_merge( $active, self::get_slugs( $policy, 'activation', self::ACTIVATION_FORCED_ON ) );

		return array_values( array_unique( array_diff( $active, self::get_slugs( $policy, 'activation', self::ACTIVATION_FORCED_OFF ) ) ) );
	}

	/**
	 * Adds default-on modules to the defaults and drops default-off ones.
	 *
	 * @param array       $modules                  Default module slugs.
	 * @param bool|string $min_version              Minimum module version, passed through from the caller.
	 * @param bool|string $max_version              Maximum module version, passed through from the caller.
	 * @param bool|null   $requires_connection      Connection requirement, passed through from the caller.
	 * @param bool|null   $requires_user_connection User connection requirement, passed through from the caller.
	 * @return array
	 */
	public static function filter_default_modules( $modules, $min_version = false, $max_version = false, $requires_connection = null, $requires_user_connection = null ) {
		if ( ! is_array( $modules ) ) {
			return $modules;
		}

		$policy     = self::get_policy();
		$default_on = self::get_slugs( $policy, 'activation', self::ACTIVATION_DEFAULT_ON );

		if ( $default_on ) {
			// Honor the caller's constraints: an offline activation must not pick up a module that needs a connection.
			$available = ( new Modules() )->get_available( $min_version, $max_version, $requires_connection, $requires_user_connection );
			$modules   = array_merge( $modules, array_intersect( $default_on, $available ) );
		}

		return array_values( array_unique( array_diff( $modules, self::get_slugs( $policy, 'activation', self::ACTIVATION_DEFAULT_OFF ) ) ) );
	}

	/**
	 * Sets each slug's My Jetpack visibility from the policy.
	 *
	 * @param array $states Map of slug to visibility state.
	 * @return array
	 */
	public static function filter_visibility( $states ) {
		if ( ! is_array( $states ) ) {
			$states = array();
		}

		foreach ( self::get_policy() as $slug => $entry ) {
			if ( null !== $entry['visibility'] ) {
				$states[ $slug ] = $entry['visibility'];
			}
		}

		return $states;
	}

	/**
	 * Slugs whose policy sets `$key` to `$value`.
	 *
	 * @param array  $policy The validated policy.
	 * @param string $key    'activation' or 'visibility'.
	 * @param string $value  The value to match.
	 * @return string[]
	 */
	private static function get_slugs( $policy, $key, $value ) {
		$slugs = array();

		foreach ( $policy as $slug => $entry ) {
			if ( $value === $entry[ $key ] ) {
				$slugs[] = $slug;
			}
		}

		return $slugs;
	}
}
