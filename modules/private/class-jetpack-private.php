<?php
/**
 * The Private Site module class file.
 *
 * @package Jetpack
 */

/**
 * Class Jetpack_Private
 */
class Jetpack_Private {
	/**
	 * Init function that adds all hooks needed for the module.
	 */
	public static function init() {
		add_action( 'parse_request', array( __CLASS__, 'privatize_blog' ), 100 );
		add_action( 'login_init', array( __CLASS__, 'privatize_blog_maybe_mask_blog_name' ) );
		add_filter( 'preprocess_comment', array( __CLASS__, 'privatize_blog_comments' ), 0 );
		add_action( 'blog_privacy_selector', array( __CLASS__, 'privatize_blog_priv_selector' ) );
		add_filter( 'robots_txt', array( __CLASS__, 'private_robots_txt' ) );
		add_action( 'wp_head', array( __CLASS__, 'private_no_pinning' ) );
		add_action( 'admin_init', array( __CLASS__, 'private_blog_prevent_requests' ), 9 );
		add_action( 'check_ajax_referer', array( __CLASS__, 'private_blog_ajax_nonce_check' ), 9, 2 );
		add_action( 'rest_pre_dispatch', array( __CLASS__, 'disable_rest_api' ) );
		add_filter( 'jetpack_active_modules', array( __CLASS__, 'private_get_modules' ), 0 );
		add_action( 'update_option_blog_public', array( __CLASS__, 'private_update_option_blog_public' ) );
		add_action( 'update_right_now_text', array( __CLASS__, 'add_private_dashboard_glance_items' ) );
		add_action( 'jetpack_sync_before_send_queue_full_sync', array( __CLASS__, 'remove_privatize_blog_mask_blog_name_filter' ) );
		add_action( 'jetpack_sync_before_send_queue_sync', array( __CLASS__, 'remove_privatize_blog_mask_blog_name_filter' ) );
		add_action( 'opml_head', array( __CLASS__, 'hide_opml' ) );
		add_action( 'admin_enqueue_scripts', array( __CLASS__, 'wp_admin_glance_dashboard_style' ) );
	}

	/**
	 * Returns the private site template for private blogs
	 *
	 * @param object $wp Current WordPress environment instance (passed by reference).
	 */
	public static function privatize_blog( $wp ) {
		global $pagenow;

		if ( 'wp-login.php' === $pagenow ) {
			return;
		}

		if ( defined( 'WP_CLI' ) && WP_CLI ) {
			return;
		}

		// Serve robots.txt for private blogs.
		if ( is_object( $wp ) && ! empty( $wp->query_vars['robots'] ) ) {
			return;
		}

		if ( is_user_logged_in() && self::is_private_blog_user( get_current_blog_id() ) ) {
			return;
		}

		include JETPACK__PLUGIN_DIR . '/modules/private/private.php';

		exit;
	}

	/**
	 * Does not check whether the blog is private. Accepts blog and user in various types.
	 * Returns true for super admins.
	 *
	 * @param int $blog Current WordPress blod id..
	 */
	private static function is_private_blog_user( $blog ) {
		if ( is_numeric( $blog ) ) {
			$blog_id = intval( $blog );
		} elseif ( is_object( $blog ) ) {
			$blog_id = $blog->blog_id;
		} elseif ( is_string( $blog ) ) {
			$fields  = array(
				'domain' => $blog,
				'path'   => '/',
			);
			$blog    = get_blog_details( $fields );
			$blog_id = $blog->blog_id;
		} else {
			$blog_id = get_current_blog_id();
		}

		/**
		 * Filter the capabilites a user needs to have to see the site
		 *
		 * @module private
		 *
		 * @since 7.4.0
		 *
		 * @param string $cap The lowest capability a user needs to have
		 */
		$capability = apply_filters( 'jetpack_private_capability', 'read' );
		return current_user_can_for_blog( $blog_id, $capability );
	}

