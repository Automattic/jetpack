<?php
/**
 * Jetpack Debug Data for the Site Health sections.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Connection\Tokens;
use Automattic\Jetpack\Connection\Urls;
use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Current_Plan as Jetpack_Plan;
use Automattic\Jetpack\Identity_Crisis;
use Automattic\Jetpack\Redirect;
use Automattic\Jetpack\Status;
use Automattic\Jetpack\Sync\Modules;
use Automattic\Jetpack\Sync\Sender;

/**
 * Class Jetpack_Debug_Data
 *
 * Collect and return debug data for Jetpack.
 *
 * @since 7.3.0
 */
class Jetpack_Debug_Data {
	/**
	 * Determine the active plan and normalize it for the debugger results.
	 *
	 * @since 7.3.0
	 *
	 * @return string The plan slug.
	 */
	public static function what_jetpack_plan() {
		$plan = Jetpack_Plan::get();
		return ! empty( $plan['class'] ) ? $plan['class'] : 'undefined';
	}

	/**
	 * Convert seconds to human readable time.
	 *
	 * A dedication function instead of using Core functionality to allow for output in seconds.
	 *
	 * @since 7.3.0
	 *
	 * @param int $seconds Number of seconds to convert to human time.
	 *
	 * @return string Human readable time.
	 */
	public static function seconds_to_time( $seconds ) {
		$seconds = (int) $seconds;
		$units   = array(
			'week'   => WEEK_IN_SECONDS,
			'day'    => DAY_IN_SECONDS,
			'hour'   => HOUR_IN_SECONDS,
			'minute' => MINUTE_IN_SECONDS,
			'second' => 1,
		);
		// specifically handle zero.
		if ( 0 === $seconds ) {
			return '0 seconds';
		}
		$human_readable = '';
		foreach ( $units as $name => $divisor ) {
			$quot = (int) ( $seconds / $divisor );
			if ( $quot ) {
				$human_readable .= "$quot $name";
				$human_readable .= ( abs( $quot ) > 1 ? 's' : '' ) . ', ';
				$seconds        -= $quot * $divisor;
			}
		}
		return substr( $human_readable, 0, -2 );
	}

	/**
	 * Return debug data in the format expected by Core's Site Health Info tab.
	 *
	 * @since 7.3.0
	 *
	 * @param array $debug {
	 *     The debug information already compiled by Core.
	 *
	 *     @type string  $label        The title for this section of the debug output.
	 *     @type string  $description  Optional. A description for your information section which may contain basic HTML
	 *                                 markup: `em`, `strong` and `a` for linking to documentation or putting emphasis.
	 *     @type boolean $show_count   Optional. If set to `true` the amount of fields will be included in the title for
	 *                                 this section.
	 *     @type boolean $private      Optional. If set to `true` the section and all associated fields will be excluded
	 *                                 from the copy-paste text area.
	 *     @type array   $fields {
	 *         An associative array containing the data to be displayed.
	 *
	 *         @type string  $label    The label for this piece of information.
	 *         @type string  $value    The output that is of interest for this field.
	 *         @type boolean $private  Optional. If set to `true` the field will not be included in the copy-paste text area
	 *                                 on top of the page, allowing you to show, for example, API keys here.
	 *     }
	 * }
	 *
	 * @return array $args Debug information in the same format as the initial argument.
	 */
	public static function core_debug_data( $debug ) {
		$support_url = Jetpack::is_development_version()
			? Redirect::get_url( 'jetpack-contact-support-beta-group' )
			: Redirect::get_url( 'jetpack-contact-support' );

		$jetpack = array(
			'jetpack' => array(
				'label'       => __( 'Jetpack', 'jetpack' ),
				'description' => sprintf(
					/* translators: %1$s is URL to jetpack.com's contact support page. %2$s accessibility text */
					__(
						'Diagnostic information helpful to <a href="%1$s" target="_blank" rel="noopener noreferrer">your Jetpack Happiness team<span class="screen-reader-text">%2$s</span></a>',
						'jetpack'
					),
					esc_url( $support_url ),
					__( '(opens in a new tab)', 'jetpack' )
				),
				'fields'      => self::debug_data(),
			),
		);
		$debug   = array_merge( $debug, $jetpack );
		return $debug;
	}

