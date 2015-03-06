<?php

class WPCOM_JSON_API_GET_Site_Endpoint extends WPCOM_JSON_API_Endpoint {

	public static $site_format = array(
 		'ID'                => '(int) Site ID',
 		'name'              => '(string) Title of site',
 		'description'       => '(string) Tagline or description of site',
 		'URL'               => '(string) Full URL to the site',
 		'jetpack'           => '(bool)  Whether the site is a Jetpack site or not',
 		'post_count'        => '(int) The number of posts the site has',
		'subscribers_count' => '(int) The number of subscribers the site has',
		'lang'              => '(string) Primary language code of the site',
		'icon'              => '(array) An array of icon formats for the site',
		'logo'              => '(array) The site logo, set in the Customizer',
		'visible'           => '(bool) If this site is visible in the user\'s site list',
		'is_private'        => '(bool) If the site is a private site or not',
		'is_following'      => '(bool) If the current user is subscribed to this site in the reader',
		'options'           => '(array) An array of options/settings for the blog. Only viewable by users with post editing rights to the site. Note: Post formats is deprecated, please see /sites/$id/post-formats/',
		'meta'              => '(object) Meta data',
	);

	// /sites/mine
	// /sites/%s -> $blog_id
	function callback( $path = '', $blog_id = 0 ) {
		global $wpdb;
		if ( 'mine' === $blog_id ) {
			$api = WPCOM_JSON_API::init();
			if ( !$api->token_details || empty( $api->token_details['blog_id'] ) ) {
				return new WP_Error( 'authorization_required', 'An active access token must be used to query information about the current blog.', 403 );
			}
			$blog_id = $api->token_details['blog_id'];
		}

		$blog_id = $this->api->switch_to_blog_and_validate_user( $this->api->get_blog_id( $blog_id ) );
		if ( is_wp_error( $blog_id ) ) {
			return $blog_id;
		}

		$response = $this->build_current_site_response();

		do_action( 'wpcom_json_api_objects', 'sites' );

		return $response;
	}

	/**
	 * Collects the necessary information to return for a site's response.
	 *
	 * @return (array)
	 */
	public function build_current_site_response( ) {

		global $wpdb, $wp_version;

		$response_format = self::$site_format;

		$is_user_logged_in = is_user_logged_in();

		$visible = array();

		if ( $is_user_logged_in ) {
			$current_user = wp_get_current_user();
			$visible = get_user_meta( $current_user->ID, 'blog_visibility', true );

			if ( !is_array( $visible ) )
				$visible = array();

		}

		$blog_id = (int) $this->api->get_blog_id_for_output();

		$is_jetpack = true === apply_filters( 'is_jetpack_site', false, $blog_id );
		$site_url = get_option( 'siteurl' );

		if ( $is_jetpack ) {
			remove_filter( 'option_stylesheet', 'fix_theme_location' );
			if ( 'https' !== parse_url( $site_url, PHP_URL_SCHEME ) ) {
				add_filter( 'set_url_scheme', array( $this, 'force_http' ), 10, 3 );
			}
		}
		foreach ( array_keys( $response_format ) as $key ) {
			switch ( $key ) {
			case 'ID' :
				$response[$key] = $blog_id;
				break;
			case 'name' :
				$response[$key] = (string) htmlspecialchars_decode( get_bloginfo( 'name' ), ENT_QUOTES );
				break;
			case 'description' :
				$response[$key] = (string) htmlspecialchars_decode( get_bloginfo( 'description' ), ENT_QUOTES );
				break;
			case 'URL' :
				$response[$key] = (string) home_url();
				break;
			case 'jetpack' :
				$response[$key] = $is_jetpack; // jetpack magic affects this value
				break;
			case 'is_private' :
				if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
					$public_setting = get_option( 'blog_public' );
					if ( -1 == $public_setting )
						$response[$key] = true;
					else
						$response[$key] = false;
				} else {
					$response[$key] = false; // magic
				}
				break;
			case 'visible' :
				if ( $is_user_logged_in ){
					$is_visible = true;
					if ( isset( $visible[$blog_id] ) ) {
						$is_visible = $visible[$blog_id];
					}
					// null and true are visible
					$response[$key] = $is_visible;
				}
				break;
			case 'post_count' :
				if ( $is_user_logged_in )
					$response[$key] = (int) $wpdb->get_var("SELECT COUNT(*) FROM $wpdb->posts WHERE post_status = 'publish'");
				break;
			case 'lang' :
				if ( $is_user_logged_in )
					$response[$key] = (string) get_bloginfo( 'language' );
				break;
			case 'icon' :
				if ( function_exists( 'blavatar_domain' ) && function_exists( 'blavatar_exists' ) && function_exists( 'blavatar_url' ) ) {
					$domain = blavatar_domain( home_url() );
					if ( blavatar_exists( $domain ) ) {
						$response[ $key ] = array(
							'img' => (string) remove_query_arg( 's', blavatar_url( $domain, 'img' ) ),
							'ico' => (string) remove_query_arg( 's', blavatar_url( $domain, 'ico' ) ),
						);
					} else {
                        // This is done so that we can access the updated blavatar on .com via the /me/sites endpoint
                        if( is_jetpack_site() ) {

							$site_icon_url = get_option( 'jetpack_site_icon_url' );
							if( $site_icon_url ) {
								$response[ $key ] = array(
									'img' => (string) jetpack_photon_url( $site_icon_url, array() , 'https' ),
									'ico' => (string) jetpack_photon_url( $site_icon_url, array( 'w' => 16 ), 'https' )
								);
							}
                        }
                   }
				} elseif ( function_exists( 'jetpack_site_icon_url' ) && function_exists( 'jetpack_photon_url' ) ) {
					$response[ $key ] = array(
						'img' => (string) jetpack_photon_url( jetpack_site_icon_url( get_current_blog_id() , 80 ), array( 'w' => 80 ), 'https' ),
						'ico' => (string) jetpack_photon_url( jetpack_site_icon_url( get_current_blog_id() , 16 ), array( 'w' => 16 ), 'https' ),
					);
				}
				break;
			case 'logo' :
				// Set an empty response array.
				$response[$key] = array(
					'id'  => (int) 0,
					'sizes' => array(),
					'url' => '',
				);

				// Get current site logo values.
				$logo = get_option( 'site_logo' );

				// Update the response array if there's a site logo currenty active.
				if ( $logo && 0 != $logo['id'] ) {
					$response[$key]['id']  = $logo['id'];
					$response[$key]['url'] = $logo['url'];

					foreach ( $logo['sizes'] as $size => $properties ) {
						$response[$key]['sizes'][$size] = $properties;
					}
				}
				break;
			case 'subscribers_count' :

				if ( function_exists( 'wpcom_subs_total_wpcom_subscribers' ) ) {
					$total_wpcom_subs = wpcom_subs_total_wpcom_subscribers(
						array(
							'blog_id' => $blog_id,
						)
					);
					$response[$key] = $total_wpcom_subs;
				} else {
					$response[$key] = 0; // magic
				}
				break;
			case 'is_following':
				$response[$key] = (bool) $this->api->is_following( $blog_id );
				break;
			case 'options':

				$response[$key] = Jetpack_Sync_Settings::get_all();

				if ( ! current_user_can( 'edit_posts' ) )
					unset( $response[$key] );
				break;
			case 'meta' :
				$xmlrpc_scheme = apply_filters( 'wpcom_json_api_xmlrpc_scheme', parse_url( get_option( 'home' ), PHP_URL_SCHEME ) );
				$xmlrpc_url = site_url( 'xmlrpc.php', $xmlrpc_scheme );
				$response[$key] = (object) array(
					'links' => (object) array(
						'self'     => (string) $this->get_site_link( $blog_id ),
						'help'     => (string) $this->get_site_link( $blog_id, 'help'      ),
						'posts'    => (string) $this->get_site_link( $blog_id, 'posts/'    ),
						'comments' => (string) $this->get_site_link( $blog_id, 'comments/' ),
						'xmlrpc'   => (string) $xmlrpc_url,
					),
				);
				break;
			}
		}
		if ( $is_jetpack ) {
			add_filter( 'option_stylesheet', 'fix_theme_location' );
			if ( 'https' !== parse_url( $site_url, PHP_URL_SCHEME ) ) {
				remove_filter( 'set_url_scheme', array( $this, 'force_http' ), 10, 3 );
			}
		}

