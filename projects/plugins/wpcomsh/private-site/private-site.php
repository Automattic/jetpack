<?php

/**
 * Private Site
 * Functionality to make sites private and only accessible to members with appropriate capabilities
 */

namespace Private_Site;

use WP_Error;
use WP_REST_Request;
use function checked;
use function doing_filter;
use function esc_html_e;
use function get_current_blog_id;
use function get_option;
use function remove_filter;
use function status_header;
use function update_option;
use function wp_clone;
use function wp_get_current_user;
use function wp_send_json_error;

function is_module_active() {
	// This feature is currently in testing. It's only enabled for sites that have explicitly set the option
	return 1 == get_option( 'wpcomsh_private_site_module_active' );
}

function admin_init() {
	if ( ! is_module_active() ) {
		return;
	}

	// Add the radio option to the wp-admin Site Privacy selector
	add_action( 'blog_privacy_selector', '\Private_Site\privatize_blog_priv_selector' );

	// Many AJAX actions do not execute the `parse_request` action. Catch them here.
	if ( should_prevent_site_access() ) {
		send_access_denied_error_response();
	}
}
add_action( 'admin_init', '\Private_Site\admin_init' );

function init() {
	if ( ! is_module_active() ) {
		return;
	}

	add_filter( 'pre_update_option_blog_public', '\Private_Site\pre_update_option_blog_public' );

	if ( ! site_is_private() ) {
		return;
	}

	// Scrutinize most requests
	add_action( 'parse_request', '\Private_Site\parse_request', 100 );

	// Scrutinize REST API requests
	add_filter( 'rest_dispatch_request', '\Private_Site\rest_dispatch_request', 10, 4 );

	// Prevent Pinterest pinning
	add_action( 'wp_head', '\Private_Site\private_no_pinning' );

	// Prevent leaking site information via OPML
	add_action( 'opml_head', '\Private_Site\hide_opml' );

	// Mask the blog name on the login screen etc.
	add_filter( 'bloginfo', '\Private_Site\mask_site_name', 3, 2 );

	// Block incoming comments for non-users
	add_filter( 'preprocess_comment', '\Private_Site\preprocess_comment', 0 );

	// Robots requests are allowed via `should_prevent_site_access`
	add_filter( 'robots_txt', '\Private_Site\private_robots_txt' );

	// @TODO pre_trackback_post maybe..?

	// @TODO add "lock" toolbar item when private

	/** Jetpack-specific hooks **/

	// Prevent Jetpack certain modules from running while the site is private
	add_filter( 'jetpack_active_modules', '\Private_Site\filter_jetpack_active_modules', 0 );

	// Only allow Jetpack XMLRPC methods -- Jetpack handles verifying the token, request signature, etc.
	add_filter( 'xmlrpc_methods', '\Private_Site\xmlrpc_methods_limit_to_jetpack' );

	// Lift the blog name mask prior to Jetpack sync activity
	add_action( 'jetpack_sync_before_send_queue_full_sync', '\Private_Site\remove_mask_site_name_filter' );
	add_action( 'jetpack_sync_before_send_queue_sync', '\Private_Site\remove_mask_site_name_filter' );
}
add_action( 'init', '\Private_Site\init' );

/**
 * The site is determined to be "private" when both:
 * - The `blog_public` option is `-1`
 * - The `wpcom_blog_public_updated` option is truthy
 *
 * The `wpcom_blog_public_updated` check is intended to only treat sites as private which have
 * altered this setting since the Private Site module was launched.
 *
 * This is in contrast to WordPress.com Simple sites which only rely on the `blog_public` option.
 * @return bool
 */
function site_is_private() {
	return '-1' == get_option( 'blog_public' ) && get_option( 'wpcom_blog_public_updated' );
}

/**
 * Hooked into filter: `pre_update_option_blog_public`
 * Sets a secondary option (`wpcom_blog_public_updated`) to `1` when the `blog_public` option is updated
 * This will be used to determine that the option has been set after the launch of the Private Site module.
 *
 * @param $new_value
 *
 * @return mixed $new_value is always returned
 * @see `site_is_private`
 */
