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
	 * The current user
	 */
	public $user = null;

	/**
	 * Whitelist of the XML-RPC methods available to the Jetpack Server. If the
	 * user is not authenticated (->login()) then the methods are never added,
	 * so they will get a "does not exist" error.
	 */
	function xmlrpc_methods( $core_methods ) {
		$jetpack_methods = array(
			'jetpack.jsonAPI'           => array( $this, 'json_api' ),
			'jetpack.verifyAction'      => array( $this, 'verify_action' ),
			'jetpack.remoteRegister'    => array( $this, 'remote_register' ),
			'jetpack.remoteProvision'   => array( $this, 'remote_provision' ),
		);

		$this->user = $this->login();

		if ( $this->user ) {
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
			$jetpack_methods = apply_filters( 'jetpack_xmlrpc_methods', $jetpack_methods, $core_methods, $this->user );
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
			'jetpack.remoteRegister' => array( $this, 'remote_register' ),
		);
	}

	function authorize_xmlrpc_methods() {
		return array(
			'jetpack.remoteAuthorize' => array( $this, 'remote_authorize' ),
		);
	}

	function provision_xmlrpc_methods() {
		return array(
			'jetpack.remoteRegister' => array( $this, 'remote_register' ),
			'jetpack.remoteProvision'   => array( $this, 'remote_provision' ),
		);
	}

	function remote_authorize( $request ) {
		$user = get_user_by( 'id', $request['state'] );
		JetpackTracking::record_user_event( 'jpc_remote_authorize_begin', array(), $user );

		foreach( array( 'secret', 'state', 'redirect_uri', 'code' ) as $required ) {
			if ( ! isset( $request[ $required ] ) || empty( $request[ $required ] ) ) {
				return $this->error( new Jetpack_Error( 'missing_parameter', 'One or more parameters is missing from the request.', 400 ), 'jpc_remote_authorize_fail' );
			}
		}

		if ( ! $user ) {
			return $this->error( new Jetpack_Error( 'user_unknown', 'User not found.', 404 ), 'jpc_remote_authorize_fail' );
		}

		if ( Jetpack::is_active() && Jetpack::is_user_connected( $request['state'] ) ) {
			return $this->error( new Jetpack_Error( 'already_connected', 'User already connected.', 400 ), 'jpc_remote_authorize_fail' );
		}

		$verified = $this->verify_action( array( 'authorize', $request['secret'], $request['state'] ) );

		if ( is_a( $verified, 'IXR_Error' ) ) {
			return $this->error( $verified, 'jpc_remote_authorize_fail' );
		}

		wp_set_current_user( $request['state'] );

		$client_server = new Jetpack_Client_Server;
		$result = $client_server->authorize( $request );

		if ( is_wp_error( $result ) ) {
			return $this->error( $result, 'jpc_remote_authorize_fail' );
		}

		JetpackTracking::record_user_event( 'jpc_remote_authorize_success' );

		return array(
			'result' => $result,
		);
	}

	/**
	 * This XML-RPC method is called from the /jpphp/provision endpoint on WPCOM in order to
	 * register this site so that a plan can be provisioned.
	 *
	 * @param array $request An array containing at minimum nonce and local_user keys.
	 *
	 * @return WP_Error|array
	 */
	public function remote_register( $request ) {
		JetpackTracking::record_user_event( 'jpc_remote_register_begin', array() );

		$user = $this->fetch_and_verify_local_user( $request );

		if ( ! $user ) {
			return $this->error( new WP_Error( 'input_error', __( 'Valid user is required', 'jetpack' ), 400 ), 'jpc_remote_register_fail' );
		}

		if ( is_wp_error( $user ) || is_a( $user, 'IXR_Error' ) ) {
			return $this->error( $user, 'jpc_remote_register_fail' );
		}

		if ( empty( $request['nonce'] ) ) {
			return $this->error(
				new Jetpack_Error(
					'nonce_missing',
					__( 'The required "nonce" parameter is missing.', 'jetpack' ),
					400
				),
				'jpc_remote_register_fail'
			);
		}

		$nonce = sanitize_text_field( $request['nonce'] );
		unset( $request['nonce'] );

		$api_url  = Jetpack::fix_url_for_bad_hosts( Jetpack::api_url( 'partner_provision_nonce_check' ) );
		$response = Jetpack_Client::_wp_remote_request(
			esc_url_raw( add_query_arg( 'nonce', $nonce, $api_url ) ),
			array( 'method' => 'GET' ),
			true
		);

		if (
			200 !== wp_remote_retrieve_response_code( $response ) ||
			'OK' !== trim( wp_remote_retrieve_body( $response ) )
		) {
			return $this->error(
				new Jetpack_Error(
					'invalid_nonce',
					__( 'There was an issue validating this request.', 'jetpack' ),
					400
				),
				'jpc_remote_register_fail'
			);
		}

		if ( ! Jetpack_Options::get_option( 'id' ) || ! Jetpack_Options::get_option( 'blog_token' ) || ! empty( $request['force'] ) ) {
			wp_set_current_user( $user->ID );

			// This code mostly copied from Jetpack::admin_page_load.
			Jetpack::maybe_set_version_option();
			$registered = Jetpack::try_registration();
			if ( is_wp_error( $registered ) ) {
				return $this->error( $registered, 'jpc_remote_register_fail' );
			} elseif ( ! $registered ) {
				return $this->error(
					new Jetpack_Error(
						'registration_error',
						__( 'There was an unspecified error registering the site', 'jetpack' ),
						400
					),
					'jpc_remote_register_fail'
				);
			}
		}

		JetpackTracking::record_user_event( 'jpc_remote_register_success' );

		return array(
			'client_id' => Jetpack_Options::get_option( 'id' )
		);
	}

	/**
	 * This XML-RPC method is called from the /jpphp/provision endpoint on WPCOM in order to
	 * register this site so that a plan can be provisioned.
	 *
	 * @param array $request An array containing at minimum a nonce key and a local_username key.
	 *
	 * @return WP_Error|array
	 */
	public function remote_provision( $request ) {
		$user = $this->fetch_and_verify_local_user( $request );

		if ( ! $user ) {
			return $this->error( new WP_Error( 'input_error', __( 'Valid user is required', 'jetpack' ), 400 ), 'jpc_remote_register_fail' );
		}

		if ( is_wp_error( $user ) || is_a( $user, 'IXR_Error' ) ) {
			return $this->error( $user, 'jpc_remote_register_fail' );
		}

		$site_icon = ( function_exists( 'has_site_icon' ) && has_site_icon() )
			? get_site_icon_url()
			: false;

		$auto_enable_sso = ( ! Jetpack::is_active() || Jetpack::is_module_active( 'sso' ) );

		/** This filter is documented in class.jetpack-cli.php */
		if ( apply_filters( 'jetpack_start_enable_sso', $auto_enable_sso ) ) {
			$redirect_uri = add_query_arg(
				array(
					'action'      => 'jetpack-sso',
					'redirect_to' => rawurlencode( admin_url() ),
				),
				wp_login_url() // TODO: come back to Jetpack dashboard?
			);
		} else {
			$redirect_uri = admin_url();
		}

		// Generate secrets.
		$role    = Jetpack::translate_user_to_role( $user );
		$secrets = Jetpack::init()->generate_secrets( 'authorize', $user->ID );

		$response = array(
			'jp_version'   => JETPACK__VERSION,
			'redirect_uri' => $redirect_uri,
			'user_id'      => $user->ID,
			'user_email'   => $user->user_email,
			'user_login'   => $user->user_login,
			'scope'        => Jetpack::sign_role( $role, $user->ID ),
			'secret'       => $secrets['secret_1'],
			'is_active'    => Jetpack::is_active(),
		);

		if ( $site_icon ) {
			$response['site_icon'] = $site_icon;
		}

		if ( ! empty( $request['onboarding'] ) ) {
			Jetpack::create_onboarding_token();
			$response['onboarding_token'] = Jetpack_Options::get_option( 'onboarding' );
		}

		return $response;
	}

	private function fetch_and_verify_local_user( $request ) {
		if ( empty( $request['local_user'] ) ) {
			return $this->error(
				new Jetpack_Error(
					'local_user_missing',
					__( 'The required "local_user" parameter is missing.', 'jetpack' ),
					400
				),
				'jpc_remote_provision_fail'
			);
		}

		// local user is used to look up by login, email or ID
		$local_user_info = $request['local_user'];

		$user = get_user_by( 'login', $local_user_info );

		if ( ! $user ) {
			$user = get_user_by( 'email', $local_user_info );
		}

		if ( ! $user ) {
			$user = get_user_by( 'ID', $local_user_info );
		}

		return $user;
	}

	private function tracks_record_error( $name, $error, $user = null ) {
		if ( is_wp_error( $error ) ) {
			JetpackTracking::record_user_event( $name, array(
				'error_code' => $error->get_error_code(),
				'error_message' => $error->get_error_message()
			), $user );
		} elseif( is_a( $error, 'IXR_Error' ) ) {
			JetpackTracking::record_user_event( $name, array(
				'error_code' => $error->code,
				'error_message' => $error->message
			), $user );
		}

		return $error;
	}

	/**
	* Verifies that Jetpack.WordPress.com received a registration request from this site
	*/
	function verify_registration( $data ) {
		// failure modes will be recorded in tracks in the verify_action method
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
		$user = get_user_by( 'id', $state );
		JetpackTracking::record_user_event( 'jpc_verify_' . $action . '_begin', array(), $user );
		$tracks_failure_event_name = 'jpc_verify_' . $action . '_fail';

		if ( empty( $verify_secret ) ) {
			return $this->error( new Jetpack_Error( 'verify_secret_1_missing', sprintf( 'The required "%s" parameter is missing.', 'secret_1' ), 400 ), $tracks_failure_event_name, $user );
		} else if ( ! is_string( $verify_secret ) ) {
			return $this->error( new Jetpack_Error( 'verify_secret_1_malformed', sprintf( 'The required "%s" parameter is malformed.', 'secret_1' ), 400 ), $tracks_failure_event_name, $user );
		} else if ( empty( $state ) ) {
			return $this->error( new Jetpack_Error( 'state_missing', sprintf( 'The required "%s" parameter is missing.', 'state' ), 400 ), $tracks_failure_event_name, $user );
		} else if ( ! ctype_digit( $state ) ) {
			return $this->error( new Jetpack_Error( 'state_malformed', sprintf( 'The required "%s" parameter is malformed.', 'state' ), 400 ), $tracks_failure_event_name, $user );
		}

		$secrets = Jetpack::get_secrets( $action, $state );

		if ( ! $secrets ) {
			Jetpack::delete_secrets( $action, $state );
			return $this->error( new Jetpack_Error( 'verify_secrets_missing', 'Verification secrets not found', 400 ), $tracks_failure_event_name, $user );
		}

		if ( is_wp_error( $secrets ) ) {
			Jetpack::delete_secrets( $action, $state );
			return $this->error( new Jetpack_Error( $secrets->get_error_code(), $secrets->get_error_message(), 400 ), $tracks_failure_event_name, $user );
		}

		if ( empty( $secrets['secret_1'] ) || empty( $secrets['secret_2'] ) || empty( $secrets['exp'] ) ) {
			Jetpack::delete_secrets( $action, $state );
			return $this->error( new Jetpack_Error( 'verify_secrets_incomplete', 'Verification secrets are incomplete', 400 ), $tracks_failure_event_name, $user );
		}

		if ( ! hash_equals( $verify_secret, $secrets['secret_1'] ) ) { // phpcs:ignore PHPCompatibility -- skipping since `hash_equals` is part of WP core
			Jetpack::delete_secrets( $action, $state );
			return $this->error( new Jetpack_Error( 'verify_secrets_mismatch', 'Secret mismatch', 400 ), $tracks_failure_event_name, $user );
		}

		Jetpack::delete_secrets( $action, $state );

		JetpackTracking::record_user_event( 'jpc_verify_' . $action . '_success', array(), $user );

		return $secrets['secret_2'];
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
	function error( $error = null, $tracks_event_name = null, $user = null ) {
		// record using Tracks
		if ( null !== $tracks_event_name ) {
			$this->tracks_record_error( $tracks_event_name, $error, $user );
		}

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

		$jetpack_token = Jetpack_Data::get_access_token( $user_id );

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

		if ( ! hash_equals( $hmac, $verify ) ) { // phpcs:ignore PHPCompatibility -- skipping since `hash_equals` is part of WP core
			return false;
		}

		return $user_id;
	}

	/**
	* Disconnect this blog from the connected wordpress.com account
	* @return boolean
	*/
	function disconnect_blog() {

		// For tracking
		if ( ! empty( $this->user->ID ) ) {
			wp_set_current_user( $this->user->ID );
		}

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
		require_once JETPACK__PLUGIN_DIR . 'sync/class.jetpack-sync-functions.php';
		return array(
			'home'    => Jetpack_Sync_Functions::home_url(),
			'siteurl' => Jetpack_Sync_Functions::site_url(),
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