		return $response;

	}

	function force_http( $url, $scheme, $orig_scheme ) {
		return preg_replace('/^https:\/\//', 'http://', $url, 1 );
	}

}

class WPCOM_JSON_API_List_Post_Formats_Endpoint extends WPCOM_JSON_API_Endpoint {
	// /sites/%s/post-formats -> $blog_id
	function callback( $path = '', $blog_id = 0 ) {
		$blog_id = $this->api->switch_to_blog_and_validate_user( $this->api->get_blog_id( $blog_id ) );
		if ( is_wp_error( $blog_id ) ) {
			return $blog_id;
		}

		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			$this->load_theme_functions();
		}

		// Get a list of supported post formats.
		$all_formats = get_post_format_strings();
		$supported   = get_theme_support( 'post-formats' );

		$supported_formats = $response['formats'] = array();

		if ( isset( $supported[0] ) ) {
			foreach ( $supported[0] as $format ) {
				$supported_formats[ $format ] = $all_formats[ $format ];
			}
		}

		$response['formats'] = $supported_formats;

		return $response;
	}
}

class WPCOM_JSON_API_List_Post_Types_Endpoint extends WPCOM_JSON_API_Endpoint {
	static $post_type_keys_to_include = array( 'name', 'label', 'description' );

	// /sites/%s/post-types -> $blog_id
	function callback( $path = '', $blog_id = 0 ) {
		$blog_id = $this->api->switch_to_blog_and_validate_user( $this->api->get_blog_id( $blog_id ) );
		if ( is_wp_error( $blog_id ) ) {
			return $blog_id;
		}

		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			$this->load_theme_functions();
		}

		$args = $this->query_args();
		$queryable_only = isset( $args['api_queryable'] ) && $args['api_queryable'];

		// Get a list of available post types
		$post_types = get_post_types( array( 'public' => true ) );
		$formatted_post_type_objects = array();

		// Retrieve post type object for each post type
		foreach ( $post_types as $post_type ) {
			// Skip non-queryable if filtering on queryable only
			$is_queryable = $this->is_post_type_allowed( $post_type );
			if ( $queryable_only && ! $is_queryable ) {
				continue;
			}

			$post_type_object = get_post_type_object( $post_type );
			$formatted_post_type_object = array();

			// Include only the desired keys in the response
			foreach ( self::$post_type_keys_to_include as $key ) {
				$formatted_post_type_object[ $key ] = $post_type_object->{ $key };
			}
			$formatted_post_type_object['api_queryable'] = $is_queryable;

			$formatted_post_type_objects[] = $formatted_post_type_object;
		}

		return array(
			'found' => count( $formatted_post_type_objects ),
			'post_types' => $formatted_post_type_objects
		);
	}
}

