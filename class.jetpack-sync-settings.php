<?php

/**
 * All the Settings we want to sync to .com
 *
 * This is also used when displaying settings in the API
 */
class Jetpack_Sync_Settings {

	private static $options = array(

		'blogname'                     	 => 'string',
		'blogdescription'              	 => 'string',

		'default_ping_status'          	 => 'closed',
		'default_comment_status'       	 => 'closed',
		'blog_public'                  	 => 'string',

		'infinite_scroll'              	 => 'bool',
		'default_category'             	 => 'int',
		'default_post_format'          	 => 'string',
		'default_pingback_flag'          => 'bool',
		'require_name_email'           	 => 'bool',
		'comment_registration'         	 => 'bool',
		'close_comments_for_old_posts' 	 => 'bool',
		'close_comments_days_old'      	 => 'int',
		'thread_comments'              	 => 'bool',
		'thread_comments_depth'        	 => 'int',
		'page_comments'                	 => 'bool',
		'comments_per_page'            	 => 'int',
		'default_comments_page'        	 => array( 'newest', 'oldest' ),
		'comment_order'                	 => array( 'asc', 'desc' ),
		'comments_notify'              	 => 'bool',
		'moderation_notify'            	 => 'bool',
		'social_notifications_like'    	 => 'on',
		'social_notifications_reblog'  	 => 'on',
		'social_notifications_subscribe' => 'on',
		'comment_moderation'           	 => 'bool',
		'comment_whitelist'            	 => 'bool',
		'comment_max_links'            	 => 'int',
		'moderation_keys'              	 => 'string',
		'blacklist_keys'               	 => 'string',
		'lang_id'                      	 => 'string',
		'wga'                          	 => array( 'code'=>'regex:/^$|^UA-[\d-]+$/i' ),
		'disabled_likes'               	 => 'bool',
		'disabled_reblogs'             	 => 'bool',
		'jetpack_comment_likes_enabled'	 => 'bool',
		'twitter_via'                  	 => 'string',
		'jetpack-twitter-cards-site-tag' => 'string',

		// added from jetpack site options
		'jetpack_version'	=> 'string',
		'page_on_front'		=> 'int',
		'page_for_posts'	=> 'int',
		'show_on_front'		=> array( 'posts', 'page' ),
		'gmt_offset'		=> 'float',
		'language'			=> 'string',
		'timezone_string'	=> 'string',
		'gmt_offset'		=> 'float',
		'image_default_link_type' => 'string',
	);

