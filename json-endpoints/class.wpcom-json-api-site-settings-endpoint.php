<?php

new WPCOM_JSON_API_Site_Settings_Endpoint( array(
	'description' => 'Get detailed settings information about a site.',
	'group'       => '__do_not_document',
	'stat'        => 'sites:X',
	'max_version'   => '1.1',
	'new_version' => '1.2',
	'method'      => 'GET',
	'path'        => '/sites/%s/settings',
	'path_labels' => array(
		'$site' => '(int|string) Site ID or domain',
	),

	'query_parameters' => array(
		'context' => false,
	),

	'response_format' => WPCOM_JSON_API_Site_Settings_Endpoint::$site_format,

	'example_request' => 'https://public-api.wordpress.com/rest/v1/sites/en.blog.wordpress.com/settings',
) );

new WPCOM_JSON_API_Site_Settings_Endpoint( array(
	'description' => 'Update settings for a site.',
	'group'       => '__do_not_document',
	'stat'        => 'sites:X',
	'max_version' => '1.1',
	'new_version' => '1.2',
	'method'      => 'POST',
	'path'        => '/sites/%s/settings',
	'path_labels' => array(
		'$site' => '(int|string) Site ID or domain',
	),

	'request_format'  => array(
		'blogname'                     => '(string) Blog name',
		'blogdescription'              => '(string) Blog description',
		'default_pingback_flag'        => '(bool) Notify blogs linked from article?',
		'default_ping_status'          => '(bool) Allow link notifications from other blogs?',
		'default_comment_status'       => '(bool) Allow comments on new articles?',
		'blog_public'                  => '(string) Site visibility; -1: private, 0: discourage search engines, 1: allow search engines',
		'jetpack_sync_non_public_post_stati' => '(bool) allow sync of post and pages with non-public posts stati',
		'jetpack_relatedposts_enabled' => '(bool) Enable related posts?',
		'jetpack_relatedposts_show_headline' => '(bool) Show headline in related posts?',
		'jetpack_relatedposts_show_thumbnails' => '(bool) Show thumbnails in related posts?',
		'jetpack_protect_whitelist'    => '(array) List of IP addresses to whitelist',
		'jetpack_search_enabled'       => '(bool) Enable Jetpack Search',
		'jetpack_search_supported'     => '(bool) Jetpack Search is supported',
		'infinite_scroll'              => '(bool) Support infinite scroll of posts?',
		'default_category'             => '(int) Default post category',
		'default_post_format'          => '(string) Default post format',
		'require_name_email'           => '(bool) Require comment authors to fill out name and email?',
		'comment_registration'         => '(bool) Require users to be registered and logged in to comment?',
		'close_comments_for_old_posts' => '(bool) Automatically close comments on old posts?',
		'close_comments_days_old'      => '(int) Age at which to close comments',
		'thread_comments'              => '(bool) Enable threaded comments?',
		'thread_comments_depth'        => '(int) Depth to thread comments',
		'page_comments'                => '(bool) Break comments into pages?',
		'comments_per_page'            => '(int) Number of comments to display per page',
		'default_comments_page'        => '(string) newest|oldest Which page of comments to display first',
		'comment_order'                => '(string) asc|desc Order to display comments within page',
		'comments_notify'              => '(bool) Email me when someone comments?',
		'moderation_notify'            => '(bool) Email me when a comment is helf for moderation?',
		'social_notifications_like'    => '(bool) Email me when someone likes my post?',
		'social_notifications_reblog'  => '(bool) Email me when someone reblogs my post?',
		'social_notifications_subscribe' => '(bool) Email me when someone follows my blog?',
		'comment_moderation'           => '(bool) Moderate comments for manual approval?',
		'comment_whitelist'            => '(bool) Moderate comments unless author has a previously-approved comment?',
		'comment_max_links'            => '(int) Moderate comments that contain X or more links',
		'moderation_keys'              => '(string) Words or phrases that trigger comment moderation, one per line',
		'blacklist_keys'               => '(string) Words or phrases that mark comment spam, one per line',
		'lang_id'                      => '(int) ID for language blog is written in',
		'wga'                          => '(array) Google Analytics Settings',
		'disabled_likes'               => '(bool) Are likes globally disabled (they can still be turned on per post)?',
		'disabled_reblogs'             => '(bool) Are reblogs disabled on posts?',
		'jetpack_comment_likes_enabled' => '(bool) Are comment likes enabled for all comments?',
		'sharing_button_style'         => '(string) Style to use for sharing buttons (icon-text, icon, text, or official)',
		'sharing_label'                => '(string) Label to use for sharing buttons, e.g. "Share this:"',
		'sharing_show'                 => '(string|array:string) Post type or array of types where sharing buttons are to be displayed',
		'sharing_open_links'           => '(string) Link target for sharing buttons (same or new)',
		'twitter_via'                  => '(string) Twitter username to include in tweets when people share using the Twitter button',
		'jetpack-twitter-cards-site-tag' => '(string) The Twitter username of the owner of the site\'s domain.',
		'eventbrite_api_token'         => '(int) The Keyring token ID for an Eventbrite token to associate with the site',
		'timezone_string'              => '(string) PHP-compatible timezone string like \'UTC-5\'',
		'gmt_offset'                   => '(int) Site offset from UTC in hours',
		'date_format'                  => '(string) PHP Date-compatible date format',
		'time_format'                  => '(string) PHP Date-compatible time format',
		'start_of_week'                => '(int) Starting day of week (0 = Sunday, 6 = Saturday)',
		'jetpack_testimonial'          => '(bool) Whether testimonial custom post type is enabled for the site',
		'jetpack_testimonial_posts_per_page' => '(int) Number of testimonials to show per page',
		'jetpack_portfolio'            => '(bool) Whether portfolio custom post type is enabled for the site',
		'jetpack_portfolio_posts_per_page' => '(int) Number of portfolio projects to show per page',
		Jetpack_SEO_Utils::FRONT_PAGE_META_OPTION => '(string) The seo meta description for the site.',
		Jetpack_SEO_Titles::TITLE_FORMATS_OPTION => '(array) SEO meta title formats. Allowed keys: front_page, posts, pages, groups, archives',
		'verification_services_codes'  => '(array) Website verification codes. Allowed keys: google, pinterest, bing, yandex',
		'markdown_supported'            => '(bool) Whether markdown is supported for this site',
		'wpcom_publish_posts_with_markdown' => '(bool) Whether markdown is enabled for posts',
		'wpcom_publish_comments_with_markdown' => '(bool) Whether markdown is enabled for comments',
		'amp_is_enabled'   => '(bool) Whether AMP is enabled for this site',
		'site_icon'                    => '(int) Media attachment ID to use as site icon. Set to zero or an otherwise empty value to clear',
		'api_cache'                    => '(bool) Turn on/off the Jetpack JSON API cache',
		'posts_per_page'               => '(int) Number of posts to show on blog pages',
		'net_neutrality'               => '(bool) Whether to show the net neutrality modal for a site',
		'posts_per_rss'                => '(int) Number of posts to show in the RSS feed',
		'rss_use_excerpt'              => '(bool) Whether the RSS feed will use post excerpts',
	),

	'response_format' => array(
		'updated' => '(array)'
	),

	'example_request' => 'https://public-api.wordpress.com/rest/v1/sites/en.blog.wordpress.com/settings',
) );

