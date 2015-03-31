<?php

class WPCOM_JSON_API_Site_Settings_Endpoint extends WPCOM_JSON_API_Endpoint {

	public static $site_format = array(
 		'ID'                => '(int) Site ID',
 		'name'              => '(string) Title of site',
 		'description'       => '(string) Tagline or description of site',
 		'URL'               => '(string) Full URL to the site',
		'lang'              => '(string) Primary language code of the site',
		'settings'          => '(array) An array of options/settings for the blog. Only viewable by users with post editing rights to the site.',
	);

	// GET /sites/%s/settings
	// POST /sites/%s/settings
	function callback( $path = '', $blog_id = 0 ) {
		$blog_id = $this->api->switch_to_blog_and_validate_user( $this->api->get_blog_id( $blog_id ) );
		if ( is_wp_error( $blog_id ) ) {
			return $blog_id;
		}

		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			$this->load_theme_functions();
		}

		if ( ! is_user_logged_in() ) {
			return new WP_Error( 'Unauthorized', 'You must be logged-in to manage settings.', 401 );
		} else if ( ! current_user_can( 'manage_options' ) ) {
			return new WP_Error( 'Forbidden', 'You do not have the capability to manage settings for this site.', 403 );
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
	 * Returns category details
	 *
	 * @return (array)
	 */
	public function get_category_details( $category ) {
		return array(
			'value' => $category->term_id,
			'name' => $category->name
		);
	}

	/**
	 * Collects the necessary information to return for a get settings response.
	 *
	 * @return (array)
	 */
	public function get_settings_response() {

		$response_format = self::$site_format;
		$blog_id = (int) $this->api->get_blog_id_for_output();
		$is_jetpack = true === apply_filters( 'is_jetpack_site', false, $blog_id );

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

				$jetpack_relatedposts_options = Jetpack_Options::get_option( 'relatedposts' );

				if ( method_exists( 'Jetpack', 'is_module_active' ) ) {
					$jetpack_relatedposts_options[ 'enabled' ] = Jetpack::is_module_active( 'related-posts' );
				}

				// array_values() is necessary to ensure the array starts at index 0.
				$post_categories = array_values(
					array_map(
						array( $this, 'get_category_details' ),
						get_categories( array( 'hide_empty' => false ) )
					)
				);

				$response[$key] = array(

					// also exists as "options"
					'admin_url'               => get_admin_url(),
					'default_ping_status'     => (bool) ( 'closed' != get_option( 'default_ping_status' ) ),
					'default_comment_status'  => (bool) ( 'closed' != get_option( 'default_comment_status' ) ),

					// new stuff starts here
					'blog_public'             => (int) get_option( 'blog_public' ),
					'jetpack_sync_non_public_post_stati' => (bool) Jetpack_Options::get_option( 'sync_non_public_post_stati' ),
					'jetpack_relatedposts_allowed' => (bool) $this->jetpack_relatedposts_supported(),
					'jetpack_relatedposts_enabled' => (bool) $jetpack_relatedposts_options[ 'enabled' ],
					'jetpack_relatedposts_show_headline' => (bool) $jetpack_relatedposts_options[ 'show_headline' ],
					'jetpack_relatedposts_show_thumbnails' => (bool) $jetpack_relatedposts_options[ 'show_thumbnails' ],
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
					'wga'                     => get_option( 'wga' ),
					'disabled_likes'          => (bool) get_option( 'disabled_likes' ),
					'disabled_reblogs'        => (bool) get_option( 'disabled_reblogs' ),
					'jetpack_comment_likes_enabled' => (bool) get_option( 'jetpack_comment_likes_enabled', false ),
					'twitter_via'             => (string) get_option( 'twitter_via' ),
					'jetpack-twitter-cards-site-tag' => (string) get_option( 'jetpack-twitter-cards-site-tag' ),
				);

				if ( class_exists( 'Sharing_Service' ) ) {
					$ss = new Sharing_Service();
					$sharing = $ss->get_global_options();
					$response[ $key ]['sharing_button_style'] = (string) $sharing['button_style'];
					$response[ $key ]['sharing_label'] = (string) $sharing['sharing_label'];
					$response[ $key ]['sharing_show'] = (array) $sharing['show'];
					$response[ $key ]['sharing_open_links'] = (string) $sharing['open_links'];
				}

				if ( function_exists( 'jetpack_protect_format_whitelist' ) ) {
					$response[ $key ]['jetpack_protect_whitelist'] = jetpack_protect_format_whitelist();
				}

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
		$sharing_options = array();
		$updated = array();

		foreach ( $input as $key => $value ) {

			if ( ! is_array( $value ) ) {
				$value = trim( $value );
			}
			$value = wp_unslash( $value );

			switch ( $key ) {

				case 'default_ping_status':
				case 'default_comment_status':
					// settings are stored as closed|open
					$coerce_value = ( $value ) ? 'open' : 'closed';
					if ( update_option( $key, $coerce_value ) ) {
						$updated[ $key ] = $value;
					};
					break;
				case 'jetpack_protect_whitelist':
					if ( function_exists( 'jetpack_protect_save_whitelist' ) ) {
						$result = jetpack_protect_save_whitelist( $value );
						if ( is_wp_error( $result ) ) {
							return $result;
						}
						$updated[ $key ] = jetpack_protect_format_whitelist();
					}
					break;
				case 'jetpack_sync_non_public_post_stati':
					Jetpack_Options::update_option( 'sync_non_public_post_stati', $value );
					break;
				case 'jetpack_relatedposts_enabled':
				case 'jetpack_relatedposts_show_thumbnails':
				case 'jetpack_relatedposts_show_headline':
					if ( ! $this->jetpack_relatedposts_supported() ) {
						break;
					}
					if ( 'jetpack_relatedposts_enabled' === $key && method_exists( 'Jetpack', 'is_module_active' ) && $this->jetpack_relatedposts_supported() ) {
						$before_action = Jetpack::is_module_active('related-posts');
						if ( $value ) {
							Jetpack::activate_module( 'related-posts', false, false );
						} else {
							Jetpack::deactivate_module( 'related-posts' );
						}
						$after_action = Jetpack::is_module_active('related-posts');
						if ( $after_action == $before_action ) {
							break;
						}
					}
					$just_the_key = substr( $key, 21 );
					$jetpack_relatedposts_options[ $just_the_key ] = $value;
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
				case 'wga':
					if ( ! isset( $value['code'] ) || ! preg_match( '/^$|^UA-[\d-]+$/i', $value['code'] ) ) {
						return new WP_Error( 'invalid_code', 'Invalid UA ID' );
					}
					$wga = get_option( 'wga', array() );
					$wga['code'] = $value['code']; // maintain compatibility with wp-google-analytics
					if ( update_option( 'wga', $wga ) ) {
						$updated[ $key ] = $value;
					}

					$enabled_or_disabled = $wga['code'] ? 'enabled' : 'disabled';
					bump_stats_extras( 'google-analytics', $enabled_or_disabled );

					$business_plugins = WPCOM_Business_Plugins::instance();
					$business_plugins->activate_plugin( 'wp-google-analytics' );
					break;

				case 'jetpack_comment_likes_enabled':
					// settings are stored as 1|0
					$coerce_value = (int) $value;
					if ( update_option( $key, $coerce_value ) ) {
						$updated[ $key ] = $value;
					}
					break;

				// Sharing options
				case 'sharing_button_style':
				case 'sharing_show':
				case 'sharing_open_links':
					$sharing_options[ preg_replace( '/^sharing_/', '', $key ) ] = $value;
					break;
				case 'sharing_label':
					$sharing_options[ $key ] = $value;
					break;

				// no worries, we've already whitelisted and casted arguments above
				default:
					if ( update_option( $key, $value ) ) {
						$updated[ $key ] = $value;
					}

			}
		}

		if ( count( $jetpack_relatedposts_options ) ) {
			// track new jetpack_relatedposts options against old
			$old_relatedposts_options = Jetpack_Options::get_option( 'relatedposts' );
			if ( Jetpack_Options::update_option( 'relatedposts', $jetpack_relatedposts_options ) ) {
				foreach( $jetpack_relatedposts_options as $key => $value ) {
					if ( $value !== $old_relatedposts_options[ $key ] ) {
						$updated[ 'jetpack_relatedposts_' . $key ] = $value;
					}
				}
			}
		}

		if ( ! empty( $sharing_options ) && class_exists( 'Sharing_Service' ) ) {
			$ss = new Sharing_Service();

			// Merge current values with updated, since Sharing_Service expects
			// all values to be included when updating
			$current_sharing_options = $ss->get_global_options();
			foreach ( $current_sharing_options as $key => $val ) {
				if ( ! isset( $sharing_options[ $key ] ) ) {
					$sharing_options[ $key ] = $val;
				}
			}

			$updated_social_options = $ss->set_global_options( $sharing_options );

			if ( isset( $input['sharing_button_style'] ) ) {
				$updated['sharing_button_style'] = (string) $updated_social_options['button_style'];
			}
			if ( isset( $input['sharing_label'] ) ) {
				// Sharing_Service won't report label as updated if set to default
				$updated['sharing_label'] = (string) $sharing_options['sharing_label'];
			}
			if ( isset( $input['sharing_show'] ) ) {
				$updated['sharing_show'] = (array) $updated_social_options['show'];
			}
			if ( isset( $input['sharing_open_links'] ) ) {
				$updated['sharing_open_links'] = (string) $updated_social_options['open_links'];
			}
		}

		return array(
			'updated' => $updated
		);

	}
}
