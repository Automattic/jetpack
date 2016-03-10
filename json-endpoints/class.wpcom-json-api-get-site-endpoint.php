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
		'updates'           => '(array) An array of available updates for plugins, themes, wordpress, and languages.',
		'jetpack_modules'   => '(array) A list of active Jetpack modules.',
		'meta'              => '(object) Meta data',
	);

	private $site;

	// /sites/mine
	// /sites/%s -> $blog_id
	function callback( $path = '', $blog_id = 0 ) {
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

		/** This action is documented in json-endpoints/class.wpcom-json-api-site-settings-endpoint.php */
		do_action( 'wpcom_json_api_objects', 'sites' );

		return $response;
	}

	/**
	 * Collects the necessary information to return for a site's response.
	 *
	 * @return (array)
	 */
	public function build_current_site_response( ) {

		$blog_id = (int) $this->api->get_blog_id_for_output();

		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			$this->site = WPCOM_Platform::get_site( $blog_id );	
		} else {
			$this->site = WPORG_Platform::get_site( $blog_id );	
		}

		// Allow update in later versions
		$response_format = apply_filters( 'sites_site_format', self::$site_format );

		$is_user_logged_in = is_user_logged_in();

		$this->site->before_render();

		foreach ( array_keys( $response_format ) as $key ) {
			$this->render_response_key( $key, $response, $is_user_logged_in );
		}

		$this->site->after_render( $response );

		return $response;
	}

	protected function render_response_key( $key, &$response, $is_user_logged_in ) {
		do_action( 'pre_render_site_response_key', $key );
		
		switch ( $key ) {
			case 'ID' :
				$response[$key] = $this->site->blog_id;
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
			case 'is_private' :
				$response[$key] = $this->site->is_private();
				break;
			case 'visible' :
				$response[$key] = $this->site->is_visible();
				break;
			case 'subscribers_count' : 
				$response[$key] = $this->site->get_subscribers_count();
				break;
			case 'post_count' :
				if ( $is_user_logged_in ) {
					$response[$key] = (int) wp_count_posts( 'post' )->publish;
				}
				break;
			case 'icon' :
				$icon = $this->site->get_icon();

				if ( $icon !== null ) {
					$response[$key] = $icon;	
				}
				break;
			case 'logo' :
				$response[$key] = $this->site->get_logo();
				break;
			case 'is_following':
				$response[$key] = $this->site->is_following();
				break;
			case 'options':
				$this->build_options_response( $response );
				break;
			case 'meta':
				$this->build_meta_response( $response );
				break;
			case 'lang' : 
				$response[$key] = $is_user_logged_in ? $this->site->get_locale() : false;
				break;
			case 'locale' : 
				$response[$key] = $is_user_logged_in ? $this->site->get_locale() : false;
				break;
			case 'jetpack' :
				$response[$key] = $this->site->is_jetpack();
				break;
			case 'jetpack_modules':
				$jetpack_modules = $this->site->get_jetpack_modules();
				if ( $jetpack_modules !== null ) {
					$response[$key] = $jetpack_modules;
				}
				break;
		}

		do_action( 'post_render_site_response_key', $key );
	}

	protected function build_options_response( &$response ) {
		if ( ! current_user_can( 'edit_posts' ) ) {
			unset( $response['options'] );
			return;
		}

		global $wp_version;

		// determine if sharing buttons should be visible by default
		$default_sharing_status = false;
		if ( class_exists( 'Sharing_Service' ) ) {
			$ss                     = new Sharing_Service();
			$blog_services          = $ss->get_blog_services();
			$default_sharing_status = ! empty( $blog_services['visible'] );
		}

		$publicize_permanently_disabled = false;
		if ( function_exists( 'is_publicize_permanently_disabled' ) ) {
			$publicize_permanently_disabled = is_publicize_permanently_disabled( $this->site->blog_id );
		}

		$response['options'] = array(
			'timezone'                => (string) get_option( 'timezone_string' ),
			'gmt_offset'              => (float) get_option( 'gmt_offset' ),
			'videopress_enabled'      => $this->site->has_videopress(),
			'upgraded_filetypes_enabled' =>  $this->site->upgraded_filetypes_enabled(),
			'login_url'               => wp_login_url(),
			'admin_url'               => get_admin_url(),
			'is_mapped_domain'        => $this->site->is_mapped_domain(),
			'is_redirect'             => $this->site->is_redirect(),
			'unmapped_url'            => get_site_url( $this->site->blog_id ),
			'featured_images_enabled' => $this->site->featured_images_enabled(),
			'theme_slug'              => get_option( 'stylesheet' ),
			'header_image'            => get_theme_mod( 'header_image_data' ),
			'background_color'        => get_theme_mod( 'background_color' ),
			'image_default_link_type' => get_option( 'image_default_link_type' ),
			'image_thumbnail_width'   => (int)  get_option( 'thumbnail_size_w' ),
			'image_thumbnail_height'  => (int)  get_option( 'thumbnail_size_h' ),
			'image_thumbnail_crop'    => get_option( 'thumbnail_crop' ),
			'image_medium_width'      => (int)  get_option( 'medium_size_w' ),
			'image_medium_height'     => (int)  get_option( 'medium_size_h' ),
			'image_large_width'       => (int)  get_option( 'large_size_w' ),
			'image_large_height'      => (int) get_option( 'large_size_h' ),
			'permalink_structure'     => get_option( 'permalink_structure' ),
			'post_formats'            => $this->site->get_post_formats(),
			'default_post_format'     => get_option( 'default_post_format' ),
			'default_category'        => (int) get_option( 'default_category' ),
			'allowed_file_types'      => $this->site->allowed_file_types(),
			'show_on_front'           => get_option( 'show_on_front' ),
			/** This filter is documented in modules/likes.php */
			'default_likes_enabled'   => (bool) apply_filters( 'wpl_is_enabled_sitewide', ! get_option( 'disabled_likes' ) ),
			'default_sharing_status'  => (bool) $default_sharing_status,
			'default_comment_status'  => ( 'closed' == get_option( 'default_comment_status' ) ? false : true ),
			'default_ping_status'     => ( 'closed' == get_option( 'default_ping_status' ) ? false : true ),
			'software_version'        => $wp_version,
			'created_at'              => $this->site->get_registered_date(),
			'wordads'                 => $this->site->has_wordads(),
			'publicize_permanently_disabled' => $publicize_permanently_disabled,
			'frame_nonce'            => $this->site->get_frame_nonce(),
		);

		if ( 'page' === get_option( 'show_on_front' ) ) {
			$response['options']['page_on_front'] = (int) get_option( 'page_on_front' );
			$response['options']['page_for_posts'] = (int) get_option( 'page_for_posts' );
		}

		$this->site->after_render_options( $response['options'] );
	}

	protected function build_meta_response( &$response ) {
		$xmlrpc_scheme = apply_filters( 'wpcom_json_api_xmlrpc_scheme', parse_url( get_option( 'home' ), PHP_URL_SCHEME ) );
		$xmlrpc_url = site_url( 'xmlrpc.php', $xmlrpc_scheme );
		$response['meta'] = (object) array(
			'links' => (object) array(
				'self'     => (string) $this->get_site_link( $this->site->blog_id ),
				'help'     => (string) $this->get_site_link( $this->site->blog_id, 'help'      ),
				'posts'    => (string) $this->get_site_link( $this->site->blog_id, 'posts/'    ),
				'comments' => (string) $this->get_site_link( $this->site->blog_id, 'comments/' ),
				'xmlrpc'   => (string) $xmlrpc_url,
			),
		);
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

		$response['formats'] = (object) $supported_formats;

		return $response;
	}
}

class WPCOM_JSON_API_List_Page_Templates_Endpoint extends WPCOM_JSON_API_Endpoint {
	// /sites/%s/page-templates -> $blog_id
	function callback( $path = '', $blog_id = 0 ) {
		$blog_id = $this->api->switch_to_blog_and_validate_user( $this->api->get_blog_id( $blog_id ) );
		if ( is_wp_error( $blog_id ) ) {
			return $blog_id;
		}

		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			$this->load_theme_functions();
		}

		$response = array();
		$page_templates = array();

		$templates = get_page_templates();
		ksort( $templates );

		foreach ( array_keys( $templates ) as $label ) {
			$page_templates[] = array(
				'label' => $label,
				'file'  => $templates[ $label ]
			);
		}

		$response['templates'] = $page_templates;

		return $response;
	}
}
