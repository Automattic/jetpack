<?php
/**
 * Jetpack Search: Module_Control class
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Modules;
use Automattic\Jetpack\Status;
use WP_Error;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * To get and set Search module settings
 */
class Module_Control {
	/**
	 * Plan object
	 *
	 * @var Plan
	 */
	protected $plan;

	/**
	 * Connection_Manager object
	 *
	 * @var \Automattic\Jetpack\Connection\Manager
	 */
	protected $connection_manager;

	/**
	 * We use the same options as Jetpack the plugin to flag whether Search is active.
	 */
	const JETPACK_ACTIVE_MODULES_OPTION_KEY               = 'active_modules';
	const JETPACK_SEARCH_MODULE_SLUG                      = 'search';
	const SEARCH_MODULE_INSTANT_SEARCH_OPTION_KEY         = 'instant_search_enabled';
	const SEARCH_MODULE_SWAP_CLASSIC_TO_INLINE_OPTION_KEY = 'swap_classic_to_inline_search';
	const SEARCH_MODULE_EXPERIENCE_OPTION_KEY             = 'jetpack_search_experience';

	/**
	 * Valid experience values.
	 */
	const EXPERIENCE_OVERLAY  = 'overlay';
	const EXPERIENCE_EMBEDDED = 'embedded';
	const EXPERIENCE_INLINE   = 'inline';
	const EXPERIENCE_OFF      = 'off';

