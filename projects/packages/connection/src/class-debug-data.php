<?php
/**
 * The Jetpack section of the Site Health Info tab.
 *
 * @package automattic/jetpack-connection
 */

namespace Automattic\Jetpack\Connection;

use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Identity_Crisis;
use Automattic\Jetpack\Redirect;
use Automattic\Jetpack\Status;
use Jetpack_Options;
use WP_User;

/**
 * Adds connection details to Tools › Site Health › Info, and so to "Copy site info to clipboard".
 *
 * @since $$next-version$$
 */
class Debug_Data {

	/**
	 * The callback older Jetpack versions add the whole section with.
	 *
	 * @var array
	 */
	const LEGACY_CALLBACK = array( 'Jetpack_Debug_Data', 'core_debug_data' );

	/**
	 * Add the Jetpack section, unless an older Jetpack plugin adds its own.
	 *
	 * @since $$next-version$$
	 *
	 * @param array $debug The debug information already compiled by Core.
	 *
	 * @return array The debug information with the Jetpack section.
	 */
	public static function add_section( $debug ) {
		if ( has_filter( 'debug_information', self::LEGACY_CALLBACK ) ) {
			return $debug;
		}

		$debug['jetpack'] = self::get_section();

		return $debug;
	}

	/**
	 * Build the Jetpack section.
	 *
	 * @since $$next-version$$
	 *
	 * @return array The section, in the shape Core's `debug_information` filter expects.
	 */
	public static function get_section() {
		/** This filter is documented in src/health/class-connection-health-test-base.php */
		$support_url = apply_filters( 'jetpack_connection_support_url', Redirect::get_url( 'jetpack-contact-support' ) );

		return array(
			'label'       => __( 'Jetpack', 'jetpack-connection' ),
			'description' => sprintf(
				/* translators: %1$s is URL to jetpack.com's contact support page. %2$s accessibility text */
				__(
					'Diagnostic information helpful to <a href="%1$s" target="_blank" rel="noopener noreferrer">your Jetpack Happiness team<span class="screen-reader-text">%2$s</span></a>',
					'jetpack-connection'
				),
				esc_url( $support_url ),
				__( '(opens in a new tab)', 'jetpack-connection' )
			),
			'fields'      => self::get_fields(),
		);
	}

