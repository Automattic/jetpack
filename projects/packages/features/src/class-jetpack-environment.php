<?php
/**
 * Self-hosted Jetpack platform adapter.
 *
 * @package automattic/jetpack-features
 */

namespace Automattic\Jetpack\Features;

use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Current_Plan;
use Automattic\Jetpack\Modules;

/**
 * Binds the Feature_Environment contract to the Jetpack module/plan/connection systems.
 * All external calls are behind class_exists guards + protected seams so the package
 * stays loadable everywhere and the mapping logic stays unit-testable.
 */
class Jetpack_Environment implements Feature_Environment {

	/**
	 * Checks if a feature is applicable based on registered callback.
	 *
	 * @param Feature $f Feature to check applicability for.
	 * @return bool True if applicable.
	 */
	public function is_applicable( Feature $f ): bool {
		$cb = $f->is_applicable_callback();
		if ( null !== $cb ) {
			return (bool) call_user_func( $cb, $f );
		}
		return true;
	}

	/**
	 * Checks if a feature is entitled based on plan support.
	 *
	 * @param ?string $entitlement_slug Entitlement slug to check.
	 * @return bool True if entitled.
	 */
	public function is_entitled( ?string $entitlement_slug ): bool {
		if ( null === $entitlement_slug || '' === $entitlement_slug ) {
			return true;
		}
		return $this->plan_supports( $entitlement_slug );
	}

	/**
	 * Checks if required connection level is met.
	 *
	 * @param string $level Connection level required.
	 * @return bool True if level is met.
	 */
	public function connection_level_met( string $level ): bool {
		switch ( $level ) {
			case 'user':
				return $this->has_connected_owner();
			case 'site':
				return $this->site_is_connected();
			case 'none':
			default:
				return true;
		}
	}

	/**
	 * Checks if a feature is active based on module status.
	 *
	 * @param Feature $f Feature to check activity for.
	 * @return bool True if active.
	 */
	public function is_active( Feature $f ): bool {
		$cb = $f->is_active_callback();
		if ( null !== $cb ) {
			return (bool) call_user_func( $cb, $f );
		}
		$module = $f->module();
		if ( null === $module ) {
			return true;
		}
		return $this->module_is_active( $module );
	}

	// --- Platform seams (overridden in tests) ---

	/**
	 * Checks if a plan supports an entitlement.
	 *
	 * @param string $slug Entitlement slug.
	 * @return bool True if plan supports entitlement.
	 */
	protected function plan_supports( $slug ): bool {
		return class_exists( Current_Plan::class ) && Current_Plan::supports( $slug );
	}

	/**
	 * Checks if a module is active.
	 *
	 * @param string $module Module slug.
	 * @return bool True if module is active.
	 */
	protected function module_is_active( $module ): bool {
		return class_exists( Modules::class ) && ( new Modules() )->is_active( $module );
	}

	/**
	 * Checks if the site is connected to WordPress.com.
	 *
	 * @return bool True if site is connected.
	 */
	protected function site_is_connected(): bool {
		return class_exists( Connection_Manager::class ) && ( new Connection_Manager( 'jetpack' ) )->is_connected();
	}

	/**
	 * Checks if the site has a connected owner.
	 *
	 * @return bool True if connected owner exists.
	 */
	protected function has_connected_owner(): bool {
		return class_exists( Connection_Manager::class ) && ( new Connection_Manager( 'jetpack' ) )->has_connected_owner();
	}
}
