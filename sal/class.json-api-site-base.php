<?php

require_once dirname( __FILE__ ) . '/class.json-api-date.php';
require_once dirname( __FILE__ ) . '/class.json-api-post-base.php';

/**
 * Base class for the Site Abstraction Layer (SAL)
 * Note that this is the site "as seen by user $user_id with token $token", which
 * is why we pass the token to the platform; these site instances are value objects
 * to be used in the context of a single request for a single user.
 * Also note that at present this class _assumes_ you've "switched to"
 * the site in question, and functions like `get_bloginfo( 'name' )` will
 * therefore return the correct value
 **/
abstract class SAL_Site {
	public $blog_id;
	public $platform;

	public function __construct( $blog_id, $platform ) {
		$this->blog_id = $blog_id;
		$this->platform = $platform;
	}

	public function get_id() {
		return $this->blog_id;
	}

	public function get_name() {
		return (string) htmlspecialchars_decode( get_bloginfo( 'name' ), ENT_QUOTES );
	}

	public function get_description() {
		return (string) htmlspecialchars_decode( get_bloginfo( 'description' ), ENT_QUOTES );
	}

	public function get_url() {
		return (string) home_url();
	}

	public function get_post_count() {
		return (int) wp_count_posts( 'post' )->publish;
	}

	public function get_quota() {
		return null;
	}

	abstract public function has_videopress();

	abstract public function upgraded_filetypes_enabled();

	abstract public function is_mapped_domain();

	abstract public function is_redirect();

	abstract public function is_headstart_fresh();

	abstract public function featured_images_enabled();

	abstract public function has_wordads();

	abstract public function get_frame_nonce();

	abstract public function get_jetpack_frame_nonce();

	abstract public function allowed_file_types();

	abstract public function get_post_formats();

	abstract public function is_private();

	abstract public function is_following();

	abstract public function get_subscribers_count();

	abstract public function get_locale();

	abstract public function is_jetpack();

	abstract public function get_jetpack_modules();

	abstract public function is_module_active( $module );

	abstract public function is_vip();

	abstract public function is_multisite();

	abstract public function is_single_user_site();

	abstract public function get_plan();

	abstract public function get_ak_vp_bundle_enabled();

	abstract public function get_podcasting_archive();

	abstract public function get_jetpack_seo_front_page_description();

	abstract public function get_jetpack_seo_title_formats();

	abstract public function get_verification_services_codes();

	abstract public function before_render();

	abstract public function after_render( &$response );

	// TODO - factor this out? Seems an odd thing to have on a site
	abstract public function after_render_options( &$options );

	// wrap a WP_Post object with SAL methods
	abstract public function wrap_post( $post, $context );

	abstract protected function is_a8c_publication( $post_id );

	public function is_automated_transfer() {
		/**
		 * Filter if a site is an automated-transfer site.
		 *
		 * @module json-api
		 *
		 * @since 6.4.0
		 *
		 * @param bool is_automated_transfer( $this->blog_id )
		 * @param int  $blog_id Blog identifier.
		 */
		return apply_filters(
			'jetpack_site_automated_transfer',
			false,
			$this->blog_id
		);
	}

	public function is_wpcom_atomic() {
		return false;
	}

	public function is_wpcom_store() {
		return false;
	}

	public function woocommerce_is_active() {
		return false;
	}

