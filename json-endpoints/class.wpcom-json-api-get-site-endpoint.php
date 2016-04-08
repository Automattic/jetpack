<?php
class WPCOM_JSON_API_GET_Site_Endpoint extends WPCOM_JSON_API_Endpoint {

	public static $site_format = array(
		'ID'                => '(int) Site ID',
		'name'              => '(string) Title of site',
		'description'       => '(string) Tagline or description of site',
		'URL'               => '(string) Full URL to the site',
		'user_can_manage'   => '(bool) The current user can manage this site', // deprecated
		'capabilities'      => '(array) Array of capabilities for the current user on this site.',
		'jetpack'           => '(bool)  Whether the site is a Jetpack site or not',
		'is_multisite'      => '(bool) Whether the site is a Multisite site or not. Always true for WP.com sites.',
		'post_count'        => '(int) The number of posts the site has',
		'subscribers_count' => '(int) The number of subscribers the site has',
		'lang'              => '(string) Primary language code of the site',
		'icon'              => '(array) An array of icon formats for the site',
		'logo'              => '(array) The site logo, set in the Customizer',
		'visible'           => '(bool) If this site is visible in the user\'s site list',
		'is_private'        => '(bool) If the site is a private site or not',
		'single_user_site'  => '(bool) Whether the site is single user. Only returned for WP.com sites and for Jetpack sites with version 3.4 or higher.',
		'is_vip'            => '(bool) If the site is a VIP site or not.',
		'is_following'      => '(bool) If the current user is subscribed to this site in the reader',
		'options'           => '(array) An array of options/settings for the blog. Only viewable by users with post editing rights to the site. Note: Post formats is deprecated, please see /sites/$id/post-formats/',
		'plan'              => '(array) Details of the current plan for this site.',
		'updates'           => '(array) An array of available updates for plugins, themes, wordpress, and languages.',
		'jetpack_modules'   => '(array) A list of active Jetpack modules.',
		'meta'              => '(object) Meta data',
	);

	protected static $no_member_fields = array(
		'ID',
		'name',
		'description',
		'URL',
		'jetpack',
		'post_count',
		'subscribers_count',
		'lang',
		'locale',
		'icon',
		'logo',
		'visible',
		'is_private',
		'is_following',
		'meta',
	);

	protected static $site_options_format = array(
		'timezone',
		'gmt_offset',
		'videopress_enabled',
		'upgraded_filetypes_enabled',
		'login_url',
		'admin_url',
		'is_mapped_domain',
		'is_redirect',
		'unmapped_url',
		'featured_images_enabled',
		'theme_slug',
		'header_image',
		'background_color',
		'image_default_link_type',
		'image_thumbnail_width',
		'image_thumbnail_height',
		'image_thumbnail_crop',
		'image_medium_width',
		'image_medium_height',
		'image_large_width',
		'image_large_height',
		'permalink_structure',
		'post_formats',
		'default_post_format',
		'default_category',
		'allowed_file_types',
		'show_on_front',
		/** This filter is documented in modules/likes.php */
		'default_likes_enabled',
		'default_sharing_status',
		'default_comment_status',
		'default_ping_status',
		'software_version',
		'created_at',
		'wordads',
		'publicize_permanently_disabled',
		'frame_nonce',
		'page_on_front',
		'page_for_posts',
		'headstart',
		'ak_vp_bundle_enabled'
	);

	protected static $jetpack_response_field_additions = array( 
		'subscribers_count',
	);

	protected static $jetpack_response_field_member_additions = array(
		'capabilities',
		'plan',
	);

	protected static $jetpack_response_option_additions = array( 
		'publicize_permanently_disabled',
		'ak_vp_bundle_enabled'
	);

	private $site;

	// protected $compact = null;
	protected $fields_to_include = '_all';
	protected $options_to_include = '_all';

