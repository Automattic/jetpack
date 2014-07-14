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
		'visible'           => '(bool) If this site is visible in the user\'s site list',
		'is_private'        => '(bool) If the site is a private site or not',
		'is_following'      => '(bool) If the current user is subscribed to this site in the reader',
		'options'           => '(array) An array of options/settings for the blog. Only viewable by users with access to the site.',
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
				$response[$key] = false; // magic
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
					if ( blavatar_exists( $domain ) )
						$response[$key] = array(
							'img' => (string) remove_query_arg( 's', blavatar_url( $domain, 'img' ) ),
							'ico' => (string) remove_query_arg( 's', blavatar_url( $domain, 'ico' ) ),
						);
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
				// Figure out if the blog supports VideoPress, have to do some extra checking for JP blogs
				$has_videopress = false;
				if ( get_option( 'video_upgrade' ) == '1' ) {
					$has_videopress = true;
				} else {
					if ( class_exists( 'Jetpack_Options' ) ) {
						$videopress = Jetpack_Options::get_option( 'videopress', array() );
						if ( $videopress['blog_id'] > 0 )
							$has_videopress = true;
					}
				}

				// Get a list of supported post formats
				$all_formats       = get_post_format_strings();
				$supported         = get_theme_support( 'post-formats' );
				$supported_formats = array();

				if ( isset( $supported[0] ) ) {
					foreach ( $supported[0] as $format ) {
						$supported_formats[ $format ] = $all_formats[ $format ];
					}
				}

				// determine if sharing buttons should be visible by default
				$default_sharing_status = false;
				if ( class_exists( 'Sharing_Service' ) ) {
					$ss                     = new Sharing_Service();
					$blog_services          = $ss->get_blog_services();
					$default_sharing_status = ! empty( $blog_services['visible'] );
				}

				$response[$key] = array(
					'timezone'                => (string) get_option( 'timezone_string' ),
					'gmt_offset'              => (float) get_option( 'gmt_offset' ),
					'videopress_enabled'      => $has_videopress,
					'login_url'               => wp_login_url(),
					'admin_url'               => get_admin_url(),
					'featured_images_enabled' => current_theme_supports( 'post-thumbnails' ),
					'header_image'            => get_theme_mod( 'header_image_data' ),
					'image_default_link_type' => get_option( 'image_default_link_type' ),
					'image_thumbnail_width'   => (int)  get_option( 'thumbnail_size_w' ),
					'image_thumbnail_height'  => (int)  get_option( 'thumbnail_size_h' ),
					'image_thumbnail_crop'    => get_option( 'thumbnail_crop' ),
					'image_medium_width'      => (int)  get_option( 'medium_size_w' ),
					'image_medium_height'     => (int)  get_option( 'medium_size_h' ),
					'image_large_width'       => (int)  get_option( 'large_size_w' ),
					'image_large_height'      => (int) get_option( 'large_size_h' ),
					'post_formats'            => $supported_formats,
					'default_likes_enabled'   => (bool) apply_filters( 'wpl_is_enabled_sitewide', ! get_option( 'disabled_likes' ) ),
					'default_sharing_status'  => (bool) $default_sharing_status,
					'default_comment_status'  => ( 'closed' == get_option( 'default_comment_status' ) ? false : true ),
					'default_ping_status'     => ( 'closed' == get_option( 'default_ping_status' ) ? false : true ),
					'software_version'        => $wp_version,
				);
				if ( !current_user_can( 'publish_posts' ) )
					unset( $response[$key] );
				break;
			case 'meta' :
				$xmlrpc_url = site_url( 'xmlrpc.php' );
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

		return $response;

	}

}
