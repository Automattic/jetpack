<?php

class Publicize extends Publicize_Base {

	function __construct() {
		parent::__construct();

		add_filter( 'jetpack_xmlrpc_methods', array( $this, 'register_update_publicize_connections_xmlrpc_method' ) );

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
					<p><?php printf(
						esc_html( wptexturize( __( "To use Publicize, you'll need to link your %s account to your WordPress.com account using the link below.", 'jetpack' ) ) ),
						'<strong>' . esc_html( $blog_name ) . '</strong>'
					); ?></p>
					<p><?php echo esc_html( wptexturize( __( "If you don't have a WordPress.com account yet, you can sign up for free in just a few seconds.", 'jetpack' ) ) ); ?></p>
				</div>
				<div class="jetpack-install-container">
					<p class="submit"><a href="<?php echo $jetpack->build_connect_url( false, menu_page_url( 'sharing', false ) ); ?>" class="button-connector" id="wpcom-connect"><?php esc_html_e( 'Link account with WordPress.com', 'jetpack' ); ?></a></p>
				</div>
			</div>
		</div>
		<?php
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
