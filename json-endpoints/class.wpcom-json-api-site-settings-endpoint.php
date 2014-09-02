<?php

class WPCOM_JSON_API_Site_Settings_Endpoint extends WPCOM_JSON_API_Endpoint {

	public static $site_format = array(
 		'ID'                => '(int) Site ID',
 		'name'              => '(string) Title of site',
 		'description'       => '(string) Tagline or description of site',
 		'URL'               => '(string) Full URL to the site',
		'lang'              => '(string) Primary language code of the site',
		'settings'          => '(array) An array of options/settings for the blog. Only viewable by users with access to the site.',
	);

	// GET /sites/%s/settings
	// POST /sites/%s/settings
	function callback( $path = '', $blog_id = 0 ) {

		$blog_id = $this->api->switch_to_blog_and_validate_user( $this->api->get_blog_id( $blog_id ) );
		if ( is_wp_error( $blog_id ) ) {
			return $blog_id;
		}

		if ( ! is_user_logged_in() || ! current_user_can( 'manage_options' ) ) {
			return new WP_Error( 'authorization_required', 'You do not have the capability to manage_options for this site.', 403 );
		}

		if ( 'GET' === $this->api->method ) {
			do_action( 'wpcom_json_api_objects', 'sites' );
			return $this->get_settings_response();
		} else if ( 'POST' === $this->api->method ) {
			return $this->update_settings();
		} else {
			return new WP_Error( 'bad_request', 'An unsupported request method was used.' );
		}

	}

	/**
	 * Determines whether jetpack_relatedposts is supported
	 *
	 * @return (bool)
	 */
	public function jetpack_relatedposts_supported() {
		$wpcom_related_posts_theme_blacklist = array(
			'Expound',
			'Traveler',
			'Opti',
			'Currents',
		);
		return ( ! in_array( wp_get_theme()->get( 'Name' ), $wpcom_related_posts_theme_blacklist ) );
	}


