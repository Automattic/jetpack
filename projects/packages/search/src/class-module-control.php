<?php
/**
 * Jetpack Search: Module_Control class
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

use Automattic\Jetpack\Modules;
use WP_Error;

/**
 * To get and set Searh module settings
 */
class Module_Control {
	/**
	 * Plan object
	 *
	 * @var Plan
	 */
	protected $plan;

	/**
	 * We use the same options as Jetpack the plugin to flag whether Search is active.
	 */
	const JETPACK_ACTIVE_MODULES_OPTION_KEY       = 'active_modules';
	const JETPACK_SEARCH_MODULE_SLUG              = 'search';
	const SEARCH_MODULE_INSTANT_SEARCH_OPTION_KEY = 'instant_search_enabled';

	/**
	 * Contructor
	 *
	 * @param Plan|null $plan - Plan object.
	 */
	public function __construct( $plan = null ) {
		$this->plan = $plan === null ? new Plan() : $plan;
		if ( ! did_action( 'jetpack_search_module_control_initialized' ) ) {
			add_filter( 'jetpack_get_available_standalone_modules', array( $this, 'search_filter_available_modules' ), 10, 1 );

			/**
			 * Fires when the Automattic\Jetpack\Search\Module_Control is initialized for the first time.
			 */
			do_action( 'jetpack_search_module_control_initialized' );
		}
	}

	/**
	 * Returns a boolean for whether of the module is enabled.
	 *
	 * @return bool
	 */
	public function is_active() {
		return ( new Modules() )->is_active( self::JETPACK_SEARCH_MODULE_SLUG );
	}

	/**
	 * Returns a boolean for whether instant search is enabled.
	 *
	 * @return bool
	 */
	public function is_instant_search_enabled() {
		return (bool) get_option( self::SEARCH_MODULE_INSTANT_SEARCH_OPTION_KEY );
	}

	/**
	 * Activiate Search module
	 */
	public function activate() {
		if ( ! $this->plan->supports_search() ) {
			return new WP_Error( 'not_supported', __( 'Your plan does not support Jetpack Search.', 'jetpack-search-pkg' ) );
		}

		return ( new Modules() )->activate( self::JETPACK_SEARCH_MODULE_SLUG, false, false );
	}

	/**
	 * Deactiviate Search module
	 */
	public function deactivate() {
		$success = ( new Modules() )->deactivate( self::JETPACK_SEARCH_MODULE_SLUG );

		$this->disable_instant_search();

		return $success;
	}

	/**
	 * Update module status
	 *
	 * @param boolean $active - true to activate, false to deactivate.
	 */
	public function update_status( $active ) {
		return $active ? $this->activate() : $this->deactivate();
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
		if ( ! $this->is_active() ) {
			return new WP_Error( 'search_module_inactive', __( 'Search module needs to be activated before enabling instant search.', 'jetpack-search-pkg' ) );
		}
		if ( ! $this->plan->supports_instant_search() ) {
			return new WP_Error( 'not_supported', __( 'Your plan does not support Instant Search.', 'jetpack-search-pkg' ) );
		}
		return update_option( self::SEARCH_MODULE_INSTANT_SEARCH_OPTION_KEY, true );
	}

	/**
	 * Update instant search status
	 *
	 * @param boolean $enabled - true to enable, false to disable.
	 */
	public function update_instant_search_status( $enabled ) {
		return $enabled ? $this->enable_instant_search() : $this->disable_instant_search();
	}

	/**
	 * Get a list of activated modules as an array of module slugs.
	 *
	 * @deprecated 0.12.3
	 * @return Array $active_modules
	 */
	public function get_active_modules() {
		_deprecated_function(
			__METHOD__,
			'jetpack-search-0.12.3',
			'Automattic\\Jetpack\\Modules\\get_active'
		);

		return ( new Modules() )->get_active();
	}

	/**
	 * Adds search to the list of available modules
	 *
	 * @param array $modules The available modules.
	 * @return array
	 */
	public function search_filter_available_modules( $modules ) {
		return array_merge( array( self::JETPACK_SEARCH_MODULE_SLUG ), $modules );
	}
}