	/**
	 * Compile the section's fields.
	 *
	 * Labels are deliberately not translated: the report is read by Jetpack support.
	 *
	 * @since $$next-version$$
	 *
	 * @return array Fields keyed by ID, each with a `label`, a `value` and a `private` flag.
	 */
	public static function get_fields() {
		$fields = array(
			'site_id'                  => array(
				'label'   => 'Jetpack Site ID',
				'value'   => Jetpack_Options::get_option( 'id' ),
				'private' => false,
			),
			'ssl_cert'                 => array(
				'label'   => 'Jetpack SSL Verfication Bypass',
				'value'   => Jetpack_Options::get_option( 'fallback_no_verify_ssl_certs' ) ? 'Yes' : 'No',
				'private' => false,
			),
			'time_diff'                => array(
				'label'   => "Offset between Jetpack server's time and this server's time.",
				'value'   => Jetpack_Options::get_option( 'time_diff' ),
				'private' => false,
			),
			'public'                   => array(
				'label'   => 'Jetpack Site Public',
				'value'   => Jetpack_Options::get_option( 'public' ) ? 'Public' : 'Private',
				'private' => false,
			),
			'master_user'              => array(
				'label'   => 'Jetpack Master User',
				'value'   => self::human_readable_master_user(),
				'private' => false,
			),
			'is_offline_mode'          => array(
				'label'   => 'Jetpack Offline Mode',
				'value'   => ( new Status() )->is_offline_mode() ? 'on' : 'off',
				'private' => false,
			),
			'is_offline_mode_constant' => array(
				'label'   => 'JETPACK_DEV_DEBUG Constant',
				'value'   => ( defined( 'JETPACK_DEV_DEBUG' ) && JETPACK_DEV_DEBUG ) ? 'on' : 'off',
				'private' => false,
			),
		);

		$user_id    = get_current_user_id();
		$tokens     = new Tokens();
		$blog_token = $tokens->get_access_token();
		$user_token = $tokens->get_access_token( $user_id );

		$tokenset = trim( ( $blog_token ? 'Blog ' : '' ) . ( $user_token ? 'User' : '' ) );

		$fields['current_user'] = array(
			'label'   => 'Current User',
			'value'   => self::human_readable_user( $user_id ),
			'private' => false,
		);
		$fields['tokens_set']   = array(
			'label'   => 'Tokens defined',
			'value'   => $tokenset ? $tokenset : 'None',
			'private' => false,
		);
		$fields['blog_token']   = array(
			'label'   => 'Blog Public Key',
			'value'   => $blog_token ? self::token_key( $blog_token->secret ) : 'Not set.',
			'private' => false,
		);
		$fields['user_token']   = array(
			'label'   => 'User Public Key',
			'value'   => $user_token ? self::token_key( $user_token->secret ) : 'Not set.',
			'private' => false,
		);

		// Without the Jetpack plugin, these are what say which plugins are on the connection.
		$connected_plugins           = Plugin_Storage::get_all();
		$fields['connected_plugins'] = array(
			'label'   => 'Connected Plugins',
			'value'   => is_array( $connected_plugins ) ? implode( ', ', array_keys( $connected_plugins ) ) : 'Unknown',
			'private' => false,
		);
		$fields['package_versions']  = array(
			'label'   => 'Package Versions',
			'value'   => wp_json_encode( get_option( Package_Version_Tracker::PACKAGE_VERSION_OPTION, array() ), JSON_UNESCAPED_SLASHES ),
			'private' => false,
		);

		foreach ( array(
			'HTTP_HOST',
			'SERVER_PORT',
			'HTTPS',
			'GD_PHP_HANDLER',
			'HTTP_AKAMAI_ORIGIN_HOP',
			'HTTP_CF_CONNECTING_IP',
			'HTTP_CLIENT_IP',
			'HTTP_FASTLY_CLIENT_IP',
			'HTTP_FORWARDED',
			'HTTP_FORWARDED_FOR',
			'HTTP_INCAP_CLIENT_IP',
			'HTTP_TRUE_CLIENT_IP',
			'HTTP_X_CLIENTIP',
			'HTTP_X_CLUSTER_CLIENT_IP',
			'HTTP_X_FORWARDED',
			'HTTP_X_FORWARDED_FOR',
			'HTTP_X_IP_TRAIL',
			'HTTP_X_REAL_IP',
			'HTTP_X_VARNISH',
			'REMOTE_ADDR',
		) as $header ) {
			if ( isset( $_SERVER[ $header ] ) ) {
				$fields[ $header ] = array(
					'label'   => 'Server Variable ' . $header,
					'value'   => empty( $_SERVER[ $header ] ) ? 'false' : filter_var( wp_unslash( $_SERVER[ $header ] ) ),
					// Not secret, but kept out of the copied report so it is not pasted into public forums.
					'private' => true,
				);
			}
		}

		$fields['protect_header'] = array(
			'label'   => 'Trusted IP',
			'value'   => wp_json_encode( get_site_option( 'trusted_ip_header' ), JSON_UNESCAPED_SLASHES ),
			'private' => false,
		);

		/**
		 * Filters the fields of the Jetpack section in Site Health › Info.
		 *
		 * @since $$next-version$$
		 *
		 * @param array $fields Fields keyed by ID, each with a `label`, a `value` and a `private` flag.
		 */
		$filtered = apply_filters( 'jetpack_connection_debug_data', $fields );
		$fields   = is_array( $filtered ) ? $filtered : $fields;

		$idc_urls = array(
			'home'       => Urls::home_url(),
			'siteurl'    => Urls::site_url(),
			'WP_HOME'    => Constants::is_defined( 'WP_HOME' ) ? Constants::get_constant( 'WP_HOME' ) : '',
			'WP_SITEURL' => Constants::is_defined( 'WP_SITEURL' ) ? Constants::get_constant( 'WP_SITEURL' ) : '',
		);

		$fields['idc_urls']         = array(
			'label'   => 'IDC URLs',
			'value'   => wp_json_encode( $idc_urls, JSON_UNESCAPED_SLASHES ),
			'private' => false,
		);
		$fields['idc_error_option'] = array(
			'label'   => 'IDC Error Option',
			'value'   => wp_json_encode( Jetpack_Options::get_option( 'sync_error_idc' ), JSON_UNESCAPED_SLASHES ),
			'private' => false,
		);
		$fields['idc_optin']        = array(
			'label'   => 'IDC Opt-in',
			'value'   => Identity_Crisis::should_handle_idc(),
			'private' => false,
		);

		$cxn_tests           = new Connection_Health_Tests();
		$fields['cxn_tests'] = array(
			'label'   => 'Connection Tests',
			'value'   => $cxn_tests->pass() ? 'All Pass.' : wp_json_encode( $cxn_tests->list_fails(), JSON_UNESCAPED_SLASHES ),
			'private' => false,
		);

		return $fields;
	}

	/**
	 * The part of a token before its period, which identifies it without revealing it.
	 *
	 * @param string $secret The token secret.
	 *
	 * @return string The key, or a note that the token is malformed.
	 */
	private static function token_key( $secret ) {
		$key = substr( $secret, 0, (int) strpos( $secret, '.' ) );

		return $key ? $key : 'Potentially Malformed Token.';
	}

	/**
	 * Describe the connection owner.
	 *
	 * @return string
	 */
	private static function human_readable_master_user() {
		$master_user = Jetpack_Options::get_option( 'master_user' );

		if ( ! $master_user ) {
			return __( 'No master user set.', 'jetpack-connection' );
		}

		$user = new WP_User( $master_user );

		if ( ! $user->exists() ) {
			return __( 'Master user no longer exists. Please disconnect and reconnect Jetpack.', 'jetpack-connection' );
		}

		return self::human_readable_user( $user );
	}

	/**
	 * Describe a user as "#1 username".
	 *
	 * @param WP_User|int $user Object or ID.
	 *
	 * @return string
	 */
	private static function human_readable_user( $user ) {
		$user = new WP_User( $user );

		return sprintf( '#%1$d %2$s', $user->ID, $user->user_login );
	}
}
