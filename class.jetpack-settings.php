<?php

/**
 * All the Settings we want to sync to .com
 *
 * This is also used when displaying settings in the API
 */
class Jetpack_Settings {

	public static $settings = array(
		// also exists as "options"
		'default_ping_status'     => 'bool',
		'default_comment_status'  => 'bool',

		// new stuff starts here
		'blog_public'             => 'int',
		'jetpack_sync_non_public_post_stati' => 'bool',
		'jetpack_relatedposts_allowed' => 'bool',
		'jetpack_relatedposts_enabled' => 'bool',
		'jetpack_relatedposts_show_headline' => 'bool',
		'jetpack_relatedposts_show_thumbnails' => 'bool',
		'default_category'        => array( 'ID' =>'int', 'name' => 'string' ),
		'post_categories'         => array( 'ID' =>'int', 'name' => 'string' ),
		'default_post_format'     => 'string', // to check
		'default_pingback_flag'   => 'bool',
		'require_name_email'      => 'bool',
		'comment_registration'    => 'bool',
		'close_comments_for_old_posts' => 'bool' ,
		'close_comments_days_old' => 'int' ,
		'thread_comments'         => 'bool' ,
		'thread_comments_depth'   => 'int' ,
		'page_comments'           => 'bool' ,
		'comments_per_page'       => 'int' ,
		'default_comments_page'   => 'string' , // to check
		'comment_order'           => 'string', //  to check
		'comments_notify'         => 'bool' ,
		'moderation_notify'       => 'bool',
		'social_notifications_like' => 'bool',
		'social_notifications_reblog' => 'bool',
		'social_notifications_subscribe' => 'bool',
		'comment_moderation'      => 'bool',
		'comment_whitelist'       => 'bool',
		'comment_max_links'       => 'int',
		'moderation_keys'         => 'string', // to check
		'blacklist_keys'          => 'bool', // to check
		'lang_id'                 => 'bool', // to check
		'wga'                     => 'bool', // array to check
		'disabled_likes'          => 'bool',
		'disabled_reblogs'        => 'bool',
		'jetpack_comment_likes_enabled' => 'bool',
		'twitter_via'             => 'string',
		'jetpack-twitter-cards-site-tag' => 'string'

	);

	/**
	 * Data that we want to sync.
	 * @var array
	 */
	public static $mock_options = array(
		'admin_url' => array( 'type' => 'url', 'callback' => 'get_admin_url', 'callback_' )
	);

	/**
	 * Constants that we want to sync
	 * @var array
	 */
	public static $constants = array(
		'EMPTY_TRASH_DAYS' => 'int',
		'WP_POST_REVISIONS'=> 'bool',
		'AUTOMATIC_UPDATER_DISABLED'=> 'bool',
		'WP_AUTO_UPDATE_CORE'=> 'bool'
	);
	/**
	 * Set induvidual setting
	 *
	 * @param  sting $name
	 * @param  string $type
	 * @param  string or array $callback
	 * @param  boolean $is_constant
	 * @return value of the setting
	 */
	static function get( $name, $type = null, $callback = null, $callback_args = null, $is_constant = false) {

		if ( $callback ) {
			$data = call_user_func_array( $callback,  $callback_args );
		} elseif( $is_constant ) {
			if( defined( $name ) ){
				$data = constant( $name );
			} else {
				$data = null;
			}
		} else {
			$data = get_option( $name );
		}
		return self::validate( $data, $type );
	}
	/**
	 * Gets all the settings.
	 *
	 * @param  string or array $type could be 'all', 'options', 'mock_options', 'constants'
	 * @return array $settings associative array of settings bases on type
	 */
	static function get_all( $type = null  ) {

		if ( ! in_array( $type, array( 'options', 'mock_options', 'constants' ) ) && ! is_array( $type ) ) {
			$type = 'all';
		} elseif ( is_array( $type ) ) {
			foreach( $type as $name => $type_data ) {
				$settings[ $name ] = self::get( $name , $type_data['type'], $type_data['callback'], $type_data['callback_args'], $type_data['is_constant'] );
			}

			return $settings;
		}

		if ( in_array( $type, array( 'all', 'options' ) ) ) {
			foreach( self::$settings as $name => $type ) {
				$settings[ $name ] = self::get( $name , $type );
			}
		}

		if ( in_array( $type, array( 'all', 'mock_options' ) ) ) {
			foreach( self::$mock_options as $name => $args ) {
				$settings[ $name ] = self::get( $name, $args['type'], $args['callback'], $args['callback_args'] );
			}
		}

		if ( in_array( $type, array( 'all', 'constants' ) ) ) {
			foreach( self::$constants as $name => $type ) {
				$settings[ $name ] = self::get( $name, $type, null, true );
			}
		}

		return $settings;
	}

	static function update( $name, $data, $type, $callback ) {

		if ( $callback ) {
			$data = call_user_func_array( $callback, $name );
		} else {
			$data = self::validate( $data, $type );

			$data = update_option( $name, $data );
		}
	}

	static function validate( $data, $type ) {

		//
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
				return  ( is_numeric( $data) ? intval( $data ) : 0 );
		}

		if ( is_array( $type ) ) {
			foreach( $type as $item => $check ) {

				$data[ $item ] = self::validate( $data[ $item ], $check );
			}
			return $data;
		}
	}


}