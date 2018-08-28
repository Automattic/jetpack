<?php



class Keyring {

	function __construct() {

		add_action( 'load-settings_page_sharing', array( $this, 'admin_page_load' ), 9 );

	}

	function display_connection_error() {
		$code = false;
		if ( isset( $_GET['service'] ) ) {
			$service_name = $_GET['service'];
			$error        = sprintf( __( 'There was a problem connecting to %s to create an authorized connection. Please try again in a moment.', 'jetpack' ), Publicize::get_service_label( $service_name ) );
		} else {
			if ( isset( $_GET['publicize_error'] ) ) {
				$code = strtolower( $_GET['publicize_error'] );
				switch ( $code ) {
					case '400':
						$error = __( 'An invalid request was made. This normally means that something intercepted or corrupted the request from your server to the Jetpack Server. Try again and see if it works this time.', 'jetpack' );
						break;
					case 'secret_mismatch':
						$error = __( 'We could not verify that your server is making an authorized request. Please try again, and make sure there is nothing interfering with requests from your server to the Jetpack Server.', 'jetpack' );
						break;
					case 'empty_blog_id':
						$error = __( 'No blog_id was included in your request. Please try disconnecting Jetpack from WordPress.com and then reconnecting it. Once you have done that, try connecting Publicize again.', 'jetpack' );
						break;
					case 'empty_state':
						$error = sprintf( __( 'No user information was included in your request. Please make sure that your user account has connected to Jetpack. Connect your user account by going to the <a href="%s">Jetpack page</a> within wp-admin.', 'jetpack' ), Jetpack::admin_url() );
						break;
					default:
						$error = __( 'Something which should never happen, happened. Sorry about that. If you try again, maybe it will work.', 'jetpack' );
						break;
				}
			} else {
				$error = __( 'There was a problem connecting with Publicize. Please try again in a moment.', 'jetpack' );
			}
		}
		// Using the same formatting/style as Jetpack::admin_notices() error
		?>
		<div id="message" class="jetpack-message jetpack-err">
			<div class="squeezer">
				<h2><?php echo wp_kses( $error, array( 'a'      => array( 'href' => true ),
														'code'   => true,
														'strong' => true,
														'br'     => true,
														'b'      => true
					) ); ?></h2>
				<?php if ( $code ) : ?>
					<p><?php printf( __( 'Error code: %s', 'jetpack' ), esc_html( stripslashes( $code ) ) ); ?></p>
				<?php endif; ?>
			</div>
		</div>
		<?php
	}