	/**
	 * Data that we want to sync.
	 * @var array
	 */
	private static $mock_options = array(
		'admin_url' => array(
			'type' => 'url',
			'callback' => 'get_admin_url'
		),
		'login_url' => array(
			'type' => 'url',
			'callback' => 'wp_login_url'
		),
		'unmapped_url' => array(
			'type' => 'url',
			'callback' => array( 'Jetpack_Sync_Settings','get_site_url' ),
		),
		'jetpack_protect_whitelist' => array(
			'type' => array( 'local' => 'array', 'global' => 'array' ),
			'callback' => 'jetpack_protect_format_whitelist'
		),
		'post_categories' => array(
			'type' => 'array',
			'callback' => array( 'Jetpack_Sync_Settings', 'get_post_caregories' )
		),
		'jetpack_sync_non_public_post_stati' => array(
			'type' => 'bool',
			'callback' => array( 'Jetpack_Options','get_option' ),
			'callback_args' => array( 'sync_non_public_post_stati' )
		),
		'jetpack_relatedposts_allowed' => array(
			'type' => 'bool',
			'callback' => array( 'Jetpack_Sync_Settings','jetpack_relatedposts_supported' )
		),
		'jetpack_relatedposts_enabled' => array(
			'type' => 'bool',
			'callback' => array( 'Jetpack_Sync_Settings','jetpack_related_posts_data' ),
			'callback_args' => array( 'enabled' )
		),
		'jetpack_relatedposts_show_headline' => array(
			'type' => 'bool',
			'callback' => array( 'Jetpack_Sync_Settings','jetpack_related_posts_data' ),
			'callback_args' => array( 'show_headline' )
		),
		'jetpack_relatedposts_show_thumbnails' => array(
			'type' =>  'bool',
			'callback' => array( 'Jetpack_Sync_Settings','jetpack_related_posts_data' ),
			'callback_args' => array( 'show_thumbnails' )
		),

		'default_sharing_status' =>array(
			'type' =>  'string',
			'callback' => array( 'Jetpack_Sync_Settings','sharing_service' ),
			'callback_args' => array( 'visible' )
		),
		'sharing_button_style' => array(
			'type' =>  'string',
			'callback' => array( 'Jetpack_Sync_Settings','sharing_service' ),
			'callback_args' => array( 'button_style' )
		),
		'sharing_label' => array(
			'type' =>  'string',
			'callback' => array( 'Jetpack_Sync_Settings','sharing_service' ),
			'callback_args' => array( 'label' )
		),
		'sharing_show' => array(
			'type' =>  'array',
			'callback' => array( 'Jetpack_Sync_Settings','sharing_service' ),
			'callback_args' => array( 'show' )
		),
		'sharing_open_links' => array(
			'type' =>  'string',
			'callback' => array( 'Jetpack_Sync_Settings','sharing_service' ),
			'callback_args' => array( 'open_links' )
		),
		'videopress_enabled' => array(
			'type' =>  'bool',
			'callback' => array( 'Jetpack_Sync_Settings','videopress_enabled' ),
			'callback_args' => array( 'thumbnail_size_w' )
		),
		'image_thumbnail_width'   => array(
			'type' =>  'int',
			'callback' => array( 'Jetpack_Sync_Settings','get_option' ),
			'callback_args' => array( 'thumbnail_size_w' )
		),
		'image_thumbnail_height'   => array(
			'type' =>  'int',
			'callback' => array( 'Jetpack_Sync_Settings','get_option' ),
			'callback_args' => array( 'thumbnail_size_h' )
		),
		'image_thumbnail_crop'   => array(
			'type' =>  'bool', // ?
			'callback' => array( 'Jetpack_Sync_Settings','get_option' ),
			'callback_args' => array( 'thumbnail_crop' )
		),
		'image_medium_width'   => array(
			'type' =>  'int',
			'callback' => array( 'Jetpack_Sync_Settings','get_option' ),
			'callback_args' => array( 'medium_size_w' )
		),
		'image_medium_height'   => array(
			'type' =>  'int',
			'callback' => array( 'Jetpack_Sync_Settings','get_option' ),
			'callback_args' => array( 'medium_size_h' )
		),
		'image_large_width'   => array(
			'type' =>  'int',
			'callback' => array( 'Jetpack_Sync_Settings','get_option' ),
			'callback_args' => array( 'large_size_w' )
		),
		'image_large_height'   => array(
			'type' =>  'int',
			'callback' => array( 'Jetpack_Sync_Settings','get_option' ),
			'callback_args' => array( 'large_size_h' )
		),
		'post_formats' => array(
			'type' =>  'array',
			'callback' => array( 'Jetpack_Sync_Settings','post_formats' )
		),
		'allowed_file_types' => array(
			'type' =>  'array',
			'callback' => array( 'Jetpack_Sync_Settings','get_mime_types' )
		),
		'is_mapped_domain' => array(
			'type' =>  'bool',
			'callback' => array( 'Jetpack_Sync_Settings','is_mapped_domain' )
		),
		'default_likes_enabled' => array(
			'type' => 'bool',
			'callback' => array( 'Jetpack_Sync_Settings', 'default_likes_enabled' )
		),
		'software_version' => array(
			'type' => 'float',
			'callback' => array( 'Jetpack_Sync_Settings', 'wp_version' )
		),
		'created_date' => array(
			'type' => 'string',
			'callback' => array( 'Jetpack_Sync_Settings', 'created_date' )
		),
		'main_network_site' => array(
			'type' => 'rtrim-slash',
			'callback' => array( 'Jetpack_Sync_Settings','get_option' ),
			'callback_args' => array( 'jetpack_main_network_site' )
		),
		'is_multi_network' => array(
			'type' => 'bool',
			'callback' => array( 'Jetpack_Sync_Settings','get_option' ),
			'callback_args' => array( 'jetpack_is_main_network', true )
		),
		'is_multi_site' => array(
			'type' => 'bool',
			'callback' => array( 'Jetpack_Sync_Settings','get_option' ),
			'callback_args' => array( 'jetpack_main_network_site', true )
		)
	);