function pre_update_option_blog_public( $new_value ) {
	update_option( 'wpcom_blog_public_updated', 1 );
	return $new_value;
}

/**
 * Determine if site access should be blocked for various types of requests.
 * This function is cached for subsequent calls so we can use it gratuitously.
 *
 * @return bool
 */
function should_prevent_site_access() {
	global $pagenow;

	$doing_bloginfo_filter = doing_filter( 'bloginfo' );

	$use_cache = ! $doing_bloginfo_filter;

	static $cached;

	if ( $use_cache && isset( $cached ) ) {
		return $cached;
	}

	if ( ! site_is_private() ) {
		if ( $use_cache ) {
			$cached = false;
		}
		return false;
	}

	if ( 'wp-login.php' === $pagenow && ! $doing_bloginfo_filter ) {
		if ( $use_cache ) {
			$cached = false;
		}
		return false;
	}

	if ( defined( 'WP_CLI' ) && WP_CLI ) {
		if ( $use_cache ) {
			$cached = false;
		}
		return false;
	}

	$to_return = ! is_private_blog_user();
	if ( $use_cache ) {
		$cached = $to_return;
	}
	return $to_return;
}

/**
 * Tell the client that the site is private and they do not have access.
 * This function always exits PHP (`wp_send_json_error` calls `wp_die` / `die`)
 */
function send_access_denied_error_response() {
	global $wp;

	if ( ( defined( 'DOING_AJAX' ) && DOING_AJAX ) ||
		 'admin-ajax.php' === ( $wp->query_vars['pagename'] ?? '' )
	) {
		wp_send_json_error( [ 'code' => 'private_site', 'message' => __( 'This site is private.' ) ] );
	}

	require __DIR__ . '/private-site-template.php';
	exit;
}

function parse_request() {
	if ( maybe_print_robots_txt() ) {
		// If robots.txt was requested, go ahead & serve our hard-coded version & bail
		exit;
	}

	if ( should_prevent_site_access() ) {
		send_access_denied_error_response();
	}
}

/**
 * Requests for the "Robots" file are not blocked by the site being marked as private.
 * If the client has requested the `/robots.txt` file, execute the `do_robots` action and return true.
 * This function compares the request to the site_url() so it also supports subdomain installs.
 *
 * @see `private_robots_txt`
 * @return bool
 */
function maybe_print_robots_txt() {
	$origin = ( is_ssl() ? 'https://' : 'http://' ) . $_SERVER['HTTP_HOST'];

	if ( ! empty( $_SERVER['SERVER_PORT'] ) && ! in_array( $_SERVER['SERVER_PORT'], [ 80, 443 ] ) ) {
		$origin .= ':' . $_SERVER['SERVER_PORT'];
	}

	if ( $origin . strtok( $_SERVER['REQUEST_URI'], '?' ) === site_url( '/robots.txt' ) ) {
		do_action( 'do_robots' );
		return true;
	}

	return false;
}

/**
 * Scrutinize REST API Requests _after_ the permissions checks have been applied
 * This enforces nonce & token checking on content endpoints to prevent CSRF-style attacks
 * If using cookie auth, clients must send a valid nonce in order to access content endpoints
 *
 * @see rest_dispatch_request https://core.trac.wordpress.org/browser/tags/5.2.3/src/wp-includes/rest-api/class-wp-rest-server.php#L940
 *
 * @param mixed           $dispatch_result Dispatch result, will be used if not empty.
 * @param WP_REST_Request $request         Request used to generate the response.
 * @param string          $route           Route matched for the request.
 * @param array           $handler         Route handler used for the request.
 *
 * @return WP_Error|null  WP_Error on disallowed, null on ok
 */
