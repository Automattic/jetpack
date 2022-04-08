<?php
/**
 * Jetpack Search: Module_Control class
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

use Automattic\Jetpack\Modules;
use Automattic\Jetpack\Status;
use Jetpack_Options;
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
		/**
		 * Fires before a module is activated.
		 *
		 * @since 2.6.0
		 *
		 * @param string $module Module slug.
		 * @param bool $exit Should we exit after the module has been activated. Default to true.
		 * @param bool $redirect Should the user be redirected after module activation? Default to true.
		 */
		do_action( 'jetpack_pre_activate_module', self::JETPACK_SEARCH_MODULE_SLUG );

		// If it's already active, then don't do it again.
		if ( $this->is_active() ) {
			return true;
		}
		// Not available for offline mode.
		$is_offline_mode = ( new Status() )->is_offline_mode();
		if ( $is_offline_mode ) {
			return new WP_Error( 'offline_mode', __( 'Search module can not be activated in offline mode.', 'jetpack-search-pkg' ) );
		}
		// Return false if no plan supports search.
		if ( ! $this->plan->supports_search() ) {
			return new WP_Error( 'not_supported', __( 'Your plan does not support Jetpack Search.', 'jetpack-search-pkg' ) );
		}

		$active_modules   = ( new Modules() )->get_active();
		$active_modules[] = self::JETPACK_SEARCH_MODULE_SLUG;

		$success = Jetpack_Options::update_option( self::JETPACK_ACTIVE_MODULES_OPTION_KEY, $active_modules );

		/**
		 * Fired after a module has been deactivated.
		 *
		 * @since 4.2.0
		 *
		 * @param string $module Module slug.
		 * @param boolean $success whether the module was deactivated.
		 */
		do_action( 'jetpack_activate_module', self::JETPACK_SEARCH_MODULE_SLUG, $success );
		/**
		 * Fires when a module is deactivated.
		 * The dynamic part of the filter, $module, is the module slug.
		 *
		 * @since 1.9.0
		 *
		 * @param string $module Module slug.
		 */
		do_action( 'jetpack_activate_module_' . self::JETPACK_SEARCH_MODULE_SLUG );

		return $success;
	}

	/**
	 * Deactiviate Search module
	 */
	public function deactivate() {
		/**
		 * Fires when a module is deactivated.
		 *
		 * @since-jetpack 1.9.0
		 *
		 * @param string $module Module slug.
		 */
		do_action( 'jetpack_pre_deactivate_module', self::JETPACK_SEARCH_MODULE_SLUG );

		$active_modules = ( new Modules() )->get_active();
		$active_modules = array_values( array_diff( $active_modules, array( self::JETPACK_SEARCH_MODULE_SLUG ) ) );

		$success = Jetpack_Options::update_option( self::JETPACK_ACTIVE_MODULES_OPTION_KEY, $active_modules );

		/**
		 * Fired after a module has been deactivated.
		 *
		 * @since-jetpack 4.2.0
		 *
		 * @param string $module Module slug.
		 * @param boolean $success whether the module was deactivated.
		 */
		do_action( 'jetpack_deactivate_module', self::JETPACK_SEARCH_MODULE_SLUG, $success );
		/**
		 * Fires when a module is deactivated.
		 * The dynamic part of the filter, $module, is the module slug.
		 *
		 * @since-jetpack 1.9.0
		 *
		 * @param string $module Module slug.
		 */
		do_action( 'jetpack_deactivate_module_' . self::JETPACK_SEARCH_MODULE_SLUG );

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
	 * @deprecated $$next-version$$
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
}
