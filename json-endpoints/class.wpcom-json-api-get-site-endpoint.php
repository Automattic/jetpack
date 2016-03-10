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

		/** This filter is documented in class.json-api-endpoints.php */
		$is_jetpack = true === apply_filters( 'is_jetpack_site', false, $blog_id );

		if ( $is_jetpack ) {
			if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
				$this->site = new Jetpack_Shadow_Site( $blog_id );
			} else {
				$this->site = new Jetpack_Site( $blog_id );
			}

		} else {
			$this->site = new WPCOM_Site( $blog_id );
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

// all this does is set up WPCOM-specific hooks for things like
// analytics
// TODO: put in a separate file
class WPCOM_Platform {
	static $debug_pdh;

	static function init() {
		jetpack_require_lib( 'performance-debug-helper' );
		WPCOM_Platform::$debug_pdh = new Performance_Debug_Helper( 'com.wordpress.timers.rest_api.test.performance.' );

		add_action( 'pre_render_site_response_key', array( 'WPCOM_Platform', 'record_api_timing_start' ), 10, 1 );
		add_action( 'post_render_site_response_key', array( 'WPCOM_Platform', 'record_api_timing_finish' ), 10, 1 );
	}

	function record_api_timing_start( $key ) {
		self::$debug_pdh->start_timing( 'build-site.response.'.$key );
	}

	function record_api_timing_finish( $key ) {
		self::$debug_pdh->finish_timing( 'build-site.response.'.$key );
	}
}

if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
	WPCOM_Platform::init();	
}

/**
 * Base class for the Site Abstraction Layer (SAL)
 **/

abstract class SAL_Site {
	public $blog_id;

	public function __construct( $blog_id ) {
		$this->blog_id = $blog_id;
	}

	abstract public function has_videopress();
	abstract public function upgraded_filetypes_enabled();
	abstract public function is_mapped_domain();
	abstract public function is_redirect();
	abstract public function featured_images_enabled();
	abstract public function has_wordads();
	abstract public function get_frame_nonce();
	abstract public function allowed_file_types();
	abstract public function get_post_formats();
	abstract public function is_private();
	abstract public function is_following();
	abstract public function get_subscribers_count();
	abstract public function get_locale();
	abstract public function is_jetpack();
	abstract public function get_jetpack_modules();

	abstract public function before_render();
	abstract public function after_render( &$response );
	abstract public function after_render_options( &$options );

	function get_registered_date() {
		if ( function_exists( 'get_blog_details' ) ) {
			$blog_details = get_blog_details();
			if ( ! empty( $blog_details->registered ) ) {
				return $this->format_date( $blog_details->registered );
			}
		}

		return '0000-00-00T00:00:00+00:00';
	}

	function is_visible() {
		if ( is_user_logged_in() ){
			$current_user = wp_get_current_user();
			$visible = (array) get_user_meta( $current_user->ID, 'blog_visibility', true );

			$is_visible = true;
			if ( isset( $visible[$this->blog_id] ) ) {
				$is_visible = (bool) $visible[$this->blog_id];
			}
			// null and true are visible
			return $is_visible;
		}
		return null;
	}

	function get_logo() {

		// Set an empty response array.
		$logo_setting = array(
			'id'  => (int) 0,
			'sizes' => array(),
			'url' => '',
		);

		// Get current site logo values.
		$logo = get_option( 'site_logo' );

		// Update the response array if there's a site logo currenty active.
		if ( $logo && 0 != $logo['id'] ) {
			$logo_setting['id']  = $logo['id'];
			$logo_setting['url'] = $logo['url'];

			foreach ( $logo['sizes'] as $size => $properties ) {
				$logo_setting['sizes'][$size] = $properties;
			}
		}

		return $logo_setting;
	}