	// /sites/mine
	// /sites/%s -> $blog_id
	function callback( $path = '', $blog_id = 0 ) {
		if ( 'mine' === $blog_id ) {
			$api = WPCOM_JSON_API::init();
			if ( ! $api->token_details || empty( $api->token_details['blog_id'] ) ) {
				return new WP_Error( 'authorization_required', 'An active access token must be used to query information about the current blog.', 403 );
			}
			$blog_id = $api->token_details['blog_id'];
		}

		$blog_id = $this->api->switch_to_blog_and_validate_user( $this->api->get_blog_id( $blog_id ) );
		if ( is_wp_error( $blog_id ) ) {
			return $blog_id;
		}

		// TODO: enable this when we can do so without being interfered with by 
		// other endpoints that might be wrapping this one.
		// Uncomment and see failing test: test_jetpack_site_should_have_true_jetpack_property_via_site_meta
		// $this->filter_fields_and_options();

		$response = $this->build_current_site_response();

		/** This action is documented in json-endpoints/class.wpcom-json-api-site-settings-endpoint.php */
		do_action( 'wpcom_json_api_objects', 'sites' );

		return $response;
	}

	public function filter_fields_and_options() {
		$query_args = $this->query_args();

		$this->fields_to_include  = empty( $query_args['fields'] ) ? '_all' : array_map( 'trim', explode( ',', $query_args['fields'] ) );
		$this->options_to_include = empty( $query_args['options'] ) ? '_all' : array_map( 'trim', explode( ',', $query_args['options'] ) );
	}

	/**
	 * Collects the necessary information to return for a site's response.
	 *
	 * @return (array)
	 */
	public function build_current_site_response() {

		$blog_id = (int) $this->api->get_blog_id_for_output();

		$this->site = $this->get_platform()->get_site( $blog_id );

		/**
 		 * Filter the structure of information about the site to return.
 		 *
 		 * @module json-api
 		 *
 		 * @since 3.9.3
 		 *
 		 * @param array $site_format Data structure.
 		 */
		$default_fields = array_keys( apply_filters( 'sites_site_format', self::$site_format ) );

		$response_keys = is_array( $this->fields_to_include ) ?
			array_intersect( $default_fields, $this->fields_to_include ) :
			$default_fields;

		if ( ! is_user_member_of_blog( get_current_user(), $blog_id ) ) {
			$response_keys = array_intersect( $response_keys, self::$no_member_fields );
		}

		return $this->render_response_keys( $response_keys );
	}

	private function render_response_keys( &$response_keys ) {
		$response = array();

		$is_user_logged_in = is_user_logged_in();

		$this->site->before_render();

		foreach ( $response_keys as $key ) {
			$this->render_response_key( $key, $response, $is_user_logged_in );
		}

		$this->site->after_render( $response );

		return $response;
	}

