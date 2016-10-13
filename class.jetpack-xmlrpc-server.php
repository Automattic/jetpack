<?php

/**
 * Just a sack of functions.  Not actually an IXR_Server
 */
class Jetpack_XMLRPC_Server {
	/**
	 * The current error object
	 */
	public $error = null;

	/**
	 * Whitelist of the XML-RPC methods available to the Jetpack Server. If the
	 * user is not authenticated (->login()) then the methods are never added,
	 * so they will get a "does not exist" error.
	 */
	function xmlrpc_methods( $core_methods ) {
		$jetpack_methods = array(
			'jetpack.jsonAPI'      => array( $this, 'json_api' ),
			'jetpack.verifyAction' => array( $this, 'verify_action' ),
		);

		$user = $this->login();

		if ( $user ) {
			$jetpack_methods = array_merge( $jetpack_methods, array(
				'jetpack.testConnection'    => array( $this, 'test_connection' ),
				'jetpack.testAPIUserCode'   => array( $this, 'test_api_user_code' ),
				'jetpack.featuresAvailable' => array( $this, 'features_available' ),
				'jetpack.featuresEnabled'   => array( $this, 'features_enabled' ),
				'jetpack.disconnectBlog'    => array( $this, 'disconnect_blog' ),
				'jetpack.unlinkUser'        => array( $this, 'unlink_user' ),
				'jetpack.syncObject'        => array( $this, 'sync_object' ),
				'jetpack.idcUrlValidation'  => array( $this, 'validate_urls_for_idc_mitigation' ),
			) );

			if ( isset( $core_methods['metaWeblog.editPost'] ) ) {
				$jetpack_methods['metaWeblog.newMediaObject'] = $core_methods['metaWeblog.newMediaObject'];
				$jetpack_methods['jetpack.updateAttachmentParent'] = array( $this, 'update_attachment_parent' );
			}

			/**
			 * Filters the XML-RPC methods available to Jetpack for authenticated users.
			 *
			 * @since 1.1.0
			 *
			 * @param array $jetpack_methods XML-RPC methods available to the Jetpack Server.
			 * @param array $core_methods Available core XML-RPC methods.
			 * @param WP_User $user Information about a given WordPress user.
			 */
			$jetpack_methods = apply_filters( 'jetpack_xmlrpc_methods', $jetpack_methods, $core_methods, $user );
		}

		/**
		 * Filters the XML-RPC methods available to Jetpack for unauthenticated users.
		 *
		 * @since 3.0.0
		 *
		 * @param array $jetpack_methods XML-RPC methods available to the Jetpack Server.
		 * @param array $core_methods Available core XML-RPC methods.
		 */
		return apply_filters( 'jetpack_xmlrpc_unauthenticated_methods', $jetpack_methods, $core_methods );
	}

	/**
	 * Whitelist of the bootstrap XML-RPC methods
	 */
	function bootstrap_xmlrpc_methods() {
		return array(
			'jetpack.verifyRegistration' => array( $this, 'verify_registration' ),
			'jetpack.remoteAuthorize' => array( $this, 'remote_authorize' ),
		);
	}

	function authorize_xmlrpc_methods() {
		return array(
			'jetpack.remoteAuthorize' => array( $this, 'remote_authorize' ),
			'jetpack.activateManage'    => array( $this, 'activate_manage' ),
		);
	}

	function activate_manage( $request ) {
		foreach( array( 'secret', 'state' ) as $required ) {
			if ( ! isset( $request[ $required ] ) || empty( $request[ $required ] ) ) {
				return $this->error( new Jetpack_Error( 'missing_parameter', 'One or more parameters is missing from the request.', 400 ) );
			}
		}
		$verified = $this->verify_action( array( 'activate_manage', $request['secret'], $request['state'] ) );
		if ( is_a( $verified, 'IXR_Error' ) ) {
			return $verified;
		}
		$activated = Jetpack::activate_module( 'manage', false, false );
		if ( false === $activated || ! Jetpack::is_module_active( 'manage' ) ) {
			return $this->error( new Jetpack_Error( 'activation_error', 'There was an error while activating the module.', 500 ) );
		}
		return 'active';
	}

