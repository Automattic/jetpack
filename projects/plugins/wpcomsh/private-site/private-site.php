<?php

/**
 * Private Site
 * Functionality to make sites private and only accessible to members with appropriate capabilities
 */

namespace Private_Site;

use Jetpack;
use WP_Error;
use WP_REST_Request;
use function checked;
use function get_home_url;
use function doing_filter;
use function esc_html_e;
use function get_current_blog_id;
use function get_option;
use function remove_filter;
use function status_header;
use function wp_clone;
use function wp_get_current_user;
use function wp_send_json_error;

function is_module_active() {
	// This feature is currently in testing. It's only enabled for sites which have privacy model
	// explicitly set to private. This is technically the same as site_is_private function, but since
	// the other implementation may change, it's safe to just have that copied over for now.
	return defined( 'AT_PRIVACY_MODEL' ) && AT_PRIVACY_MODEL === 'wp_uploads';
}

function admin_init() {
	if ( ! is_module_active() ) {
		return;
	}

	/**
	 * Don't add the action when we don't intend to alter core behavior.
	 * The mere presence of a `blog_privacy_selector` hook changes things!
	 * @see https://github.com/WordPress/wordpress-develop/blob/fd479f953731bbf522b32b9d95eeb68bc455c418/src/wp-admin/options-reading.php#L178-L202
	 */
	if ( ( is_jetpack_connected() || site_is_private() ) && should_update_privacy_selector() ) {
		add_action( 'blog_privacy_selector', '\Private_Site\privatize_blog_priv_selector' );
		// Prevent wp-admin from touching blog_public option
		add_action( 'whitelist_options', '\Private_Site\remove_privacy_option_from_whitelist' );
	}

	if ( ! site_is_private() ) {
		return;
	}

	// Many AJAX actions do not execute the `parse_request` action. Catch them here.
	if ( should_prevent_site_access() && ! is_jetpack_admin_ajax_request() ) {
		send_access_denied_error_response();
	}
}
add_action( 'admin_init', '\Private_Site\admin_init' );

function init() {
	if ( ! is_module_active() ) {
		return;
	}

	if ( ! site_is_private() ) {
		return;
	}

	// Scrutinize most requests
	add_action( 'parse_request', '\Private_Site\parse_request', 100 );

	// Scrutinize REST API requests
	add_filter( 'rest_dispatch_request', '\Private_Site\rest_dispatch_request', 10, 4 );

	// Update `wpcom_coming_soon` cached value when it's updated on WP.com
	add_filter( 'rest_api_update_site_settings', '\Private_Site\cache_option_on_update_site_settings', 10, 2 );

	// Prevent Pinterest pinning
	add_action( 'wp_head', '\Private_Site\private_no_pinning' );

	// Prevent leaking site information via OPML
	add_action( 'opml_head', '\Private_Site\hide_opml' );

	// Mask the blog name on the login screen etc.
	add_filter( 'bloginfo', '\Private_Site\mask_site_name', 3, 2 );

	// Block incoming comments for non-users
	add_filter( 'preprocess_comment', '\Private_Site\preprocess_comment', 0 );

	// Robots requests are allowed via parse_request / maybe_print_robots_txt
	add_filter( 'robots_txt', '\Private_Site\private_robots_txt' );

	// @TODO pre_trackback_post maybe..?

	// @TODO add "lock" toolbar item when private

	/** Jetpack-specific hooks **/

	// Prevent Jetpack certain modules from running while the site is private
	add_filter( 'jetpack_active_modules', '\Private_Site\filter_jetpack_active_modules', 0 );
	add_filter( 'jetpack_force_disable_site_accelerator', '__return_true' );

	// Only allow Jetpack XMLRPC methods -- Jetpack handles verifying the token, request signature, etc.
	add_filter( 'xmlrpc_methods', '\Private_Site\xmlrpc_methods_limit_to_jetpack' );

	// Lift the blog name mask prior to Jetpack sync activity
	add_action( 'jetpack_sync_before_send_queue_full_sync', '\Private_Site\remove_mask_site_name_filter' );
	add_action( 'jetpack_sync_before_send_queue_sync', '\Private_Site\remove_mask_site_name_filter' );

	// Logged-in blog users for an 'unlaunched' or 'coming soon' site see a banner.
	require __DIR__ . '/logged-in-banner.php';
	add_action( 'wp_head', '\Private_Site\show_logged_in_banner', -1000 );
}
add_action( 'init', '\Private_Site\init' );

/**
 * Replaces the 'Site Visibility' privacy options selector with a Calypso link.
 */
