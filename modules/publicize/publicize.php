<?php

abstract class Publicize_Base {

	/**
	* Services that are currently connected to the given user
	* through publicize.
	*/
	public $connected_services = array();

	/**
	* Services that are supported by publicize. They don't
	* necessarily need to be connected to the current user.
	*/
	public $services;

	/**
	* key names for post meta
	*/
	public $ADMIN_PAGE        = 'wpas';
	public $POST_MESS         = '_wpas_mess';
	public $POST_SKIP         = '_wpas_skip_'; // connection id appended to indicate that a connection should NOT be publicized to
	public $POST_DONE         = '_wpas_done_'; // connection id appended to indicate a connection has already been publicized to
	public $USER_AUTH         = 'wpas_authorize';
	public $USER_OPT          = 'wpas_';
	public $PENDING           = '_publicize_pending'; // ready for Publicize to do its thing
	public $POST_SERVICE_DONE = '_publicize_done_external'; // array of external ids where we've Publicized

	/**
	* default pieces of the message used in constructing the
	* content pushed out to other social networks
	*/

	public $default_prefix  = '';
	public $default_message = '%title%';
	public $default_suffix  = ' ';

	/**
	 * What WP capability is require to create/delete global connections?
	 * All users with this cap can un-globalize all other global connections, and globalize any of their own
	 * Globalized connections cannot be unselected by users without this capability when publishing
	 */
	public $GLOBAL_CAP = 'edit_others_posts';

	/**
	* Sets up the basics of Publicize
	*/
	function __construct() {
		$this->default_message = Publicize_Util::build_sprintf( array(
			/**
			 * Filter the default Publicize message.
			 *
			 * @module publicize
			 *
			 * @since 2.0.0
			 *
			 * @param string $this->default_message Publicize's default message. Default is the post title.
			 */
			apply_filters( 'wpas_default_message', $this->default_message ),
			'title',
			'url',
		) );

		$this->default_prefix = Publicize_Util::build_sprintf( array(
			/**
			 * Filter the message prepended to the Publicize custom message.
			 *
			 * @module publicize
			 *
			 * @since 2.0.0
			 *
			 * @param string $this->default_prefix String prepended to the Publicize custom message.
			 */
			apply_filters( 'wpas_default_prefix', $this->default_prefix ),
			'url',
		) );

		$this->default_suffix = Publicize_Util::build_sprintf( array(
			/**
			 * Filter the message appended to the Publicize custom message.
			 *
			 * @module publicize
			 *
			 * @since 2.0.0
			 *
			 * @param string $this->default_suffix String appended to the Publicize custom message.
			 */
			apply_filters( 'wpas_default_suffix', $this->default_suffix ),
			'url',
		) );

		/**
		 * Filter the capability to change global Publicize connection options.
		 *
		 * All users with this cap can un-globalize all other global connections, and globalize any of their own
		 * Globalized connections cannot be unselected by users without this capability when publishing.
		 *
		 * @module publicize
		 *
		 * @since 2.2.1
		 *
		 * @param string $this->GLOBAL_CAP default capability in control of global Publicize connection options. Default to edit_others_posts.
		 */
		$this->GLOBAL_CAP = apply_filters( 'jetpack_publicize_global_connections_cap', $this->GLOBAL_CAP );

		// stage 1 and 2 of 3-stage Publicize. Flag for Publicize on creation, save meta,
		// then check meta and publicize based on that. stage 3 implemented on wpcom
		add_action( 'transition_post_status', array( $this, 'flag_post_for_publicize' ), 10, 3 );
		add_action( 'save_post', array( &$this, 'save_meta' ), 20, 2 );
		add_filter( 'post_updated_messages', array( $this, 'update_published_message' ), 20, 1 );

		// Connection test callback
		add_action( 'wp_ajax_test_publicize_conns', array( $this, 'test_publicize_conns' ) );
	}