	/**
	 * Returns ISO 8601 formatted datetime: 2011-12-08T01:15:36-08:00
	 *
	 * @param $date_gmt (string) GMT datetime string.
	 * @param $date (string) Optional.  Used to calculate the offset from GMT.
	 *
	 * @return string
	 */
	function format_date( $date_gmt, $date = null ) {
		$timestamp_gmt = strtotime( "$date_gmt+0000" );

		if ( null === $date ) {
			$timestamp = $timestamp_gmt;
			$hours     = $minutes = $west = 0;
		} else {
			$date_time = date_create( "$date+0000" );
			if ( $date_time ) {
				$timestamp = date_format(  $date_time, 'U' );
			} else {
				$timestamp = 0;
			}

			// "0000-00-00 00:00:00" == -62169984000
			if ( -62169984000 == $timestamp_gmt ) {
				// WordPress sets post_date=now, post_date_gmt="0000-00-00 00:00:00" for all drafts
				// WordPress sets post_modified=now, post_modified_gmt="0000-00-00 00:00:00" for new drafts

				// Try to guess the correct offset from the blog's options.
				$timezone_string = get_option( 'timezone_string' );

				if ( $timezone_string && $date_time ) {
					$timezone = timezone_open( $timezone_string );
					if ( $timezone ) {
						$offset = $timezone->getOffset( $date_time );
					}
				} else {
					$offset = 3600 * get_option( 'gmt_offset' );
				}
			} else {
				$offset = $timestamp - $timestamp_gmt;
			}

			$west      = $offset < 0;
			$offset    = abs( $offset );
			$hours     = (int) floor( $offset / 3600 );
			$offset   -= $hours * 3600;
			$minutes   = (int) floor( $offset / 60 );
		}

		return (string) gmdate( 'Y-m-d\\TH:i:s', $timestamp ) . sprintf( '%s%02d:%02d', $west ? '-' : '+', $hours, $minutes );
	}
}

// this code runs on WordPress.com native sites
class WPCOM_Site extends SAL_Site {
	function has_videopress() {
		return get_option( 'video_upgrade' ) == '1';
	}

	function upgraded_filetypes_enabled() {
		return (bool) get_option( 'use_upgraded_upload_filetypes' );
	}

	function is_mapped_domain() {
		$primary_redirect = strtolower( get_primary_redirect() );
		return ( false === strpos( $primary_redirect, '.wordpress.com' ) );
	}

	function is_redirect() {
		return get_primary_domain_mapping_record()->type == 1;
	}

	function featured_images_enabled() {
		return current_theme_supports( 'post-thumbnails' );
	}

	function has_wordads() {
		return has_any_blog_stickers( array( 'wordads-approved', 'wordads-approved-misfits' ), $this->blog_id );
	}

	function get_frame_nonce() {
		return wpcom_get_frame_nonce();
	}

	function allowed_file_types() {
		return get_mime_types();
	}

	function is_private() {
		return ( -1 == get_option( 'blog_public' ) );
	}

	function is_following() {
		return (bool) wpcom_subs_is_subscribed( array( 'user_id' => get_current_user_id(), 'blog_id' => $this->blog_id ) );
	}

	function get_subscribers_count() {
		return wpcom_subs_total_wpcom_subscribers( array( 'blog_id' => $this->blog_id ) );
	}

	function get_locale() {
		return (string) get_blog_lang_code();	
	}

	function get_icon() {
		$domain = blavatar_domain( home_url() );

		if ( blavatar_exists( $domain ) ) {
	        return array(
	          'img' => (string) remove_query_arg( 's', blavatar_url( $domain, 'img' ) ),
	          'ico' => (string) remove_query_arg( 's', blavatar_url( $domain, 'ico' ) ),
	        );
	    }

	    return null;
	}

	function is_jetpack() {
		return false;
	}

	function get_jetpack_modules() {
		return null;
	}

	function get_post_formats() {
		// deprecated - see separate endpoint. get a list of supported post formats
		$all_formats       = get_post_format_strings();
		$supported         = get_theme_support( 'post-formats' );

		$supported_formats = array();

		if ( isset( $supported[0] ) ) {
			foreach ( $supported[0] as $format ) {
				$supported_formats[ $format ] = $all_formats[ $format ];
			}
		}

		return $supported_formats;
	}

	function before_render() {}
	function after_render( &$response ) {}
	function after_render_options( &$options ) {}	
}

abstract class Abstract_Jetpack_Site extends SAL_Site {
	abstract protected function get_constant( $name );
	abstract protected function current_theme_supports( $feature_name );
	abstract protected function get_theme_support( $feature_name );
	abstract protected function get_mock_option( $name );
	abstract protected function get_jetpack_version();

	function before_render() {}

	function after_render( &$response ) {
		// Add the updates only make them visible if the user has manage options permission and the site is the main site of the network
		if ( current_user_can( 'manage_options' ) && $this->is_main_site( $response ) ) {
			$jetpack_update = (array) get_option( 'jetpack_updates' );
			if ( ! empty( $jetpack_update ) ) {
				// In previous version of Jetpack 3.4, 3.5, 3.6 we synced the wp_version into to jetpack_updates
				unset( $jetpack_update['wp_version'] );
				// In previous version of Jetpack 3.4, 3.5, 3.6 we synced the site_is_version_controlled into to jetpack_updates
				unset( $jetpack_update['site_is_version_controlled'] );
				
				$response['updates'] = (array) $jetpack_update;
			}
		}
	}