	/**
	 * Constants that we want to sync
	 * @var array
	 */
	private static $constants = array(
		'EMPTY_TRASH_DAYS' => 'int',
		'WP_POST_REVISIONS'=> 'int',
		'AUTOMATIC_UPDATER_DISABLED'=> 'bool',
		'WP_AUTO_UPDATE_CORE'=> 'bool'
	);
	/**
	 * This lets us add to the different to be synced.
	 *
	 * @param  $name [description]
	 * @param [type] $type [description]
	 * @param [type] $args [description]
	 */
	static function add_setting( $name, $type, $args ) {
		switch( $type ) {
			case 'option':
				if ( ! array_key_exists( $name, self::$options ) ) {
					self::$options[ $name ] = $args;
				}
				break;
			case 'mock_option':
				if ( ! array_key_exists( $name, self::$mock_options ) ) {
					self::$mock_options[ $name ] = $args;
				}
				break;
			case 'constant':
				if ( ! array_key_exists( $name, self::$constants ) ) {
					self::$constants[ $name ] = $args;
				}
				break;
		}
	}
	/**
	 * Set ndividual setting
	 *
	 * @param  sting $name
	 * @param  string $type
	 * @param  string or array $callback
	 * @param  boolean $is_constant
	 * @return value of the setting
	 */
	static function get( $name ) {

		// Options
		if ( array_key_exists( $name, self::$options ) ) {
			return self::validate( get_option( $name ), self::$options[ $name ] );

		// Mock options
		} elseif ( array_key_exists( $name, self::$mock_options ) ) {
			if ( is_callable( self::$mock_options[ $name ][ 'callback' ] ) ) {

				$args = array();
				if ( isset( self::$mock_options[ $name ][ 'callback_args' ] ) &&
					 is_array( self::$mock_options[ $name ][ 'callback_args' ] ) ) {
					$args = self::$mock_options[ $name ][ 'callback_args' ];
				}

				$data = call_user_func_array( self::$mock_options[ $name ][ 'callback' ], $args );

				return self::validate( $data, self::$mock_options[ $name ][ 'type' ] );

			} else {
				return new WP_Error( json_encode( self::$mock_options[ $name ][ 'callback' ] ) . ' can not be called' );
			}

		// Constants
		} elseif ( array_key_exists( $name, self::$constants) ) {

			if ( defined( $name ) ) {
				return self::validate( constant( $name ) , self::$constants[ $name ] );
			}
		}

		return null;
	}
	/**
	 * Gets all the settings or just some.
	 *
	 * @param  string or array $type could be 'all', 'options', 'mock_options', 'constants' it can also be an array of setting names
	 * @return array $settings associative array of settings bases on type
	 */
	static function get_all( $type = null ) {

		$all_settings = array();
		$data = array();

		if ( is_array( $type ) ) {
			$all_settings = $type;
		} else {
			switch( $type ) {
			case 'options':
				$all_settings = array_keys( self::$options );
				break;

			case 'mock_options':
				$all_settings = array_keys( self::$mock_options );
				break;

			case 'constants':
				$all_settings = array_keys( self::$constants );
				break;

			case 'all':
			default:
				$all_settings = array_merge( array_keys( self::$options ), array_keys( self::$mock_options ), array_keys( self::$constants ) );
				break;

			}
		}

		foreach ( $all_settings as $name  ) {
			$data[ $name ] = self::get( $name );
		}

		return $data;
	}

	static function update( $name, $data ) {

		if ( ! isset( self::$options[ $name ] ) )
			return;

		$data = self::validate( $data, self::$options[ $name ] );
		return update_option( $name, $data );

	}

	static function validate( $data, $type = null ) {

		if ( is_null( $data ) ) {
			return $data;
		}

		switch( $type ) {
			case 'bool':
				return boolval( $data );

			case 'url':
				return esc_url( $data );

			case 'on':
				return ( 'on' == $data ? true : false );
				break;

			case 'closed':
				return ( 'closed' != $data ? true : false );

			case 'string':
				return strval( $data );

			case 'int':
				return ( is_numeric( $data ) ? intval( $data ) : 0 );

			case 'float':
				return ( is_numeric( $data ) ? floatval( $data ) : 0 );

			case 'array':
				return ( is_array( $data ) ? $data : array() );

			case 'rtrim-slash':
				return strval( rtrim( $data, '/' ) );
		}

		if (  is_string( $type ) && 'regex:' == substr( $type, 0, 6 ) ) {

			return ( preg_match( substr( $type, 6 ), $data ) ? $data : null );

		} elseif ( is_array( $type ) ) {
			// Is the array associative?
			if ( count( array_filter( array_keys( $type ), 'is_string' ) ) ) {

				foreach ( $type as $item => $check ) {
					$data[ $item ] = self::validate( $data[ $item ], $check );
				}
				return $data;

			} else {
				// check if the value exists in the array if not return the first value.
				// Ex $type = array( 'open', 'closed' ); defaults to 'open'
				return ( in_array( $data, $type ) ? $data: $type[0] );
			}
		}

		// Don't check for validity here
		if ( 'no-validation' == $type ) {
			return $data;
		}

		return null;
	}

	/**
	 * Helper callback functions
	 */
	static function get_post_caregories() {
		// array_values() is necessary to ensure the array starts at index 0.
		return array_values(
			array_map(
				array( 'Jetpack_Sync_Settings', 'get_category_details' ),
				get_categories( array( 'hide_empty' => false ) )
			)
		);

	}