	/**
	 * Compile and return array of debug information.
	 *
	 * @since 7.3.0
	 *
	 * @return array $args {
	 *          Associated array of arrays with the following.
	 *         @type string  $label    The label for this piece of information.
	 *         @type string  $value    The output that is of interest for this field.
	 *         @type boolean $private  Optional. Set to true if data is sensitive (API keys, etc).
	 * }
	 */
	public static function debug_data() {
		$debug_info = array();

		/* Add various important Jetpack options */
		$debug_info['site_id']                  = array(
			'label'   => 'Jetpack Site ID',
			'value'   => Jetpack_Options::get_option( 'id' ),
			'private' => false,
		);
		$debug_info['ssl_cert']                 = array(
			'label'   => 'Jetpack SSL Verfication Bypass',
			'value'   => ( Jetpack_Options::get_option( 'fallback_no_verify_ssl_certs' ) ) ? 'Yes' : 'No',
			'private' => false,
		);
		$debug_info['time_diff']                = array(
			'label'   => "Offset between Jetpack server's time and this server's time.",
			'value'   => Jetpack_Options::get_option( 'time_diff' ),
			'private' => false,
		);
		$debug_info['version_option']           = array(
			'label'   => 'Current Jetpack Version Option',
			'value'   => Jetpack_Options::get_option( 'version' ),
			'private' => false,
		);
		$debug_info['old_version']              = array(
			'label'   => 'Previous Jetpack Version',
			'value'   => Jetpack_Options::get_option( 'old_version' ),
			'private' => false,
		);
		$debug_info['public']                   = array(
			'label'   => 'Jetpack Site Public',
			'value'   => ( Jetpack_Options::get_option( 'public' ) ) ? 'Public' : 'Private',
			'private' => false,
		);
		$debug_info['master_user']              = array(
			'label'   => 'Jetpack Master User',
			'value'   => self::human_readable_master_user(), // Only ID number and user name.
			'private' => false,
		);
		$debug_info['is_offline_mode']          = array(
			'label'   => 'Jetpack Offline Mode',
			'value'   => ( new Status() )->is_offline_mode() ? 'on' : 'off',
			'private' => false,
		);
		$debug_info['is_offline_mode_constant'] = array(
			'label'   => 'JETPACK_DEV_DEBUG Constant',
			'value'   => ( defined( 'JETPACK_DEV_DEBUG' ) && JETPACK_DEV_DEBUG ) ? 'on' : 'off',
			'private' => false,
		);

		/**
		 * Token information is private, but awareness if there one is set is helpful.
		 *
		 * To balance out information vs privacy, we only display and include the "key",
		 * which is a segment of the token prior to a period within the token and is
		 * technically not private.
		 *
		 * If a token does not contain a period, then it is malformed and we report it as such.
		 */
		$user_id    = get_current_user_id();
		$blog_token = ( new Tokens() )->get_access_token();
		$user_token = ( new Tokens() )->get_access_token( $user_id );

		$tokenset = '';
		if ( $blog_token ) {
			$tokenset = 'Blog ';
			$blog_key = substr( $blog_token->secret, 0, strpos( $blog_token->secret, '.' ) );
			// Intentionally not translated since this is helpful when sent to Happiness.
			$blog_key = ( $blog_key ) ? $blog_key : 'Potentially Malformed Token.';
		}
		if ( $user_token ) {
			$tokenset .= 'User';
			$user_key  = substr( $user_token->secret, 0, strpos( $user_token->secret, '.' ) );
			// Intentionally not translated since this is helpful when sent to Happiness.
			$user_key = ( $user_key ) ? $user_key : 'Potentially Malformed Token.';
		}
		if ( ! $tokenset ) {
			$tokenset = 'None';
		}

		$debug_info['current_user'] = array(
			'label'   => 'Current User',
			'value'   => self::human_readable_user( $user_id ),
			'private' => false,
		);
		$debug_info['tokens_set']   = array(
			'label'   => 'Tokens defined',
			'value'   => $tokenset,
			'private' => false,
		);
		$debug_info['blog_token']   = array(
			'label'   => 'Blog Public Key',
			'value'   => ( $blog_token ) ? $blog_key : 'Not set.',
			'private' => false,
		);
		$debug_info['user_token']   = array(
			'label'   => 'User Public Key',
			'value'   => ( $user_token ) ? $user_key : 'Not set.',
			'private' => false,
		);

		/** Jetpack Environmental Information */
		$debug_info['version']       = array(
			'label'   => 'Jetpack Version',
			'value'   => JETPACK__VERSION,
			'private' => false,
		);
		$debug_info['jp_plugin_dir'] = array(
			'label'   => 'Jetpack Directory',
			'value'   => JETPACK__PLUGIN_DIR,
			'private' => false,
		);
		$debug_info['plan']          = array(
			'label'   => 'Plan Type',
			'value'   => self::what_jetpack_plan(),
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
				$debug_info[ $header ] = array(
					'label'   => 'Server Variable ' . $header,
					'value'   => empty( $_SERVER[ $header ] ) ? 'false' : filter_var( wp_unslash( $_SERVER[ $header ] ) ),
					'private' => true, // This isn't really 'private' information, but we don't want folks to easily paste these into public forums.
				);
			}
		}