	function after_render_options( &$options ) {
		$options['jetpack_version'] = $this->get_jetpack_version();

		if ( $main_network_site = $this->get_mock_option( 'main_network_site' ) ) {
			$options['main_network_site'] = (string) rtrim( $main_network_site, '/' );
		}

		if ( is_array( $active_modules = Jetpack_Options::get_option( 'active_modules' ) ) ) {
			$options['active_modules'] = (array) array_values( $active_modules );
		}

		$options['software_version'] = (string) $this->get_mock_option( 'wp_version' );
		$options['max_upload_size']  = $this->get_mock_option( 'max_upload_size', false );

		// Sites have to prove that they are not main_network site.
		// If the sync happends right then we should be able to see that we are not dealing with a network site
		$options['is_multi_network'] = (bool) $this->get_mock_option( 'is_main_network', true  );
		$options['is_multi_site']    = (bool) $this->get_mock_option( 'is_multi_site', true );

		$file_mod_disabled_reasons = array_keys( array_filter( array(
			'automatic_updater_disabled'      => (bool) $this->get_constant( 'AUTOMATIC_UPDATER_DISABLED' ),
			// WP AUTO UPDATE CORE defaults to minor, '1' if true and '0' if set to false.
			'wp_auto_update_core_disabled'    =>  ! ( (bool) $this->get_constant( 'WP_AUTO_UPDATE_CORE', 'minor' ) ),
			'is_version_controlled'           => (bool) $this->get_mock_option( 'is_version_controlled' ),
			// By default we assume that site does have system write access if the value is not set yet.
			'has_no_file_system_write_access' => ! (bool)( $this->get_mock_option( 'has_file_system_write_access', true ) ),
			'disallow_file_mods'              => (bool) $this->get_constant( 'DISALLOW_FILE_MODS' )
		) ) );

		$options['file_mod_disabled'] = empty( $file_mod_disabled_reasons ) ? false : $file_mod_disabled_reasons;
	}

	function get_jetpack_modules() {
		if ( is_user_member_of_blog() ) {
			return array_values( Jetpack_Options::get_option( 'active_modules', array() ) );	
		}

		return null;
	}

	function featured_images_enabled() {
		return $this->current_theme_supports( 'post-thumbnails' );
	}

	function get_post_formats() {
		// deprecated - see separate endpoint. get a list of supported post formats
		$all_formats       = get_post_format_strings();
		$supported         = $this->get_theme_support( 'post-formats' );

		$supported_formats = array();

		if ( isset( $supported[0] ) ) {
			foreach ( $supported[0] as $format ) {
				$supported_formats[ $format ] = $all_formats[ $format ];
			}
		}

		return $supported_formats;
	}

	/**
	 * Private methods
	 **/

	private function is_main_site( $response ) {
		if ( isset( $response['options']['main_network_site'], $response['options']['unmapped_url'] ) ) {
			$main_network_site_url = set_url_scheme( $response['options']['main_network_site'], 'http' );
			$unmapped_url          = set_url_scheme( $response['options']['unmapped_url'], 'http' );
			if ( $unmapped_url === $main_network_site_url ) {
				return true;
			}
		}
		return false;
	}
}

// this code runs on Jetpack (.org) sites
class Jetpack_Site extends Abstract_Jetpack_Site {

	protected function get_mock_option( $name ) {
		return get_option( 'jetpack_'.$name );
	}

	protected function get_constant( $name ) {
		if ( defined( $name) ) {
			return constant( $name );	
		}
		return null;
	}

	protected function current_theme_supports( $feature_name ) {
		return current_theme_supports( $feature_name );
	}

	protected function get_theme_support( $feature_name ) {
		return get_theme_support( $feature_name );
	}

	function has_videopress() {
		// TODO - this only works on wporg site - need to detect videopress option for remote Jetpack site on WPCOM
		$videopress = Jetpack_Options::get_option( 'videopress', array() );
		if ( isset( $videopress['blog_id'] ) && $videopress['blog_id'] > 0 ) {
			return true;
		}

		return false;
	}

	function upgraded_filetypes_enabled() {
		return true;
	}

	function is_mapped_domain() {
		return true;
	}

	function is_redirect() {
		return false;
	}

	function is_following() {
		return false;
	}

	function has_wordads() {
		// TODO: any way to detect wordads on the site, or does it need to be modified on the way through?
		return false;
	}

	function get_frame_nonce() {
		return false;
	}

	function allowed_file_types() {
		$allowed_file_types = array();

		// http://codex.wordpress.org/Uploading_Files
		$mime_types = get_allowed_mime_types();
		foreach ( $mime_types as $type => $mime_type ) {
			$extras = explode( '|', $type );
			foreach ( $extras as $extra ) {
				$allowed_file_types[] = $extra;
			}
		}

		return $allowed_file_types;
	}

