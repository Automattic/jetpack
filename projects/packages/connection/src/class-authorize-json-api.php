<?php
/**
 * Authorize_Json_Api handler class.
 * Used to handle connections via JSON API.
 * Ported from the Jetpack class.
 *
 * @since 2.7.6 Ported from the Jetpack class.
 *
 * @package automattic/jetpack-connection
 */

namespace Automattic\Jetpack\Connection;

use Automattic\Jetpack\Redirect;
use Automattic\Jetpack\Status\Host;
use Jetpack_Options;

/**
 * Authorize_Json_Api handler class.
 */
class Authorize_Json_Api {
	/**
	 * Verified data for JSON authorization request
	 *
	 * @since 2.7.6
	 *
	 * @var array
	 */
	public $json_api_authorization_request = array();

	/**
	 * Verifies the request by checking the signature
	 *
	 * @since jetpack-4.6.0 Method was updated to use `$_REQUEST` instead of `$_GET` and `$_POST`. Method also updated to allow
	 * passing in an `$environment` argument that overrides `$_REQUEST`. This was useful for integrating with SSO.
	 * @since 2.7.6 Ported from Jetpack to the Connection package.
	 *
	 * @param null|array $environment Value to override $_REQUEST.
	 *
	 * @return void
	 */
	public function verify_json_api_authorization_request( $environment = null ) {
		$environment = $environment === null
			? $_REQUEST // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- nonce verification handled later in function and request data are 1) used to verify a cryptographic signature of the request data and 2) sanitized later in function.
			: $environment;

		if ( ! isset( $environment['token'] ) ) {
			wp_die( esc_html__( 'You must connect your Jetpack plugin to WordPress.com to use this feature.', 'jetpack-connection' ) );
		}

		list( $env_token,, $env_user_id ) = explode( ':', $environment['token'] );
		$token                            = ( new Tokens() )->get_access_token( (int) $env_user_id, $env_token );
		if ( ! $token || empty( $token->secret ) ) {
			wp_die( esc_html__( 'You must connect your Jetpack plugin to WordPress.com to use this feature.', 'jetpack-connection' ) );
		}

		$die_error = __( 'Someone may be trying to trick you into giving them access to your site. Or it could be you just encountered a bug :).  Either way, please close this window.', 'jetpack-connection' );

		// Host has encoded the request URL, probably as a result of a bad http => https redirect.
		if (
			preg_match( '/https?%3A%2F%2F/i', esc_url_raw( wp_unslash( $_GET['redirect_to'] ) ) ) > 0 // phpcs:ignore WordPress.Security.NonceVerification.Recommended, WordPress.Security.ValidatedSanitizedInput.InputNotValidated -- no site changes, we're erroring out.
		) {
			/**
			 * Jetpack authorisation request Error.
			 *
			 * @since jetpack-7.5.0
			 */
			do_action( 'jetpack_verify_api_authorization_request_error_double_encode' );
			$die_error = sprintf(
				/* translators: %s is a URL */
				__( 'Your site is incorrectly double-encoding redirects from http to https. This is preventing Jetpack from authenticating your connection. Please visit our <a href="%s">support page</a> for details about how to resolve this.', 'jetpack-connection' ),
				esc_url( Redirect::get_url( 'jetpack-support-double-encoding' ) )
			);
		}

		$jetpack_signature = new \Jetpack_Signature( $token->secret, (int) Jetpack_Options::get_option( 'time_diff' ) );

		if ( isset( $environment['jetpack_json_api_original_query'] ) ) {
			$signature = $jetpack_signature->sign_request(
				$environment['token'],
				$environment['timestamp'],
				$environment['nonce'],
				'',
				'GET',
				$environment['jetpack_json_api_original_query'],
				null,
				true
			);
		} else {
			$signature = $jetpack_signature->sign_current_request(
				array(
					'body'   => null,
					'method' => 'GET',
				)
			);
		}

		if ( ! $signature ) {
			wp_die(
				wp_kses(
					$die_error,
					array(
						'a' => array(
							'href' => array(),
						),
					)
				)
			);
		} elseif ( is_wp_error( $signature ) ) {
			wp_die(
				wp_kses(
					$die_error,
					array(
						'a' => array(
							'href' => array(),
						),
					)
				)
			);
		} elseif ( ! hash_equals( $signature, $environment['signature'] ) ) {
			if ( is_ssl() ) {
				// If we signed an HTTP request on the Jetpack Servers, but got redirected to HTTPS by the local blog, check the HTTP signature as well.
				$signature = $jetpack_signature->sign_current_request(
					array(
						'scheme' => 'http',
						'body'   => null,
						'method' => 'GET',
					)
				);
				if ( ! $signature || is_wp_error( $signature ) || ! hash_equals( $signature, $environment['signature'] ) ) {
					wp_die(
						wp_kses(
							$die_error,
							array(
								'a' => array(
									'href' => array(),
								),
							)
						)
					);
				}
			} else {
				wp_die(
					wp_kses(
						$die_error,
						array(
							'a' => array(
								'href' => array(),
							),
						)
					)
				);
			}
		}

		$timestamp = (int) $environment['timestamp'];
		$nonce     = stripslashes( (string) $environment['nonce'] );

		if ( ! ( new Nonce_Handler() )->add( $timestamp, $nonce ) ) {
			// De-nonce the nonce, at least for 5 minutes.
			// We have to reuse this nonce at least once (used the first time when the initial request is made, used a second time when the login form is POSTed).
			$old_nonce_time = get_option( "jetpack_nonce_{$timestamp}_{$nonce}" );
			if ( $old_nonce_time < time() - 300 ) {
				wp_die( esc_html__( 'The authorization process expired. Please go back and try again.', 'jetpack-connection' ) );
			}
		}

		$data         = json_decode(
			base64_decode( stripslashes( $environment['data'] ) ) // phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_decode
		);
		$data_filters = array(
			'state'        => 'opaque',
			'client_id'    => 'int',
			'client_title' => 'string',
			'client_image' => 'url',
		);

		foreach ( $data_filters as $key => $sanitation ) {
			if ( ! isset( $data->$key ) ) {
				wp_die(
					wp_kses(
						$die_error,
						array(
							'a' => array(
								'href' => array(),
							),
						)
					)
				);
			}

			switch ( $sanitation ) {
				case 'int':
					$this->json_api_authorization_request[ $key ] = (int) $data->$key;
					break;
				case 'opaque':
					$this->json_api_authorization_request[ $key ] = (string) $data->$key;
					break;
				case 'string':
					$this->json_api_authorization_request[ $key ] = wp_kses( (string) $data->$key, array() );
					break;
				case 'url':
					$this->json_api_authorization_request[ $key ] = esc_url_raw( (string) $data->$key );
					break;
			}
		}

		if ( empty( $this->json_api_authorization_request['client_id'] ) ) {
			wp_die(
				wp_kses(
					$die_error,
					array(
						'a' => array(
							'href' => array(),
						),
					)
				)
			);
		}
	}

