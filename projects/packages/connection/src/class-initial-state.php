<?php
/**
 * The React initial state.
 *
 * @package automattic/jetpack-connection
 */

namespace Automattic\Jetpack\Connection;

use Automattic\Jetpack\Identity_Crisis;
use Automattic\Jetpack\Status;

/**
 * The React initial state.
 */
class Initial_State {

	/**
	 * Get the initial state data.
	 *
	 * @return array
	 */
	private static function get_data() {
		global $wp_version;

		$status                = new Status();
		$manager               = new Manager();
		$can_manage_connection = current_user_can( 'jetpack_connect' );

		// Only expose the owner's identity to users who can act on connection issues:
		// this state is printed for any logged-in user loading connection scripts
		// (e.g. contributors in the editor). The owner is derived from the master_user
		// option rather than the token-dependent Manager::get_connection_owner(): that
		// method returns false exactly when the owner's token is broken, which is the
		// scenario connection-error UIs need this data for (and it re-reports
		// invalid_connection_owner as a side effect). Unlike
		// userConnectionData.connectionOwner (the *connected* owner), this field
		// identifies who holds ownership regardless of token health.
		$connection_owner = null;
		if ( $can_manage_connection ) {
			$owner_id = (int) \Jetpack_Options::get_option( 'master_user' );
			$owner    = $owner_id > 0 ? get_userdata( $owner_id ) : false;

			if ( $owner instanceof \WP_User ) {
				$connection_owner = array(
					'id'          => $owner_id,
					'displayName' => $owner->display_name,
					'avatar'      => get_avatar_url(
						$owner_id,
						array(
							'size'    => 48,
							'default' => 'mysteryman',
						)
					),
				);
			}
		}

		// Behind the same gate: on an anchored site, resolving the owner can cost a WordPress.com lookup.
		$has_protected_owner            = null;
		$requires_protected_owner       = null;
		$use_default_protected_owner_ui = null;
		if ( $can_manage_connection ) {
			$has_protected_owner      = $manager->has_protected_owner();
			$requires_protected_owner = $manager->requires_protected_owner();

			/**
			 * Filters whether the connection package renders its default protected owner UI.
			 *
			 * Return `false` from a consumer that renders its own confirmation flow.
			 *
			 * @since 9.7.0
			 *
			 * @param bool $use_default_ui Whether to render the default UI. Default true.
			 */
			$use_default_protected_owner_ui = (bool) apply_filters( 'jetpack_connection_protected_owner_default_ui', true );
		}

		return array(
			'apiRoot'                    => esc_url_raw( rest_url() ),
			'apiNonce'                   => wp_create_nonce( 'wp_rest' ),
			'registrationNonce'          => wp_create_nonce( 'jetpack-registration-nonce' ),
			'connectionStatus'           => REST_Connector::connection_status( false ),
			'userConnectionData'         => REST_Connector::get_user_connection_data( false ),
			'connectedPlugins'           => REST_Connector::get_connection_plugins( false ),
			'wpVersion'                  => $wp_version,
			'siteSuffix'                 => $status->get_site_suffix(),
			'connectionErrors'           => Error_Handler::get_instance()->get_displayable_errors(),
			'isOfflineMode'              => $status->is_offline_mode(),
			'calypsoEnv'                 => ( new Status\Host() )->get_calypso_env(),
			// @deprecated 9.18.0 Nothing reads it any more; kept for third-party readers. Remove in a later release.
			'isOwnershipTransferable'    => $manager->is_ownership_transferable(),
			// Null on a partial update with a Manager that predates the method; JS then falls back to the trunk rule.
			'canTakeOwnerSlot'           => method_exists( $manager, 'can_take_owner_slot' ) ? $manager->can_take_owner_slot() : null,
			'connectionOwner'            => $connection_owner,
			'hasProtectedOwner'          => $has_protected_owner,
			'requiresProtectedOwner'     => $requires_protected_owner,
			'useDefaultProtectedOwnerUi' => $use_default_protected_owner_ui,
			'identityCrisis'             => self::get_identity_crisis_data( $status ),
		);
	}

