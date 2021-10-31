<?php
/**
 * Jetpack Search: Module_Control class
 *
 * @package    jetpack-search
 */

namespace Automattic\Jetpack\Search;

/**
 * To get and set Searh module settings
 */
class Module_Control {
	const SEARCH_MODULE_STATUS_OPTION_KEY         = 'jetpack-search-module-status';
	const SEARCH_MODULE_INSTANT_SEARCH_OPTION_KEY = 'instant_search_enabled';
	/**
	 * Singleton Instance
	 *
	 * @var Module_Control
	 */
	protected static $instance;

	/**
	 * Hide contruct
	 */
	protected function __construct() {
	}

	/**
	 * Return the singleton
	 */
	public static function get_instance() {
		if ( is_null( static::$instance ) ) {
			static::$instance = new static();
		}
		return static::$instance;
	}

	/**
	 * Returns a boolean for whether of the module is enabled.
	 *
	 * @return bool
	 */
	public function is_activated() {
		return (bool) get_option( self::SEARCH_MODULE_STATUS_OPTION_KEY );
	}

	/**
	 * Returns a boolean for whether instant search is enabled.
	 *
	 * @return bool
	 */
	public function is_instant_enabled() {
		return (bool) get_option( self::SEARCH_MODULE_INSTANT_SEARCH_OPTION_KEY );
	}

	/**
	 * Activiate Search module
	 */
	public function activate() {
		// TODO need to see what happens in the search activiate process.
		return update_option( self::SEARCH_MODULE_STATUS_OPTION_KEY, true );
	}

	/**
	 * Deactiviate Search module
	 */
	public function deactive() {
		return update_option( self::SEARCH_MODULE_STATUS_OPTION_KEY, false );
	}

	/**
	 * Disable Instant Search Experience
	 */
	public function disable_instant_search() {
		return update_option( self::SEARCH_MODULE_INSTANT_SEARCH_OPTION_KEY, false );
	}

	/**
	 * Enable Instant Search Experience
	 */
	public function enable_instant_search() {
		return update_option( self::SEARCH_MODULE_INSTANT_SEARCH_OPTION_KEY, true );
	}
}