	/**
	* Functions to be implemented by the extended class (publicize-wpcom or publicize-jetpack)
	*/
	abstract function get_connection_id( $connection );
	abstract function connect_url( $service_name );
	abstract function disconnect_url( $service_name, $id );
	abstract function get_connection_meta( $connection );
	abstract function get_services( $filter = 'all' );
	abstract function get_connections( $service, $_blog_id = false, $_user_id = false );
	abstract function get_connection( $service, $id, $_blog_id = false, $_user_id = false );
	abstract function flag_post_for_publicize( $new_status, $old_status, $post );
	abstract function test_connection( $service_name, $connection );
	abstract function disconnect( $service, $connection_id, $_blog_id = false, $_user_id = false, $force_delete = false );

	/**
	* Shared Functions
	*/

	/**
	* Returns an external URL to the connection's profile
	*/
	function get_profile_link( $service_name, $connection ) {
		$cmeta = $this->get_connection_meta( $connection );

		if ( isset( $cmeta['connection_data']['meta']['link'] ) ) {
			if ( 'facebook' == $service_name && 0 === strpos( parse_url( $cmeta['connection_data']['meta']['link'], PHP_URL_PATH ), '/app_scoped_user_id/' ) ) {
				// App-scoped Facebook user IDs are not usable profile links
				return false;
			}

			return $cmeta['connection_data']['meta']['link'];
		} elseif ( 'facebook' == $service_name && isset( $cmeta['connection_data']['meta']['facebook_page'] ) ) {
			return 'https://facebook.com/' . $cmeta['connection_data']['meta']['facebook_page'];
		} elseif ( 'tumblr' == $service_name && isset( $cmeta['connection_data']['meta']['tumblr_base_hostname'] ) ) {
			 return 'http://' . $cmeta['connection_data']['meta']['tumblr_base_hostname'];
		} elseif ( 'twitter' == $service_name ) {
			return 'https://twitter.com/' . substr( $cmeta['external_display'], 1 ); // Has a leading '@'
		} elseif ( 'google_plus' == $service_name && isset( $cmeta['connection_data']['meta']['google_plus_page'] ) ) {
			return 'https://plus.google.com/' . $cmeta['connection_data']['meta']['google_plus_page'];
		} elseif ( 'google_plus' == $service_name ) {
			return 'https://plus.google.com/' . $cmeta['external_id'];
		} else if ( 'linkedin' == $service_name ) {
			if ( !isset( $cmeta['connection_data']['meta']['profile_url'] ) ) {
				return false;
			}

			$profile_url_query = parse_url( $cmeta['connection_data']['meta']['profile_url'], PHP_URL_QUERY );
			wp_parse_str( $profile_url_query, $profile_url_query_args );
			if ( isset( $profile_url_query_args['key'] ) ) {
				$id = $profile_url_query_args['key'];
			} elseif ( isset( $profile_url_query_args['id'] ) ) {
				$id = $profile_url_query_args['id'];
			} else {
				return false;
			}

			return esc_url_raw( add_query_arg( 'id', urlencode( $id ), 'http://www.linkedin.com/profile/view' ) );
		} else {
			return false; // no fallback. we just won't link it
		}
	}

	/**
	* Returns a display name for the connection
	*/
	function get_display_name( $service_name, $connection ) {
		$cmeta = $this->get_connection_meta( $connection );

		if ( isset( $cmeta['connection_data']['meta']['display_name'] ) ) {
			return $cmeta['connection_data']['meta']['display_name'];
		} elseif ( $service_name == 'tumblr' && isset( $cmeta['connection_data']['meta']['tumblr_base_hostname'] ) ) {
			 return $cmeta['connection_data']['meta']['tumblr_base_hostname'];
		} elseif ( $service_name == 'twitter' ) {
			return $cmeta['external_display'];
		} else {
			$connection_display = $cmeta['external_display'];
			if ( empty( $connection_display ) )
				$connection_display = $cmeta['external_name'];
			return $connection_display;
		}
	}

	public static function get_service_label( $service_name ) {
		switch ( $service_name ) {
			case 'linkedin':
				return 'LinkedIn';
				break;
			case 'google_plus':
				return  'Google+';
				break;
			case 'twitter':
			case 'facebook':
			case 'tumblr':
			default:
				return ucfirst( $service_name );
				break;
		}
	}

