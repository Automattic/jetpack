<?php

class Publicize extends Publicize_Base {

	function __construct() {
		parent::__construct();

		add_filter( 'jetpack_xmlrpc_methods', array( $this, 'register_update_publicize_connections_xmlrpc_method' ) );

		add_action( 'load-settings_page_sharing', array( $this, 'admin_page_load' ), 9 );

		add_action( 'wp_ajax_publicize_tumblr_options_page', array( $this, 'options_page_tumblr' ) );
		add_action( 'wp_ajax_publicize_facebook_options_page', array( $this, 'options_page_facebook' ) );
		add_action( 'wp_ajax_publicize_twitter_options_page', array( $this, 'options_page_twitter' ) );
		add_action( 'wp_ajax_publicize_linkedin_options_page', array( $this, 'options_page_linkedin' ) );
		add_action( 'wp_ajax_publicize_path_options_page', array( $this, 'options_page_path' ) );
		add_action( 'wp_ajax_publicize_google_plus_options_page', array( $this, 'options_page_google_plus' ) );

		add_action( 'wp_ajax_publicize_tumblr_options_save', array( $this, 'options_save_tumblr' ) );
		add_action( 'wp_ajax_publicize_facebook_options_save', array( $this, 'options_save_facebook' ) );
		add_action( 'wp_ajax_publicize_twitter_options_save', array( $this, 'options_save_twitter' ) );
		add_action( 'wp_ajax_publicize_linkedin_options_save', array( $this, 'options_save_linkedin' ) );
		add_action( 'wp_ajax_publicize_path_options_save', array( $this, 'options_save_path' ) );
		add_action( 'wp_ajax_publicize_google_plus_options_save', array( $this, 'options_save_google_plus' ) );

		add_action( 'load-settings_page_sharing', array( $this, 'force_user_connection' ) );

		add_filter( 'publicize_checkbox_default', array( $this, 'publicize_checkbox_default' ), 10, 4 );

		add_action( 'transition_post_status', array( $this, 'save_publicized' ), 10, 3 );

		add_filter( 'jetpack_twitter_cards_site_tag', array( $this, 'enhaced_twitter_cards_site_tag' ) );

		add_action( 'publicize_save_meta', array( $this, 'save_publicized_twitter_account' ), 10, 4 );
		add_action( 'publicize_save_meta', array( $this, 'save_publicized_facebook_account' ), 10, 4 );

		add_filter( 'jetpack_sharing_twitter_via', array( $this, 'get_publicized_twitter_account' ), 10, 2 );

		include_once ( JETPACK__PLUGIN_DIR . 'modules/publicize/enhanced-open-graph.php' );
	}

	function force_user_connection() {
		global $current_user;
		$user_token = Jetpack_Data::get_access_token( $current_user->ID );
		$is_user_connected = $user_token && !is_wp_error( $user_token );

		// If the user is already connected via Jetpack, then we're good
		if ( $is_user_connected )
			return;

		// If they're not connected, then remove the Publicize UI and tell them they need to connect first
		global $publicize_ui;
		remove_action( 'pre_admin_screen_sharing', array( $publicize_ui, 'admin_page' ) );

		// Do we really need `admin_styles`? With the new admin UI, it's breaking some bits.
		// Jetpack::init()->admin_styles();
		add_action( 'pre_admin_screen_sharing', array( $this, 'admin_page_warning' ), 1 );
	}

