<?php

/**
 * Module Name: Manage
 * Module Description: Enables you to view available upgrades on your WordPress.com dashboard.
 * First Introduced: 3.1
 * Requires Connection: Yes
 * Auto Activate: Yes
 */

class Jetpack_Manage_Client {

	public static function init() {
		add_filter( 'jetpack_xmlrpc_methods', array( __CLASS__, 'add_xmlrpc_methods' ) );
	}

	public static function add_xmlrpc_methods( $methods ) {
		$methods['manage.core']         = array( __CLASS__, 'core' );
		$methods['manage.plugins']      = array( __CLASS__, 'plugins' );
		$methods['manage.themes']       = array( __CLASS__, 'themes' );
		$methods['manage.translations'] = array( __CLASS__, 'translations' );

		// Leave these off until we can check the capabilities of
		// the user being used to call them.
		// $methods['manage.plugins.activate']   = array( __CLASS__, 'plugins_activate' );
		// $methods['manage.plugins.deactivate'] = array( __CLASS__, 'plugins_deactivate' );
		// $methods['manage.themes.activate']    = array( __CLASS__, 'themes_activate' );

		return $methods;
	}

	/**
	 * Used to verify incoming commands with WordPress.com Servers.
	 */
	private static function verify_nonce( $nonce ) {
		if ( is_string( $nonce ) ) {
			jetpack::load_xml_rpc_client();
			$client = new Jetpack_IXR_Client( array( 'url' => jetpack::xmlrpc_api_url() . '?for=jetpack' ) );
			if ( $client->query( 'manage.verifyNonce', $nonce ) ) {
				return true === $client->getResponse();
			}
		}
		return false;
	}

	/**
	 * Returns the current version of WordPress, and whether
	 * there is an available upgrade.
	 *
	 * @param $args
	 * @return array
	 */
	public static function core( $args ) {
		global $wp_version, $wp_db_version;

		_maybe_update_core();

		return array(
			'wp_version'    => $wp_version,
			'wp_db_version' => $wp_db_version,
			'upgrade_core'  => get_site_transient( 'update_core' ),
		);
	}

	/**
	 * Returns a list of installed plugins, their versions, whether
	 * they are active, and whether there is an available upgrade.
	 *
	 * @param $args
	 * @return array
	 */
	public static function plugins( $args ) {
		_maybe_update_plugins();

		return array(
			'plugins'  => get_plugins(),
			'upgrades' => get_site_transient( 'update_plugins' ),
		);
	}

	/**
	 * Attempts to activate a plugin, and returns a status array
	 * designating success|failure & reasons.
	 *
	 * @param $args
	 * @return array
	 */
	public static function plugins_activate( $args ) {
		extract( self::get_args_assoc( $args, array(
			'slug'         => 'sanitize_file_name',
			'network_wide' => 'boolval',
		) ) );

		// $slug = plugin_basename( $slug );

		if ( Jetpack::is_plugin_active( $slug ) ) {
			return array(
				'result'   => false,
				'messages' => array( __( 'Plugin is already active.', 'jetpack' ) ),
			);
		}

		// activate_plugin() does internal validation on the plugin name.
		$result = activate_plugin( $slug, '', $network_wide );
		$messages = is_wp_error( $result ) ? $result->get_error_messages() : array();

		$success = is_plugin_active( $slug );
		if ( $success && $network_wide ) {
			$success &= is_plugin_active_for_network( $slug );
		}

		if ( $success ) {
			$messages[] = __( 'Plugin Activated.', 'jetpack' );
		} else {
			$messages[] = __( 'Error.', 'jetpack' );
		}

		return array(
			'result'   => $success,
			'messages' => $messages,
		);
	}

	/**
	 * Attempts to deactivate a plugin, and returns a status array
	 * designating success|failure & reasons.
	 *
	 * @param $args
	 * @return array
	 */
	public static function plugins_deactivate( $args ) {
		extract( self::get_args_assoc( $args, array(
			'slug'         => 'sanitize_file_name',
			'network_wide' => 'boolval',
		) ) );

		if ( ! Jetpack::is_plugin_active( $slug ) ) {
			return array(
				'result'   => false,
				'messages' => array( __( 'Plugin is already inactive.', 'jetpack' ) ),
			);
		}

		deactivate_plugins( $slug, null, $network_wide );

		$messages = array();
		$success  = ! is_plugin_active( $slug );
		if ( $success && $network_wide ) {
			$success &= ! is_plugin_active_for_network( $slug );
		}

		if ( $success ) {
			$messages[] = __( 'Plugin Deactivated.', 'jetpack' );
		} else {
			$messages[] = __( 'Error.', 'jetpack' );
		}

		return array(
			'result'   => $success,
			'messages' => $messages,
		);
	}

	/**
	 * Returns a list of installed themes, their versions, whether
	 * they are active, and whether there is an available upgrade.
	 *
	 * @param $args
	 * @return array
	 */
	public static function themes( $args ) {
		_maybe_update_themes();

		return array(
			'themes'   => wp_get_themes(),
			'upgrades' => get_site_transient( 'update_themes' ),
		);
	}

	/**
	 * Attempts to activate a theme, and returns a status array
	 * designating success|failure & reasons.
	 *
	 * @param $args
	 * @return array
	 */
	public static function themes_activate( $args ) {
		extract( self::get_args_assoc( $args, array(
			'slug' => 'sanitize_file_name',
		) ) );

		$messages = array();
		$theme    = wp_get_theme( $slug );

		if ( $theme->exists() ) {
			switch_theme( $slug );
			$success    = true;
			$messages[] = __( 'Theme Activated.', 'jetpack' );
		} else {
			$success    = false;
			$messages[] = sprintf( _x( '%s does not exist', '{$theme_slug} does not exist.',  'jetpack' ), $slug );
		}

		return array(
			'result'   => $success,
			'messages' => $messages,
			'data'     => $theme,
		);
	}

	/**
	 * Returns a list of installed translations, their versions,
	 * and whether there is an available upgrade.
	 *
	 * @param $args
	 * @return array
	 */
	public static function translations( $args ) {
		return array(
			'result'   => false,
			'messages' => array( __( 'Not Yet Implemented', 'jetpack' ) ),
		);
	}

	/**
	 * This will take the $args array, and normalize it into an associative array.
	 *
	 * @param $args array|string
	 * @param $into array The array that $args is going to get merged into and returned.
	 *                    Keys are the final keys, Values are the callback performed on the data.
	 * @return array The $into array, with the data escaped.
	 */
	private static function get_args_assoc( $source, $into ) {
		$source = (array) $source;

		foreach ( $into as $key => $callback ) {
			$val = array_shift( $source );
			$into[ $key ] = $val;
			if ( is_callable( $callback ) ) {
				$into[ $key ] = call_user_func( $callback, $val );
			}
		}

		return $into;
	}

}

Jetpack_Manage_Client::init();