function privatize_blog_priv_selector() {
	$has_jetpack_connection = is_jetpack_connected();

	if ( ! $has_jetpack_connection && site_is_private() ) {
		$escaped_content = 'Jetpack is disconnected & site is private. Reconnect Jetpack to manage site visibility settings.';
	} else if ( ! $has_jetpack_connection || ! is_callable( 'Jetpack::build_raw_urls' ) ) {
		return;
	} else {
		$site_slug = Jetpack::build_raw_urls( get_home_url() );
		$settings_url = esc_url_raw( sprintf( 'https://wordpress.com/settings/general/%s#site-privacy-settings', $site_slug ) );
		$manage_label = __( 'Manage your site visibility settings', 'wpcomsh' );
		$escaped_content = '<a target="_blank" href="' . esc_url( $settings_url ) . '">' . esc_html( $manage_label ) . '</a>';
	}

	?>
<noscript>
<p><?php echo wp_kses_post( $escaped_content ) ?></p>
</noscript>
<script>
( function() {
	var widgetArea = document.querySelector( '.option-site-visibility td' );
	if ( ! widgetArea ) {
	  return;
	}
	widgetArea.innerHTML = '<?php echo wp_kses_post( $escaped_content ) ?>';
} )()
</script>
        <?php
}

/**
 * Fetches an option from the Jetpack cloud site.
 *
 * @param $option  String  Name of option to be retrieved.
 *
 * @return mixed  Option value.
 */
function fetch_option_from_wpcom( $option ) {
	if ( ! is_jetpack_connected() ) {
		return false;
	}

	$jetpack = Jetpack::init();
	if ( ! method_exists( $jetpack, 'get_cloud_site_options' ) ) {
		return false;
	}
	$options = $jetpack->get_cloud_site_options( [ $option ] );

	return $options[$option];
}

/**
 * The site is determined to be "coming soon" when both:
 * - The site is private (@see site_is_private)
 * - The `wpcom_coming_soon` option on the "cloud site" is truthy
 *
 * As such, "coming soon" is just a flavor of private sites and is always false on sites that are public.
 * @return bool
 */
function site_is_coming_soon() : bool {
	if ( ! site_is_private() ) {
		return false;
	}

	$wpcom_coming_soon = wp_cache_get( 'wpcom_coming_soon', 'wpcomsh' );

	if ( false === $wpcom_coming_soon ) {
		$wpcom_coming_soon = (int) fetch_option_from_wpcom( 'wpcom_coming_soon' );
		wp_cache_set( 'wpcom_coming_soon', $wpcom_coming_soon, 'wpcomsh' );
	}

	return (bool) $wpcom_coming_soon;
}

/**
 * Sites are created as "unlaunched" and can only be launched once.
 *
 * @return string
 */
function site_launch_status() : string {
	if ( ! site_is_private() ) {
		return '';
	}

	$launch_status = wp_cache_get( 'wpcom_launch_status', 'wpcomsh' );

	if ( ! $launch_status ) {
		$launch_status = (string) fetch_option_from_wpcom( 'launch-status' );
		wp_cache_set( 'wpcom_launch_status', $launch_status, 'wpcomsh' );
	}

	return (string) $launch_status;
}

function is_launched() {
	return 'launched' === site_launch_status();
}

function get_launch_banner_status() {
	return get_option( 'wpcom_private_sites_module_launch_banner' );
}

function set_launch_banner_status( $status = 'hide' ) {
	update_option( 'wpcom_private_sites_module_launch_banner', $status );
}

/**
 * Hooked into filter: `pre_update_option_blog_public`
 * Sets a secondary option (`wpcom_blog_public_updated`) to `1` when the `blog_public` option is updated
 * This will be used to determine that the option has been set after the launch of the Private Site module.
 *
 * This is in contrast to WordPress.com Simple sites which relies on the `blog_public` option.
 * @return bool
 */
function site_is_private() {
	return defined( 'AT_PRIVACY_MODEL' ) && AT_PRIVACY_MODEL === 'wp_uploads';
}

/**
 * Determine if site access should be blocked for various types of requests.
 * This function is cached for subsequent calls so we can use it gratuitously.
 *
 * IMPORTANT: This function assumes a site is set to private.
 * This module is structured such that `site_is_private` is consulted prior to calling `should_prevent_site_access`
 * You should likely do the same if you are building on to this.
 *
 * @return bool
 */
function should_prevent_site_access() {
	static $cached;

	if ( isset( $cached ) ) {
		return $cached;
	}

	if (
		( defined( 'WP_CLI' ) && WP_CLI ) ||
		( defined( 'WP_IMPORTING' ) && WP_IMPORTING )
	) {
		// WP-CLI & Importers are always allowed
		return $cached = false;
	}

	return $cached = ! is_private_blog_user();
}

/**
 * Checks if current request is a request sent to admin-ajax.php and initiated by remote
 * Jetpack API.
 *
 * @return bool
 */
function is_jetpack_admin_ajax_request() {
	return (
		substr( $_SERVER['REQUEST_URI'], 0, 24 ) === '/wp-admin/admin-ajax.php' &&
		substr( $_SERVER['HTTP_AUTHORIZATION'], 0, 9 ) === 'X_JETPACK' &&
		array_key_exists( 'action', $_POST ) &&
		substr( $_POST['action'], 0, 8 ) === 'jetpack_'
	);
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
		wp_send_json_error( [ 'code' => 'private_site', 'message' => __( 'This site is private.', 'wpcomsh' ) ] );
	}

	require access_denied_template_path();
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