	function remote_authorize( $request ) {
		foreach( array( 'secret', 'state', 'redirect_uri', 'code' ) as $required ) {
			if ( ! isset( $request[ $required ] ) || empty( $request[ $required ] ) ) {
				return $this->error( new Jetpack_Error( 'missing_parameter', 'One or more parameters is missing from the request.', 400 ) );
			}
		}

		if ( ! get_user_by( 'id', $request['state'] ) ) {
			return $this->error( new Jetpack_Error( 'user_unknown', 'User not found.', 404 ) );
		}

		if ( Jetpack::is_active() && Jetpack::is_user_connected( $request['state'] ) ) {
			return $this->error( new Jetpack_Error( 'already_connected', 'User already connected.', 400 ) );
		}

		$verified = $this->verify_action( array( 'authorize', $request['secret'], $request['state'] ) );

		if ( is_a( $verified, 'IXR_Error' ) ) {
			return $verified;
		}

		wp_set_current_user( $request['state'] );

		$client_server = new Jetpack_Client_Server;
		$result = $client_server->authorize( $request );

		if ( is_wp_error( $result ) ) {
			return $this->error( $result );
		}
		// Creates a new secret, allowing someone to activate the manage module for up to 1 day after authorization.
		$secrets = Jetpack::init()->generate_secrets( 'activate_manage', DAY_IN_SECONDS );
		@list( $secret ) = explode( ':', $secrets );
		$response = array(
			'result' => $result,
			'activate_manage' => $secret,
		);
		return $response;
	}

	/**
	* Verifies that Jetpack.WordPress.com received a registration request from this site
	*/
	function verify_registration( $data ) {
		return $this->verify_action( array( 'register', $data[0], $data[1] ) );
	}

	/**
	 * @return WP_Error|string secret_2 on success, WP_Error( error_code => error_code, error_message => error description, error_data => status code ) on failure
	 *
	 * Possible error_codes:
	 *
	 * verify_secret_1_missing
	 * verify_secret_1_malformed
	 * verify_secrets_missing: verification secrets are not found in database
	 * verify_secrets_incomplete: verification secrets are only partially found in database
	 * verify_secrets_expired: verification secrets have expired
	 * verify_secrets_mismatch: stored secret_1 does not match secret_1 sent by Jetpack.WordPress.com
	 * state_missing: required parameter of state not found
	 * state_malformed: state is not a digit
	 * invalid_state: state in request does not match the stored state
	 *
	 * The 'authorize' and 'register' actions have additional error codes
	 *
	 * state_missing: a state ( user id ) was not supplied
	 * state_malformed: state is not the correct data type
	 * invalid_state: supplied state does not match the stored state
	 */
	function verify_action( $params ) {
		$action = $params[0];
		$verify_secret = $params[1];
		$state = isset( $params[2] ) ? $params[2] : '';

		if ( empty( $verify_secret ) ) {
			return $this->error( new Jetpack_Error( 'verify_secret_1_missing', sprintf( 'The required "%s" parameter is missing.', 'secret_1' ), 400 ) );
		} else if ( ! is_string( $verify_secret ) ) {
			return $this->error( new Jetpack_Error( 'verify_secret_1_malformed', sprintf( 'The required "%s" parameter is malformed.', 'secret_1' ), 400 ) );
		}

		$secrets = Jetpack_Options::get_option( $action );
		if ( ! $secrets || is_wp_error( $secrets ) ) {
			Jetpack_Options::delete_option( $action );
			return $this->error( new Jetpack_Error( 'verify_secrets_missing', 'Verification secrets not found', 400 ) );
		}

		@list( $secret_1, $secret_2, $secret_eol, $user_id ) = explode( ':', $secrets );

		if ( empty( $secret_1 ) || empty( $secret_2 ) || empty( $secret_eol ) ) {
			Jetpack_Options::delete_option( $action );
			return $this->error( new Jetpack_Error( 'verify_secrets_incomplete', 'Verification secrets are incomplete', 400 ) );
		}

		if ( $secret_eol < time() ) {
			Jetpack_Options::delete_option( $action );
			return $this->error( new Jetpack_Error( 'verify_secrets_expired', 'Verification took too long', 400 ) );
		}

		if ( ! hash_equals( $verify_secret, $secret_1 ) ) {
			Jetpack_Options::delete_option( $action );
			return $this->error( new Jetpack_Error( 'verify_secrets_mismatch', 'Secret mismatch', 400 ) );
		}

		if ( in_array( $action, array( 'authorize', 'register' ) ) ) {
			// 'authorize' and 'register' actions require further testing
			if ( empty( $state ) ) {
				return $this->error( new Jetpack_Error( 'state_missing', sprintf( 'The required "%s" parameter is missing.', 'state' ), 400 ) );
			} else if ( ! ctype_digit( $state ) ) {
				return $this->error( new Jetpack_Error( 'state_malformed', sprintf( 'The required "%s" parameter is malformed.', 'state' ), 400 ) );
			}
			if ( empty( $user_id ) || $user_id !== $state ) {
				Jetpack_Options::delete_option( $action );
				return $this->error( new Jetpack_Error( 'invalid_state', 'State is invalid', 400 ) );
			}
		}

		Jetpack_Options::delete_option( $action );

		return $secret_2;
	}