	/**
	 * Hides the blog's name on the login form for private blogs.
	 */
	public static function privatize_blog_maybe_mask_blog_name() {
		add_filter( 'bloginfo', array( __CLASS__, 'privatize_blog_mask_blog_name' ), 3, 2 );
	}

	/**
	 * Replaces the the blog's "name" value with "Private Site"
	 *
	 * @see privatize_blog_maybe_mask_blog_name()
	 * @param mixed $value The requested non-URL site information.
	 * @param mixed $what  Type of information requested.
	 */
	public static function privatize_blog_mask_blog_name( $value, $what ) {
		if ( in_array( $what, array( 'name', 'title' ), true ) ) {
			$value = __( 'Private Site', 'jetpack' );
		}

		return $value;
	}

	/**
	 * Remove the privatize_blog_mask_blog_name filter
	 */
	public static function remove_privatize_blog_mask_blog_name_filter() {
		remove_filter( 'bloginfo', array( __CLASS__, 'privatize_blog_mask_blog_name' ) );
	}

	/**
	 * Filters new comments so that users can't comment on private blogs
	 *
	 * @param array $comment Documented in wp-includes/comment.php.
	 */
	public static function privatize_blog_comments( $comment ) {
		self::privatize_blog( null );
		return $comment;
	}

	/**
	 * Extend the 'Site Visibility' privacy options to also include a private option
	 **/
	public static function privatize_blog_priv_selector() {
		?>
		<style>
			.jetpack-private__setting-disabled {
				font-weight: bold;	
				padding: 10px;
			}
			.option-site-visibility fieldset {
				display: none;
			}
		</style>
		</fieldset>
		<div class="jetpack-private__setting-disabled highlight">
			<?php
			wp_kses(
				printf(
					/* translators: URL for Jetpack dashboard. */
					__( 'This setting is ignored because you <a href="%s">made your site private</a>.', 'jetpack' ), // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
					esc_url( admin_url( 'admin.php?page=jetpack#/security?term=private' ) )
				),
				array( 'a' => array( 'href' => true ) )
			);
			?>
		</div>
		<fieldset>
		<?php
	}

	/**
	 * Don't let search engines index private sites
	 * or sites not deemed publicly available, like deleted, archived, spam.
	 *
	 * @param string $output Robots.txt output.
	 */
	public static function private_robots_txt( $output ) {
		$output  = "User-agent: *\n"; // Purposefully overriding current output; we only want these rules.
		$output .= "Disallow: /\n";
		return $output;
	}

	/**
	 * Output the meta tag that tells Pinterest not to allow users to pin
	 * content from this page.
	 * https://support.pinterest.com/entries/21063792-what-if-i-don-t-want-images-from-my-site-to-be-pinned
	 */
	public static function private_no_pinning() {
		echo '<meta name="pinterest" content="nopin" />';
	}

	/**
	 * Prevents ajax and post requests on private blogs for users who don't have permissions
	 */
	public static function private_blog_prevent_requests() {
		global $pagenow;

		$is_ajax_request       = defined( 'DOING_AJAX' ) && DOING_AJAX;
		$is_admin_post_request = ( 'admin-post.php' === $pagenow );

		// Make sure we are in the right code path, if not bail now.
		if ( ! is_admin() || ( ! $is_ajax_request && ! $is_admin_post_request ) ) {
			return;
		}

		if ( ! self::is_private_blog_user( get_current_blog_id() ) ) {
			wp_die( esc_html__( 'This site is private.', 'jetpack' ), 403 );
		}
	}

	/**
	 * Prevents ajax requests on private blogs for users who don't have permissions
	 *
	 * @param string    $action The Ajax nonce action.
	 * @param false|int $result The result of the nonce check.
	 */
	public static function private_blog_ajax_nonce_check( $action, $result ) {
		if ( 1 !== $result && 2 !== $result ) {
			return;
		}

		// These two ajax actions relate to wp_ajax_wp_link_ajax() and wp_ajax_find_posts()
		// They are needed for users with admin capabilities in wp-admin.
		// Read more at p3btAN-o8-p2.
		if ( 'find-posts' !== $action && 'internal-linking' !== $action ) {
			return;
		}

		// Make sure we are in the right code path, if not bail now.
		if ( ! is_admin() || ( ! defined( 'DOING_AJAX' ) || ! DOING_AJAX ) ) {
			return;
		}

		if ( ! self::is_private_blog_user( get_current_blog_id() ) ) {
			wp_die( esc_html__( 'This site is private.', 'jetpack' ), 403 );
		}
	}