function original_request_url() {
	$origin = ( is_ssl() ? 'https://' : 'http://' ) . $_SERVER['SERVER_NAME'];

	if ( ! empty( $_SERVER['SERVER_PORT'] ) && ! in_array( $_SERVER['SERVER_PORT'], [ 80, 443 ] ) ) {
		$origin .= ':' . $_SERVER['SERVER_PORT'];
	}

	return $origin . strtok( $_SERVER['REQUEST_URI'], '?' );
}

/**
 * Hooked into `rest_api_update_site_settings` filter.
 *
 * This filter updates the cached value of `wpcom_coming_soon` or `launch-status`
 * whenever `wpcom_coming_soon` option is changed on WP.com and this plugin
 * is notified via Jetpack-WPCOM REST API bridge.
 *
 * @param $input Filtered POST input
 * @param $unfiltered_input Raw and unfiltered POST input
 *
 * @return mixed
 */
function cache_option_on_update_site_settings( $input, $unfiltered_input ) {
	if ( array_key_exists( 'wpcom_coming_soon', $unfiltered_input ) ) {
		wp_cache_set( 'wpcom_coming_soon', $unfiltered_input['wpcom_coming_soon'], 'wpcomsh' );
	}

	if ( array_key_exists( 'launch-status', $unfiltered_input ) ) {
		wp_cache_set( 'wpcom_launch_status', $unfiltered_input['launch-status'], 'wpcomsh' );
	}

	return $input;
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
	if ( untrailingslashit( original_request_url() ) === site_url( '/robots.txt' ) ) {
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
	$allowed_routes = [
		'2fa/', // https://wordpress.org/plugins/application-passwords/
		'jwt-auth/', // https://wordpress.org/plugins/jwt-authentication-for-wp-rest-api/
		'oauth1/', // https://wordpress.org/plugins/rest-api-oauth1/
	];

	if ( preg_match( '#^/(' . implode( '|', $allowed_routes ) . ')#', $route ) ) {
		return null;
	}

	if ( should_prevent_site_access() ) {
		return new WP_Error( 'private_site', __( 'This site is private.', 'wpcomsh' ), [ 'status' => 403 ] );
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
 * Checks if the current user is a member of the current site.
 *
 * @return bool
 */
function is_private_blog_user() {
	return (bool) blog_user_can( 'read' );
}

/**
 * Checks the current user's capabilities for the current site.
 *
 * Does not check whether the blog is private. Works on current blog & user.
 * Returns true for super admins.
 *
 * @param $capability string  Capability name.
 * @return bool
 */
function blog_user_can( $capability = 'read' ) {
	$user = wp_get_current_user();
	if ( ! $user->ID ) {
		return false;
	}

	$blog_id = get_current_blog_id();
	if ( ! $blog_id ) {
		return false;
	}

	// check if the user has read permissions
	$the_user = clone( $user );
	$the_user->for_site( $blog_id );
	return (bool) $the_user->has_cap( $capability );
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
	if ( ! site_is_coming_soon() && should_prevent_site_access() && in_array( $what, [ 'name', 'title' ], true ) ) {
		return __( 'Private Site', 'wpcomsh' );
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
 *
 * @return array
 */
function preprocess_comment( $comment ) {
	if ( should_prevent_site_access() ) {
		require access_denied_template_path();
		exit;
	}
	return $comment;
}

function is_jetpack_connected() {
	return is_callable( 'Jetpack::is_active' ) && \Jetpack::is_active();
}

/**
 * Grabs a proper access denied template and returns it's path
 */
function access_denied_template_path() {
	if ( site_is_coming_soon() ) {
		return __DIR__ . '/access-denied-coming-soon-template.php';
	} else {
		return __DIR__ . '/access-denied-private-site-template.php';
	}
}


/**
 * Hooked into filter: `whitelist_options`
 *
 * Prevents WordPress from saving blog_public option when site options are saved.
 *
 * This plugin disables the 'Site Visibility' selector in wp-admin and shows a link to Calypso instead. This function
 * effectively prevents wp-admin from accidentally updating 'blog_public' option when other site options are updated.
 *
 * @param array $whitelist
 * @return array
 */
function remove_privacy_option_from_whitelist($whitelist) {
	$blog_public_index = array_search( 'blog_public', $whitelist['reading'], true );
	unset( $whitelist['reading'][ $blog_public_index ] );

	return $whitelist;
}

/**
 * Makes it possible to disable WP.com customizations to 'Site Visibility' selector by attaching
 * a 'wpcom_should_update_privacy_selector' filter and making sure it returns false.
 *
 * @return bool
 */
function should_update_privacy_selector( ) {
	return apply_filters( 'wpcom_should_update_privacy_selector', true );
}


/**
 * Don't let search engines index private sites.
 * If the site is not private, do nothing.
 *
 * @param string $output Robots.txt output.
 * @return string the Robots.txt information
 */
function private_robots_txt( $output ) {
	// Purposefully overriding current output; we only want these rules.
	return "User-agent: *\nDisallow: /\n";
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
		<error><?php esc_html_e( 'This site is private.', 'wpcomsh' ) ?></error>
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
		'photon-cdn',
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