class WPCOM_JSON_API_Site_Settings_Endpoint extends WPCOM_JSON_API_Endpoint {

	public static $site_format = array(
		'ID'                => '(int) Site ID',
		'name'              => '(string) Title of site',
		'description'       => '(string) Tagline or description of site',
		'URL'               => '(string) Full URL to the site',
		'lang'              => '(string) Primary language code of the site',
		'locale_variant'    => '(string) Locale variant code for the site, if set',
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
			// Source & include the infinite scroll compatibility files prior to loading theme functions
			add_filter( 'restapi_theme_action_copy_dirs', array( 'WPCOM_JSON_API_Site_Settings_Endpoint', 'wpcom_restapi_copy_theme_plugin_actions' ) );
			$this->load_theme_functions();
		}

		if ( ! is_user_logged_in() ) {
			return new WP_Error( 'Unauthorized', 'You must be logged-in to manage settings.', 401 );
		} else if ( ! current_user_can( 'manage_options' ) ) {
			return new WP_Error( 'Forbidden', 'You do not have the capability to manage settings for this site.', 403 );
		}

		if ( 'GET' === $this->api->method ) {
			/**
			 * Fires on each GET request to a specific endpoint.
			 *
			 * @module json-api
			 *
			 * @since 3.2.0
			 *
			 * @param string sites.
			 */
			do_action( 'wpcom_json_api_objects', 'sites' );
			return $this->get_settings_response();
		} else if ( 'POST' === $this->api->method ) {
			return $this->update_settings();
		} else {
			return new WP_Error( 'bad_request', 'An unsupported request method was used.' );
		}

	}

	/**
	 * Includes additional theme-specific files to be included in REST API theme
	 * context loading action copying.
	 *
	 * @see WPCOM_JSON_API_Endpoint#load_theme_functions
	 * @see the_neverending_home_page_theme_support
	 */
	function wpcom_restapi_copy_theme_plugin_actions( $copy_dirs ) {
		$theme_name = get_stylesheet();
		$default_file_name = WP_CONTENT_DIR . "/mu-plugins/infinity/themes/{$theme_name}.php";

		/**
		 * Filter the path to the Infinite Scroll compatibility file.
		 *
		 * @module infinite-scroll
		 *
		 * @since 2.0.0
		 *
		 * @param string $str IS compatibility file path.
		 * @param string $theme_name Theme name.
		 */
		$customization_file = apply_filters( 'infinite_scroll_customization_file', $default_file_name, $theme_name );

		if ( is_readable( $customization_file ) ) {
			require_once $customization_file;
			$copy_dirs[] = $customization_file;
		}

		return $copy_dirs;
	}

	/**
	 * Determines whether jetpack_relatedposts is supported
	 *
	 * @return bool
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
	 * @return array
	 */
	public function get_category_details( $category ) {
		return array(
			'value' => $category->term_id,
			'name' => $category->name
		);
	}

	/**
	 * Returns an option value as the result of the callable being applied to
	 * it if a value is set, otherwise null.
	 *
	 * @param string $option_name Option name
	 * @param callable $cast_callable Callable to invoke on option value
	 * @return int|null Numeric option value or null
	 */
	protected function get_cast_option_value_or_null( $option_name, $cast_callable ) {
		$option_value = get_option( $option_name, null );
		if ( is_null( $option_value ) ) {
			return $option_value;
		}

		return call_user_func( $cast_callable, $option_value );
	}

	/**
	 * Collects the necessary information to return for a get settings response.
	 *
	 * @return array
	 */
	public function get_settings_response() {

		// Allow update in later versions
		/**
		 * Filter the structure of site settings to return.
		 *
		 * @module json-api
		 *
		 * @since 3.9.3
		 *
		 * @param array $site_format Data structure.
		 */
		$response_format = apply_filters( 'site_settings_site_format', self::$site_format );

		$blog_id = (int) $this->api->get_blog_id_for_output();
		/** This filter is documented in class.json-api-endpoints.php */
		$is_jetpack = true === apply_filters( 'is_jetpack_site', false, $blog_id );

		foreach ( array_keys( $response_format ) as $key ) {

			// refactoring to change lang parameter to locale in 1.2
			if ( $lang_or_locale = $this->get_locale( $key ) ) {
				$response[$key] = $lang_or_locale;
				continue;
			}

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
			case 'locale_variant':
				if ( function_exists( 'wpcom_l10n_get_blog_locale_variant' ) ) {
					$blog_locale_variant = wpcom_l10n_get_blog_locale_variant();
					if ( $blog_locale_variant ) {
						$response[$key] = $blog_locale_variant;
					}
				}
				break;
			case 'settings':

				$jetpack_relatedposts_options = Jetpack_Options::get_option( 'relatedposts', array() );
				// If the option's enabled key is NOT SET, it is considered enabled by the plugin
				if ( ! isset( $jetpack_relatedposts_options['enabled'] ) ) {
					$jetpack_relatedposts_options['enabled'] = true;
				}

				if ( method_exists( 'Jetpack', 'is_module_active' ) ) {
					$jetpack_relatedposts_options[ 'enabled' ] = Jetpack::is_module_active( 'related-posts' );
				}

				$jetpack_search_supported = false;
				if ( function_exists( 'wpcom_is_jetpack_search_supported' ) ) {
					$jetpack_search_supported = wpcom_is_jetpack_search_supported( $blog_id );
				}

				$jetpack_search_active = false;
				if ( method_exists( 'Jetpack', 'is_module_active' ) ) {
					$jetpack_search_active = Jetpack::is_module_active( 'search' );
				}
				if ( function_exists( 'is_jetpack_module_active' ) ) {
					$jetpack_search_active = is_jetpack_module_active( 'search', $blog_id );
				}

				// array_values() is necessary to ensure the array starts at index 0.
				$post_categories = array_values(
					array_map(
						array( $this, 'get_category_details' ),
						get_categories( array( 'hide_empty' => false ) )
					)
				);

				$api_cache = $is_jetpack ? (bool) get_option( 'jetpack_api_cache_enabled' ) : true;

				$net_neutrality_options = get_option( 'net_neutrality_options_2017' );
				$net_neutrality = ( $net_neutrality_options && ! empty( $net_neutrality_options['enabled'] ) )
					? true
					: false;

				$response[ $key ] = array(

					// also exists as "options"
					'admin_url'               => get_admin_url(),
					'default_ping_status'     => (bool) ( 'closed' != get_option( 'default_ping_status' ) ),
					'default_comment_status'  => (bool) ( 'closed' != get_option( 'default_comment_status' ) ),

					// new stuff starts here
					'blog_public'             => (int) get_option( 'blog_public' ),
					'jetpack_sync_non_public_post_stati' => (bool) Jetpack_Options::get_option( 'sync_non_public_post_stati' ),
					'jetpack_relatedposts_allowed' => (bool) $this->jetpack_relatedposts_supported(),
					'jetpack_relatedposts_enabled' => (bool) $jetpack_relatedposts_options[ 'enabled' ],
					'jetpack_relatedposts_show_headline' => (bool) isset( $jetpack_relatedposts_options[ 'show_headline' ] ) ? $jetpack_relatedposts_options[ 'show_headline' ] : false,
					'jetpack_relatedposts_show_thumbnails' => (bool) isset( $jetpack_relatedposts_options[ 'show_thumbnails' ] ) ? $jetpack_relatedposts_options[ 'show_thumbnails' ] : false,
					'jetpack_search_enabled'  => (bool) $jetpack_search_active,
					'jetpack_search_supported'=> (bool) $jetpack_search_supported,
					'default_category'        => (int) get_option('default_category'),
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
					'lang_id'                 => defined( 'IS_WPCOM' ) && IS_WPCOM
						? get_lang_id_by_code( wpcom_l10n_get_blog_locale_variant( $blog_id, true ) )
						: get_option( 'lang_id' ),
					'wga'                     => $this->get_google_analytics(),
					'disabled_likes'          => (bool) get_option( 'disabled_likes' ),
					'disabled_reblogs'        => (bool) get_option( 'disabled_reblogs' ),
					'jetpack_comment_likes_enabled' => (bool) get_option( 'jetpack_comment_likes_enabled', false ),
					'twitter_via'             => (string) get_option( 'twitter_via' ),
					'jetpack-twitter-cards-site-tag' => (string) get_option( 'jetpack-twitter-cards-site-tag' ),
					'eventbrite_api_token'    => $this->get_cast_option_value_or_null( 'eventbrite_api_token', 'intval' ),
					'gmt_offset'              => get_option( 'gmt_offset' ),
					'timezone_string'         => get_option( 'timezone_string' ),
					'date_format'             => get_option( 'date_format' ),
					'time_format'             => get_option( 'time_format' ),
					'start_of_week'           => get_option( 'start_of_week' ),
					'jetpack_testimonial'     => (bool) get_option( 'jetpack_testimonial', '0' ),
					'jetpack_testimonial_posts_per_page' => (int) get_option( 'jetpack_testimonial_posts_per_page', '10' ),
					'jetpack_portfolio'       => (bool) get_option( 'jetpack_portfolio', '0' ),
					'jetpack_portfolio_posts_per_page' => (int) get_option( 'jetpack_portfolio_posts_per_page', '10' ),
					'markdown_supported'      => true,
					'site_icon'               => $this->get_cast_option_value_or_null( 'site_icon', 'intval' ),
					Jetpack_SEO_Utils::FRONT_PAGE_META_OPTION => get_option( Jetpack_SEO_Utils::FRONT_PAGE_META_OPTION, '' ),
					Jetpack_SEO_Titles::TITLE_FORMATS_OPTION => get_option( Jetpack_SEO_Titles::TITLE_FORMATS_OPTION, array() ),
					'amp_is_supported'        => (bool) function_exists( 'wpcom_is_amp_supported' ) && wpcom_is_amp_supported( $blog_id ),
					'amp_is_enabled'          => (bool) function_exists( 'wpcom_is_amp_enabled' ) && wpcom_is_amp_enabled( $blog_id ),
					'api_cache'               => $api_cache,
					'posts_per_page'          => (int) get_option( 'posts_per_page' ),
					'net_neutrality'          => $net_neutrality,
					'posts_per_rss'           => (int) get_option( 'posts_per_rss' ),
					'rss_use_excerpt'         => (bool) get_option( 'rss_use_excerpt' ),
				);

				if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
					$response[ $key ]['wpcom_publish_posts_with_markdown'] = (bool) WPCom_Markdown::is_posting_enabled();
					$response[ $key ]['wpcom_publish_comments_with_markdown'] = (bool) WPCom_Markdown::is_commenting_enabled();

					// WPCOM-specific Infinite Scroll Settings
					if ( is_callable( array( 'The_Neverending_Home_Page', 'get_settings' ) ) ) {
						/**
						 * Clear the cached copy of widget info so it's pulled fresh from blog options.
						 * It was primed during the initial load under the __REST API site__'s context.
						 * @see wp_get_sidebars_widgets https://core.trac.wordpress.org/browser/trunk/src/wp-includes/widgets.php?rev=42374#L931
						 */
						$GLOBALS['_wp_sidebars_widgets'] = array();

						$infinite_scroll_settings = The_Neverending_Home_Page::get_settings();
						$response[ $key ]['infinite_scroll'] = get_option( 'infinite_scroll', true ) && $infinite_scroll_settings->type === 'scroll';
						if ( $infinite_scroll_settings->footer_widgets || 'click' == $infinite_scroll_settings->requested_type ) {
							// The blog has footer widgets -- infinite scroll is blocked
							$response[ $key ]['infinite_scroll_blocked'] = 'footer';
						} else {
							$response[ $key ]['infinite_scroll_blocked'] = false;
						}
					}
				}

				//allow future versions of this endpoint to support additional settings keys
				/**
				 * Filter the current site setting in the returned response.
				 *
				 * @module json-api
				 *
				 * @since 3.9.3
				 *
				 * @param mixed $response_item A single site setting.
				 */
				$response[ $key ] = apply_filters( 'site_settings_endpoint_get', $response[ $key ] );

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

	protected function get_locale( $key ) {
		if ( 'lang' == $key ) {
			if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
				return (string) get_blog_lang_code();
			} else {
				return get_locale();
			}
		}

		return false;
	}

	protected function get_google_analytics () {
		$option_name = defined( 'IS_WPCOM' ) && IS_WPCOM ? 'wga' : 'jetpack_wga';
		return get_option( $option_name );
	}

	/**
	 * Updates site settings for authorized users
	 *
	 * @return array
	 */
	public function update_settings() {
		// $this->input() retrieves posted arguments whitelisted and casted to the $request_format
		// specs that get passed in when this class is instantiated
		$input = $this->input();
		$unfiltered_input = $this->input( false, false );
		/**
		 * Filters the settings to be updated on the site.
		 *
		 * @module json-api
		 *
		 * @since 3.6.0
		 * @since 6.1.1 Added $unfiltered_input parameter.
		 *
		 * @param array $input              Associative array of site settings to be updated.
		 *                                  Cast and filtered based on documentation.
		 * @param array $unfiltered_input   Associative array of site settings to be updated.
		 *                                  Neither cast nor filtered. Contains raw input.
		 */
		$input = apply_filters( 'rest_api_update_site_settings', $input, $unfiltered_input );

		$blog_id = get_current_blog_id();

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
				case 'jetpack_search_enabled':
					if ( ! method_exists( 'Jetpack', 'activate_module' ) ) {
						break;
					}
					$is_wpcom = defined( 'IS_WPCOM' ) && IS_WPCOM;
					if ( $value ) {
						$jetpack_search_update_success = $is_wpcom
							? Jetpack::activate_module( $blog_id, 'search' )
							: Jetpack::activate_module( 'search', false, false );
					} else {
						$jetpack_search_update_success = $is_wpcom
							? Jetpack::deactivate_module( $blog_id, 'search' )
							: Jetpack::deactivate_module( 'search' );
					}
					$updated[ $key ] = (bool) $value;
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
				case 'jetpack_wga':
					if ( ! isset( $value['code'] ) || ! preg_match( '/^$|^UA-[\d-]+$/i', $value['code'] ) ) {
						return new WP_Error( 'invalid_code', 'Invalid UA ID' );
					}

					$is_wpcom = defined( 'IS_WPCOM' ) && IS_WPCOM;
					$option_name = $is_wpcom ? 'wga' : 'jetpack_wga';

					$wga = get_option( $option_name, array() );
					$wga['code'] = $value['code']; // maintain compatibility with wp-google-analytics

					/**
					 * Allow newer versions of this endpoint to filter in additional fields for Google Analytics
					 *
					 * @since 5.4.0
					 *
					 * @param array $wga Associative array of existing Google Analytics settings.
					 * @param array $value Associative array of new Google Analytics settings passed to the endpoint.
					 */
					$wga = apply_filters( 'site_settings_update_wga', $wga, $value );

					if ( update_option( $option_name, $wga ) ) {
						$updated[ $key ] = $value;
					}

					$enabled_or_disabled = $wga['code'] ? 'enabled' : 'disabled';

					/** This action is documented in modules/widgets/social-media-icons.php */
					do_action( 'jetpack_bump_stats_extras', 'google-analytics', $enabled_or_disabled );

					if ( $is_wpcom ) {
						$business_plugins = WPCOM_Business_Plugins::instance();
						$business_plugins->activate_plugin( 'wp-google-analytics' );
					}
					break;

				case 'jetpack_testimonial':
				case 'jetpack_portfolio':
				case 'jetpack_comment_likes_enabled':
					// settings are stored as 1|0
					$coerce_value = (int) $value;
					if ( update_option( $key, $coerce_value ) ) {
						$updated[ $key ] = (bool) $value;
					}
					break;

				case 'jetpack_testimonial_posts_per_page':
				case 'jetpack_portfolio_posts_per_page':
					// settings are stored as numeric
					$coerce_value = (int) $value;
					if ( update_option( $key, $coerce_value ) ) {
						$updated[ $key ] = $coerce_value;
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

				// Keyring token option
				case 'eventbrite_api_token':
					// These options can only be updated for sites hosted on WordPress.com
					if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
						if ( empty( $value ) || WPCOM_JSON_API::is_falsy( $value ) ) {
							if ( delete_option( $key ) ) {
								$updated[ $key ] = null;
							}
						} else if ( update_option( $key, $value ) ) {
							$updated[ $key ] = (int) $value;
						}
					}
					break;

				case 'api_cache':
					if ( empty( $value ) || WPCOM_JSON_API::is_falsy( $value ) ) {
						if ( delete_option( 'jetpack_api_cache_enabled' ) ) {
							$updated[ $key ] = false;
						}
					} else if ( update_option( 'jetpack_api_cache_enabled', true ) ) {
						$updated[ $key ] = true;
					}
					break;

				case 'timezone_string':
					// Map UTC+- timezones to gmt_offsets and set timezone_string to empty
					// https://github.com/WordPress/WordPress/blob/4.4.2/wp-admin/options.php#L175
					if ( ! empty( $value ) && preg_match( '/^UTC[+-]/', $value ) ) {
						$gmt_offset = preg_replace( '/UTC\+?/', '', $value );
						if ( update_option( 'gmt_offset', $gmt_offset ) ) {
							$updated[ 'gmt_offset' ] = $gmt_offset;
						}

						$value = '';
					}

					// Always set timezone_string either with the given value or with an
					// empty string
					if ( update_option( $key, $value ) ) {
						$updated[ $key ] = $value;
					}
					break;

				case 'date_format':
				case 'time_format':
					// settings are stored as strings
					if ( update_option( $key, sanitize_text_field( $value ) ) ) {
						$updated[ $key ] = $value;
					}
					break;

				case 'start_of_week':
					// setting is stored as int in 0-6 range (days of week)
					$coerce_value = (int) $value;
					$limit_value  = ( $coerce_value >= 0 && $coerce_value <= 6 ) ? $coerce_value : 0;
					if ( update_option( $key, $limit_value ) ) {
						$updated[ $key ] = $limit_value;
					}
					break;

				case 'site_icon':
					// settings are stored as deletable numeric (all empty
					// values as delete intent), validated as media image
					if ( empty( $value ) || WPCOM_JSON_API::is_falsy( $value ) ) {
						/**
						 * Fallback mechanism to clear a third party site icon setting. Can be used
						 * to unset the option when an API request instructs the site to remove the site icon.
						 *
						 * @module json-api
						 *
						 * @since 4.10
						 */
						if ( delete_option( $key ) || apply_filters( 'rest_api_site_icon_cleared', false )  ) {
							$updated[ $key ] = null;
						}
					} else if ( is_numeric( $value ) ) {
						$coerce_value = (int) $value;
						if ( wp_attachment_is_image( $coerce_value ) && update_option( $key, $coerce_value ) ) {
							$updated[ $key ] = $coerce_value;
						}
					}
					break;

				case Jetpack_SEO_Utils::FRONT_PAGE_META_OPTION:
					if ( ! Jetpack_SEO_Utils::is_enabled_jetpack_seo() && ! Jetpack_SEO_Utils::has_grandfathered_front_page_meta() ) {
						return new WP_Error( 'unauthorized', __( 'SEO tools are not enabled for this site.', 'jetpack' ), 403 );
					}

					if ( ! is_string( $value ) ) {
						return new WP_Error( 'invalid_input', __( 'Invalid SEO meta description value.', 'jetpack' ), 400 );
					}

					$new_description = Jetpack_SEO_Utils::update_front_page_meta_description( $value );

					if ( ! empty( $new_description ) ) {
						$updated[ $key ] = $new_description;
					}
					break;

				case Jetpack_SEO_Titles::TITLE_FORMATS_OPTION:
					if ( ! Jetpack_SEO_Utils::is_enabled_jetpack_seo() ) {
						return new WP_Error( 'unauthorized', __( 'SEO tools are not enabled for this site.', 'jetpack' ), 403 );
					}

					if ( ! Jetpack_SEO_Titles::are_valid_title_formats( $value ) ) {
						return new WP_Error( 'invalid_input', __( 'Invalid SEO title format.', 'jetpack' ), 400 );
					}

					$new_title_formats = Jetpack_SEO_Titles::update_title_formats( $value );

					if ( ! empty( $new_title_formats ) ) {
						$updated[ $key ] = $new_title_formats;
					}
					break;

				case 'verification_services_codes':
					$verification_codes = jetpack_verification_validate( $value );

					if ( update_option( 'verification_services_codes', $verification_codes ) ) {
						$updated[ $key ] = $verification_codes;
					}
					break;

				case 'wpcom_publish_posts_with_markdown':
				case 'wpcom_publish_comments_with_markdown':
					$coerce_value = (bool) $value;
					if ( update_option( $key, $coerce_value ) ) {
						$updated[ $key ] = $coerce_value;
					}
					break;

				case 'amp_is_enabled':
					if ( function_exists( 'wpcom_update_amp_enabled' ) ) {
						$saved = wpcom_update_amp_enabled( $blog_id, $value );
						if ( $saved ) {
							$updated[ $key ] = (bool) $value;
						}
					}
					break;

				case 'net_neutrality':
					$original_value = $value;
					$value = array( 'enabled' => (bool) $value );
					if ( update_option( 'net_neutrality_options_2017', $value ) ) {
						$updated[ $key ] = $original_value;
					}

					break;

				case 'rss_use_excerpt':
					update_option( 'rss_use_excerpt', (int)(bool) $value );
					break;

				default:
					//allow future versions of this endpoint to support additional settings keys
					if ( has_filter( 'site_settings_endpoint_update_' . $key ) ) {
						/**
						 * Filter current site setting value to be updated.
						 *
						 * @module json-api
						 *
						 * @since 3.9.3
						 *
						 * @param mixed $response_item A single site setting value.
						 */
						$value = apply_filters( 'site_settings_endpoint_update_' . $key, $value );
						$updated[ $key ] = $value;
						break;
					}

					// no worries, we've already whitelisted and casted arguments above
					if ( update_option( $key, $value ) ) {
						$updated[ $key ] = $value;
					}
			}
		}

		if ( count( $jetpack_relatedposts_options ) ) {
			// track new jetpack_relatedposts options against old
			$old_relatedposts_options = Jetpack_Options::get_option( 'relatedposts' );
			if ( Jetpack_Options::update_option( 'relatedposts', $jetpack_relatedposts_options ) ) {
				foreach ( $jetpack_relatedposts_options as $key => $value ) {
					if ( isset( $old_relatedposts_options[ $key ] ) && $value !== $old_relatedposts_options[ $key ] ) {
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
