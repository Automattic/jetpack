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

		add_action( 'wp_ajax_publicize_tumblr_options_save', array( $this, 'options_save_tumblr' ) );
		add_action( 'wp_ajax_publicize_facebook_options_save', array( $this, 'options_save_facebook' ) );
		add_action( 'wp_ajax_publicize_twitter_options_save', array( $this, 'options_save_twitter' ) );
		add_action( 'wp_ajax_publicize_linkedin_options_save', array( $this, 'options_save_linkedin' ) );

		add_action( 'load-settings_page_sharing', array( $this, 'force_user_connection' ) );

		add_filter( 'jetpack_published_post_flags', array( $this, 'set_post_flags' ), 10, 2 );

		add_action( 'wp_insert_post', array( $this, 'save_publicized' ), 11, 3 );

		add_filter( 'jetpack_twitter_cards_site_tag', array( $this, 'enhaced_twitter_cards_site_tag' ) );

		add_action( 'publicize_save_meta', array( $this, 'save_publicized_twitter_account' ), 10, 4 );
		add_action( 'publicize_save_meta', array( $this, 'save_publicized_facebook_account' ), 10, 4 );

		add_action( 'connection_disconnected', array( $this, 'add_disconnect_notice' ) );

		add_filter( 'jetpack_sharing_twitter_via', array( $this, 'get_publicized_twitter_account' ), 10, 2 );

		include_once( JETPACK__PLUGIN_DIR . 'modules/publicize/enhanced-open-graph.php' );

		jetpack_require_lib( 'class.jetpack-keyring-service-helper' );
	}

	function add_disconnect_notice() {
		add_action( 'admin_notices', array( $this, 'display_disconnected' ) );
	}

	function force_user_connection() {
		global $current_user;
		$user_token        = Jetpack_Data::get_access_token( $current_user->ID );
		$is_user_connected = $user_token && ! is_wp_error( $user_token );

		// If the user is already connected via Jetpack, then we're good
		if ( $is_user_connected ) {
			return;
		}

		// If they're not connected, then remove the Publicize UI and tell them they need to connect first
		global $publicize_ui;
		remove_action( 'pre_admin_screen_sharing', array( $publicize_ui, 'admin_page' ) );

		// Do we really need `admin_styles`? With the new admin UI, it's breaking some bits.
		// Jetpack::init()->admin_styles();
		add_action( 'pre_admin_screen_sharing', array( $this, 'admin_page_warning' ), 1 );
	}

	function admin_page_warning() {
		$jetpack   = Jetpack::init();
		$blog_name = get_bloginfo( 'blogname' );
		if ( empty( $blog_name ) ) {
			$blog_name = home_url( '/' );
		}

		?>
		<div id="message" class="updated jetpack-message jp-connect">
			<div class="jetpack-wrap-container">
				<div class="jetpack-text-container">
					<p><?php printf(
							/* translators: %s is the name of the blog */
							esc_html( wptexturize( __( "To use Publicize, you'll need to link your %s account to your WordPress.com account using the link below.", 'jetpack' ) ) ),
							'<strong>' . esc_html( $blog_name ) . '</strong>'
						); ?></p>
					<p><?php echo esc_html( wptexturize( __( "If you don't have a WordPress.com account yet, you can sign up for free in just a few seconds.", 'jetpack' ) ) ); ?></p>
				</div>
				<div class="jetpack-install-container">
					<p class="submit"><a
							href="<?php echo $jetpack->build_connect_url( false, menu_page_url( 'sharing', false ) ); ?>"
							class="button-connector"
							id="wpcom-connect"><?php esc_html_e( 'Link account with WordPress.com', 'jetpack' ); ?></a>
					</p>
					<p class="jetpack-install-blurb">
						<?php jetpack_render_tos_blurb(); ?>
					</p>
				</div>
			</div>
		</div>
		<?php
	}

	/**
	 * Remove a Publicize connection
	 */
	function disconnect( $service_name, $connection_id, $_blog_id = false, $_user_id = false, $force_delete = false ) {
		return Jetpack_Keyring_Service_Helper::disconnect( $service_name, $connection_id, $_blog_id, $_user_id, $force_delete );
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

	function get_all_connections() {
		$connections = Jetpack_Options::get_option( 'publicize_connections' );
		if ( isset( $connections['google_plus'] ) ) {
			unset( $connections['google_plus'] );
		}
		return $connections;
	}

	function get_connections( $service_name, $_blog_id = false, $_user_id = false ) {
		if ( false === $_user_id ) {
			$_user_id = $this->user_id();
		}

		$connections           = $this->get_all_connections();
		$connections_to_return = array();

		if ( ! empty( $connections ) && is_array( $connections ) ) {
			if ( ! empty( $connections[ $service_name ] ) ) {
				foreach ( $connections[ $service_name ] as $id => $connection ) {
					if ( 0 == $connection['connection_data']['user_id'] || $_user_id == $connection['connection_data']['user_id'] ) {
						$connections_to_return[ $id ] = $connection;
					}
				}
			}

			return $connections_to_return;
		}

		return false;
	}

	function get_all_connections_for_user() {
		$connections = $this->get_all_connections();

		$connections_to_return = array();
		if ( ! empty( $connections ) ) {
			foreach ( (array) $connections as $service_name => $connections_for_service ) {
				foreach ( $connections_for_service as $id => $connection ) {
					$user_id = intval( $connection['connection_data']['user_id'] );
					// phpcs:ignore WordPress.PHP.YodaConditions.NotYoda
					if ( $user_id === 0 || $this->user_id() === $user_id ) {
						$connections_to_return[ $service_name ][ $id ] = $connection;
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

	function get_connection_unique_id( $connection ) {
		return $connection['connection_data']['token_id'];
	}

	function get_connection_meta( $connection ) {
		$connection['user_id'] = $connection['connection_data']['user_id']; // Allows for shared connections
		return $connection;
	}

	function admin_page_load() {
		if ( isset( $_GET['action'] ) && 'error' === $_GET['action'] ) {
					add_action( 'pre_admin_screen_sharing', array( $this, 'display_connection_error' ), 9 );
		}
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

	function display_disconnected() {
		echo "<div class='updated'>\n";
		echo '<p>' . esc_html( __( 'That connection has been removed.', 'jetpack' ) ) . "</p>\n";
		echo "</div>\n\n";
	}

	function globalization() {
		if ( 'on' == $_REQUEST['global'] ) {
			$globalize_connection = $_REQUEST['connection'];
			if ( ! current_user_can( $this->GLOBAL_CAP ) ) {
				return;
			}

			$this->globalize_connection( $globalize_connection );
		}
	}

	function globalize_connection( $connection_id ) {
		$xml = new Jetpack_IXR_Client();
		$xml->query( 'jetpack.globalizePublicizeConnection', $connection_id, 'globalize' );

		if ( ! $xml->isError() ) {
			$response = $xml->getResponse();
			$this->receive_updated_publicize_connections( $response );
		}
	}

	function unglobalize_connection( $connection_id ) {
		$xml = new Jetpack_IXR_Client();
		$xml->query( 'jetpack.globalizePublicizeConnection', $connection_id, 'unglobalize' );

		if ( ! $xml->isError() ) {
			$response = $xml->getResponse();
			$this->receive_updated_publicize_connections( $response );
		}
	}

	function connect_url( $service_name, $for = 'publicize' ) {
		return Jetpack_Keyring_Service_Helper::connect_url( $service_name, $for );
	}

	function refresh_url( $service_name, $for = 'publicize' ) {
		return Jetpack_Keyring_Service_Helper::refresh_url( $service_name, $for );
	}

	function disconnect_url( $service_name, $id ) {
		return Jetpack_Keyring_Service_Helper::disconnect_url( $service_name, $id );
	}

	/**
	 * Get social networks, either all available or only those that the site is connected to.
	 *
	 * @since 2.0.0
	 * @since 6.6.0 Removed Path. Service closed October 2018.
	 *
	 * @param string $filter Select the list of services that will be returned. Defaults to 'all', accepts 'connected'.
	 *
	 * @return array List of social networks.
	 */
	function get_services( $filter = 'all', $_blog_id = false, $_user_id = false ) {
		$services = array(
			'facebook'    => array(),
			'twitter'     => array(),
			'linkedin'    => array(),
			'tumblr'      => array(),
		);

		if ( 'all' == $filter ) {
			return $services;
		} else {
			$connected_services = array();
			foreach ( $services as $service_name => $empty ) {
				$connections = $this->get_connections( $service_name, $_blog_id, $_user_id );
				if ( $connections ) {
					$connected_services[ $service_name ] = $connections;
				}
			}
			return $connected_services;
		}
	}

	function get_connection( $service_name, $id, $_blog_id = false, $_user_id = false ) {
		// Stub
	}

	function flag_post_for_publicize( $new_status, $old_status, $post ) {
		if ( ! $this->post_type_is_publicizeable( $post->post_type ) ) {
			return;
		}

		if ( 'publish' == $new_status && 'publish' != $old_status ) {
			/**
			 * Determines whether a post being published gets publicized.
			 *
			 * Side-note: Possibly our most alliterative filter name.
			 *
			 * @module publicize
			 *
			 * @since 4.1.0
			 *
			 * @param bool $should_publicize Should the post be publicized? Default to true.
			 * @param WP_POST $post Current Post object.
			 */
			$should_publicize = apply_filters( 'publicize_should_publicize_published_post', true, $post );

			if ( $should_publicize ) {
				update_post_meta( $post->ID, $this->PENDING, true );
			}
		}
	}

	function test_connection( $service_name, $connection ) {

		$id = $this->get_connection_id( $connection );

		$xml = new Jetpack_IXR_Client();
		$xml->query( 'jetpack.testPublicizeConnection', $id );

		// Bail if all is well
		if ( ! $xml->isError() ) {
			return true;
		}

		$xml_response            = $xml->getResponse();
		$connection_test_message = $xml_response['faultString'];

		// Set up refresh if the user can
		$user_can_refresh = current_user_can( $this->GLOBAL_CAP );
		if ( $user_can_refresh ) {
			$nonce        = wp_create_nonce( "keyring-request-" . $service_name );
			$refresh_text = sprintf( _x( 'Refresh connection with %s', 'Refresh connection with {social media service}', 'jetpack' ), $this->get_service_label( $service_name ) );
			$refresh_url  = $this->refresh_url( $service_name );
		}

		$error_data = array(
			'user_can_refresh' => $user_can_refresh,
			'refresh_text'     => $refresh_text,
			'refresh_url'      => $refresh_url
		);

		return new WP_Error( 'pub_conn_test_failed', $connection_test_message, $error_data );
	}

	/**
	 * Checks if post has already been shared by Publicize in the past.
	 *
	 * Jetpack uses two methods:
	 * 1. A POST_DONE . 'all' postmeta flag, or
	 * 2. if the post has already been published.
	 *
	 * @since 6.7.0
	 *
	 * @param integer $post_id Optional. Post ID to query connection status for: will use current post if missing.
	 *
	 * @return bool True if post has already been shared by Publicize, false otherwise.
	 */
	public function post_is_done_sharing( $post_id = null ) {
		// Defaults to current post if $post_id is null.
		$post = get_post( $post_id );
		if ( is_null( $post ) ) {
			return false;
		}

		return 'publish' == $post->post_status || get_post_meta( $post->ID, $this->POST_DONE . 'all', true );
	}

	/**
	 * Save a flag locally to indicate that this post has already been Publicized via the selected
	 * connections.
	 */
	function save_publicized( $post_ID, $post = null, $update = null ) {
		if ( is_null( $post ) ) {
			return;
		}
		// Only do this when a post transitions to being published
		if ( get_post_meta( $post->ID, $this->PENDING ) && $this->post_type_is_publicizeable( $post->post_type ) ) {
			$connected_services = $this->get_all_connections();
			if ( ! empty( $connected_services ) ) {
				/**
				 * Fires when a post is saved that has is marked as pending publicizing
				 *
				 * @since 4.1.0
				 *
				 * @param int The post ID
				 */
				do_action_deprecated( 'jetpack_publicize_post', $post->ID, '4.8.0', 'jetpack_published_post_flags' );
			}
			delete_post_meta( $post->ID, $this->PENDING );
			update_post_meta( $post->ID, $this->POST_DONE . 'all', true );
		}
	}

	function set_post_flags( $flags, $post ) {
		$flags['publicize_post'] = false;
		if ( ! $this->post_type_is_publicizeable( $post->post_type ) ) {
			return $flags;
		}
		/** This filter is already documented in modules/publicize/publicize-jetpack.php */
		if ( ! apply_filters( 'publicize_should_publicize_published_post', true, $post ) ) {
			return $flags;
		}

		$connected_services = $this->get_all_connections();

		if ( empty( $connected_services ) ) {
			return $flags;
		}

		$flags['publicize_post'] = true;

		return $flags;
	}

	/**
	 * Options Code
	 */

	function options_page_facebook() {
		$connected_services = $this->get_all_connections();
		$connection         = $connected_services['facebook'][ $_REQUEST['connection'] ];
		$options_to_show    = ( ! empty( $connection['connection_data']['meta']['options_responses'] ) ? $connection['connection_data']['meta']['options_responses'] : false );

		// Nonce check
		check_admin_referer( 'options_page_facebook_' . $_REQUEST['connection'] );

		$pages = ( ! empty( $options_to_show[1]['data'] ) ? $options_to_show[1]['data'] : false );

		$page_selected   = false;
		if ( ! empty( $connection['connection_data']['meta']['facebook_page'] ) ) {
			$found = false;
			if ( $pages && isset( $pages->data ) && is_array( $pages->data )  ) {
				foreach ( $pages->data as $page ) {
					if ( $page->id == $connection['connection_data']['meta']['facebook_page'] ) {
						$found = true;
						break;
					}
				}
			}

			if ( $found ) {
				$page_selected   = $connection['connection_data']['meta']['facebook_page'];
			}
		}

		?>

		<div id="thickbox-content">

			<?php
			ob_start();
			Publicize_UI::connected_notice( 'Facebook' );
			$update_notice = ob_get_clean();

			if ( ! empty( $update_notice ) ) {
				echo $update_notice;
			}
			$page_info_message = sprintf(
				__( 'Facebook supports Publicize connections to Facebook Pages, but not to Facebook Profiles. <a href="%s">Learn More about Publicize for Facebook</a>', 'jetpack' ),
				'https://jetpack.com/support/publicize/facebook'
			);

			if ( $pages ) : ?>
				<p><?php _e( 'Publicize to my <strong>Facebook Page</strong>:', 'jetpack' ); ?></p>
				<table id="option-fb-fanpage">
					<tbody>

					<?php foreach ( $pages as $i => $page ) : ?>
						<?php if ( ! ( $i % 2 ) ) : ?>
							<tr>
						<?php endif; ?>
						<td class="radio"><input type="radio" name="option" data-type="page"
						                         id="<?php echo esc_attr( $page['id'] ) ?>"
						                         value="<?php echo esc_attr( $page['id'] ) ?>" <?php checked( $page_selected && $page_selected == $page['id'], true ); ?> />
						</td>
						<td class="thumbnail"><label for="<?php echo esc_attr( $page['id'] ) ?>"><img
									src="<?php echo esc_url( str_replace( '_s', '_q', $page['picture']['data']['url'] ) ) ?>"
									width="50" height="50"/></label></td>
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

				<?php Publicize_UI::global_checkbox( 'facebook', $_REQUEST['connection'] ); ?>
				<p style="text-align: center;">
					<input type="submit" value="<?php esc_attr_e( 'OK', 'jetpack' ) ?>"
					       class="button fb-options save-options" name="save"
					       data-connection="<?php echo esc_attr( $_REQUEST['connection'] ); ?>"
					       rel="<?php echo wp_create_nonce( 'save_fb_token_' . $_REQUEST['connection'] ) ?>"/>
				</p><br/>
				<p><?php echo $page_info_message; ?></p>
			<?php else: ?>
				<div>
					<p><?php echo $page_info_message; ?></p>
					<p><?php printf( __( '<a class="button" href="%s" target="%s">Create a Facebook page</a> to get started.', 'jetpack' ), 'https://www.facebook.com/pages/creation/', '_blank noopener noreferrer' ); ?></p>
				</div>
			<?php endif; ?>
		</div>
		<?php
	}

	function options_save_facebook() {
		// Nonce check
		check_admin_referer( 'save_fb_token_' . $_REQUEST['connection'] );

		// Check for a numeric page ID
		$page_id = $_POST['selected_id'];
		if ( ! ctype_digit( $page_id ) ) {
			die( 'Security check' );
		}

		if ( 'page' != $_POST['type'] || ! isset( $_POST['selected_id'] ) ) {
			return;
		}

		// Publish to Page
		$options = array(
			'facebook_page'    => $page_id,
			'facebook_profile' => null
		);

		$this->set_remote_publicize_options( $_POST['connection'], $options );
	}

	function options_page_tumblr() {
		// Nonce check
		check_admin_referer( 'options_page_tumblr_' . $_REQUEST['connection'] );

		$connected_services = $this->get_all_connections();
		$connection         = $connected_services['tumblr'][ $_POST['connection'] ];
		$options_to_show    = $connection['connection_data']['meta']['options_responses'];
		$request            = $options_to_show[0];

		$blogs = $request['response']['user']['blogs'];

		$blog_selected = false;

		if ( ! empty( $connection['connection_data']['meta']['tumblr_base_hostname'] ) ) {
			foreach ( $blogs as $blog ) {
				if ( $connection['connection_data']['meta']['tumblr_base_hostname'] == $this->get_basehostname( $blog['url'] ) ) {
					$blog_selected = $connection['connection_data']['meta']['tumblr_base_hostname'];
					break;
				}
			}

		}

		// Use their Primary blog if they haven't selected one yet
		if ( ! $blog_selected ) {
			foreach ( $blogs as $blog ) {
				if ( $blog['primary'] ) {
					$blog_selected = $this->get_basehostname( $blog['url'] );
				}
			}
		} ?>

		<div id="thickbox-content">

			<?php
			ob_start();
			Publicize_UI::connected_notice( 'Tumblr' );
			$update_notice = ob_get_clean();

			if ( ! empty( $update_notice ) ) {
				echo $update_notice;
			}
			?>

			<p><?php _e( 'Publicize to my <strong>Tumblr blog</strong>:', 'jetpack' ); ?></p>

			<ul id="option-tumblr-blog">

				<?php
				foreach ( $blogs as $blog ) {
					$url = $this->get_basehostname( $blog['url'] ); ?>
					<li>
						<input type="radio" name="option" data-type="blog" id="<?php echo esc_attr( $url ) ?>"
						       value="<?php echo esc_attr( $url ) ?>" <?php checked( $blog_selected == $url, true ); ?> />
						<label for="<?php echo esc_attr( $url ) ?>"><span
								class="name"><?php echo esc_html( $blog['title'] ) ?></span></label>
					</li>
				<?php } ?>

			</ul>

			<?php Publicize_UI::global_checkbox( 'tumblr', $_REQUEST['connection'] ); ?>

			<p style="text-align: center;">
				<input type="submit" value="<?php esc_attr_e( 'OK', 'jetpack' ) ?>"
				       class="button tumblr-options save-options" name="save"
				       data-connection="<?php echo esc_attr( $_REQUEST['connection'] ); ?>"
				       rel="<?php echo wp_create_nonce( 'save_tumblr_blog_' . $_REQUEST['connection'] ) ?>"/>
			</p> <br/>
		</div>

		<?php
	}

	function get_basehostname( $url ) {
		return wp_parse_url( $url, PHP_URL_HOST );
	}

	function options_save_tumblr() {
		// Nonce check
		check_admin_referer( 'save_tumblr_blog_' . $_REQUEST['connection'] );
		$options = array( 'tumblr_base_hostname' => $_POST['selected_id'] );

		$this->set_remote_publicize_options( $_POST['connection'], $options );

	}

	function set_remote_publicize_options( $id, $options ) {
		$xml = new Jetpack_IXR_Client();
		$xml->query( 'jetpack.setPublicizeOptions', $id, $options );

		if ( ! $xml->isError() ) {
			$response = $xml->getResponse();
			Jetpack_Options::update_option( 'publicize_connections', $response );
			$this->globalization();
		}
	}

	function options_page_twitter() {
		Publicize_UI::options_page_other( 'twitter' );
	}

	function options_page_linkedin() {
		Publicize_UI::options_page_other( 'linkedin' );
	}

	function options_save_twitter() {
		$this->options_save_other( 'twitter' );
	}

	function options_save_linkedin() {
		$this->options_save_other( 'linkedin' );
	}

	function options_save_other( $service_name ) {
		// Nonce check
		check_admin_referer( 'save_' . $service_name . '_token_' . $_REQUEST['connection'] );
		$this->globalization();
	}

	/**
	 * If there's only one shared connection to Twitter set it as twitter:site tag.
	 */
	function enhaced_twitter_cards_site_tag( $tag ) {
		$custom_site_tag = get_option( 'jetpack-twitter-cards-site-tag' );
		if ( ! empty( $custom_site_tag ) ) {
			return $tag;
		}
		if ( ! $this->is_enabled( 'twitter' ) ) {
			return $tag;
		}
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
			$connection_meta        = $this->get_connection_meta( $connection );
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