		$debug_info['protect_header'] = array(
			'label'   => 'Trusted IP',
			'value'   => wp_json_encode( get_site_option( 'trusted_ip_header' ) ),
			'private' => false,
		);

		/** Sync Debug Information */
		$sync_module = Modules::get_module( 'full-sync' );
		'@phan-var \Automattic\Jetpack\Sync\Modules\Full_Sync_Immediately|\Automattic\Jetpack\Sync\Modules\Full_Sync $sync_module';
		if ( $sync_module ) {
			$sync_statuses              = $sync_module->get_status();
			$human_readable_sync_status = array();
			foreach ( $sync_statuses as $sync_status => $sync_status_value ) {
				$human_readable_sync_status[ $sync_status ] =
					in_array( $sync_status, array( 'started', 'queue_finished', 'send_started', 'finished' ), true )
						? gmdate( 'r', $sync_status_value ) : $sync_status_value;
			}
			$debug_info['full_sync'] = array(
				'label'   => 'Full Sync Status',
				'value'   => wp_json_encode( $human_readable_sync_status ),
				'private' => false,
			);
		}

		$queue = Sender::get_instance()->get_sync_queue();

		$debug_info['sync_size'] = array(
			'label'   => 'Sync Queue Size',
			'value'   => $queue->size(),
			'private' => false,
		);
		$debug_info['sync_lag']  = array(
			'label'   => 'Sync Queue Lag',
			'value'   => self::seconds_to_time( $queue->lag() ),
			'private' => false,
		);

		$full_sync_queue = Sender::get_instance()->get_full_sync_queue();

		$debug_info['full_sync_size'] = array(
			'label'   => 'Full Sync Queue Size',
			'value'   => $full_sync_queue->size(),
			'private' => false,
		);
		$debug_info['full_sync_lag']  = array(
			'label'   => 'Full Sync Queue Lag',
			'value'   => self::seconds_to_time( $full_sync_queue->lag() ),
			'private' => false,
		);

		/**
		 * IDC Information
		 *
		 * Must follow sync debug since it depends on sync functionality.
		 */
		$idc_urls = array(
			'home'       => Urls::home_url(),
			'siteurl'    => Urls::site_url(),
			'WP_HOME'    => Constants::is_defined( 'WP_HOME' ) ? Constants::get_constant( 'WP_HOME' ) : '',
			'WP_SITEURL' => Constants::is_defined( 'WP_SITEURL' ) ? Constants::get_constant( 'WP_SITEURL' ) : '',
		);

		$debug_info['idc_urls']         = array(
			'label'   => 'IDC URLs',
			'value'   => wp_json_encode( $idc_urls ),
			'private' => false,
		);
		$debug_info['idc_error_option'] = array(
			'label'   => 'IDC Error Option',
			'value'   => wp_json_encode( Jetpack_Options::get_option( 'sync_error_idc' ) ),
			'private' => false,
		);
		$debug_info['idc_optin']        = array(
			'label'   => 'IDC Opt-in',
			'value'   => Identity_Crisis::should_handle_idc(),
			'private' => false,
		);

		// @todo -- Add testing results?
		$cxn_tests               = new Jetpack_Cxn_Tests();
		$debug_info['cxn_tests'] = array(
			'label'   => 'Connection Tests',
			'value'   => '',
			'private' => false,
		);
		if ( $cxn_tests->pass() ) {
			$debug_info['cxn_tests']['value'] = 'All Pass.';
		} else {
			$debug_info['cxn_tests']['value'] = wp_json_encode( $cxn_tests->list_fails() );
		}

		return $debug_info;
	}

	/**
	 * Returns a human readable string for which user is the master user.
	 *
	 * @return string
	 */
	private static function human_readable_master_user() {
		$master_user = Jetpack_Options::get_option( 'master_user' );

		if ( ! $master_user ) {
			return __( 'No master user set.', 'jetpack' );
		}

		$user = new WP_User( $master_user );

		if ( ! $user ) {
			return __( 'Master user no longer exists. Please disconnect and reconnect Jetpack.', 'jetpack' );
		}

		return self::human_readable_user( $user );
	}

	/**
	 * Return human readable string for a given user object.
	 *
	 * @param WP_User|int $user Object or ID.
	 *
	 * @return string
	 */
	private static function human_readable_user( $user ) {
		$user = new WP_User( $user );

		return sprintf( '#%1$d %2$s', $user->ID, $user->user_login ); // Format: "#1 username".
	}
}