	protected function render_response_key( $key, &$response, $is_user_logged_in ) {
		do_action( 'pre_render_site_response_key', $key );

		switch ( $key ) {
			case 'ID' :
				$response[ $key ] = $this->site->blog_id;
				break;
			case 'name' :
				$response[ $key ] = $this->site->get_name();
				break;
			case 'description' :
				$response[ $key ] = $this->site->get_description();
				break;
			case 'URL' :
				$response[ $key ] = $this->site->get_url();
				break;
			case 'user_can_manage' :
				$response[ $key ] = $this->site->user_can_manage();
			case 'is_private' :
				$response[ $key ] = $this->site->is_private();
				break;
			case 'visible' :
				$response[ $key ] = $this->site->is_visible();
				break;
			case 'subscribers_count' :
				$response[ $key ] = $this->site->get_subscribers_count();
				break;
			case 'post_count' :
				if ( $is_user_logged_in ) {
					$response[ $key ] = $this->site->get_post_count();
				}
				break;
			case 'icon' :
				$icon = $this->site->get_icon();

				if ( ! is_null( $icon ) ) {
					$response[ $key ] = $icon;
				}
				break;
			case 'logo' :
				$response[ $key ] = $this->site->get_logo();
				break;
			case 'is_following':
				$response[ $key ] = $this->site->is_following();
				break;
			case 'options':
				// small optimisation - don't recalculate 
				$all_options = apply_filters( 'sites_site_options_format', self::$site_options_format );

				$options_response_keys = is_array( $this->options_to_include ) ?
					array_intersect( $all_options, $this->options_to_include ) :
					$all_options;

				$options = $this->render_option_keys( $options_response_keys );

				$this->site->after_render_options( $options );

				$response[ $key ] = (object) $options;
				break;
			case 'meta':
				$this->build_meta_response( $response );
				break;
			case 'lang' :
				$response[ $key ] = $is_user_logged_in ? $this->site->get_locale() : false;
				break;
			case 'locale' :
				$response[ $key ] = $is_user_logged_in ? $this->site->get_locale() : false;
				break;
			case 'jetpack' :
				$response[ $key ] = $this->site->is_jetpack();
				break;
			case 'single_user_site' : 
				$response[ $key ] = $this->site->is_single_user_site();
				break;
			case 'is_vip' : 
				$response[ $key ] = $this->site->is_vip();
				break;
			case 'is_multisite' :
				$response[ $key ] = $this->site->is_multisite();
				break;
			case 'capabilities' : 
				$response[ $key ] = $this->site->get_capabilities();
				break;
			case 'jetpack_modules':
				$jetpack_modules = $this->site->get_jetpack_modules();
				if ( ! is_null( $jetpack_modules ) ) {
					$response[ $key ] = $jetpack_modules;
				}
				break;
			case 'plan' :
				$response[ $key ] = $this->site->get_plan();
				break;
		}

		do_action( 'post_render_site_response_key', $key );
	}

	protected function render_option_keys( &$options_response_keys ) {
		if ( ! current_user_can( 'edit_posts' ) ) {
			return array();
		}

		$options = array();
		$site = $this->site;

		$custom_front_page = $site->is_custom_front_page();
		

		foreach ( $options_response_keys as $key ) {
			switch ( $key ) {
				case 'timezone' :
					$options[ $key ] = $site->get_timezone();
					break;
				case 'gmt_offset' :
					$options[ $key ] = $site->get_gmt_offset();
					break;
				case 'videopress_enabled' :
					$options[ $key ] = $site->has_videopress();
					break;
				case 'upgraded_filetypes_enabled' :
					$options[ $key ] = $site->upgraded_filetypes_enabled();
					break;
				case 'login_url' :
					$options[ $key ] = $site->get_login_url();
					break;
				case 'admin_url' :
					$options[ $key ] = $site->get_admin_url();
					break;
				case 'is_mapped_domain' :
					$options[ $key ] = $site->is_mapped_domain();
					break;
				case 'is_redirect' :
					$options[ $key ] = $site->is_redirect();
					break;
				case 'unmapped_url' :
					$options[ $key ] = $site->get_unmapped_url();
					break;
				case 'featured_images_enabled' :
					$options[ $key ] = $site->featured_images_enabled();
					break;
				case 'theme_slug' :
					$options[ $key ] = $site->get_theme_slug();
					break;
				case 'header_image' :
					$options[ $key ] = $site->get_header_image();
					break;
				case 'background_color' :
					$options[ $key ] = $site->get_background_color();
					break;
				case 'image_default_link_type' :
					$options[ $key ] = $site->get_image_default_link_type();
					break;
				case 'image_thumbnail_width' :
					$options[ $key ] = $site->get_image_thumbnail_width();
					break;
				case 'image_thumbnail_height' :
					$options[ $key ] = $site->get_image_thumbnail_height();
					break;
				case 'image_thumbnail_crop' :
					$options[ $key ] = $site->get_image_thumbnail_crop();
					break;
				case 'image_medium_width' :
					$options[ $key ] = $site->get_image_medium_width();
					break;
				case 'image_medium_height' :
					$options[ $key ] = $site->get_image_medium_height();
					break;
				case 'image_large_width' :
					$options[ $key ] = $site->get_image_large_width();
					break;
				case 'image_large_height' :
					$options[ $key ] = $site->get_image_large_height(); 
					break;
				case 'permalink_structure' :
					$options[ $key ] = $site->get_permalink_structure();
					break;
				case 'post_formats' :
					$options[ $key ] = $site->get_post_formats();
					break;
				case 'default_post_format' :
					$options[ $key ] = $site->get_default_post_format();
					break;
				case 'default_category' :
					$options[ $key ] = $site->get_default_category();
					break;
				case 'allowed_file_types' :
					$options[ $key ] = $site->allowed_file_types();
					break;
				case 'show_on_front' :
					$options[ $key ] = $site->get_show_on_front();
					break;
				/** This filter is documented in modules/likes.php */
				case 'default_likes_enabled' :
					$options[ $key ] = $site->get_default_likes_enabled();
					break;
				case 'default_sharing_status' :
					$options[ $key ] = $site->get_default_sharing_status();
					break;
				case 'default_comment_status' :
					$options[ $key ] = $site->get_default_comment_status();
					break;
				case 'default_ping_status' :
					$options[ $key ] = $site->default_ping_status();
					break;
				case 'software_version' :
					$options[ $key ] = $site->get_wordpress_version();
					break;
				case 'created_at' :
					$options[ $key ] = $site->get_registered_date();
					break;
				case 'wordads' :
					$options[ $key ] = $site->has_wordads();
					break;
				case 'publicize_permanently_disabled' :
					$options[ $key ] = $site->is_publicize_permanently_disabled();
					break;
				case 'frame_nonce' :
					$options[ $key ] = $site->get_frame_nonce();
					break;
				case 'page_on_front' :
					if ( $custom_front_page ) {
						$options[ $key ] = $site->get_page_on_front();
					}
					break;
				case 'page_for_posts' :
					if ( $custom_front_page ) {
						$options[ $key ] = $site->get_page_for_posts();
					}
					break;
				case 'headstart' :
					$options[ $key ] = $site->is_headstart();
					break;
				case 'ak_vp_bundle_enabled' :
					$options[ $key ] = $site->get_ak_vp_bundle_enabled();
			}
		}

		return $options;
	}

