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
	const COOKIE_NAME                  = '_wpcomsh_support_session_detected';
	const DETECTION_URI                = '/_wpcomsh_detect_support_session';
	const NONCE_ACTION                 = 'support-session-detect';
	const NONCE_NAME                   = 'nonce';
	const LOGIN_PATH                   = '/wp-login.php';
	const QUERY_PARAM_TO_SHORT_CIRCUIT = 'disable-support-session-detection';
	const EMERGENCY_LOGIN_PATH         = '/wp-login.php?' . self::QUERY_PARAM_TO_SHORT_CIRCUIT;

	public function __construct() {
		// Detect support session on WordPress.com SSO success
		add_action( 'muplugins_loaded', array( __CLASS__, 'detect_support_session_sso_success' ) );

		// Detect support session via client-side check when both of the following are true:
		// - User is not logged in
		// - Jetpack is disconnected or Jetpack SSO is disabled
		add_action( 'login_init', array( __CLASS__, 'handle_detection_redirect' ), -1 );
		add_action( 'plugins_loaded', array( __CLASS__, 'handle_detection_requests' ), -1 );
	}

	/**
	 * Answers whether we need to detect whether the request is probably part of a support session.
	 *
	 * NOTE: This method is marked private because it is for internal use and can only be called
	 * safely after pluggable functions have been declared.
	 *
	 * @return bool
	 */
	private static function need_to_detect() {
		return (
			! is_user_logged_in() &&
			! static::has_detection_result() &&
			! ( class_exists( 'Jetpack' ) && Jetpack::is_connection_ready() && Jetpack::is_module_active( 'sso' ) ) &&
			! isset( $_GET[ static::QUERY_PARAM_TO_SHORT_CIRCUIT ] )
		);
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
		return in_array( $candidate_result, array( 'true', 'false' ) );
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
					'path'     => '/',
					'expires'  => $expires,
					'secure'   => true,
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
	 * Looks for an is_support_session flag on a WordPress.com SSO success request
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
				isset( $_GET['is_support_session'] ) ? 'true' : 'false';

			$expires = 0;
			if ( isset( $_GET['expires'] ) && ctype_digit( $_GET['expires'] ) ) {
				$expires = time() + $_GET['expires'];
			}

			static::set_detection_result( $is_probably_support_session, $expires );
		}
	}

	/**
	 * Redirects unauthenticated wp-login requests to a client-side detection page
	 * when Jetpack is disconnected or SSO is disabled.
	 */
	public static function handle_detection_redirect() {
		if ( ! static::need_to_detect() ) {
			return;
		}

		$is_simple_login_page_request =
			'GET' === $_SERVER['REQUEST_METHOD'] &&
			static::LOGIN_PATH === parse_url( $_SERVER['REQUEST_URI'], PHP_URL_PATH ) &&
			( empty( $_GET['action'] ) || 'jetpack-sso' !== $_GET['action'] );

		if ( $is_simple_login_page_request ) {
			// After detection, we will redirect to this login URL.
			// Add a query param to short-circuit detection so that if something goes wrong
			// we do not end up in a login->detect redirect loop.
			$destination_login_uri = add_query_arg(
				static::QUERY_PARAM_TO_SHORT_CIRCUIT,
				// empty value because this query param is just a flag
				'',
				$_SERVER['REQUEST_URI']
			);

			$detection_uri = add_query_arg(
				array(
					'redirect' => urlencode( $destination_login_uri ),
					'nonce'    => wp_create_nonce( static::NONCE_ACTION ),
				),
				static::DETECTION_URI
			);
			wp_redirect( $detection_uri );
			die;
		}
	}

	/**
	 * Handles GETs and POSTs to the client-side support session detection page
	 */
	public static function handle_detection_requests() {
		if ( 0 !== strncmp( $_SERVER['REQUEST_URI'], static::DETECTION_URI, strlen( static::DETECTION_URI ) ) ) {
			return;
		}

		if ( 'GET' === $_SERVER['REQUEST_METHOD'] ) {
			static::print_detection_ui();
			die;
		}

		if ( 'POST' === $_SERVER['REQUEST_METHOD'] ) {
			if ( isset( $_POST['result'] ) && static::is_valid_detection_result( $_POST['result'] ) ) {
				static::set_detection_result( $_POST['result'] );
			}

			// Return to original login path
			if (
				'/' === substr( $_GET['redirect'], 0, 1 ) &&
				static::LOGIN_PATH === parse_url( $_GET['redirect'], PHP_URL_PATH )
			) {
				$redirect = $_GET['redirect'];
			} else {
				// Use "emergency" login path to avoid infinite login->detect redirect loop
				$redirect = static::EMERGENCY_LOGIN_PATH;
			}
			wp_redirect( $redirect );
			die;
		}
	}

	/**
	 * Prints a page to attempt support session detection on the client side,
	 * since it is the browser that may own either support session cookies
	 * or an extension-managed support session.
	 */
	public static function print_detection_ui() {
		?>
		<!DOCTYPE html>
		<html>
			<head>
				<meta charset="UTF-8">
				<title>Detect Support Session</title>
				<style>
					body {
						/* add enough padding to render below the support session status overlay */
						padding: 57px;
						display: flex;
						flex-direction: column;
						align-items: center;
						font-size: larger;
						font-family: sans-serif;
					}

					body > * {
						margin: 42px;
					}

					#error-report {
						color: red;
					}

					#escape-hatch {
						background: lavender;
						padding: 0 13px;
						width: min( 37em, 90vw );
						font-size: 80%;
					}
				</style>
			</head>
			<body>
				<p>Asking WordPress.com whether we are in a support session...</p>
				<div id="escape-hatch">
					<p>This check is for Automatticians only and should normally complete in a few seconds.</p>
					<p>
						We normally detect support sessions via WordPress.com SSO and only
						resort to this check when SSO is disabled or Jetpack is disconnected.
					</p>
					<p>If you encounter an error or the page appears to be stalled, please do the following:</p>
					<ul>
						<li>Check the dev tools console for errors</li>
						<li>Let us know on the Atomic Requests P2</li>
						<li>
							Continue login without support session detection by clicking
							<a target="_blank" href="<?php echo esc_url( static::EMERGENCY_LOGIN_PATH ); ?>">here</a>
						</li>
					</ul>
				</div>
				<form id="result-form" method="POST">
					<input id="result-field" type="hidden" name="result" value="">
				</form>
				<script>
					function wpcomshHandleFailure( message ) {
						if ( ! message ) {
							message = 'Unknown error';
						}
						console.error( message );

						var errorElement = document.createElement( 'p' );
						errorElement.id = 'error-report';
						errorElement.textContent = 'Error: ' + message;

						var escapeHatchElement = document.getElementById( 'escape-hatch' );
						escapeHatchElement.parentNode.insertBefore( errorElement, escapeHatchElement );
					}

					function wpcomshPostDetectionResult( resultValue ) {
						var resultForm = document.getElementById( 'result-form' );
						var resultField = document.getElementById( 'result-field' );

						resultField.value = resultValue;
						resultForm.submit();
					}
					
					function wpcomshHandleReadyStateChange() {
						if ( XMLHttpRequest.DONE !== xhr.readyState ) {
							return;
						}

						if ( 200 !== xhr.status ) {
							wpcomshHandleFailure( 'Unexpected HTTP status code: ' + xhr.status );
							return;
						}

						if ( ! xhr.responseText ) {
							wpcomshHandleFailure( 'Empty response' );
							return;
						}

						var parsedResponse = JSON.parse( xhr.responseText );
						if ( typeof parsedResponse === 'boolean' ) {
							wpcomshPostDetectionResult( parsedResponse.toString() );
						} else {
							wpcomHandleFailure( 'Unexpected result type: ' + ( typeof parsedResponse ) );
						}
					}

					// Handle exceptional errors in one place rather than using scattered try/catch blocks
					window.addEventListener( 'error', function ( errorEvent ) {
						var message = errorEvent.message || 'Unknown unhandled error';
						wpcomshHandleFailure( message );
					} );

					// Use basic XMLHttpRequest to avoid errors in older browsers
					var xhr = new XMLHttpRequest();
					xhr.open(
						'POST',
						'https://public-api.wordpress.com/wpcom/v2/atomic/is-probably-support-session',
					);
					xhr.onreadystatechange = wpcomshHandleReadyStateChange;
					xhr.timeout = 15 * 1000;
					xhr.ontimeout = function () {
						wpcomshHandleFailure( 'Support session detection timed out' );
					};
					xhr.send();
				</script>
			</body>
		</html>
		<?php
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
		wp_add_inline_style(
			'jetpack',
			'
			.support-session .jp-banner__tos-blurb,
			.support-session .jp-connect-full__tos-blurb {
				visibility: hidden !important;
			}
		'
		);
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
		$filtered_jetpack_tools = array_filter(
			$jetpack_tools,
			function ( $tool_path ) {
				$file_to_exclude = 'wpcom-tos.php';
				$search_from_end = - strlen( $file_to_exclude );
				return 0 !== substr_compare( $tool_path, $file_to_exclude, $search_from_end );
			}
		);
		return $filtered_jetpack_tools;
	}
}
