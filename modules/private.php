<?php
/**
 * Module Name: Private site
 * Module Description: Make your site only visible to you and users you approve.
 * Sort Order: 9
 * First Introduced: ?
 * Requires Connection: No
 * Auto Activate: No
 * Module Tags: Private
 * Feature: Traffic
 * Additional Search Queries: private, sandbox, launch, unlaunched
 */

function privatize_blog( $wp ) {
	global $pagenow, $current_user, $wpdb;

	if ( '-1' != get_option('blog_public') )
		return;

	if ( 'wp-login.php' == $pagenow )
		return;

	if ( defined( 'WP_CLI' ) && WP_CLI )
		return;

	// Serve robots.txt for private blogs.
	if ( is_object( $wp ) && !empty( $wp->query_vars['robots'] ) )
		return;

	if ( $current_user && ( is_super_admin() || is_private_blog_user( $wpdb->blogid, $current_user ) ) ) {
		return;
	}

	remove_action( 'wp_head', array( 'Jetpack_Custom_CSS', 'link_tag' ), 101 );

	if ( file_exists(TEMPLATEPATH . '/private.php' ) )
		include(TEMPLATEPATH . '/private.php' );
	else if ( file_exists(ABSPATH . 'wp-content/plugins/jetpack/modules/private/private.php' ) )
		include(ABSPATH . 'wp-content/plugins/jetpack/modules/private/private.php' );
	else
		_e( 'This site is private.' );

	exit;
}

/**
 * Does not check whether the blog is private. Accepts blog and user in various types.
 * Returns true for super admins; if you don't want that, use is_really_private_blog_user.
 */
function is_private_blog_user( $blog, $user ) {
	global $wpdb;

	if ( !is_object($user) )
		$user = new WP_User($user);

	if ( !$user->ID )
		return false;

	$user_id = $user->data->ID;

	if ( is_numeric($blog) )
		$blog_id = intval($blog);
	elseif ( is_object($blog) )
		$blog_id = $blog->blog_id;
	elseif ( is_string($blog) )
	{
		$blog = get_blog_info($blog, '/', 1);
		$blog_id = $blog->blog_id;
	}
	else
		$blog_id = $wpdb->blogid;

	// check if the user has read permissions
	$the_user = wp_clone( $user );
	$the_user->for_blog( $blog_id );
	return $the_user->has_cap( 'read'  );
}

/**
 * Tests whether the current blog is private and not spam/suspended/deleted.
 */
function is_private_blog( $_blog_id = null ) {
	return true;
	global $blog_id;

	if ( empty( $_blog_id ) )
		$_blog_id = $blog_id;

	$blog_details = get_blog_details( $_blog_id );

	return (	( '-1' == $blog_details->public ) &&
				( !isset( $blog_details->deleted )	|| !$blog_details->deleted ) &&
				( !isset( $blog_details->archived )	|| !$blog_details->archived ) &&
				( !isset( $blog_details->spam )		|| !$blog_details->spam )
			);
}

function privatize_blog_comments( $comment ) {
	privatize_blog(null);
	return $comment;
}

function privatize_blog_priv_selector() {
?>
<br /><input id="blog-private" type="radio" name="blog_public" value="-1" <?php checked('-1', get_option('blog_public')); ?> />
<label for="blog-private"><?php _e('I would like my site to be private, visible only to myself and users I choose') ?></label>
<?php
}

function privatize_blog_option_whitelist( $options_whitelist ) {
	$options_whitelist['reading'][] = 'links_public';
	return $options_whitelist;
}

/**
 * Hides the blog's name on the login form for private blogs.
 */
function privatize_blog_maybe_mask_blog_name() {
	if ( ! is_private_blog() )
		return;

	add_filter( 'bloginfo', 'privatize_blog_mask_blog_name', 3, 2 );
}

/**
 * Replaces the the blog's "name" value with "Protected Blog"
 *
 * @see privatize_blog_maybe_mask_blog_name()
 */
function privatize_blog_mask_blog_name( $value, $what ) {
	if ( in_array( $what, array( 'name', 'title' ) ) ) {
		$value = __( 'Protected Blog' );
	}

	return $value;
}

function make_blog_private() {
	update_option( 'blog_public', -1 );
}

function make_blog_public() {
	update_option( 'blog_public', 1 );
}

add_action( 'parse_request',                     'privatize_blog', 100 );
add_action( 'login_init',                        'privatize_blog_maybe_mask_blog_name' );
add_filter( 'preprocess_comment',                'privatize_blog_comments' );
add_action( 'blog_privacy_selector',             'privatize_blog_priv_selector' );
add_filter( 'whitelist_options',                 'privatize_blog_option_whitelist' );
add_action( 'jetpack_activate_module_private',   'make_blog_private' );
add_action( 'jetpack_deactivate_module_private', 'make_blog_public' );

/**
 * Don't let search engines index private sites
 * or sites not deemed publicly available, like deleted, archived, spam.
 */
function private_robots_txt( $output, $public ) {
	if ( ! is_publicly_available() ) {
		$output = "User-agent: *\n"; // Purposefully overriding current output; we only want these rules.
		$output .= "Disallow: /\n";
	}

	return $output;
}
add_filter( 'robots_txt', 'private_robots_txt', 10, 2 );

function privatize_privacy_on_link_title( $text ) {
	if ( '-1' == get_option('blog_public') )
		return __('Your site is visible only to registered members');

	return $text;
}
add_filter('privacy_on_link_title', 'privatize_privacy_on_link_title');

function privatize_privacy_on_link_text( $text ) {
	if ( '-1' == get_option('blog_public') )
		return __('Private');

	return $text;
}
add_filter('privacy_on_link_text', 'privatize_privacy_on_link_text');

/**
 * Output the meta tag that tells Pinterest not to allow users to pin
 * content from this page.
 * https://support.pinterest.com/entries/21063792-what-if-i-don-t-want-images-from-my-site-to-be-pinned
 */
function private_no_pinning() {
	echo '<meta name="pinterest" content="nopin" />';
}
add_action( 'wp_head', 'private_no_pinning' );

function private_blog_ajax_nonce_check( $action, $result ) {
	global $current_user, $wpdb;

	if ( is_super_admin() || !is_private_blog() ) {
		return;
	}

	if ( $result !== 1 && $result !== 2 ) {
		return;
	}

	if ( $action !== 'find-posts' && $action !== 'internal-linking' ) {
		return;
	}

	// Make sure we are in the right code path, if not bail now
	if ( !is_admin() || ( !defined( 'DOING_AJAX' ) || !DOING_AJAX ) ) {
		return;
	}

	if ( !is_private_blog_user($wpdb->blogid, $current_user) ) {
		wp_die( -1 );
	}
}
add_action( 'check_ajax_referer', 'private_blog_ajax_nonce_check', 9999, 2 );