	protected function build_meta_response( &$response ) {
		$response['meta'] = (object) array(
			'links' => (object) array(
				'self'     => (string) $this->links->get_site_link( $this->site->blog_id ),
				'help'     => (string) $this->links->get_site_link( $this->site->blog_id, 'help'      ),
				'posts'    => (string) $this->links->get_site_link( $this->site->blog_id, 'posts/'    ),
				'comments' => (string) $this->links->get_site_link( $this->site->blog_id, 'comments/' ),
				'xmlrpc'   => (string) $this->site->get_xmlrpc_url(),
			),
		);
	}

	// apply any WPCOM-only response components to a Jetpack site response
	public function decorate_jetpack_response( &$response ) {
		$this->site = $this->get_platform()->get_site( $response->ID );

		// ensure the response is marked as being from Jetpack
		$response->jetpack = true;

		$wpcom_response = $this->render_response_keys( self::$jetpack_response_field_additions );

		foreach( $wpcom_response as $key => $value ) {
			$response->{ $key } = $value;
		}

		if ( is_user_member_of_blog( get_current_user(), $response->ID ) ) {
			$wpcom_member_response = $this->render_response_keys( self::$jetpack_response_field_member_additions );

			foreach( $wpcom_member_response as $key => $value ) {
				$response->{ $key } = $value;
			}
		} else {
			// ensure private data is not rendered for non members of the site
			unset( $response->options );
			unset( $response->is_vip );
			unset( $response->single_user_site );
			unset( $response->is_private );
			unset( $response->capabilities );
			unset( $response->lang );
			unset( $response->user_can_manage );
			unset( $response->is_multisite );
			unset( $response->plan );
		}

		// render additional options
		if ( $response->options ) {
			$wpcom_options_response = $this->render_option_keys( self::$jetpack_response_option_additions );

			foreach ( $wpcom_options_response as $key => $value ) {
				$response->options[ $key ] = $value;
			}
		}

		return $response; // possibly no need since it's modified in place
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