	/**
	 * Collects the necessary information to return for a get settings response.
	 *
	 * @return (array)
	 */
	public function get_settings_response() {

		$response_format = self::$site_format;
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
			case 'lang' :
				$response[$key] = (string) get_bloginfo( 'language' );
				break;
			case 'settings':

				if ( class_exists( 'The_Neverending_Home_Page' ) ) {
					$infinity = new The_Neverending_Home_Page();
					$infinity_settings = $infinity->get_settings();
					$infinity_posts_per_page = $infinity_settings->posts_per_page;
				}

				$jetpack_relatedposts_options = Jetpack_Options::get_option( 'relatedposts' );

				if ( method_exists( 'Jetpack', 'is_module_active' ) ) {
					$jetpack_relatedposts_options[ 'enabled' ] = Jetpack::is_module_active( 'related-posts' );
				}

				// array_values() is necessary to ensure the array starts at index 0.
				$post_categories = array_values(
					array_map(
						function( $category ) {
							return array(
								'value' => $category->term_id,
								'name' => $category->name
							);
						},
						get_categories( array( 'hide_empty' => false ) )
					)
				);

				$response[$key] = array(

					// also exists as "options"
					'admin_url'               => get_admin_url(),
					'default_ping_status'     => (bool) ( 'closed' != get_option( 'default_ping_status' ) ),
					'default_comment_status'  => (bool) ( 'closed' != get_option( 'default_comment_status' ) ),

					// new stuff starts here
					'blog_public'             => (int)( ( defined( 'WPCOM' ) && WPCOM ) ? get_option( 'blog_public' ) : 1 ),
					'jetpack_relatedposts_allowed' => (bool) $this->jetpack_relatedposts_supported(),
					'jetpack_relatedposts_enabled' => (bool) $jetpack_relatedposts_options[ 'enabled' ],
					'jetpack_relatedposts_show_headline' => (bool) $jetpack_relatedposts_options[ 'show_headline' ],
					'jetpack_relatedposts_show_thumbnails' => (bool) $jetpack_relatedposts_options[ 'show_thumbnails' ],
					'infinite_scroll_supported' => (bool) current_theme_supports( 'infinite-scroll' ),
					'infinite_scroll'         => (bool) get_option( 'infinite_scroll' ),
					'posts_per_page'          => (int) $infinity_posts_per_page,
					'default_category'        => get_option('default_category'),
					'post_categories'         => (array) $post_categories,
					'default_post_format'     => get_option( 'default_post_format' ),
					'default_pingback_flag'   => (bool) get_option( 'default_pingback_flag' ),
					'require_name_email'      => (bool) get_option( 'require_name_email' ),
					'comment_registration'    => (bool) get_option( 'comment_registration' ),
					'close_comments_for_old_posts' => (bool) get_option( 'close_comments_for_old_posts' ),
					'close_comments_days_old' => (int) get_option( 'close_comments_days_old' ),
					'thread_comments'         => (bool) get_option( 'thread_comments' ),
					'thread_comments_depth'   => (int) get_option( 'thread_comments_depth' ),
					'page_comments'           => (bool) get_option( 'page_comments' ),
					'comments_per_page'       => (int) get_option( 'comments_per_page' ),
					'default_comments_page'   => get_option( 'default_comments_page' ),
					'comment_order'           => get_option( 'comment_order' ),
					'comments_notify'         => (bool) get_option( 'comments_notify' ),
					'moderation_notify'       => (bool) get_option( 'moderation_notify' ),
					'social_notifications_like' => ( "on" == get_option( 'social_notifications_like' ) ),
					'social_notifications_reblog' => ( "on" == get_option( 'social_notifications_reblog' ) ),
					'social_notifications_subscribe' => ( "on" == get_option( 'social_notifications_subscribe' ) ),
					'comment_moderation'      => (bool) get_option( 'comment_moderation' ),
					'comment_whitelist'       => (bool) get_option( 'comment_whitelist' ),
					'comment_max_links'       => (int) get_option( 'comment_max_links' ),
					'moderation_keys'         => get_option( 'moderation_keys' ),
					'blacklist_keys'          => get_option( 'blacklist_keys' ),
					'lang_id'                 => get_option( 'lang_id' ),

				);
				if ( ! current_user_can( 'edit_posts' ) )
					unset( $response[$key] );
				break;
			}
		}

		return $response;

	}

	/**
	 * Updates site settings for authorized users
	 *
	 * @return (array)
	 */
	public function update_settings() {

		// $this->input() retrieves posted arguments whitelisted and casted to the $request_format
		// specs that get passed in when this class is instantiated
		$input = $this->input();

		$jetpack_relatedposts_options = array();
		$updated = array();

		foreach ( $input as $key => $value ) {

			$value = wp_unslash( trim( $value ) );

			switch ( $key ) {

				case 'default_ping_status':
				case 'default_comment_status':
					// settings are stored as closed|open
					$coerce_value = ( $value ) ? 'open' : 'closed';
					if ( update_option( $key, $coerce_value ) ) {
						$updated[ $key ] = $value;
					};
					break;

				case 'infinite_scroll':
					if ( ! current_theme_supports( 'infinite-scroll' ) ) {
						continue;
					}
					if ( update_option( $key, $value ) ) {
						$updated[ $key ] = $value;
					}
					break;

				case 'jetpack_relatedposts_enabled':
					if ( method_exists( 'Jetpack', 'is_module_active' ) && $this->jetpack_relatedposts_supported() ) {
						if ( $value ) {
							Jetpack::activate_module( 'related-posts', false, false );
						} else {
							Jetpack::deactivate_module( 'related-posts' );
						}
						$updated[ $key ] = $value;
						unset( $jetpack_relatedposts_options[ 'enabled' ] );
						break;
					}
				case 'jetpack_relatedposts_show_thumbnails':
				case 'jetpack_relatedposts_show_headline':
					if ( ! $this->jetpack_relatedposts_supported() ) {
						break;
					}
					$jetpack_relatedposts_options = Jetpack_Options::get_option( 'relatedposts' );
					$just_the_key = substr( $key, 21 );
					$jetpack_relatedposts_options[ $just_the_key ] = $value;
					if ( Jetpack_Options::update_option( 'relatedposts', $jetpack_relatedposts_options ) ) {
						$updated[ $key ] = $value;
					}
				break;

				case 'social_notifications_like':
				case 'social_notifications_reblog':
				case 'social_notifications_subscribe':
					// settings are stored as on|off
					$coerce_value = ( $value ) ? 'on' : 'off';
					if ( update_option( $key, $coerce_value ) ) {
						$updated[ $key ] = $value;
					}
					break;

				// no worries, we've already whitelisted and casted arguments above
				default:
					if ( update_option( $key, $value ) ) {
						$updated[ $key ] = $value;
					}

			}
		}

		return array(
			'updated' => $updated
		);

	}
}