	function show_options_popup( $service_name, $connection ) {
		$cmeta = $this->get_connection_meta( $connection );

		// always show if no selection has been made for facebook
		if ( 'facebook' == $service_name && empty( $cmeta['connection_data']['meta']['facebook_profile'] ) && empty( $cmeta['connection_data']['meta']['facebook_page'] ) )
			return true;

		// always show if no selection has been made for tumblr
		if ( 'tumblr' == $service_name && empty ( $cmeta['connection_data']['meta']['tumblr_base_hostname'] ) )
			return true;

		// if we have the specific connection info..
		if ( isset( $_GET['id'] ) ) {
			if ( $cmeta['connection_data']['id'] == $_GET['id'] )
				return true;
		} else {
			// otherwise, just show if this is the completed step / first load
			if ( !empty( $_GET['action'] ) && 'completed' == $_GET['action'] && !empty( $_GET['service'] ) && $service_name == $_GET['service'] && ! in_array( $_GET['service'], array( 'facebook', 'tumblr' ) ) )
				return true;
		}

		return false;
	}

	function user_id() {
		global $current_user;
		return $current_user->ID;
	}

	function blog_id() {
		return get_current_blog_id();
	}

	/**
	* Returns true if a user has a connection to a particular service, false otherwise
	*/
	function is_enabled( $service, $_blog_id = false, $_user_id = false ) {
		if ( !$_blog_id )
			$_blog_id = $this->blog_id();

		if ( !$_user_id )
			$_user_id = $this->user_id();

		$connections = $this->get_connections( $service, $_blog_id, $_user_id );
		return ( is_array( $connections ) && count( $connections ) > 0 ? true : false );
	}

