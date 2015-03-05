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
		'lang_id'                      	 => 'int',
		'wga'                          	 => array( 'code'=>'regex:/^$|^UA-[\d-]+$/i' ),
		'disabled_likes'               	 => 'bool',
		'disabled_reblogs'             	 => 'bool',
		'jetpack_comment_likes_enabled'	 => 'bool',
		'twitter_via'                  	 => 'string',
		'jetpack-twitter-cards-site-tag' => 'string',
		/*
		'sharing_button_style'         	 => 'string',
		'sharing_label'                	 => 'string',
		'sharing_show'                 	 => 'string',
		'sharing_open_links'           	 => 'string',
		*/
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
		if ( is_array( self::$options ) &&  array_key_exists( $name, self::$options ) ) {
			return self::validate( get_option( $name ), self::$options[ $name ] );

		// Mock options
		} elseif ( is_array( self::$mock_options) && array_key_exists( $name, self::$mock_options ) ) {
			if ( is_callable( self::$mock_options[ $name ][ 'callback' ] ) ) {

				$args = array();
				if ( isset( self::$mock_options[ $name ][ 'callback_args' ] ) &&
					 is_array( self::$mock_options[ $name ][ 'callback_args' ] ) ) {
					$args = self::$mock_options[ $name ][ 'callback_args' ];
				}

				$data = call_user_func_array( self::$mock_options[ $name ][ 'callback' ], $args );

				return self::validate( $data, self::$mock_options[ $name ][ 'type' ] );

			} else {
				new WP_Error( json_encode( self::$mock_options[ $name ][ 'callback' ] ) . ' can not be called' );
				return null;
			}

		// Constants
		} elseif( is_array( self::$constants ) && array_key_exists( $name, self::$constants) ) {

			if ( defined( $name ) ) {
				return self::validate( constant( $name ) , self::$constants[ $name ] );
			} else {
				return null;
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

		foreach ( $all_settings  as $name  ) {
				$data[ $name ] = self::get( $name );
		}

		return $data;
	}

	static function update( $name, $data ) {

		if ( ! isset( self::$options[$name] ) )
			return;

		$data = self::validate( $data, self::$options[$name] );
		return update_option( $name, $data );

	}

	static function validate( $data, $type ) {

		if ( is_null( $data ) ) {
			return $data;
		}

		switch( $type ) {
			case 'bool':
				return boolval( $data );

			case 'url':
				return esc_url( $data );

			case 'on':
				return ( $data == 'on' ? true : false );
				break;

			case 'closed':
				return ( $data != 'closed' ? true : false );

			case 'string':
				return strval( $data );

			case 'int':
				return ( is_numeric( $data ) ? intval( $data ) : 0 );

			case 'array':
				return ( is_array( $data ) ? $data : array() );
		}

		if (  ! is_array( $type ) && 'regex:' == substr( $type, 0, 5 ) ) {

			return ( preg_match( substr( $type, 6 ), $data ) ? $data : null );

		} elseif ( is_array( $type ) && ! isset( $type[0]) ) {

			foreach ( $type as $item => $check ) {
				$data[ $item ] = self::validate( $data[ $item ], $check );
			}
			return $data;

		} elseif ( is_array( $type ) && isset( $type[0] ) ) {
			return ( in_array( $data, $type ) ? $data: $type[0] );
		}
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
	 * todo: not a good way of doing this. :(
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

	static function jetpack_related_posts_data( $key ) {
		$jetpack_relatedposts_options = Jetpack_Options::get_option( 'relatedposts' );

		if ( $key == 'enabled' && method_exists( 'Jetpack', 'is_module_active' ) ) {
			return Jetpack::is_module_active( 'related-posts' );
		}

		return $jetpack_relatedposts_options[$key];
	}


}