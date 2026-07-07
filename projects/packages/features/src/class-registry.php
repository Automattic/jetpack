<?php
/**
 * In-memory registry of declared features.
 *
 * @package automattic/jetpack-features
 */

namespace Automattic\Jetpack\Features;

/**
 * Singleton store of Feature objects and the bound platform environment.
 */
class Registry {

	/**
	 * Singleton instance.
	 *
	 * @var Registry|null
	 */
	private static $instance = null;

	/**
	 * Registered features indexed by slug.
	 *
	 * @var Feature[]
	 */
	private $features = array();

	/**
	 * Bound platform environment.
	 *
	 * @var Feature_Environment|null
	 */
	private $environment = null;

	/**
	 * Get or create the Registry singleton instance.
	 *
	 * @return Registry
	 */
	public static function instance() {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	/**
	 * Register a feature. Last registration for a slug wins.
	 *
	 * @param Feature $feature Feature to register.
	 */
	public function register( Feature $feature ) {
		$this->features[ $feature->slug() ] = $feature;
	}

	/**
	 * Get a registered feature by slug.
	 *
	 * @param string $slug Feature slug.
	 * @return Feature|null
	 */
	public function get( $slug ) {
		return $this->features[ $slug ] ?? null;
	}

	/**
	 * Get all registered features, slug-keyed.
	 *
	 * @return Feature[]
	 */
	public function all() {
		return $this->features;
	}

	/**
	 * Reset (primarily for tests).
	 */
	public function clear() {
		$this->features    = array();
		$this->environment = null;
	}

	/**
	 * Set the bound platform environment.
	 *
	 * @param Feature_Environment $env Bound platform adapter.
	 */
	public function set_environment( Feature_Environment $env ) {
		$this->environment = $env;
	}

	/**
	 * Get the bound platform environment.
	 *
	 * @return Feature_Environment|null
	 */
	public function environment() {
		return $this->environment;
	}
}
