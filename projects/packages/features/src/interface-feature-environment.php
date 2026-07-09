<?php
/**
 * Platform adapter contract for resolving feature signals.
 *
 * @package automattic/jetpack-features
 */

namespace Automattic\Jetpack\Features;

/**
 * Each platform (Jetpack self-hosted, wpcom Simple, Atomic) binds one implementation.
 */
interface Feature_Environment {

	/**
	 * Does this platform have the capability at all?
	 *
	 * @param Feature $f Feature.
	 * @return bool
	 */
	public function applies_to_site( Feature $f ): bool;

	/**
	 * Does the current plan/site grant the entitlement? Null slug means "free".
	 *
	 * @param string|null $entitlement_slug Entitlement slug.
	 * @return bool
	 */
	public function site_is_entitled( ?string $entitlement_slug ): bool;

	/**
	 * Is the required connection level satisfied?
	 *
	 * @param string $level One of 'none' | 'site' | 'user'.
	 * @return bool
	 */
	public function site_has_connection_level( string $level ): bool;

	/**
	 * Is the feature currently turned on?
	 *
	 * @param Feature $f Feature.
	 * @return bool
	 */
	public function is_active_on_site( Feature $f ): bool;
}