	/**
	 * Contructor
	 *
	 * @param Plan|null                                   $plan - Plan object.
	 * @param \Automattic\Jetpack\Connection\Manager|null $connection_manager - Connection_Manager object.
	 */
	public function __construct( $plan = null, $connection_manager = null ) {
		$this->plan               = $plan === null ? new Plan() : $plan;
		$this->connection_manager = $connection_manager === null ? new Connection_Manager( Package::SLUG ) : $connection_manager;
		if ( ! did_action( 'jetpack_search_module_control_initialized' ) ) {
			add_filter( 'jetpack_get_available_standalone_modules', array( $this, 'search_filter_available_modules' ), 10, 1 );
			if ( Helper::is_wpcom() ) {
				add_filter( 'jetpack_active_modules', array( $this, 'search_filter_available_modules' ), 10, 2 );
			}
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
		return (bool) $this->plan->supports_instant_search() && get_option( self::SEARCH_MODULE_INSTANT_SEARCH_OPTION_KEY );
	}

	/**
	 * Returns a boolean for whether new inline search is enabled.
	 *
	 * @return bool
	 */
	public function is_swap_classic_to_inline_search() {
		return (bool) get_option( self::SEARCH_MODULE_SWAP_CLASSIC_TO_INLINE_OPTION_KEY, false );
	}

	/**
	 * Activiate Search module
	 */
	public function activate() {
		$is_wpcom = defined( 'IS_WPCOM' ) && IS_WPCOM;
		if ( ( new Status() )->is_offline_mode() ) {
			return new WP_Error( 'site_offline', __( 'Jetpack Search cannot be used in offline mode.', 'jetpack-search-pkg' ) );
		}
		if ( ! $is_wpcom && ! $this->connection_manager->is_connected() ) {
			return new WP_Error( 'connection_required', __( 'Connect your site to use Jetpack Search.', 'jetpack-search-pkg' ) );
		}
		if ( ! $this->plan->supports_search() ) {
			return new WP_Error( 'not_supported', __( 'Your plan does not support Jetpack Search.', 'jetpack-search-pkg' ) );
		}

		$success = ( new Modules() )->activate( self::JETPACK_SEARCH_MODULE_SLUG, false, false );
		if ( false === $success ) {
			return new WP_Error( 'not_updated', __( 'Setting not updated.', 'jetpack-search-pkg' ) );
		}
		return $success;
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
	 * Update setting indicating whether inline search should use newer 1.3 API.
	 *
	 * @param bool $swap_classic_to_inline_search - true to use Inline Search, false to use Classic Search.
	 */
	public function update_swap_classic_to_inline_search( bool $swap_classic_to_inline_search ) {
		return update_option( self::SEARCH_MODULE_SWAP_CLASSIC_TO_INLINE_OPTION_KEY, $swap_classic_to_inline_search );
	}

	/**
	 * Get the active search experience.
	 *
	 * `'off'` is read from the global Jetpack module-active state (not stored in
	 * this package's option). `'inline'`, `'embedded'`, and `'overlay'` are each
	 * written as their literal value to `jetpack_search_experience` whenever the
	 * experience changes, and read straight back here.
	 *
	 * @return string One of 'embedded', 'overlay', 'inline', 'off'.
	 */
	public function get_experience() {
		if ( ! $this->is_active() ) {
			return self::EXPERIENCE_OFF;
		}

		$saved = get_option( self::SEARCH_MODULE_EXPERIENCE_OPTION_KEY, false );
		if ( in_array( $saved, array( self::EXPERIENCE_INLINE, self::EXPERIENCE_EMBEDDED, self::EXPERIENCE_OVERLAY ), true ) ) {
			return $saved;
		}

		// Legacy fallback for sites that have never saved via the new UI: a true
		// `instant_search_enabled` boolean reads as overlay; otherwise inline.
		return $this->is_instant_search_enabled() ? self::EXPERIENCE_OVERLAY : self::EXPERIENCE_INLINE;
	}

	/**
	 * Update the search experience.
	 *
	 * `'off'` only deactivates the global module — it does not touch the
	 * experience option or `instant_search_enabled`, so re-enabling later
	 * restores the user's prior preference. The other three branches each
	 * write `instant_search_enabled` and `jetpack_search_experience` to the
	 * correct values for the chosen experience.
	 *
	 * @param string $experience One of 'embedded', 'overlay', 'inline', 'off'.
	 * @return bool|WP_Error WP_Error on failure; true on success for the affirmative
	 *                      branches; the bool from Modules::deactivate() for `'off'`
	 *                      (false signals the module was already inactive — a benign
	 *                      no-op the REST controller treats as success).
	 */
	public function update_experience( string $experience ) {
		$valid_values = array( self::EXPERIENCE_OVERLAY, self::EXPERIENCE_EMBEDDED, self::EXPERIENCE_INLINE, self::EXPERIENCE_OFF );
		if ( ! in_array( $experience, $valid_values, true ) ) {
			return new WP_Error(
				'invalid_experience',
				esc_html__( 'Invalid experience value.', 'jetpack-search-pkg' ),
				array( 'status' => 400 )
			);
		}

		if ( self::EXPERIENCE_OFF === $experience ) {
			return ( new Modules() )->deactivate( self::JETPACK_SEARCH_MODULE_SLUG );
		}

		$result = $this->activate();
		if ( is_wp_error( $result ) ) {
			return $result;
		}

		if ( self::EXPERIENCE_OVERLAY === $experience ) {
			$result = $this->enable_instant_search();
			if ( is_wp_error( $result ) ) {
				return $result;
			}
		} else {
			$this->disable_instant_search();
		}

		update_option( self::SEARCH_MODULE_EXPERIENCE_OPTION_KEY, $experience );
		return true;
	}

	/**
	 * Keep `instant_search_enabled` in lockstep with `jetpack_search_experience`.
	 *
	 * Legacy readers (Initializer, Options, sidebar registration) still check
	 * `instant_search_enabled`. Whenever the canonical experience option is
	 * written — through `update_experience()` *or* a direct `update_option()` —
	 * mirror the change so those readers see the right state. Skipped on
	 * Jetpack-connected sites running in offline / safe mode (Sync wouldn't
	 * replicate the change anyway, and the local site state is whatever the
	 * caller already wrote).
	 *
	 * @param string $experience The value just written to `jetpack_search_experience`.
	 */
	public static function sync_instant_search_with_experience( $experience ) {
		$should_be_enabled = ( self::EXPERIENCE_OVERLAY === $experience );
		$current           = (bool) get_option( self::SEARCH_MODULE_INSTANT_SEARCH_OPTION_KEY, false );
		if ( $should_be_enabled !== $current ) {
			update_option( self::SEARCH_MODULE_INSTANT_SEARCH_OPTION_KEY, $should_be_enabled );
		}
	}

	/**
	 * Action adapter for `add_option_jetpack_search_experience` — args are `($option, $value)`.
	 *
	 * @param string $option Option name.
	 * @param mixed  $value  Option value just added.
	 */
	public static function on_search_experience_added( $option, $value ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		self::sync_instant_search_with_experience( (string) $value );
	}

	/**
	 * Action adapter for `update_option_jetpack_search_experience` — args are `($old, $new, $option)`.
	 *
	 * @param mixed  $old_value Previous option value.
	 * @param mixed  $new_value New option value.
	 * @param string $option    Option name.
	 */
	public static function on_search_experience_updated( $old_value, $new_value, $option ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		self::sync_instant_search_with_experience( (string) $new_value );
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
