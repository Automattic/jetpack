<?php

/**
 * Private Site
 * Functionality to make sites private and only accessible to members with appropriate capabilities
 */

namespace Private_Site;

const JETPACK_AJAX_ACTIONS = [
	'jetpack_upload_file',
];

function init() {
	add_action( 'parse_request', '\Private_Site\privatize_blog', 100 );
	add_action( 'blog_privacy_selector', '\Private_Site\privatize_blog_priv_selector' );
	add_action( 'wp_head', '\Private_Site\private_no_pinning' );
	add_action( 'admin_init', '\Private_Site\prevent_ajax_and_admin_auth_requests', 9 );
	add_action( 'check_ajax_referer', '\Private_Site\ajax_nonce_check', 9, 2 );
	add_action( 'rest_pre_dispatch', '\Private_Site\disable_rest_api' );
	add_action( 'opml_head', '\Private_Site\hide_opml' );

	add_filter( 'bloginfo', '\Private_Site\privatize_blog_mask_blog_name', 3, 2 );
	add_filter( 'preprocess_comment', '\Private_Site\privatize_blog_comments', 0 );
	add_filter( 'robots_txt', '\Private_Site\private_robots_txt' );

	// Jetpack-specific hooks
	add_filter( 'jetpack_active_modules', '\Private_Site\filter_jetpack_active_modules', 0 );
	add_action( 'jetpack_sync_before_send_queue_full_sync', '\Private_Site\remove_privatize_blog_mask_blog_name_filter' );
	add_action( 'jetpack_sync_before_send_queue_sync', '\Private_Site\remove_privatize_blog_mask_blog_name_filter' );
}
add_action( 'init', '\Private_Site\init' );

/**
 * Returns the private site template for private blogs
 *
 * @param object $wp Current WordPress environment instance (passed by reference).
 */
function privatize_blog( $wp ) {
	global $pagenow;

	if ( '-1' != get_option( 'blog_public' ) ) {
		return;
	}

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

	if ( is_user_logged_in() && is_private_blog_user() ) {
		return;
	}

	require __DIR__ . '/private-site-template.php';

	exit;
}

/**
 * Does not check whether the blog is private. Accepts blog and user in various types.
 * Returns true for super admins.
 *
 * @param int $blog_id 0 means "current"
 * @param int $user_id 0 means "current"
 *
 * @return bool
 */
function is_private_blog_user( int $blog_id = 0, int $user_id = 0 ) {
	$user = $user_id ? \get_user_by( 'id', $user_id ) : \wp_get_current_user();

	// check if the user has read permissions
	$the_user = \wp_clone( $user );
	$the_user->for_site( $blog_id );
	return $the_user->has_cap( 'read'  );
}

/**
 * Replaces the the blog's "name" value with "Private Site"
 * Added to the `bloginfo` filter in our `init` function
 *
 * @param mixed $value The requested non-URL site information.
 * @param mixed $what  Type of information requested.
 * @return string The potentially modified bloginfo value
 */
function privatize_blog_mask_blog_name( $value, $what ) {
	if ( in_array( $what, array( 'name', 'title' ), true ) ) {
		$value = __( 'Private Site' );
	}

	return $value;
}

/**
 * Remove the privatize_blog_mask_blog_name filter
 */
function remove_privatize_blog_mask_blog_name_filter() {
	remove_filter( 'bloginfo', '\Private_Site\privatize_blog_mask_blog_name' );
}

/**
 * Filters new comments so that users can't comment on private blogs
 *
 * @param array $comment Documented in wp-includes/comment.php.
 */
function privatize_blog_comments( $comment ) {
	privatize_blog( null );
	return $comment;
}

/**
 * Extend the 'Site Visibility' privacy options to also include a private option
 **/
function privatize_blog_priv_selector() {
	?>
	<br/><input id="blog-private" type="radio" name="blog_public"
				value="-1" <?php checked( '-1', get_option( 'blog_public' ) ); ?> />
	<label for="blog-private"><?php _e( 'I would like my site to be private, visible only to myself and users I choose' ) ?></label>
	<?php
}

/**
 * Don't let search engines index private sites
 * or sites not deemed publicly available, like deleted, archived, spam.
 *
 * @param string $output Robots.txt output.
 */
function private_robots_txt( $output ) {
	$output  = "User-agent: *\n"; // Purposefully overriding current output; we only want these rules.
	$output .= "Disallow: /\n";
	return $output;
}

/**
 * Output the meta tag that tells Pinterest not to allow users to pin
 * content from this page.
 * https://support.pinterest.com/entries/21063792-what-if-i-don-t-want-images-from-my-site-to-be-pinned
 */
function private_no_pinning() {
	echo '<meta name="pinterest" content="nopin" />';
}

/**
 * Prevents ajax and post requests on private blogs for users who don't have permissions
 */
function prevent_ajax_and_admin_auth_requests() {
	global $pagenow;

	$is_ajax_request       = defined( 'DOING_AJAX' ) && DOING_AJAX;
	$is_admin_post_request = ( 'admin-post.php' === $pagenow );

	// Make sure we are in the right code path, if not bail now.
	if ( ! is_admin() || ( ! $is_ajax_request && ! $is_admin_post_request ) ) {
		return;
	}

	$user = wp_get_current_user();

	if ( ! $user->ID && class_exists( '\Jetpack' ) && in_array( $_POST['action'], JETPACK_AJAX_ACTIONS ) ) {
		$jp = \Jetpack::init();
		$user = $jp->authenticate_jetpack( null, null, null );
	}

	if ( ! is_private_blog_user( 0, (int) $user->ID ) ) {
		wp_die( esc_html__( 'This site is private.' ), 403 );
	}
}

/**
 * Prevents ajax requests on private blogs for users who don't have permissions
 *
 * @param string    $action The Ajax nonce action.
 * @param false|int $result The result of the nonce check.
 */
function ajax_nonce_check( $action, $result ) {
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

	if ( ! is_private_blog_user() ) {
		wp_die( esc_html__( 'This site is private.' ), 403 );
	}
}

/**
 * Disables WordPress Rest API for external requests
 */
function disable_rest_api() {
	if ( is_private_blog_user() ) {
		return;
	}

	if ( defined( 'REST_REQUEST' ) && REST_REQUEST ) {
		return new \WP_Error( 'private_site', __( 'This site is private.' ), [ 'status' => 403 ] );
	}
}

/**
 * Returns the private page template for OPML.
 */
function hide_opml() {
	if ( is_user_logged_in() && is_private_blog_user() ) {
		return;
	}

	@http_response_code( 403 );
?>
		<error><?php esc_html_e( 'This site is private.' ) ?></error>
	</head>
</opml>
<?php
	exit;
}

/**
 * Disables modules for private sites
 *
 * @param array $modules Available modules.
 *
 * @return array Array of modules after filtering.
 */
function filter_jetpack_active_modules( $modules ) {
	$disabled_modules = [
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
	];
	foreach ( $disabled_modules as $module_slug ) {
		$found = array_search( $module_slug, $modules, true );
		if ( false !== $found ) {
			unset( $modules[ $found ] );
		}
	}
	return $modules;
}