	/**
	 * Wrapper for wp_authenticate( $username, $password );
	 *
	 * @return WP_User|bool
	 */
	function login() {
		Jetpack::init()->require_jetpack_authentication();
		$user = wp_authenticate( 'username', 'password' );
		if ( is_wp_error( $user ) ) {
			if ( 'authentication_failed' == $user->get_error_code() ) { // Generic error could mean most anything.
				$this->error = new Jetpack_Error( 'invalid_request', 'Invalid Request', 403 );
			} else {
				$this->error = $user;
			}
			return false;
		} else if ( !$user ) { // Shouldn't happen.
			$this->error = new Jetpack_Error( 'invalid_request', 'Invalid Request', 403 );
			return false;
		}

		return $user;
	}

	/**
	 * Returns the current error as an IXR_Error
	 *
	 * @return bool|IXR_Error
	 */
	function error( $error = null ) {
		if ( !is_null( $error ) ) {
			$this->error = $error;
		}

		if ( is_wp_error( $this->error ) ) {
			$code = $this->error->get_error_data();
			if ( !$code ) {
				$code = -10520;
			}
			$message = sprintf( 'Jetpack: [%s] %s', $this->error->get_error_code(), $this->error->get_error_message() );
			return new IXR_Error( $code, $message );
		} else if ( is_a( $this->error, 'IXR_Error' ) ) {
			return $this->error;
		}

		return false;
	}

/* API Methods */

	/**
	 * Just authenticates with the given Jetpack credentials.
	 *
	 * @return string The current Jetpack version number
	 */
	function test_connection() {
		return JETPACK__VERSION;
	}

	function test_api_user_code( $args ) {
		$client_id = (int) $args[0];
		$user_id   = (int) $args[1];
		$nonce     = (string) $args[2];
		$verify    = (string) $args[3];

		if ( !$client_id || !$user_id || !strlen( $nonce ) || 32 !== strlen( $verify ) ) {
			return false;
		}

		$user = get_user_by( 'id', $user_id );
		if ( !$user || is_wp_error( $user ) ) {
			return false;
		}

		/* debugging
		error_log( "CLIENT: $client_id" );
		error_log( "USER:   $user_id" );
		error_log( "NONCE:  $nonce" );
		error_log( "VERIFY: $verify" );
		*/

		$jetpack_token = Jetpack_Data::get_access_token( JETPACK_MASTER_USER );

		$api_user_code = get_user_meta( $user_id, "jetpack_json_api_$client_id", true );
		if ( !$api_user_code ) {
			return false;
		}

		$hmac = hash_hmac( 'md5', json_encode( (object) array(
			'client_id' => (int) $client_id,
			'user_id'   => (int) $user_id,
			'nonce'     => (string) $nonce,
			'code'      => (string) $api_user_code,
		) ), $jetpack_token->secret );

		if ( ! hash_equals( $hmac, $verify ) ) {
			return false;
		}

		return $user_id;
	}

	/**
	* Disconnect this blog from the connected wordpress.com account
	* @return boolean
	*/
	function disconnect_blog() {
		Jetpack::log( 'disconnect' );
		Jetpack::disconnect();

		return true;
	}

	/**
	 * Unlink a user from WordPress.com
	 *
	 * This will fail if called by the Master User.
	 */
	function unlink_user() {
		Jetpack::log( 'unlink' );
		return Jetpack::unlink_user();
	}

	/**
	 * Returns any object that is able to be synced
	 */
	function sync_object( $args ) {
		// e.g. posts, post, 5
		list( $module_name, $object_type, $id ) = $args;
		require_once dirname( __FILE__ ) . '/sync/class.jetpack-sync-modules.php';
		require_once dirname( __FILE__ ) . '/sync/class.jetpack-sync-sender.php';

		$sync_module = Jetpack_Sync_Modules::get_module( $module_name );
		$codec = Jetpack_Sync_Sender::get_instance()->get_codec();

		return $codec->encode( $sync_module->get_object_by_id( $object_type, $id ) );
	}

	/**
	 * Returns the home URL and site URL for the current site which can be used on the WPCOM side for
	 * IDC mitigation to decide whether sync should be allowed if the home and siteurl values differ between WPCOM
	 * and the remote Jetpack site.
	 *
	 * @return array
	 */
	function validate_urls_for_idc_mitigation() {
		return array(
			'home'    => get_home_url(),
			'siteurl' => get_site_url(),
		);
	}