	/**
	 * Disables WordPress Rest API for external requests
	 */
	public static function disable_rest_api() {
		if ( is_user_logged_in() && self::is_private_blog_user( get_current_blog_id() ) ) {
			return;
		}

		if ( defined( 'REST_REQUEST' ) && REST_REQUEST ) {
			return new WP_Error( 'private_site', __( 'This site is private.', 'jetpack' ), array( 'status' => 403 ) );
		}
	}

	/**
	 * Disables modules for private sites
	 *
	 * @param array $modules Available modules.
	 *
	 * @return array Array of modules after filtering.
	 */
	public static function private_get_modules( $modules ) {
		$disabled_modules = array(
			'publicize',
			'sharedaddy',
			'subscriptions',
			'json-api',
			'enhanced-distribution',
			'google-analytics',
			'photon',
			'sitemaps',
			'verification-tools',
			'wordads',
		);
		foreach ( $disabled_modules as $module_slug ) {
			$found = array_search( $module_slug, $modules, true );
			if ( false !== $found ) {
				unset( $modules[ $found ] );
			}
		}
		return $modules;
	}

	/**
	 * Show an error when the blog_public option is updated
	 */
	public static function private_update_option_blog_public() {
		if ( function_exists( 'add_settings_error' ) ) {
			/* translators: URL for Jetpack dashboard. */
			add_settings_error(
				'general',
				'setting_not_updated',
				wp_kses(
					sprintf(
						/* translators: URL for Jetpack dashboard. */
						__( 'This setting is ignored because you <a href="%s">made your site private</a>.', 'jetpack' ), // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
						esc_url( admin_url( 'admin.php?page=jetpack#/security?term=private' ) )
					),
					array( 'a' => array( 'href' => true ) )
				)
			);
		}
	}

	/**
	 * Basic styling for the wp-admin 'At a Glance' dashboard widget.
	 *
	 * @param string $hook Page Hook Suffix for the current page.
	 */
	public static function wp_admin_glance_dashboard_style( $hook ) {
		if ( 'index.php' !== $hook ) {
			return;
		}
		$custom_css = '
			.jp-at-a-glance__site-private {
				color: #DC3232;
			}
		';
		wp_add_inline_style( 'dashboard', $custom_css );
	}

	/**
	 * Adds a message to the 'At a Glance' dashboard widget.
	 *
	 * @param string $content Content of At A Glance wp-admin dashboard widget.
	 * @return string The modified content of the 'At a Glance' dashboard widget.
	 */
	public static function add_private_dashboard_glance_items( $content ) {
		add_filter( 'privacy_on_link_text', '__return_empty_string' );

		return $content .
			'<br><br>' .
			wp_kses(
				sprintf(
					/* translators: URL for Jetpack dashboard. */
					__( '<span class="%1$1s">This site is set to private.</span> <a href="%2$2s">Make public</a>.', 'jetpack' ),
					esc_attr( 'jp-at-a-glance__site-private' ),
					esc_url( admin_url( 'admin.php?page=jetpack#/security?term=private' ) )
				),
				array(
					'a'    => array( 'href' => true ),
					'span' => array( 'class' => true ),
				)
			);
	}

	/**
	 * Returns the private page template for OPML.
	 */
	public static function hide_opml() {
		if ( is_user_logged_in() && self::is_private_blog_user( get_current_blog_id() ) ) {
			return;
		}

		wp_die( esc_html__( 'This site is private.', 'jetpack' ), 403 );
	}
}