	/**
	 * Returns category details
	 *
	 * @return (array)
	 */
	static function get_category_details( $category ) {
		return array(
			'value' => $category->term_id,
			'name' => $category->name
		);
	}

	/**
	 * Determines whether jetpack_relatedposts is supported
	 *
	 * @return (bool)
	 */
	static function jetpack_relatedposts_supported() {
		$wpcom_related_posts_theme_blacklist = array(
			'Expound',
			'Traveler',
			'Opti',
			'Currents',
		);
		return ( ! in_array( wp_get_theme()->get( 'Name' ), $wpcom_related_posts_theme_blacklist ) );
	}

	/**
	 * Get related posts options.
	 *
	 * @param  string $key of the value to get back
	 * @return $value
	 */
	static function jetpack_related_posts_data( $key ) {
		$jetpack_relatedposts_options = Jetpack_Options::get_option( 'relatedposts' );

		if ( $key == 'enabled' && method_exists( 'Jetpack', 'is_module_active' ) ) {
			return Jetpack::is_module_active( 'related-posts' );
		}

		if ( isset( $jetpack_relatedposts_options[ $key ] ) ) {
			return $jetpack_relatedposts_options[ $key ];
		}

		return null;
	}
	/**
	 * Get the current site url.
	 *
	 * @return string unmapped site url
	 */
	static function get_site_url(){

		return get_site_url( get_current_blog_id() );
	}

	/**
	 * Get Sharing Service options
	 * @param  string $key of the value to get back.
	 * @return $value
	 */
	static function sharing_service( $key ) {

		// This should be part of the whole thing.
		if ( class_exists( 'Sharing_Service' ) ) {
			$ss = new Sharing_Service();
			$sharing = $ss->get_global_options();

			if ( isset( $sharing[ $key ] ) ) {
				return $sharing[ $key ];
			}
		}

		return null;
	}

	/**
	 * Get the whether videopress is enabled.
	 *
	 * @return bool
	 */
	static function videopress_enabled() {

		if ( get_option( 'video_upgrade' ) == '1' ) {
			return true;
		} else {
			if ( class_exists( 'Jetpack_Options' ) ) {
				$videopress = Jetpack_Options::get_option( 'videopress', array() );

				if ( isset( $videopress[ 'blog_id' ] ) && $videopress[ 'blog_id' ] > 0 ) {
					return true;
				}
			}
		}

		return false;
	}

	/**
	 * Get Options lets you change the name of the get option to be something else.
	 *
	 * @param  string $key
	 * @param  string $default
	 * @return option value
	 */
	static function get_option( $key, $default = false ) {
		return get_option( $key, $default );
	}

	/**
	 * Get a list of suported  the post formats.
	 * @return array A list of post formats
	 */
	static function post_formats() {
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

	/**
	 * List of allowed mime types
	 * @return [type] [description]
	 */
	static function get_mime_types() {
		if ( function_exists( 'get_mime_types' ) ) {
			$allowed_file_types = get_mime_types();
		} else {
			// http://codex.wordpress.org/Uploading_Files
			$mime_types = get_allowed_mime_types();
			foreach ( $mime_types as $type => $mime_type ) {
				$extras = explode( '|', $type );
				foreach ( $extras as $extra ) {
					$allowed_file_types[] = $extra;
				}
			}
		}
		return $allowed_file_types;
	}

	/**
	 * Tells is if the domain is mapped.
	 *
	 * @return boolean [description]
	 */
	static function is_mapped_domain(){
		if ( function_exists( 'get_primary_redirect' ) ) {
			$primary_redirect = strtolower( get_primary_redirect() );
			if ( false === strpos( $primary_redirect, '.wordpress.com' ) ) {
				return true;
			}
		}
		return false;
	}
	/**
	 * Get whether likes is enabled for the site.
	 *
	 * @return bool
	 */
	static function default_likes_enabled() {
		return apply_filters( 'wpl_is_enabled_sitewide', ! get_option( 'disabled_likes' ) );
	}
	/**
	 * Get WordPress Version
	 *
	 * @return float
	 */
	static function wp_version() {
		global $wp_version;
		return $wp_version;
	}
	/**
	 * Return the date that the site was created.
	 *
	 * @return string GMT Date format.
	 */
	static function created_date() {
		if ( function_exists( 'get_blog_details' ) ) {
			$blog_details = get_blog_details();
			if ( ! empty( $blog_details->registered ) ) {
				$timestamp_gmt = strtotime( $blog_details->registered.' +0000' );
				return gmdate( 'Y-m-d\\TH:i:s', $timestamp_gmt ) . '+00:00';
			}
		}
		return '0000-00-00T00:00:00+00:00';
	}
}