	function is_private() {
		return false;
	}

	function get_subscribers_count() {
		return 0; // special magic fills this in on the WPCOM side
	}

	function get_locale() {
		return get_bloginfo( 'language' );
	}

	function get_icon() {
		if ( function_exists( 'jetpack_site_icon_url' ) && function_exists( 'jetpack_photon_url' ) ) {
			return array(
				'img' => (string) jetpack_photon_url( jetpack_site_icon_url( get_current_blog_id() , 80 ), array( 'w' => 80 ), 'https' ),
				'ico' => (string) jetpack_photon_url( jetpack_site_icon_url( get_current_blog_id() , 16 ), array( 'w' => 16 ), 'https' ),
			);
		}

		return null;
	}

	function is_jetpack() {
		return true;
	}

	protected function get_jetpack_version() {
		return JETPACK__VERSION;
	}
}

// this code runs on WordPress.com "shadow" Jetpack sites
// its code will be a hybrid of wpcom functions and jetpack functions from synced data
// ... oof.
class Jetpack_Shadow_Site extends Abstract_Jetpack_Site {
	private $is_https;

	protected function get_constant( $name ) {
		return get_option( 'jetpack_constant_'.$name );
	}

	protected function current_theme_supports( $feature_name ) {
		return (bool) get_option( 'jetpack_current_theme_supports_'.$feature_name );
	}

	protected function get_theme_support( $feature_name ) {
		return get_option( 'jetpack_get_theme_support_'.$feature_name );
	}

	protected function get_mock_option( $name ) {
        return get_option( 'jetpack_'.$name );
    }

	function has_videopress() {
		// TODO - this only works on wporg site - need to detect videopress option for remote Jetpack site on WPCOM
		$videopress = Jetpack_Options::get_option( 'videopress', array() );
		if ( isset( $videopress['blog_id'] ) && $videopress['blog_id'] > 0 ) {
			return true;
		}

		return false;
	}

	function upgraded_filetypes_enabled() {
		return true;
	}

	function is_mapped_domain() {
		return true;
	}

	function is_redirect() {
		return false;
	}

	function featured_images_enabled() {
		// TODO: render from cached rendered jetpack options
		return false;
	}

	function has_wordads() {
		return has_any_blog_stickers( array( 'wordads-approved', 'wordads-approved-misfits' ), $this->blog_id );
	}

	function get_frame_nonce() {
		return wpcom_get_frame_nonce();
	}

	function allowed_file_types() {
		return get_mime_types();
	}

	function is_private() {
		return false;
	}

	function is_following() {
		return (bool) wpcom_subs_is_subscribed( array( 'user_id' => get_current_user_id(), 'blog_id' => $this->blog_id ) );
	}

	function get_subscribers_count() {
		return wpcom_subs_total_wpcom_subscribers( array( 'blog_id' => $this->blog_id ) );
	}

	function get_locale() {
		$locale = (string) get_blog_lang_code();
		if ( $locale === 'en' ) {
			return 'en-US';
		} else {
			return $locale;
		}
	}

	function get_icon() {
		$site_icon_url = get_option( 'jetpack_site_icon_url' );

		if( $site_icon_url ) {
			return array(
			  'img' => (string) jetpack_photon_url( $site_icon_url, array() , 'https' ),
			  'ico' => (string) jetpack_photon_url( $site_icon_url, array( 'w' => 16 ), 'https' )
			);
		}

		return null;
	}

	function is_jetpack() {
		return true;
	}

	function before_render() {
		parent::before_render();

		// modify filters
		$this->is_https = 'https' === parse_url( get_option( 'siteurl' ), PHP_URL_SCHEME );
		if ( ! $this->is_https ) {
			add_filter( 'set_url_scheme', array( $this, 'force_http' ), 10, 3 );
		}

		// modify filters
		remove_filter( 'option_stylesheet', 'fix_theme_location' );
	}

	function after_render( &$response ) {
		parent::after_render( $response );

		if ( ! $this->is_https ) {
			remove_filter( 'set_url_scheme', array( $this, 'force_http' ), 10, 3 );
		}

		// un-modify filters
		add_filter( 'option_stylesheet', 'fix_theme_location' );
	}

	/**
	 * Utility functions
	 **/

	public function force_http( $url, $scheme, $orig_scheme ) {
		return preg_replace('/^https:\/\//', 'http://', $url, 1 );
	}

	protected function get_jetpack_version() {
		return get_option( 'jetpack_version' );
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
