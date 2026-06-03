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
	 *
	 * `EXPERIENCE_OVERLAY_BLOCKS` is the experimental blocks-powered overlay
	 * (server-rendered Search blocks template inside a modal). It is gated
	 * by the `jetpack_search_overlay_block_template_enabled` filter — the
	 * dashboard option only appears when the filter is on, and the runtime
	 * swap from the legacy preact app to the new overlay only kicks in when
	 * the user has explicitly chosen this experience.
	 */
	const EXPERIENCE_OVERLAY        = 'overlay';
	const EXPERIENCE_OVERLAY_BLOCKS = 'overlay_blocks';
	const EXPERIENCE_EMBEDDED       = 'embedded';
	const EXPERIENCE_INLINE         = 'inline';
	const EXPERIENCE_OFF            = 'off';

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
	 * Reads the canonical `jetpack_search_experience` option first — only the
	 * `'overlay'` experience enables Instant Search, and an explicit `'inline'`
	 * or `'embedded'` value means the user opted out regardless of the legacy
	 * boolean. Falls back to the legacy `instant_search_enabled` option only
	 * when the experience option has never been written (pre-existing sites
	 * that haven't saved via the new UI).
	 *
	 * Module-inactive sites always return false: when Search is off the
	 * experience option may still hold the user's prior preference (preserved
	 * for re-enable), and we don't want a stale `'overlay'` to read as
	 * "Instant Search is on" while the module isn't loaded.
	 *
	 * Keeps callers that still read the legacy boolean (debug-bar, AI Chat
	 * editor state, etc.) correct without each having to migrate to
	 * `get_experience()` individually.
	 *
	 * @return bool
	 */
	public function is_instant_search_enabled() {
		if ( ! $this->plan->supports_instant_search() || ! $this->is_active() ) {
			return false;
		}

		$saved = get_option( self::SEARCH_MODULE_EXPERIENCE_OPTION_KEY, false );
		if ( self::EXPERIENCE_OVERLAY === $saved ) {
			return true;
		}
		if (
			self::EXPERIENCE_INLINE === $saved
			|| self::EXPERIENCE_EMBEDDED === $saved
			|| self::EXPERIENCE_OVERLAY_BLOCKS === $saved
		) {
			return false;
		}

		// Legacy fallback: experience never written, trust the legacy boolean.
		return (bool) get_option( self::SEARCH_MODULE_INSTANT_SEARCH_OPTION_KEY );
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
	 *
	 * Also writes `'overlay'` to the canonical experience option so callers that
	 * arrive here through the legacy entry points (`update_instant_search_status`,
	 * the legacy auto-setup REST endpoint, etc.) leave the option in agreement
	 * with the boolean. Without this, a stale `'embedded'` / `'inline'` in the
	 * experience option keeps `is_instant_search_enabled()` returning false even
	 * though the legacy boolean was just set true.
	 */
	public function enable_instant_search() {
		if ( ! $this->is_active() ) {
			return new WP_Error( 'search_module_inactive', __( 'Search module needs to be activated before enabling instant search.', 'jetpack-search-pkg' ) );
		}
		if ( ! $this->plan->supports_instant_search() ) {
			return new WP_Error( 'not_supported', __( 'Your plan does not support Instant Search.', 'jetpack-search-pkg' ) );
		}
		update_option( self::SEARCH_MODULE_EXPERIENCE_OPTION_KEY, self::EXPERIENCE_OVERLAY );
		return update_option( self::SEARCH_MODULE_INSTANT_SEARCH_OPTION_KEY, true );
	}

	/**
	 * Update instant search status
	 *
	 * When disabling via this legacy path we also clear the canonical experience
	 * option — the user is asking for "not Overlay", and leaving a stale
	 * `'overlay'` in the option would keep `is_instant_search_enabled()`
	 * returning true. We don't clear from `disable_instant_search` itself
	 * because `deactivate()` calls that to flip the legacy boolean, and
	 * deactivation is meant to preserve the user's experience choice for the
	 * next re-activation.
	 *
	 * @param boolean $enabled - true to enable, false to disable.
	 */
	public function update_instant_search_status( $enabled ) {
		if ( ! $enabled ) {
			update_option( self::SEARCH_MODULE_EXPERIENCE_OPTION_KEY, '' );
		}
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
	 * this package's option). `'inline'`, `'embedded'`, `'overlay'`, and
	 * `'overlay_blocks'` are each written as their literal value to
	 * `jetpack_search_experience` whenever the experience changes, and read
	 * straight back here.
	 *
	 * @return string One of 'embedded', 'overlay', 'overlay_blocks', 'inline', 'off'.
	 */
	public function get_experience() {
		if ( ! $this->is_active() ) {
			return self::EXPERIENCE_OFF;
		}

		$saved = get_option( self::SEARCH_MODULE_EXPERIENCE_OPTION_KEY, false );
		if ( self::EXPERIENCE_EMBEDDED === $saved ) {
			return self::EXPERIENCE_EMBEDDED;
		}
		if ( self::EXPERIENCE_OVERLAY === $saved ) {
			return self::EXPERIENCE_OVERLAY;
		}
		if ( self::EXPERIENCE_OVERLAY_BLOCKS === $saved ) {
			return self::EXPERIENCE_OVERLAY_BLOCKS;
		}

		// Legacy fallback for sites that have never saved via the new UI: a true
		// `instant_search_enabled` boolean reads as overlay; otherwise inline.
		if ( $this->is_instant_search_enabled() ) {
			return self::EXPERIENCE_OVERLAY;
		}

		return self::EXPERIENCE_INLINE;
	}

	/**
	 * Update the search experience.
	 *
	 * Storage is narrower than the wire format: `'off'` only deactivates the global
	 * module (no write to the experience option) and disables
	 * `instant_search_enabled` so the legacy boolean doesn't drift true after
	 * a non-overlay re-enable. `'inline'` deletes the experience option (the
	 * absence of an opt-in *is* inline). Only `'embedded'` and `'overlay'`
	 * write affirmative values.
	 *
	 * Legacy `module_active` / `instant_search_enabled` are kept in lockstep so
	 * unmigrated readers (Initializer, Options, sidebar registration) continue to
	 * see the right state until they're migrated to consult get_experience().
	 *
	 * @param string $experience One of 'embedded', 'overlay', 'inline', 'off'.
	 * @return bool|WP_Error WP_Error on failure; true on success for the affirmative
	 *                      branches; the bool from Modules::deactivate() for `'off'`
	 *                      (false signals the module was already inactive — a benign
	 *                      no-op the REST controller treats as success).
	 */
	public function update_experience( string $experience ) {
		$valid_values = array(
			self::EXPERIENCE_OVERLAY,
			self::EXPERIENCE_OVERLAY_BLOCKS,
			self::EXPERIENCE_EMBEDDED,
			self::EXPERIENCE_INLINE,
			self::EXPERIENCE_OFF,
		);
		if ( ! in_array( $experience, $valid_values, true ) ) {
			return new WP_Error(
				'invalid_experience',
				esc_html__( 'Invalid experience value.', 'jetpack-search-pkg' ),
				array( 'status' => 400 )
			);
		}

		// Defence-in-depth for the experimental blocks-powered overlay: the
		// dashboard already hides the option when the
		// `jetpack_search_overlay_block_template_enabled` filter is off, but
		// a scripted REST POST could otherwise pre-stage `overlay_blocks` on
		// a site where the operator has pinned the filter to false. Reject
		// the value at the boundary so the runtime gate isn't the only
		// safety net.
		if (
			self::EXPERIENCE_OVERLAY_BLOCKS === $experience
			&& ! (bool) apply_filters( 'jetpack_search_overlay_block_template_enabled', true )
		) {
			return new WP_Error(
				'experience_not_available',
				esc_html__( 'The blocks-powered Overlay search experience is not enabled on this site.', 'jetpack-search-pkg' ),
				array( 'status' => 400 )
			);
		}

		switch ( $experience ) {
			case self::EXPERIENCE_OFF:
				$this->disable_instant_search();
				return ( new Modules() )->deactivate( self::JETPACK_SEARCH_MODULE_SLUG );

			case self::EXPERIENCE_INLINE:
				$result = $this->activate();
				if ( is_wp_error( $result ) ) {
					return $result;
				}
				$this->disable_instant_search();
				// Inline is the absence of an opt-in — delete the option rather than
				// writing 'inline'. Pre-existing sites that have never saved are
				// already in this state, so this also normalises after a switch.
				update_option( self::SEARCH_MODULE_EXPERIENCE_OPTION_KEY, '' );
				return true;

			case self::EXPERIENCE_EMBEDDED:
				$result = $this->activate();
				if ( is_wp_error( $result ) ) {
					return $result;
				}
				$this->disable_instant_search();
				update_option( self::SEARCH_MODULE_EXPERIENCE_OPTION_KEY, self::EXPERIENCE_EMBEDDED );
				return true;

			case self::EXPERIENCE_OVERLAY:
				$result = $this->activate();
				if ( is_wp_error( $result ) ) {
					return $result;
				}
				$result = $this->enable_instant_search();
				if ( is_wp_error( $result ) ) {
					return $result;
				}
				update_option( self::SEARCH_MODULE_EXPERIENCE_OPTION_KEY, self::EXPERIENCE_OVERLAY );
				return true;

			case self::EXPERIENCE_OVERLAY_BLOCKS:
				// The blocks-powered overlay does not boot the legacy preact
				// `SearchApp`, so we keep `instant_search_enabled` off; the
				// runtime hookup lives in `Search_Blocks::is_block_template_overlay_enabled()`
				// which combines the user's experience choice with the
				// `jetpack_search_overlay_block_template_enabled` server filter.
				$result = $this->activate();
				if ( is_wp_error( $result ) ) {
					return $result;
				}
				$this->disable_instant_search();
				update_option( self::SEARCH_MODULE_EXPERIENCE_OPTION_KEY, self::EXPERIENCE_OVERLAY_BLOCKS );
				return true;

			default:
				// Unreachable — the `in_array` guard at the top of this
				// method already restricts $experience to the cases above.
				// Returning a typed value (rather than falling through to an
				// implicit `null`) satisfies the static analyzers that flag
				// switch statements without a `default` branch, and keeps the
				// method's `bool|WP_Error` contract honest if a future caller
				// loosens the validation.
				return true;
		}
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