	function admin_page_warning() {
		$jetpack = Jetpack::init();
		$blog_name = get_bloginfo( 'blogname' );
		if ( empty( $blog_name ) ) {
			$blog_name = home_url( '/' );
		}

		?>
		<div id="message" class="updated jetpack-message jp-connect">
			<div class="jetpack-wrap-container">
				<div class="jetpack-text-container">
					<h4>
					<p><?php printf(
						esc_html( wptexturize( __( "To use Publicize, you'll need to link your %s account to your WordPress.com account using the link below.", 'jetpack' ) ) ),
						'<strong>' . esc_html( $blog_name ) . '</strong>'
					); ?></p>
					<p><?php echo esc_html( wptexturize( __( "If you don't have a WordPress.com account yet, you can sign up for free in just a few seconds.", 'jetpack' ) ) ); ?></p>
					</h4>
				</div>
				<div class="jetpack-install-container">
					<p class="submit"><a href="<?php echo $jetpack->build_connect_url( false, menu_page_url( 'sharing', false ) ); ?>" class="button-connector" id="wpcom-connect"><?php esc_html_e( 'Link account with WordPress.com', 'jetpack' ); ?></a></p>
				</div>
			</div>
		</div>
		<?php
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

	function receive_updated_publicize_connections( $publicize_connections ) {
		Jetpack_Options::update_option( 'publicize_connections', $publicize_connections );
		return true;
	}

	function register_update_publicize_connections_xmlrpc_method( $methods ) {
		return array_merge( $methods, array(
			'jetpack.updatePublicizeConnections' => array( $this, 'receive_updated_publicize_connections' ),
		) );
	}

	function get_connections( $service_name, $_blog_id = false, $_user_id = false ) {
		$connections = Jetpack_Options::get_option( 'publicize_connections' );
		$connections_to_return = array();
		if ( !empty( $connections ) && is_array( $connections ) ) {
			if ( !empty( $connections[$service_name] ) ) {
				foreach( $connections[$service_name] as $id => $connection ) {
					if ( 0 == $connection['connection_data']['user_id'] || $this->user_id() == $connection['connection_data']['user_id'] ) {
						$connections_to_return[$id] = $connection;
					}
				}
			}
			return $connections_to_return;
		}
		return false;
	}

	function get_connection_id( $connection ) {
		return $connection['connection_data']['id'];
	}

	function get_connection_meta( $connection ) {
		$connection['user_id'] = $connection['connection_data']['user_id']; // Allows for shared connections
		return $connection;
	}

	function admin_page_load() {
		if ( isset( $_GET['action'] ) ) {
			if ( isset( $_GET['service'] ) )
				$service_name = $_GET['service'];

			switch ( $_GET['action'] ) {
			case 'error':
				add_action( 'pre_admin_screen_sharing', array( $this, 'display_connection_error' ), 9 );
				break;

			case 'request':
				check_admin_referer( 'keyring-request', 'kr_nonce' );
				check_admin_referer( "keyring-request-$service_name", 'nonce' );

				$verification = Jetpack::create_nonce( 'publicize' );

				$stats_options = get_option( 'stats_options' );
				$wpcom_blog_id = Jetpack_Options::get_option('id');
				$wpcom_blog_id = !empty( $wpcom_blog_id ) ? $wpcom_blog_id : $stats_options['blog_id'];

				$user = wp_get_current_user();
				$redirect = $this->api_url( $service_name, urlencode_deep( array(
					'action'       => 'request',
					'redirect_uri' => add_query_arg( array( 'action' => 'done' ), menu_page_url( 'sharing', false ) ),
					'for'          => 'publicize', // required flag that says this connection is intended for publicize
					'siteurl'      => site_url(),
					'state'        => $user->ID,
					'blog_id'      => $wpcom_blog_id,
					'secret_1'	   => $verification['secret_1'],
					'secret_2'     => $verification['secret_2'],
					'eol'		   => $verification['eol'],
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

		// Do we really need `admin_styles`? With the new admin UI, it's breaking some bits.
		// Errors encountered on WordPress.com's end are passed back as a code
		/*
		if ( isset( $_GET['action'] ) && 'error' == $_GET['action'] ) {
			// Load Jetpack's styles to handle the box
			Jetpack::init()->admin_styles();
		}
		*/
	}

	function display_connection_error() {
		$code = false;
		if ( isset( $_GET['service'] ) ) {
			$service_name = $_GET['service'];
			$error = sprintf( __( 'There was a problem connecting to %s to create an authorized connection. Please try again in a moment.', 'jetpack' ), Publicize::get_service_label( $service_name ) );
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
				<h4><?php echo wp_kses( $error, array( 'a' => array( 'href' => true ), 'code' => true, 'strong' => true, 'br' => true, 'b' => true ) ); ?></h4>
				<?php if ( $code ) : ?>
				<p><?php printf( __( 'Error code: %s', 'jetpack' ), esc_html( stripslashes( $code ) ) ); ?></p>
				<?php endif; ?>
			</div>
		</div>
		<?php
	}

	function display_disconnected() {
		echo "<div class='updated'>\n";
		echo '<p>' . esc_html( __( 'That connection has been removed.', 'jetpack' ) ) . "</p>\n";
		echo "</div>\n\n";
	}

	function globalization() {
		if ( 'on' == $_REQUEST['global'] ) {
			$id = $_REQUEST['connection'];

			if ( !current_user_can( $this->GLOBAL_CAP ) )
				return;

			Jetpack::load_xml_rpc_client();
			$xml = new Jetpack_IXR_Client();
			$xml->query( 'jetpack.globalizePublicizeConnection', $id, 'globalize' );

			if ( !$xml->isError() ) {
				$response = $xml->getResponse();
				Jetpack_Options::update_option( 'publicize_connections', $response );
			}
		}
	}

	/**
	* Gets a URL to the public-api actions. Works like WP's admin_url
	*
	* @param string $service Shortname of a specific service.
	* @return URL to specific public-api process
	*/
	// on WordPress.com this is/calls Keyring::admin_url
	function api_url( $service = false, $params = array() ) {
		/**
		 * Filters the API URL used to interact with WordPress.com.
		 *
		 * @since 2.0.0
		 *
		 * @param string https://public-api.wordpress.com/connect/?jetpack=publicize Default Publicize API URL.
		 */
		$url = apply_filters( 'publicize_api_url', 'https://public-api.wordpress.com/connect/?jetpack=publicize' );

		if ( $service )
			$url = add_query_arg( array( 'service' => $service ), $url );

		if ( count ( $params ) )
			$url = add_query_arg( $params, $url );

		return $url;
	}

	function connect_url( $service_name ) {
		return add_query_arg( array(
			'action'   => 'request',
			'service'  =>  $service_name,
			'kr_nonce' => wp_create_nonce( 'keyring-request' ),
			'nonce'    => wp_create_nonce( "keyring-request-$service_name" ),
		), menu_page_url( 'sharing', false ) );
	}

	function refresh_url( $service_name ) {
		return add_query_arg( array(
			'action'   => 'request',
			'service'  => $service_name,
			'kr_nonce' => wp_create_nonce( 'keyring-request' ),
			'refresh'  => 1,
			'for'      => 'publicize',
			'nonce'    => wp_create_nonce( "keyring-request-$service_name" ),
		), admin_url( 'options-general.php?page=sharing' ) );
	}

	function disconnect_url( $service_name, $id ) {
		return add_query_arg( array (
			'action'   => 'delete',
			'service'  => $service_name,
			'id'       => $id,
			'kr_nonce' => wp_create_nonce( 'keyring-request' ),
			'nonce'    => wp_create_nonce( "keyring-request-$service_name" ),
		), menu_page_url( 'sharing', false ) );
	}

	function get_services( $filter ) {
		if ( !in_array( $filter, array( 'all', 'connected' ) ) )
			$filter = 'all';

		$services = array(
				'facebook'        => array(),
				'twitter'         => array(),
				'linkedin'        => array(),
				'tumblr'          => array(),
				'path'            => array(),
				'google_plus'     => array(),
		);

		if ( 'all' == $filter ) {
			return $services;
		} else {
			$connected_services = array();
			foreach ( $services as $service => $empty ) {
				$connections = $this->get_connections( $service );
				if ( $connections )
					$connected_services[$service] = $connections;
			}
			return $connected_services;
		}
	}

	function get_connection( $service, $id, $_blog_id = false, $_user_id = false ) {
		// Stub
	}

	function flag_post_for_publicize( $new_status, $old_status, $post ) {
		// Stub only. Doesn't need to do anything on Jetpack Client
	}

	function test_connection( $service_name, $connection ) {
		$connection_test_passed = true;
		$connection_test_message = '';
		$user_can_refresh = false;

		$id = $this->get_connection_id( $connection );

		Jetpack::load_xml_rpc_client();
		$xml = new Jetpack_IXR_Client();
		$xml->query( 'jetpack.testPublicizeConnection', $id );

		if ( $xml->isError() ) {
			$xml_response = $xml->getResponse();
			$connection_test_message = $xml_response['faultString'];
			$connection_test_passed = false;
		}

		// Bail if all is well
		if ( $connection_test_passed ) {
			return true;
		}

		// Set up refresh if the user can
		$user_can_refresh = current_user_can( $this->GLOBAL_CAP );
		if ( $user_can_refresh ) {
			$nonce = wp_create_nonce( "keyring-request-" . $service_name );
			$refresh_text = sprintf( _x( 'Refresh connection with %s', 'Refresh connection with {social media service}', 'jetpack' ), $this->get_service_label( $service_name ) );
			$refresh_url = $this->refresh_url( $service_name );
		}

		$error_data = array(
			'user_can_refresh' => $user_can_refresh,
			'refresh_text' => $refresh_text,
			'refresh_url' => $refresh_url
		);

		return new WP_Error( 'pub_conn_test_failed', $connection_test_message, $error_data );
	}

	/**
	 * Save a flag locally to indicate that this post has already been Publicized via the selected
	 * connections.
	 */
	function save_publicized( $new_status, $old_status, $post ) {
		// Only do this when a post transitions to being published
		if ( 'publish' == $new_status && 'publish' != $old_status ) {
			update_post_meta( $post->ID, $this->POST_DONE . 'all', true );
		}
	}

	/**
	* Options Code
	*/

	function options_page_facebook() {
		$connected_services = Jetpack_Options::get_option( 'publicize_connections' );
		$connection = $connected_services['facebook'][$_REQUEST['connection']];
		$options_to_show = ( ! empty( $connection['connection_data']['meta']['options_responses'] ) ? $connection['connection_data']['meta']['options_responses'] : false );

		// Nonce check
		check_admin_referer( 'options_page_facebook_' . $_REQUEST['connection'] );

		$me    = ( ! empty( $options_to_show[0] )         ? $options_to_show[0]         : false );
		$pages = ( ! empty( $options_to_show[1]['data'] ) ? $options_to_show[1]['data'] : false );

		$profile_checked = true;
		$page_selected = false;

		if ( !empty( $connection['connection_data']['meta']['facebook_page'] ) ) {
			$found = false;
			if ( is_array( $pages->data ) ) {
				foreach ( $pages->data as $page ) {
					if ( $page->id == $connection['connection_data']['meta']['facebook_page'] ) {
						$found = true;
						break;
					}
				}
			}

			if ( $found ) {
				$profile_checked = false;
				$page_selected = $connection['connection_data']['meta']['facebook_page'];
			}
		}

		?>

		<div id="thickbox-content">

			<?php
			ob_start();
			Publicize_UI::connected_notice( 'Facebook' );
			$update_notice = ob_get_clean();

			if ( ! empty( $update_notice ) )
				echo $update_notice;
			?>

			<?php if ( !empty( $me['name'] ) ) : ?>
			<p><?php printf(
				esc_html__( 'Publicize to my %s:', 'jetpack' ),
				'<strong>' . esc_html__( 'Facebook Wall', 'jetpack' ) . '</strong>'
			); ?></p>
			<table id="option-profile">
				<tbody>
					<tr>
						<td class="radio"><input type="radio" name="option" data-type="profile" id="<?php echo esc_attr( $me['id'] ) ?>" value="" <?php checked( $profile_checked, true ); ?> /></td>
						<td class="thumbnail"><label for="<?php echo esc_attr( $me['id'] ) ?>"><img src="<?php echo esc_url( $me['picture']['data']['url'] ) ?>" width="50" height="50" /></label></td>
						<td class="details"><label for="<?php echo esc_attr( $me['id'] ) ?>"><?php echo esc_html( $me['name'] ) ?></label></td>
					</tr>
				</tbody>
			</table>
			<?php endif; ?>

			<?php if ( $pages ) : ?>

				<p><?php printf(
					esc_html__( 'Publicize to my %s:', 'jetpack' ),
					'<strong>' . esc_html__( 'Facebook Page', 'jetpack' ) . '</strong>'
				); ?></p>
				<table id="option-fb-fanpage">
					<tbody>

						<?php foreach ( $pages as $i => $page ) : ?>
							<?php if ( ! ( $i % 2 ) ) : ?>
								<tr>
							<?php endif; ?>
									<td class="radio"><input type="radio" name="option" data-type="page" id="<?php echo esc_attr( $page['id'] ) ?>" value="<?php echo esc_attr( $page['id'] ) ?>" <?php checked( $page_selected && $page_selected == $page['id'], true ); ?> /></td>
									<td class="thumbnail"><label for="<?php echo esc_attr( $page['id'] ) ?>"><img src="<?php echo esc_url( str_replace( '_s', '_q', $page['picture']['data']['url'] ) ) ?>" width="50" height="50" /></label></td>
									<td class="details">
										<label for="<?php echo esc_attr( $page['id'] ) ?>">
											<span class="name"><?php echo esc_html( $page['name'] ) ?></span><br/>
											<span class="category"><?php echo esc_html( $page['category'] ) ?></span>
										</label>
									</td>
							<?php if ( ( $i % 2 ) || ( $i == count( $pages ) - 1 ) ): ?>
								</tr>
							<?php endif; ?>
						<?php endforeach; ?>

					</tbody>
				</table>

			<?php endif; ?>

			<?php Publicize_UI::global_checkbox( 'facebook', $_REQUEST['connection'] ); ?>

			<p style="text-align: center;">
				<input type="submit" value="<?php esc_attr_e( 'OK', 'jetpack' ) ?>" class="button fb-options save-options" name="save" data-connection="<?php echo esc_attr( $_REQUEST['connection'] ); ?>" rel="<?php echo wp_create_nonce('save_fb_token_' . $_REQUEST['connection'] ) ?>" />
			</p><br/>
		</div>

		<?php
	}

	function options_save_facebook() {
		// Nonce check
		check_admin_referer( 'save_fb_token_' . $_REQUEST['connection'] );

		$id = $_POST['connection'];

		// Check for a numeric page ID
		$page_id = $_POST['selected_id'];
		if ( !ctype_digit( $page_id ) )
			die( 'Security check' );

		if ( isset( $_POST['selected_id'] ) && 'profile' == $_POST['type'] ) {
			// Publish to User Wall/Profile
			$options = array(
				'facebook_page'       => null,
				'facebook_profile'    => true
			);

		} else {
			if ( 'page' != $_POST['type'] || !isset( $_POST['selected_id'] ) ) {
				return;
			}

			// Publish to Page
			$options = array(
				'facebook_page'       => $page_id,
				'facebook_profile'    => null
			);
		}

		Jetpack::load_xml_rpc_client();
		$xml = new Jetpack_IXR_Client();
		$xml->query( 'jetpack.setPublicizeOptions', $id, $options );

		if ( !$xml->isError() ) {
			$response = $xml->getResponse();
			Jetpack_Options::update_option( 'publicize_connections', $response );
		}

		$this->globalization();
	}

	function options_page_tumblr() {
		// Nonce check
		check_admin_referer( 'options_page_tumblr_' . $_REQUEST['connection'] );

		$connected_services = Jetpack_Options::get_option( 'publicize_connections' );
		$connection = $connected_services['tumblr'][$_POST['connection']];
		$options_to_show = $connection['connection_data']['meta']['options_responses'];
		$request = $options_to_show[0];

		$blogs = $request['response']['user']['blogs'];

		$blog_selected = false;

		if ( !empty( $connection['connection_data']['meta']['tumblr_base_hostname'] ) ) {
			foreach ( $blogs as $blog ) {
				if ( $connection['connection_data']['meta']['tumblr_base_hostname'] == $this->get_basehostname( $blog['url'] ) ) {
					$blog_selected = $connection['connection_data']['meta']['tumblr_base_hostname'];
					break;
				}
			}

		}

		// Use their Primary blog if they haven't selected one yet
		if ( !$blog_selected ) {
			foreach ( $blogs as $blog ) {
				if ( $blog['primary'] )
					$blog_selected = $this->get_basehostname( $blog['url'] );
			}
		} ?>

		<div id="thickbox-content">

			<?php
			ob_start();
			Publicize_UI::connected_notice( 'Tumblr' );
			$update_notice = ob_get_clean();

			if ( ! empty( $update_notice ) )
				echo $update_notice;
			?>

			<p><?php printf(
				esc_html__( 'Publicize to my %s:', 'jetpack' ),
				'<strong>' . esc_html__( 'Tumblr blog', 'jetpack' ) . '</strong>'
			); ?></p>

			<ul id="option-tumblr-blog">

			<?php
			foreach ( $blogs as $blog ) {
				$url = $this->get_basehostname( $blog['url'] ); ?>
				<li>
					<input type="radio" name="option" data-type="blog" id="<?php echo esc_attr( $url ) ?>" value="<?php echo esc_attr( $url ) ?>" <?php checked( $blog_selected == $url, true ); ?> />
					<label for="<?php echo esc_attr( $url ) ?>"><span class="name"><?php echo esc_html( $blog['title'] ) ?></span></label>
				</li>
			<?php } ?>

			</ul>

			<?php Publicize_UI::global_checkbox( 'tumblr', $_REQUEST['connection'] ); ?>

			<p style="text-align: center;">
				<input type="submit" value="<?php esc_attr_e( 'OK', 'jetpack' ) ?>" class="button tumblr-options save-options" name="save" data-connection="<?php echo esc_attr( $_REQUEST['connection'] ); ?>" rel="<?php echo wp_create_nonce( 'save_tumblr_blog_' . $_REQUEST['connection'] ) ?>" />
			</p> <br />
		</div>

		<?php
	}

	function get_basehostname( $url ) {
		return parse_url( $url, PHP_URL_HOST );
	}

	function options_save_tumblr() {
		// Nonce check
		check_admin_referer( 'save_tumblr_blog_' . $_REQUEST['connection'] );

		$id = $_POST['connection'];

		$options = array( 'tumblr_base_hostname' => $_POST['selected_id'] );

		Jetpack::load_xml_rpc_client();
		$xml = new Jetpack_IXR_Client();
		$xml->query( 'jetpack.setPublicizeOptions', $id, $options );

		if ( !$xml->isError() ) {
			$response = $xml->getResponse();
			Jetpack_Options::update_option( 'publicize_connections', $response );
		}

		$this->globalization();
	}

	function options_page_twitter() { Publicize_UI::options_page_other( 'twitter' ); }
	function options_page_linkedin() { Publicize_UI::options_page_other( 'linkedin' ); }
	function options_page_path() { Publicize_UI::options_page_other( 'path' ); }
	function options_page_google_plus() { Publicize_UI::options_page_other( 'google_plus' ); }

	function options_save_twitter() { $this->options_save_other( 'twitter' ); }
	function options_save_linkedin() { $this->options_save_other( 'linkedin' ); }
	function options_save_path() { $this->options_save_other( 'path' ); }
	function options_save_google_plus() { $this->options_save_other( 'google_plus' ); }

	function options_save_other( $service_name ) {
		// Nonce check
		check_admin_referer( 'save_' . $service_name . '_token_' . $_REQUEST['connection'] );
		$this->globalization();
	}

	/**
	* Already-published posts should not be Publicized by default. This filter sets checked to
	* false if a post has already been published.
	*/
	function publicize_checkbox_default( $checked, $post_id, $name, $connection ) {
		if ( 'publish' == get_post_status( $post_id ) )
			return false;

		return $checked;
	}

	/**
	* If there's only one shared connection to Twitter set it as twitter:site tag.
	*/
	function enhaced_twitter_cards_site_tag( $tag ) {
		$custom_site_tag = get_option( 'jetpack-twitter-cards-site-tag' );
		if( ! empty( $custom_site_tag ) )
			return $tag;
		if ( ! $this->is_enabled('twitter') )
			return $tag;
		$connections = $this->get_connections( 'twitter' );
		foreach ( $connections as $connection ) {
			$connection_meta = $this->get_connection_meta( $connection );
			if ( 0 == $connection_meta['connection_data']['user_id'] ) {
				// If the connection is shared
				return $this->get_display_name( 'twitter', $connection );
			}
		}
		return $tag;
	}

	function save_publicized_twitter_account( $submit_post, $post_id, $service_name, $connection ) {
		if ( 'twitter' == $service_name && $submit_post ) {
			$connection_meta = $this->get_connection_meta( $connection );
			$publicize_twitter_user = get_post_meta( $post_id, '_publicize_twitter_user' );
			if ( empty( $publicize_twitter_user ) || 0 != $connection_meta['connection_data']['user_id'] ) {
				update_post_meta( $post_id, '_publicize_twitter_user', $this->get_display_name( 'twitter', $connection ) );
			}
		}
	}

	function get_publicized_twitter_account( $account, $post_id ) {
		if ( ! empty( $account ) ) {
			return $account;
		}
		$account = get_post_meta( $post_id, '_publicize_twitter_user', true );
		if ( ! empty( $account ) ) {
			return $account;
		}
		return '';
	}

	/**
	* Save the Publicized Facebook account when publishing a post
	* Use only Personal accounts, not Facebook Pages
	*/
	function save_publicized_facebook_account( $submit_post, $post_id, $service_name, $connection ) {
		$connection_meta = $this->get_connection_meta( $connection );
		if ( 'facebook' == $service_name && isset( $connection_meta['connection_data']['meta']['facebook_profile'] ) && $submit_post ) {
			$publicize_facebook_user = get_post_meta( $post_id, '_publicize_facebook_user' );
			if ( empty( $publicize_facebook_user ) || 0 != $connection_meta['connection_data']['user_id'] ) {
				$profile_link = $this->get_profile_link( 'facebook', $connection );

				if ( false !== $profile_link ) {
					update_post_meta( $post_id, '_publicize_facebook_user', $profile_link );
				}
			}
		}
	}
}
