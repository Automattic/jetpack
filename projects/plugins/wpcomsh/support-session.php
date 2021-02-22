<?php
/**
 * This file provides support session detection and safety.
 * Support session "safety" means avoiding certain actions on behalf of users (e.g., accepting ToS).
 */

if ( defined( 'AT_PROXIED_REQUEST' ) && AT_PROXIED_REQUEST ) {
	if ( ! WPCOMSH_Support_Session_Detect::has_detection_result() ) {
		new WPCOMSH_Support_Session_Detect();
	}

	if ( WPCOMSH_Support_Session_Detect::is_probably_support_session() ) {
		new WPCOMSH_Support_Session_Safety();
	}
}

/**
 * Detects the presence of a support session through Jetpack SSO
 * or a client-side check when SSO is disabled or the Jetpack connection is broken.
 */
class WPCOMSH_Support_Session_Detect {
	const COOKIE_NAME = '_wpcomsh_support_session_detected';

	public function __construct() {
		// Detect support session on Jetpack SSO success
		add_action( 'muplugins_loaded', array( __CLASS__, 'detect_support_session_sso_success' ) );
	}

	/**
	 * Answers whether we already have a detection result
	 */
	public static function has_detection_result() {
		return isset( $_COOKIE[ static::COOKIE_NAME ] );
	}

	/**
	 * Answers whether we think the request is probably part of a support session
	 * 
	 * @return bool
	 */
	public static function is_probably_support_session() {
		if ( isset( $_COOKIE[ static::COOKIE_NAME ] ) ) {
			return 'true' === $_COOKIE[ static::COOKIE_NAME ];
		}
		return false;
	}

	/**
	 * Answers whether a value is a valid detection result
	 * 
	 * @param $candidate_result
	 * @return bool
	 */
	public static function is_valid_detection_result( $candidate_result ) {
		return (
			'true' === $candidate_result ||
			'false' === $candidate_result ||
			'error' === $candidate_result
		);
	}

	/**
	 * Saves the detection result (in a cookie)
	 */
	public static function set_detection_result( $result, $expires = 0 ) {
		if ( static::is_valid_detection_result( $result ) ) {
			// TODO: Consider clearing this cookie on logout
			setcookie(
				static::COOKIE_NAME,
				$result,
				array(
					'path' => '/',
					'expires' => $expires,
					'secure' => true,
					'httponly' => true,
					// Default to Strict SameSite setting until we have a reason to relax it
					'samesite' => 'Strict',
				)
			);
		} else {
			error_log( __CLASS__ . ": unexpected detection result '$result'" );
		}
	}

	/**
	 * Looks for an is_support_session flag on a Jetpack SSO success request
	 */
	public static function detect_support_session_sso_success() {
		$login_path = '/wp-login.php?';
		if (
			0 === strncmp( $_SERVER['REQUEST_URI'], $login_path, strlen( $login_path ) ) &&
			'GET' === $_SERVER['REQUEST_METHOD'] &&
			isset( $_GET['action'] ) && 'jetpack-sso' === $_GET['action'] &&
			isset( $_GET['result'] ) && 'success' === $_GET['result']
		) {
			$is_probably_support_session =
				isset( $_GET['is_support_session' ] ) ? 'true' : 'false'; 

			$expires = 0;
			if ( isset( $_GET['expires'] ) && ctype_digit( $_GET['expires'] ) ) {
				$expires = time() + $_GET['expires'];
			}

			static::set_detection_result( $is_probably_support_session, $expires );
		}
	}
}

/**
 * Attempts to hide ToS acceptance UI and prevent logging user ToS acceptance
 * while in a support session.
 */
class WPCOMSH_Support_Session_Safety {
	public function __construct() {
		add_action( 'admin_body_class', array( __CLASS__, 'enable_writing_support_session_css_rules' ) );
		// Use `admin_print_styles` instead of `admin_enqueue_scripts` to match
		// how Jetpack enqueues its styles (so we can attach inline styles).
		// Use the priority right before 20, when WordPress prints admin styles,
		// to give us the best chance of adding inline styles _after_ Jetpack enqueues its styles.
		add_action( 'admin_print_styles', array( __CLASS__, 'hide_admin_tos_blurbs' ), 19 );

		// Stop Jetpack from saving an option to reflect ToS acceptance
		// Ref: https://github.com/Automattic/jetpack/blob/7054c9a46cdd054cf45c04c85fb5464d179bafb6/projects/packages/terms-of-service/src/class-terms-of-service.php#L21
		add_filter(
			'pre_update_option_jetpack_tos_agreed',
			array( __CLASS__, 'stop_updating_jetpack_tos_agreed_option' ),
			10,
			2
		);

		// Stop Jetpack from logging ToS acceptance using the wpcom public-api
		// TODO: Is there anything we can do to stop the actual request if this measure is ineffective?
		// Ref: https://github.com/Automattic/jetpack/blob/26db3e436ccca3e16a62d02d95e792a81f38a1e4/projects/plugins/jetpack/modules/module-extras.php#L73
		add_filter( 'jetpack_tools_to_include', array( __CLASS__, 'remove_jetpack_wpcom_tos_tool' ) );
	}

	/**
	 * Adds a support-session class to admin body tags so we can write CSS rules
	 * that apply only for support sessions.
	 * 
	 * @param $body_element_classes
	 * @return string
	 */
	public static function enable_writing_support_session_css_rules( $body_element_classes ) {
		$body_element_classes .= ' support-session';
		return $body_element_classes;
	}

	/**
	 * Adds inline styles to hide ToS blurbs
	 */
	public static function hide_admin_tos_blurbs() {
		// Stop showing ToS blurbs during support sessions
		wp_add_inline_style( 'jetpack', '
			.support-session .jp-banner__tos-blurb,
			.support-session .jp-connect-full__tos-blurb {
				visibility: hidden !important;
			}
		' );
	}

	/**
	 * Prevent updates to the `jetpack_tos_agreed` option
	 * 
	 * @param $new_value
	 * @param $old_value
	 * 
	 * @return string the old option value
	 */
	public static function stop_updating_jetpack_tos_agreed_option( $new_value, $old_value ) {
		// return old value to stop saving a new option value
		return $old_value;
	}

	/**
	 * Filter out the wpcom-tos tool from the tools Jetpack wants to load
	 * 
	 * @param $jetpack_tools
	 * 
	 * @return array the Jetpack tools without the wpcom-tos tool
	 */
	public static function remove_jetpack_wpcom_tos_tool( $jetpack_tools ) {
		$filtered_jetpack_tools = array_filter( $jetpack_tools, function ( $tool_path ) {
			$file_to_exclude = 'wpcom-tos.php';
			$search_from_end = - strlen( $file_to_exclude );
			return 0 !== substr_compare( $tool_path, $file_to_exclude, $search_from_end );
		} );
		return $filtered_jetpack_tools;
	}
}