	function admin_page_load() {
		if ( isset( $_GET['action'] ) ) {
			if ( isset( $_GET['service'] ) ) {
				$service_name = $_GET['service'];
			}

			switch ( $_GET['action'] ) {
				case 'error':
					add_action( 'pre_admin_screen_sharing', array( $this, 'display_connection_error' ), 9 );
					break;

				case 'request':
					check_admin_referer( 'keyring-request', 'kr_nonce' );
					check_admin_referer( "keyring-request-$service_name", 'nonce' );

					$verification = Jetpack::generate_secrets( 'publicize' );
					if ( ! $verification ) {
						$url = Jetpack::admin_url( 'jetpack#/settings' );
						wp_die( sprintf( __( "Jetpack is not connected. Please connect Jetpack by visiting <a href='%s'>Settings</a>.", 'jetpack' ), $url ) );

					}
					$stats_options = get_option( 'stats_options' );
					$wpcom_blog_id = Jetpack_Options::get_option( 'id' );
					$wpcom_blog_id = ! empty( $wpcom_blog_id ) ? $wpcom_blog_id : $stats_options['blog_id'];

					$user     = wp_get_current_user();
					$redirect = $this->api_url( $service_name, urlencode_deep( array(
						'action'       => 'request',
						'redirect_uri' => add_query_arg( array( 'action' => 'done' ), menu_page_url( 'sharing', false ) ),
						'for'          => 'publicize',
						// required flag that says this connection is intended for publicize
						'siteurl'      => site_url(),
						'state'        => $user->ID,
						'blog_id'      => $wpcom_blog_id,
						'secret_1'     => $verification['secret_1'],
						'secret_2'     => $verification['secret_2'],
						'eol'          => $verification['exp'],
					) ) );
					wp_redirect( $redirect );
					exit;
					break;

				case 'completed':
					Jetpack::load_xml_rpc_client();
					$xml = new Jetpack_IXR_Client();
					$xml->query( 'jetpack.fetchPublicizeConnections' );

					if ( ! $xml->isError() ) {
						$response = $xml->getResponse();
						Jetpack_Options::update_option( 'publicize_connections', $response );
					}

					break;

				case 'delete':
					$id = $_GET['id'];

					check_admin_referer( 'keyring-request', 'kr_nonce' );
					check_admin_referer( "keyring-request-$service_name", 'nonce' );

					$this->disconnect( $service_name, $id );

					add_action( 'admin_notices', array( $this, 'display_disconnected' ) );
					break;
			}
		}

	/**
	 * Remove a Publicize connection
	 */
	function disconnect( $service_name, $connection_id, $_blog_id = false, $_user_id = false, $force_delete = false ) {
		Jetpack::load_xml_rpc_client();
		$xml = new Jetpack_IXR_Client();
		$xml->query( 'jetpack.deletePublicizeConnection', $connection_id );

		if ( ! $xml->isError() ) {
			Jetpack_Options::update_option( 'publicize_connections', $xml->getResponse() );
		} else {
			return false;
		}
	}

		// Do we really need `admin_styles`? With the new admin UI, it's breaking some bits.
		// Errors encountered on WordPress.com's end are passed back as a code
		/*
		if ( isset( $_GET['action'] ) && 'error' == $_GET['action'] ) {
			// Load Jetpack's styles to handle the box
			Jetpack::init()->admin_styles();
		}
		*/
	}

	/**
	 * Gets a URL to the public-api actions. Works like WP's admin_url
	 *
	 * @param string $service Shortname of a specific service.
	 *
	 * @return URL to specific public-api process
	 */
	// on WordPress.com this is/calls Keyring::admin_url
	function api_url( $service = false, $params = array() ) {
		/**
		 * Filters the API URL used to interact with WordPress.com.
		 *
		 * @module publicize
		 *
		 * @since 2.0.0
		 *
		 * @param string https://public-api.wordpress.com/connect/?jetpack=publicize Default Publicize API URL.
		 */
		$url = apply_filters( 'publicize_api_url', 'https://public-api.wordpress.com/connect/?jetpack=publicize' );

		if ( $service ) {
			$url = add_query_arg( array( 'service' => $service ), $url );
		}

		if ( count( $params ) ) {
			$url = add_query_arg( $params, $url );
		}

		return $url;
	}

	static function connect_url( $service_name ) {
		return add_query_arg( array(
			'action'   => 'request',
			'service'  => $service_name,
			'kr_nonce' => wp_create_nonce( 'keyring-request' ),
			'nonce'    => wp_create_nonce( "keyring-request-$service_name" ),
		), menu_page_url( 'sharing', false ) );
	}

	static function refresh_url( $service_name ) {
		return add_query_arg( array(
			'action'   => 'request',
			'service'  => $service_name,
			'kr_nonce' => wp_create_nonce( 'keyring-request' ),
			'refresh'  => 1,
			'for'      => 'publicize',
			'nonce'    => wp_create_nonce( "keyring-request-$service_name" ),
		), admin_url( 'options-general.php?page=sharing' ) );
	}

	static function disconnect_url( $service_name, $id ) {
		return add_query_arg( array(
			'action'   => 'delete',
			'service'  => $service_name,
			'id'       => $id,
			'kr_nonce' => wp_create_nonce( 'keyring-request' ),
			'nonce'    => wp_create_nonce( "keyring-request-$service_name" ),
		), menu_page_url( 'sharing', false ) );
	}

	function get_services() {

		$services = array();

		if ( Jetpack::is_module_active( 'publicize' ) ) {
			$publicize = publicize_init();
 			$services = array_concat( $services, array_keys( $publicize->get_services( 'all' ) ) );
		}

		return $services;

	}

}