	/**
	* Fires when a post is saved, checks conditions and saves state in postmeta so that it
	* can be picked up later by @see ::publicize_post() on WordPress.com codebase.
	*/
	function save_meta( $post_id, $post ) {
		$cron_user = null;
		$submit_post = true;

		if ( ! $this->post_type_is_publicizeable( $post->post_type ) )
			return;

		// Don't Publicize during certain contexts:

		// - import
		if ( defined( 'WP_IMPORTING' ) && WP_IMPORTING  ) {
			$submit_post = false;
		}

		// - on quick edit, autosave, etc but do fire on p2, quickpress, and instapost ajax
		if (
			defined( 'DOING_AJAX' )
		&&
			DOING_AJAX
		&&
			!did_action( 'p2_ajax' )
		&&
			!did_action( 'wp_ajax_json_quickpress_post' )
		&&
			!did_action( 'wp_ajax_instapost_publish' )
		&&
			!did_action( 'wp_ajax_post_reblog' )
		&&
			!did_action( 'wp_ajax_press-this-save-post' )
		) {
			$submit_post = false;
		}

		// - bulk edit
		if ( isset( $_GET['bulk_edit'] ) ) {
			$submit_post = false;
		}

		// - API/XML-RPC Test Posts
		if (
			(
				defined( 'XMLRPC_REQUEST' )
			&&
				XMLRPC_REQUEST
			||
				defined( 'APP_REQUEST' )
			&&
				APP_REQUEST
			)
		&&
			0 === strpos( $post->post_title, 'Temporary Post Used For Theme Detection' )
		) {
			$submit_post = false;
		}

		// only work with certain statuses (avoids inherits, auto drafts etc)
		if ( !in_array( $post->post_status, array( 'publish', 'draft', 'future' ) ) ) {
			$submit_post = false;
		}

		// don't publish password protected posts
		if ( '' !== $post->post_password ) {
			$submit_post = false;
		}

		// Did this request happen via wp-admin?
		$from_web = isset( $_SERVER['REQUEST_METHOD'] )
			&&
			'post' == strtolower( $_SERVER['REQUEST_METHOD'] )
			&&
			isset( $_POST[$this->ADMIN_PAGE] );

		if ( ( $from_web || defined( 'POST_BY_EMAIL' ) ) && isset( $_POST['wpas_title'] ) ) {
			if ( empty( $_POST['wpas_title'] ) ) {
				delete_post_meta( $post_id, $this->POST_MESS );
			} else {
				update_post_meta( $post_id, $this->POST_MESS, trim( stripslashes( $_POST['wpas_title'] ) ) );
			}
		}

		// change current user to provide context for get_services() if we're running during cron
		if ( defined( 'DOING_CRON' ) && DOING_CRON ) {
			$cron_user = (int) $GLOBALS['user_ID'];
			wp_set_current_user( $post->post_author );
		}

		/**
		 * In this phase, we mark connections that we want to SKIP. When Publicize is actually triggered,
		 * it will Publicize to everything *except* those marked for skipping.
		 */
		foreach ( (array) $this->get_services( 'connected' ) as $service_name => $connections ) {
			foreach ( $connections as $connection ) {
				$connection_data = '';
				if ( method_exists( $connection, 'get_meta' ) )
					$connection_data = $connection->get_meta( 'connection_data' );
				elseif ( ! empty( $connection['connection_data'] ) )
					$connection_data = $connection['connection_data'];

				/** This action is documented in modules/publicize/ui.php */
				if ( false == apply_filters( 'wpas_submit_post?', $submit_post, $post_id, $service_name, $connection_data ) ) {
					delete_post_meta( $post_id, $this->PENDING );
					continue;
				}

				if ( !empty( $connection->unique_id ) )
					$unique_id = $connection->unique_id;
				else if ( !empty( $connection['connection_data']['token_id'] ) )
					$unique_id = $connection['connection_data']['token_id'];

				// This was a wp-admin request, so we need to check the state of checkboxes
				if ( $from_web ) {
					// delete stray service-based post meta
					delete_post_meta( $post_id, $this->POST_SKIP . $service_name );

					// We *unchecked* this stream from the admin page, or it's set to readonly, or it's a new addition
					if ( empty( $_POST[$this->ADMIN_PAGE]['submit'][$unique_id] ) ) {
						// Also make sure that the service-specific input isn't there.
						// If the user connected to a new service 'in-page' then a hidden field with the service
						// name is added, so we just assume they wanted to Publicize to that service.
						if ( empty( $_POST[$this->ADMIN_PAGE]['submit'][$service_name] ) ) {
							// Nothing seems to be checked, so we're going to mark this one to be skipped
							update_post_meta( $post_id, $this->POST_SKIP . $unique_id, 1 );
							continue;
						} else {
							// clean up any stray post meta
							delete_post_meta( $post_id, $this->POST_SKIP . $unique_id );
						}
					} else {
						// The checkbox for this connection is explicitly checked -- make sure we DON'T skip it
						delete_post_meta( $post_id, $this->POST_SKIP . $unique_id );
					}
				}

				/**
				 * Fires right before the post is processed for Publicize.
				 * Users may hook in here and do anything else they need to after meta is written,
				 * and before the post is processed for Publicize.
				 *
				 * @since 2.1.2
				 *
				 * @param bool $submit_post Should the post be publicized.
				 * @param int $post->ID Post ID.
				 * @param string $service_name Service name.
				 * @param array $connection Array of connection details.
				 */
				do_action( 'publicize_save_meta', $submit_post, $post_id, $service_name, $connection );
			}
		}

		if ( defined( 'DOING_CRON' ) && DOING_CRON ) {
			wp_set_current_user( $cron_user );
		}

		// Next up will be ::publicize_post()
	}