	/**
	 * Add the Access Code details to the public-api.wordpress.com redirect.
	 *
	 * @since 2.7.6 Ported from Jetpack to the Connection package.
	 *
	 * @param string   $redirect_to URL.
	 * @param string   $original_redirect_to URL.
	 * @param \WP_User $user WP_User for the redirect.
	 *
	 * @return string
	 */
	public function add_token_to_login_redirect_json_api_authorization( $redirect_to, $original_redirect_to, $user ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		return add_query_arg(
			urlencode_deep(
				array(
					'jetpack-code'    => get_user_meta(
						$user->ID,
						'jetpack_json_api_' . $this->json_api_authorization_request['client_id'],
						true
					),
					'jetpack-user-id' => (int) $user->ID,
					'jetpack-state'   => $this->json_api_authorization_request['state'],
				)
			),
			$redirect_to
		);
	}

	/**
	 * If someone logs in to approve API access, store the Access Code in usermeta.
	 *
	 * @since 2.7.6 Ported from Jetpack to the Connection package.
	 *
	 * @param string   $user_login Unused.
	 * @param \WP_User $user User logged in.
	 *
	 * @return void
	 */
	public function store_json_api_authorization_token( $user_login, $user ) {
		add_filter( 'login_redirect', array( $this, 'add_token_to_login_redirect_json_api_authorization' ), 10, 3 );
		add_filter( 'allowed_redirect_hosts', array( Host::class, 'allow_wpcom_public_api_domain' ) );
		$token = wp_generate_password( 32, false );
		update_user_meta( $user->ID, 'jetpack_json_api_' . $this->json_api_authorization_request['client_id'], $token );
	}

	/**
	 * HTML for the JSON API authorization notice.
	 *
	 * @since 2.7.6 Ported from Jetpack to the Connection package.
	 *
	 * @return string
	 */
	public function login_message_json_api_authorization() {
		return '<p class="message">' . sprintf(
			/* translators: Name/image of the client requesting authorization */
			esc_html__( '%s wants to access your site’s data. Log in to authorize that access.', 'jetpack-connection' ),
			'<strong>' . esc_html( $this->json_api_authorization_request['client_title'] ) . '</strong>'
		) . '<img src="' . esc_url( $this->json_api_authorization_request['client_image'] ) . '" /></p>';
	}
}
