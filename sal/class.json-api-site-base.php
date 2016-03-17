<?php


require_once dirname( __FILE__ ) . '/class.json-api-post-base.php';

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

	abstract public function is_vip();

	abstract public function is_multisite();

	abstract public function is_single_user_site();

	abstract public function get_plan();

	abstract public function get_ak_vp_bundle_enabled();

	abstract public function before_render();

	abstract public function after_render( &$response );

	abstract public function after_render_options( &$options );

	// wrap a WP_Post object
	abstract public function wrap_post( $post, $context );


	public function get_post_by_id( $post_id, $context ) {
		$post = get_post( $post_id, OBJECT, $context );

		if ( ! $post ) {
			return new WP_Error( 'unknown_post', 'Unknown post', 404 );
		}

		$wrapped_post = $this->wrap_post( $post, $context );

		// validate access
		return $this->validate_access( $wrapped_post );
	}

	/**
	 * Validate current user can access the post
	 * 
	 * @return WP_Error or post
	 */
	private function validate_access( $post ) {
		$context = $post->context;

		if ( ! $this->is_post_type_allowed( $post->post_type ) 
			&& 
			( ! function_exists( 'is_post_freshly_pressed' ) || ! is_post_freshly_pressed( $post->ID ) ) ) {
			return new WP_Error( 'unknown_post', 'Unknown post', 404 );
		}

		switch ( $context ) {
		case 'edit' :
			if ( ! current_user_can( 'edit_post', $post ) ) {
				return new WP_Error( 'unauthorized', 'User cannot edit post', 403 );
			}
			break;
		case 'display' :
			$can_view = $this->user_can_view_post( $post );
			if ( is_wp_error( $can_view ) ) {
				return $can_view;
			}
			break;
		default :
			return new WP_Error( 'invalid_context', 'Invalid API CONTEXT', 400 );
		}

		return $post;
	}

	// copied from class.json-api-endpoints.php
	private function is_post_type_allowed( $post_type ) {
		// if the post type is empty, that's fine, WordPress will default to post
		if ( empty( $post_type ) )
			return true;

		// allow special 'any' type
		if ( 'any' == $post_type )
			return true;

		// check for allowed types
		if ( in_array( $post_type, $this->_get_whitelisted_post_types() ) )
			return true;

		return false;
	}

	// copied from class.json-api-endpoints.php
	/**
	 * Gets the whitelisted post types that JP should allow access to.
	 *
	 * @return array Whitelisted post types.
	 */
	private function _get_whitelisted_post_types() {
		$allowed_types = array( 'post', 'page', 'revision' );

		/**
		 * Filter the post types Jetpack has access to, and can synchronize with WordPress.com.
		 *
		 * @module json-api
		 *
		 * @since 2.2.3
		 *
		 * @param array $allowed_types Array of whitelisted post types. Default to `array( 'post', 'page', 'revision' )`.
		 */
		$allowed_types = apply_filters( 'rest_api_allowed_post_types', $allowed_types );

		return array_unique( $allowed_types );
	}

	// copied and modified a little from class.json-api-endpoints.php
	private function user_can_view_post( $post ) {
		if ( !$post || is_wp_error( $post ) ) {
			return false;
		}

		if ( 'inherit' === $post->post_status ) {
			$parent_post = get_post( $post->post_parent );
			$post_status_obj = get_post_status_object( $parent_post->post_status );
		} else {
			$post_status_obj = get_post_status_object( $post->post_status );
		}

		$authorized = (
			$post_status_obj->public ||
			( is_user_logged_in() && 
				(
					( $post_status_obj->protected    && current_user_can( 'edit_post', $post->ID ) ) ||
					( $post_status_obj->private      && current_user_can( 'read_post', $post->ID ) ) ||
					( 'trash' === $post->post_status && current_user_can( 'edit_post', $post->ID ) ) ||
					'auto-draft' === $post->post_status
				) 
			) 
		);

		if ( ! $authorized ) {
			return new WP_Error( 'unauthorized', 'User cannot view post', 403 );
		}

		if (
			-1 == get_option( 'blog_public' ) &&
			/**
			 * Filter access to a specific post.
			 *
			 * @module json-api
			 *
			 * @since 3.4.0
			 *
			 * @param bool current_user_can( 'read_post', $post->ID ) Can the current user access the post.
			 * @param WP_Post $post Post data.
			 */
			! apply_filters(
				'wpcom_json_api_user_can_view_post',
				current_user_can( 'read_post', $post->ID ),
				$post
			)
		) {
			return new WP_Error( 'unauthorized', 'User cannot view post', array( 'status_code' => 403, 'error' => 'private_blog' ) );
		}

		if ( strlen( $post->post_password ) && !current_user_can( 'edit_post', $post->ID ) ) {
			return new WP_Error( 'unauthorized', 'User cannot view password protected post', array( 'status_code' => 403, 'error' => 'password_protected' ) );
		}

		return true;
	}

	/**
	 * Get post by name
	 *
	 * Attempts to match name on post title and page path
	 *
	 * @param string $name
	 * @param string $context (display or edit)
	 *
	 * @return int|object Post ID on success, WP_Error object on failure
	 **/
	public function get_post_by_name( $name, $context ) {
		$name = sanitize_title( $name );

		if ( ! $name ) {
			return new WP_Error( 'invalid_post', 'Invalid post', 400 );
		}

		$posts = get_posts( array( 'name' => $name, 'numberposts' => 1 ) );

		if ( ! $posts || ! isset( $posts[0]->ID ) || ! $posts[0]->ID ) {
			$page = get_page_by_path( $name );

			if ( ! $page ) {
				return new WP_Error( 'unknown_post', 'Unknown post', 404 );
			}

			$post_id = $page->ID;
		} else {
			$post_id = (int) $posts[0]->ID;
		}

		return $this->get_post_by_id( $post_id, $context );
	}

	function user_can_manage() {
		current_user_can( 'manage_options' ); // remove this attribute in favor of 'capabilities'
	}

	function get_registered_date() {
		if ( function_exists( 'get_blog_details' ) ) {
			$blog_details = get_blog_details();
			if ( ! empty( $blog_details->registered ) ) {
				return $this->format_date( $blog_details->registered );
			}
		}

		return '0000-00-00T00:00:00+00:00';
	}

	function get_capabilities() {
		return array(
			'edit_pages'          => current_user_can( 'edit_pages' ),
			'edit_posts'          => current_user_can( 'edit_posts' ),
			'edit_others_posts'   => current_user_can( 'edit_others_posts' ),
			'edit_others_pages'   => current_user_can( 'edit_others_pages' ),
			'delete_posts'        => current_user_can( 'delete_posts' ),
			'delete_others_posts' => current_user_can( 'delete_others_posts' ),
			'edit_theme_options'  => current_user_can( 'edit_theme_options' ),
			'edit_users'          => current_user_can( 'edit_users' ),
			'list_users'          => current_user_can( 'list_users' ),
			'manage_categories'   => current_user_can( 'manage_categories' ),
			'manage_options'      => current_user_can( 'manage_options' ),
			'promote_users'       => current_user_can( 'promote_users' ),
			'publish_posts'       => current_user_can( 'publish_posts' ),
			'upload_files'        => current_user_can( 'upload_files' ),
			'view_stats'          => stats_is_blog_user( $this->blog_id )
		);
	}

	function is_visible() {
		if ( is_user_logged_in() ) {
			$current_user = wp_get_current_user();
			$visible      = (array) get_user_meta( $current_user->ID, 'blog_visibility', true );

			$is_visible = true;
			if ( isset( $visible[ $this->blog_id ] ) ) {
				$is_visible = (bool) $visible[ $this->blog_id ];
			}

			// null and true are visible
			return $is_visible;
		}

		return null;
	}

	function get_logo() {

		// Set an empty response array.
		$logo_setting = array(
			'id'    => (int) 0,
			'sizes' => array(),
			'url'   => '',
		);

		// Get current site logo values.
		$logo = get_option( 'site_logo' );

		// Update the response array if there's a site logo currenty active.
		if ( $logo && 0 != $logo['id'] ) {
			$logo_setting['id']  = $logo['id'];
			$logo_setting['url'] = $logo['url'];

			foreach ( $logo['sizes'] as $size => $properties ) {
				$logo_setting['sizes'][ $size ] = $properties;
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
				$timestamp = date_format( $date_time, 'U' );
			} else {
				$timestamp = 0;
			}

			// "0000-00-00 00:00:00" == -62169984000
			if ( - 62169984000 == $timestamp_gmt ) {
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

			$west   = $offset < 0;
			$offset = abs( $offset );
			$hours  = (int) floor( $offset / 3600 );
			$offset -= $hours * 3600;
			$minutes = (int) floor( $offset / 60 );
		}

		return (string) gmdate( 'Y-m-d\\TH:i:s', $timestamp ) . sprintf( '%s%02d:%02d', $west ? '-' : '+', $hours, $minutes );
	}
}