function rest_dispatch_request( $dispatch_result, $request, $route, $handler ) {
	// Don't clobber other plugins
	if ( $dispatch_result !== null ) {
		return $dispatch_result;
	}

	// Allow certain endpoints for plugin-based authentication methods
	// These are "anchored" on the left side with `^/`, but not the right, so include the trailing `/`
	$allowed_routes = apply_filters( 'wpcomsh_allowed_routes', [
		'2fa/', // https://wordpress.org/plugins/application-passwords/
		'jwt-auth/', // https://wordpress.org/plugins/jwt-authentication-for-wp-rest-api/
		'oauth1/', // https://wordpress.org/plugins/rest-api-oauth1/
	] );

	if ( preg_match( '#^/(' . implode( '|', $allowed_routes ) . ')#', $route ) ) {
		return null;
	}

	if ( should_prevent_site_access() ) {
		return new WP_Error( 'private_site', __( 'This site is private.' ), [ 'status' => 403 ] );
	}

	return null;
}

function xmlrpc_methods_limit_to_jetpack( $methods ) {
	if ( should_prevent_site_access() ) {
		return array_filter( $methods, function ( $key ) {
			return preg_match( '/^jetpack\..+/', $key );
		}, ARRAY_FILTER_USE_KEY );
	}
	return $methods;
}

/**
 * Does not check whether the blog is private. Works on current blog & user.
 * Returns true for super admins.
 *
 * @return bool
 */
function is_private_blog_user() {
	$user = wp_get_current_user();
	if ( ! $user->ID ) {
		return false;
	}

	$blog_id = get_current_blog_id();

	// check if the user has read permissions
	$the_user = wp_clone( $user );
	$the_user->for_site( $blog_id );
	return $the_user->has_cap( 'read'  );
}

/**
 * Replaces the the site's "name" & "title" values with "Private Site"
 * Added to the `bloginfo` filter in our `init` function
 *
 * @param mixed $value The requested non-URL site information.
 * @param mixed $what  Type of information requested.
 * @return string The potentially modified bloginfo value
 */
function mask_site_name( $value, $what ) {
	if ( should_prevent_site_access() && in_array( $what, [ 'name', 'title' ], true ) ) {
		return __( 'Private Site' );
	}

	return $value;
}

/**
 * Remove the mask_site_name filter
 */
function remove_mask_site_name_filter() {
	remove_filter( 'bloginfo', '\Private_Site\mask_site_name' );
}

/**
 * Filters new comments so that users can't comment on private blogs
 *
 * @param array $comment Documented in wp-includes/comment.php.
 */
function preprocess_comment( $comment ) {
	if ( should_prevent_site_access() ) {
		require __DIR__ . '/private-site-template.php';
		exit;
	}
	return $comment;
}

/**
 * Extend the 'Site Visibility' privacy options to also include a private option
 **/
function privatize_blog_priv_selector() {
	?>
<br/><input id="blog-private" type="radio" name="blog_public"
			value="-1" <?php checked( site_is_private()); ?> />
<label for="blog-private"><?php _e( 'I would like my site to be private, visible only to myself and users I choose' ) ?></label>
	<?php // Select the "public" radio button if none is selected. ?>
<script>
  (function(){
    var btns = document.querySelectorAll( '.option-site-visibility input' );
    if ( ! btns.length ) {
      return;
	}
    if ( ! Array.prototype.filter.call( btns, function( node ) {
	  return node.checked;
    } ).length ) {
      document.querySelector( '#blog-public' ).checked = true;
	}
  })();
</script>
	<?php
}

/**
 * Don't let search engines index private sites.
 * If the site is not private, do nothing.
 *
 * @param string $output Robots.txt output.
 * @return string the Robots.txt information
 */
function private_robots_txt( $output ) {
	if ( site_is_private() ) {
		// Purposefully overriding current output; we only want these rules.
		return "User-agent: *\nDisallow: /\n";
	}
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
 * Returns the private page template for OPML.
 */
function hide_opml() {
	if ( should_prevent_site_access() ) {
		status_header( 403 );
?>
		<error><?php esc_html_e( 'This site is private.' ) ?></error>
	</head>
</opml>
<?php
		exit;
	}
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