	public function get_post_by_id( $post_id, $context ) {
		// Remove the skyword tracking shortcode for posts returned via the API.
		remove_shortcode( 'skyword-tracking' );
		add_shortcode( 'skyword-tracking', '__return_empty_string' );

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

		if (
			! $this->is_post_type_allowed( $post->post_type )
			&& ! $this->is_a8c_publication( $post->ID )
		) {
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

	public function current_user_can_access_post_type( $post_type, $context ) {
		$post_type_object = $this->get_post_type_object( $post_type );
		if ( ! $post_type_object ) {
			return false;
		}

		switch( $context ) {
			case 'edit':
				return current_user_can( $post_type_object->cap->edit_posts );
			case 'display':
				return $post_type_object->public || current_user_can( $post_type_object->cap->read_private_posts );
			default:
				return false;
		}
	}

	protected function get_post_type_object( $post_type ) {
		return get_post_type_object( $post_type );
	}

	// copied from class.json-api-endpoints.php
	public function is_post_type_allowed( $post_type ) {
		// if the post type is empty, that's fine, WordPress will default to post
		if ( empty( $post_type ) ) {
			return true;
		}

		// allow special 'any' type
		if ( 'any' == $post_type ) {
			return true;
		}

		// check for allowed types
		if ( in_array( $post_type, $this->get_whitelisted_post_types() ) ) {
			return true;
		}

		if ( $post_type_object = get_post_type_object( $post_type ) ) {
			if ( ! empty( $post_type_object->show_in_rest ) ) {
				return $post_type_object->show_in_rest;
			}
			if ( ! empty( $post_type_object->publicly_queryable ) ) {
				return $post_type_object->publicly_queryable;
			}
		}

		return ! empty( $post_type_object->public );
	}

	// copied from class.json-api-endpoints.php
	/**
	 * Gets the whitelisted post types that JP should allow access to.
	 *
	 * @return array Whitelisted post types.
	 */
	public function get_whitelisted_post_types() {
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
	 * Get post ID by name
	 *
	 * Attempts to match name on post title and page path
	 *
	 * @param string $name
	 *
	 * @return int|object Post ID on success, WP_Error object on failure
	 */
	public function get_post_id_by_name( $name ) {
		$name = sanitize_title( $name );

		if ( ! $name ) {
			return new WP_Error( 'invalid_post', 'Invalid post', 400 );
		}

		$posts = get_posts( array(
			'name' => $name,
			'numberposts' => 1,
			'post_type' => $this->get_whitelisted_post_types(),
		) );

		if ( ! $posts || ! isset( $posts[0]->ID ) || ! $posts[0]->ID ) {
			$page = get_page_by_path( $name );

			if ( ! $page ) {
				return new WP_Error( 'unknown_post', 'Unknown post', 404 );
			}

			return $page->ID;
		}

		return (int) $posts[0]->ID;
	}

	/**
	 * Get post by name
	 *
	 * Attempts to match name on post title and page path
	 *
	 * @param string $name
	 * @param string $context (display or edit)
	 *
	 * @return object Post object on success, WP_Error object on failure
	 **/
	public function get_post_by_name( $name, $context ) {
		$post_id = $this->get_post_id_by_name( $name );
		if ( is_wp_error( $post_id ) ) {
			return $post_id;
		}

		return $this->get_post_by_id( $post_id, $context );
	}

	function user_can_manage() {
		current_user_can( 'manage_options' );
	}

	function get_xmlrpc_url() {
		$xmlrpc_scheme = apply_filters( 'wpcom_json_api_xmlrpc_scheme', parse_url( get_option( 'home' ), PHP_URL_SCHEME ) );
		return site_url( 'xmlrpc.php', $xmlrpc_scheme );
	}

	function get_registered_date() {
		if ( function_exists( 'get_blog_details' ) ) {
			$blog_details = get_blog_details();
			if ( ! empty( $blog_details->registered ) ) {
				return WPCOM_JSON_API_Date::format_date( $blog_details->registered );
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
			'moderate_comments'   => current_user_can( 'moderate_comments' ),
			'activate_wordads'    => wpcom_get_blog_owner() === (int) get_current_user_id(),
			'promote_users'       => current_user_can( 'promote_users' ),
			'publish_posts'       => current_user_can( 'publish_posts' ),
			'upload_files'        => current_user_can( 'upload_files' ),
			'delete_users'        => current_user_can( 'delete_users' ),
			'remove_users'        => current_user_can( 'remove_users' ),
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

	function get_timezone() {
		return (string) get_option( 'timezone_string' );
	}

	function get_gmt_offset() {
		return (float) get_option( 'gmt_offset' );
	}

	function get_login_url() {
		return wp_login_url();
	}

	function get_admin_url() {
		return get_admin_url();
	}

	function get_unmapped_url() {
		return get_site_url( get_current_blog_id() );
	}

	function get_theme_slug() {
		return get_option( 'stylesheet' );
	}

	function get_header_image() {
		return get_theme_mod( 'header_image_data' );
	}

	function get_background_color() {
		return get_theme_mod( 'background_color' );
	}

	function get_image_default_link_type() {
		return get_option( 'image_default_link_type' );
	}

	function get_image_thumbnail_width() {
		return (int) get_option( 'thumbnail_size_w' );
	}

	function get_image_thumbnail_height() {
		return (int) get_option( 'thumbnail_size_h' );
	}

	function get_image_thumbnail_crop() {
		return get_option( 'thumbnail_crop' );
	}

	function get_image_medium_width() {
		return (int) get_option( 'medium_size_w' );
	}

	function get_image_medium_height() {
		return (int) get_option( 'medium_size_h' );
	}

	function get_image_large_width() {
		return (int) get_option( 'large_size_w' );
	}

	function get_image_large_height() {
		return (int) get_option( 'large_size_h' );
	}

	function get_permalink_structure() {
		return get_option( 'permalink_structure' );
	}

	function get_default_post_format() {
		return get_option( 'default_post_format' );
	}

	function get_default_category() {
		return (int) get_option( 'default_category' );
	}

	function get_show_on_front() {
		return get_option( 'show_on_front' );
	}

	function is_custom_front_page() {
		return ( 'page' === $this->get_show_on_front() );
	}

	function get_default_likes_enabled() {
		return (bool) apply_filters( 'wpl_is_enabled_sitewide', ! get_option( 'disabled_likes' ) );
	}

	function get_default_sharing_status() {
		$default_sharing_status = false;
		if ( class_exists( 'Sharing_Service' ) ) {
			$ss                     = new Sharing_Service();
			$blog_services          = $ss->get_blog_services();
			$default_sharing_status = ! empty( $blog_services['visible'] );
		}
		return (bool) $default_sharing_status;
	}

	function get_default_comment_status() {
		return 'closed' !== get_option( 'default_comment_status' );
	}

	function default_ping_status() {
		return 'closed' !== get_option( 'default_ping_status' );
	}

	function is_publicize_permanently_disabled() {
		$publicize_permanently_disabled = false;
		if ( function_exists( 'is_publicize_permanently_disabled' ) ) {
			$publicize_permanently_disabled = is_publicize_permanently_disabled( $this->blog_id );
		}
		return $publicize_permanently_disabled;
	}

	function get_page_on_front() {
		return (int) get_option( 'page_on_front' );
	}

	function get_page_for_posts() {
		return (int) get_option( 'page_for_posts' );
	}

	function is_headstart() {
		return get_option( 'headstart' );
	}

	function get_wordpress_version() {
		global $wp_version;
		return $wp_version;
	}

	function is_domain_only() {
		$options = get_option( 'options' );
		return ! empty ( $options['is_domain_only'] ) ? (bool) $options['is_domain_only'] : false;
	}

	function get_blog_public() {
		return (int) get_option( 'blog_public' );
	}

	function has_pending_automated_transfer() {
		/**
		 * Filter if a site is in pending automated transfer state.
		 *
		 * @module json-api
		 *
		 * @since 6.4.0
		 *
		 * @param bool has_site_pending_automated_transfer( $this->blog_id )
		 * @param int  $blog_id Blog identifier.
		 */
		return apply_filters(
			'jetpack_site_pending_automated_transfer',
			false,
			$this->blog_id
		);
	}

	function signup_is_store() {
		return $this->get_design_type() === 'store';
	}

	function get_roles() {
		return new WP_Roles();
	}

	function get_design_type() {
		$options = get_option( 'options' );
		return empty( $options[ 'designType'] ) ? null : $options[ 'designType' ];
	}

	function get_site_goals() {
		$options = get_option( 'options' );
		return empty( $options[ 'siteGoals'] ) ? null : $options[ 'siteGoals' ];
	}

	function get_launch_status() {
		return false;
	}

	function get_site_segment() {
		return false;
	}
}