	/**
	 * Get the Safe Mode state the shared Safe Mode screen reads.
	 *
	 * @since 9.18.3
	 *
	 * @param Status $status Status instance.
	 * @return array|null Null outside Safe Mode.
	 */
	private static function get_identity_crisis_data( Status $status ) {
		// Guarded: another plugin can still load the older Identity_Crisis from the abandoned jetpack-identity-crisis package.
		if ( ! $status->in_safe_mode() || ! method_exists( Identity_Crisis::class, 'is_new_screen_enabled' ) ) {
			return null;
		}

		$can_resolve = current_user_can( 'jetpack_disconnect' );
		$data        = array(
			'useNewScreen'        => Identity_Crisis::is_new_screen_enabled(),
			'canResolve'          => $can_resolve,
			'isSafeModeConfirmed' => (bool) Identity_Crisis::safe_mode_is_confirmed(),
		);

		// This state is printed for any logged-in user who loads connection scripts.
		if ( ! $can_resolve ) {
			return $data;
		}

		$idc_urls = self::get_mismatched_urls();

		return $data + array(
			'wpcomHomeUrl'                   => $idc_urls ? $idc_urls['wpcom_url'] : '',
			'currentUrl'                     => $idc_urls ? $idc_urls['current_url'] : ( Identity_Crisis::get_sync_error_idc_option()['home'] ?? '' ),
			'isDevelopmentSite'              => (bool) Status::is_development_site(),
			'possibleDynamicSiteUrlDetected' => (bool) Identity_Crisis::detect_possible_dynamic_site_url(),
			'logoUrl'                        => Jetpack_Connector::get_connector_logo_url(),
		);
	}

	/**
	 * Get the mismatched URLs, including once Safe Mode is confirmed.
	 *
	 * @since 9.18.3
	 *
	 * @return array{wpcom_url: string, current_url: string}|false
	 */
	private static function get_mismatched_urls() {
		$idc_urls = Identity_Crisis::get_stored_mismatched_urls();
		if ( ! $idc_urls ) {
			return false;
		}

		// The WordPress.com URLs are stored reversed, and only the filter Identity_Crisis::init() adds turns them back.
		if ( false === has_filter( 'jetpack_options', array( Identity_Crisis::class, 'reverse_wpcom_urls_for_idc' ) ) ) {
			$error = \Jetpack_Options::get_option( 'sync_error_idc' );
			if ( is_array( $error ) && ! empty( $error['reversed_url'] ) ) {
				$idc_urls['wpcom_url'] = strrev( $idc_urls['wpcom_url'] );
			}
		}

		return $idc_urls;
	}

	/**
	 * Set the connection script data.
	 *
	 * @param array $data The script data.
	 */
	public static function set_connection_script_data( $data ) {

		$data['connection'] = self::get_data();

		if ( empty( $data['site']['wpcom']['blog_id'] ) ) {
			$data['site']['wpcom']['blog_id'] = absint( \Jetpack_Options::get_option( 'id', 0 ) );
		}

		return $data;
	}

	/**
	 * Render the initial state into a JavaScript variable.
	 *
	 * @return string
	 */
	public static function render() {
		/*
		 * `window.jpTracksContext` is an intentionally minimal, Tracks-specific global used by the
		 * @automattic/jetpack-analytics package to read `blog_id` at event-fire time. It exists
		 * separately from `window.JetpackScriptData` because the analytics package is consumed in
		 * contexts (e.g. Boost frontend) where `JetpackScriptData` is not reliably available, and
		 * coupling the analytics package to that schema would widen its surface unnecessarily.
		 * When both are present, `JetpackScriptData.site.wpcom.blog_id` is populated via
		 * `set_connection_script_data()` above for other consumers.
		 * Jetpack_Connector::enqueue_script_module() prints the same line on the Connectors screen.
		 */
		return 'var JP_CONNECTION_INITIAL_STATE; typeof JP_CONNECTION_INITIAL_STATE === "object" || (JP_CONNECTION_INITIAL_STATE = ' . wp_json_encode( self::get_data(), JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP ) . ');'
			. sprintf( 'window.jpTracksContext = window.jpTracksContext || {}; window.jpTracksContext.blog_id = %s;', absint( \Jetpack_Options::get_option( 'id', 0 ) ) );
	}

	/**
	 * Render the initial state using an inline script.
	 *
	 * @param string $handle The JS script handle.
	 *
	 * @return void
	 */
	public static function render_script( $handle ) {
		wp_add_inline_script( $handle, static::render(), 'before' );
	}
}