	/**
	 * Returns what features are available. Uses the slug of the module files.
	 *
	 * @return array
	 */
	function features_available() {
		$raw_modules = Jetpack::get_available_modules();
		$modules = array();
		foreach ( $raw_modules as $module ) {
			$modules[] = Jetpack::get_module_slug( $module );
		}

		return $modules;
	}

	/**
	 * Returns what features are enabled. Uses the slug of the modules files.
	 *
	 * @return array
	 */
	function features_enabled() {
		$raw_modules = Jetpack::get_active_modules();
		$modules = array();
		foreach ( $raw_modules as $module ) {
			$modules[] = Jetpack::get_module_slug( $module );
		}

		return $modules;
	}

	function update_attachment_parent( $args ) {
		$attachment_id = (int) $args[0];
		$parent_id     = (int) $args[1];

		return wp_update_post( array(
			'ID'          => $attachment_id,
			'post_parent' => $parent_id,
		) );
	}

	function json_api( $args = array() ) {
		$json_api_args = $args[0];
		$verify_api_user_args = $args[1];

		$method       = (string) $json_api_args[0];
		$url          = (string) $json_api_args[1];
		$post_body    = is_null( $json_api_args[2] ) ? null : (string) $json_api_args[2];
		$user_details = (array) $json_api_args[4];
		$locale       = (string) $json_api_args[5];

		if ( !$verify_api_user_args ) {
			$user_id = 0;
		} elseif ( 'internal' === $verify_api_user_args[0] ) {
			$user_id = (int) $verify_api_user_args[1];
			if ( $user_id ) {
				$user = get_user_by( 'id', $user_id );
				if ( !$user || is_wp_error( $user ) ) {
					return false;
				}
			}
		} else {
			$user_id = call_user_func( array( $this, 'test_api_user_code' ), $verify_api_user_args );
			if ( !$user_id ) {
				return false;
			}
		}

		/* debugging
		error_log( "-- begin json api via jetpack debugging -- " );
		error_log( "METHOD: $method" );
		error_log( "URL: $url" );
		error_log( "POST BODY: $post_body" );
		error_log( "VERIFY_ARGS: " . print_r( $verify_api_user_args, 1 ) );
		error_log( "VERIFIED USER_ID: " . (int) $user_id );
		error_log( "-- end json api via jetpack debugging -- " );
		*/

		if ( 'en' !== $locale ) {
			// .org mo files are named slightly different from .com, and all we have is this the locale -- try to guess them.
			$new_locale = $locale;
			if ( strpos( $locale, '-' ) !== false ) {
				$locale_pieces = explode( '-', $locale );
				$new_locale = $locale_pieces[0];
				$new_locale .= ( ! empty( $locale_pieces[1] ) ) ? '_' . strtoupper( $locale_pieces[1] ) : '';
			} else {
				// .com might pass 'fr' because thats what our language files are named as, where core seems
				// to do fr_FR - so try that if we don't think we can load the file.
				if ( ! file_exists( WP_LANG_DIR . '/' . $locale . '.mo' ) ) {
					$new_locale =  $locale . '_' . strtoupper( $locale );
				}
			}

			if ( file_exists( WP_LANG_DIR . '/' . $new_locale . '.mo' ) ) {
				unload_textdomain( 'default' );
				load_textdomain( 'default', WP_LANG_DIR . '/' . $new_locale . '.mo' );
			}
		}

		$old_user = wp_get_current_user();
		wp_set_current_user( $user_id );

		$token = Jetpack_Data::get_access_token( get_current_user_id() );
		if ( !$token || is_wp_error( $token ) ) {
			return false;
		}

		define( 'REST_API_REQUEST', true );
		define( 'WPCOM_JSON_API__BASE', 'public-api.wordpress.com/rest/v1' );

		// needed?
		require_once ABSPATH . 'wp-admin/includes/admin.php';

		require_once JETPACK__PLUGIN_DIR . 'class.json-api.php';
		$api = WPCOM_JSON_API::init( $method, $url, $post_body );
		$api->token_details['user'] = $user_details;
		require_once JETPACK__PLUGIN_DIR . 'class.json-api-endpoints.php';

		$display_errors = ini_set( 'display_errors', 0 );
		ob_start();
		$content_type = $api->serve( false );
		$output = ob_get_clean();
		ini_set( 'display_errors', $display_errors );

		$nonce = wp_generate_password( 10, false );
		$hmac  = hash_hmac( 'md5', $nonce . $output, $token->secret );

		wp_set_current_user( isset( $old_user->ID ) ? $old_user->ID : 0 );

		return array(
			(string) $output,
			(string) $nonce,
			(string) $hmac,
		);
	}
}