	public function update_published_message( $messages ) {
		global $post_type, $post_type_object, $post;
		if ( ! $this->post_type_is_publicizeable( $post_type ) ) {
			return $messages;
		}
		$view_post_link_html = '';
		$viewable = is_post_type_viewable( $post_type_object );
		if ( $viewable ) {
			$view_text = esc_html__( 'View post' ); // intentionally omitted domain

			if ( 'jetpack-portfolio' == $post_type ) {
				$view_text = esc_html__( 'View project', 'jetpack' );
			}

			$view_post_link_html = sprintf( ' <a href="%1$s">%2$s</a>',
				esc_url( get_permalink( $post ) ),
				$view_text
			);
		}

		$services = $this->get_publicizing_services( $post->ID );
		if ( empty( $services ) ) {
			return $messages;
		}

		$labels = array();
		foreach ( $services as $service => $display_names ) {
			$labels[] = sprintf(
				/* translators: Service name is %1$s, and account name is %2$s. */
				esc_html__( '%1$s (%2$s)', 'jetpack' ),
				esc_html( $service ),
				esc_html( implode( ', ', $display_names ) )
			);
		}

		$messages['post'][6] = sprintf(
			/* translators: %1$s is a comma-separated list of services and accounts. Ex. Facebook (@jetpack), Twitter (@jetpack) */
			esc_html__( 'Post published and sharing on %1$s.', 'jetpack' ),
			implode( ', ', $labels )
		) . $view_post_link_html;

		if ( $post_type == 'post' && class_exists('Jetpack_Subscriptions' ) ) {
			$subscription = Jetpack_Subscriptions::init();
			if ( $subscription->should_email_post_to_subscribers( $post ) ) {
				$messages['post'][6] = sprintf(
					/* translators: %1$s is a comma-separated list of services and accounts. Ex. Facebook (@jetpack), Twitter (@jetpack) */
					esc_html__( 'Post published, sending emails to subscribers and sharing post on %1$s.', 'jetpack' ),
					implode( ', ', $labels )
				) . $view_post_link_html;
			}
		}

		$messages['jetpack-portfolio'][6] = sprintf(
			/* translators: %1$s is a comma-separated list of services and accounts. Ex. Facebook (@jetpack), Twitter (@jetpack) */
			esc_html__( 'Project published and sharing project on %1$s.', 'jetpack' ),
			implode( ', ', $labels )
		) . $view_post_link_html;

		return $messages;
	}

	function get_publicizing_services( $post_id ) {
		$services = array();

		foreach ( (array) $this->get_services( 'connected' ) as $service_name => $connections ) {
			// services have multiple connections.
			foreach ( $connections as $connection ) {
				$unique_id = '';
				if ( ! empty( $connection->unique_id ) )
					$unique_id = $connection->unique_id;
				else if ( ! empty( $connection['connection_data']['token_id'] ) )
					$unique_id = $connection['connection_data']['token_id'];

				// Did we skip this connection?
				if ( get_post_meta( $post_id, $this->POST_SKIP . $unique_id,  true ) ) {
					continue;
				}
				$services[ $this->get_service_label( $service_name ) ][] = $this->get_display_name( $service_name, $connection );
			}
		}

		return $services;
	}

	/**
	* Is a given post type Publicize-able?
	*
	* Not every CPT lends itself to Publicize-ation.  Allow CPTs to register by adding their CPT via
	* the publicize_post_types array filter.
	*
	* @param string $post_type The post type to check.
	* @return bool True if the post type can be Publicized.
	*/
	function post_type_is_publicizeable( $post_type ) {
		if ( 'post' == $post_type )
			return true;

		return post_type_supports( $post_type, 'publicize' );
	}

	/**
	 * Runs tests on all the connections and returns the results to the caller
	 */
	function test_publicize_conns() {
		$test_results = array();

		foreach ( (array) $this->get_services( 'connected' ) as $service_name => $connections ) {
			foreach ( $connections as $connection ) {

				$id = $this->get_connection_id( $connection );

				$connection_test_passed = true;
				$connection_test_message = __( 'This connection is working correctly.' , 'jetpack' );
				$user_can_refresh = false;
				$refresh_text = '';
				$refresh_url = '';

				$connection_test_result = true;
				if ( method_exists( $this, 'test_connection' ) ) {
					$connection_test_result = $this->test_connection( $service_name, $connection );
				}

				if ( is_wp_error( $connection_test_result ) ) {
					$connection_test_passed = false;
					$connection_test_message = $connection_test_result->get_error_message();
					$error_data = $connection_test_result->get_error_data();

					$user_can_refresh = $error_data['user_can_refresh'];
					$refresh_text = $error_data['refresh_text'];
					$refresh_url = $error_data['refresh_url'];
				}

				$test_results[] = array(
					'connectionID'          => $id,
					'serviceName'           => $service_name,
					'connectionTestPassed'  => $connection_test_passed,
					'connectionTestMessage' => esc_attr( $connection_test_message ),
					'userCanRefresh'        => $user_can_refresh,
					'refreshText'           => esc_attr( $refresh_text ),
					'refreshURL'            => $refresh_url
				);
			}
		}

		wp_send_json_success( $test_results );
	}
}
