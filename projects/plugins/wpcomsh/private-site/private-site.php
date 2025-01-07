<?php
/**
 * Private Site
 * Functionality to make sites private and only accessible to members with appropriate capabilities.
 *
 * @package private-site
 */

namespace Private_Site;

use Automattic\Jetpack\Connection\Rest_Authentication;
use Jetpack;
use WP_Error;
use WP_REST_Request;
use function esc_html_e;
use function get_current_blog_id;
use function get_option;
use function remove_filter;
use function status_header;
use function wp_get_current_user;
use function wp_send_json_error;

/**
 * We disable some Jetpack modules if the site is private and atomic
 *
 * !!! KEEP THIS LIST IN SYNC WITH THE LIST ON WPCOM !!!
 *
 * @see private_blog_filter_jetpack_active_modules in wp-content/mu-plugins/private-blog.php (update this to an actual link when D41356-code lands)
 */
const DISABLED_JETPACK_MODULES_WHEN_PRIVATE = array(
	'publicize',
	'sharedaddy',
	'json-api',
	'enhanced-distribution',
	'google-analytics',
	'photon',
	'photon-cdn',
	'sitemaps',
	'verification-tools',
	'wordads',
);

/**
 * This function was used when the feature was in testing. Currently we're trying it for a some WP.com users.
 * Wpcomsh is not aware of any test groups so this function just says return true for now. Once the entire feature
 * is ready to be rolled out to 100% of users, it's okay to completely remove this function and any checks.
 */
function is_module_active() {
	return true;
}

/**
 * Setup when wp-admin gets initialized.
 */
function admin_init() {
	if ( ! is_module_active() ) {
		return;
	}

	/*
	 * Don't add the action when we don't intend to alter core behavior.
	 * The mere presence of a `blog_privacy_selector` hook changes things!
	 *
	 * @see https://github.com/WordPress/wordpress-develop/blob/fd479f953731bbf522b32b9d95eeb68bc455c418/src/wp-admin/options-reading.php#L178-L202
	 */
	if ( ( is_jetpack_connected() || site_is_private() ) && should_update_privacy_selector() ) {
		// Prevent wp-admin from touching blog_public option.
		add_filter( 'allowed_options', '\Private_Site\remove_privacy_option_from_whitelist' );
	}

	if ( should_override_editor_with_classic_editor() ) {
		// Classic editor for private+atomic users is now handled in wp-admin instead of Calypso. @see use_classic_editor_if_requested
		add_action( 'load-post.php', '\Private_Site\use_classic_editor_if_requested', - 1000 );
		add_action( 'load-post-new.php', '\Private_Site\use_classic_editor_if_requested', - 1000 );
	}

	// Many AJAX actions do not execute the `parse_request` action. Catch them here.
	if ( site_is_private() && should_prevent_site_access() && ! is_jetpack_admin_ajax_request() ) {
		send_access_denied_error_response();
	}
}
add_action( 'admin_init', '\Private_Site\admin_init' );

/**
 * Setup when WordPress gets initialized.
 */
function init() {
	if ( ! is_module_active() ) {
		return;
	}

	// Update `wpcom_coming_soon` cached value when it's updated on WP.com.
	add_filter( 'rest_api_update_site_settings', '\Private_Site\cache_option_on_update_site_settings', 10, 2 );

	// Logged-in blog users for an 'unlaunched' or 'coming soon' site see a banner.
	// Only load the logged in private and public coming soon modes.
	if ( site_is_private() || site_is_public_coming_soon() ) {
		require __DIR__ . '/logged-in-banner.php';
		add_action( 'wp_body_open', '\Private_Site\show_logged_in_banner', -1000 );
	}

	if ( ! site_is_private() ) {
		return;
	}

	// Scrutinize most requests.
	add_action( 'parse_request', '\Private_Site\parse_request', 100 );

	// Scrutinize REST API requests.
	add_filter( 'rest_dispatch_request', '\Private_Site\rest_dispatch_request', 10, 3 );

	// Prevent Pinterest pinning.
	add_action( 'wp_head', '\Private_Site\private_no_pinning' );

	// Prevent leaking site information via OPML.
	add_action( 'opml_head', '\Private_Site\hide_opml' );

	// Mask the blog name on the login screen etc.
	add_filter( 'bloginfo', '\Private_Site\mask_site_name', 3, 2 );

	// Block incoming comments for non-users.
	add_filter( 'preprocess_comment', '\Private_Site\preprocess_comment', 0 );

	// Robots requests are allowed via parse_request / maybe_print_robots_txt
	add_filter( 'robots_txt', '\Private_Site\private_robots_txt' );

	// @TODO pre_trackback_post maybe..?

	// @TODO add "lock" toolbar item when private
}
add_action( 'init', '\Private_Site\init' );

/**
 * Jetpack-specific hooks.
 */
function muplugins_loaded() {
	if ( ! is_module_active() ) {
		return;
	}

	if ( ! site_is_private() ) {
		return;
	}

	// Only allow Jetpack XMLRPC methods -- Jetpack handles verifying the token, request signature, etc.
	add_filter( 'xmlrpc_methods', '\Private_Site\xmlrpc_methods_limit_to_allowed_list' );

	// Register additional Jetpack XMLRPC methods.
	add_filter( 'jetpack_xmlrpc_methods', '\Private_Site\register_additional_jetpack_xmlrpc_methods' );

	// Lift the blog name mask prior to Jetpack sync activity.
	add_action( 'jetpack_sync_before_send_queue_full_sync', '\Private_Site\remove_mask_site_name_filter' );
	add_action( 'jetpack_sync_before_send_queue_sync', '\Private_Site\remove_mask_site_name_filter' );

	// Prevent Jetpack certain modules from running while the site is private.
	add_filter( 'jetpack_active_modules', '\Private_Site\filter_jetpack_active_modules' );
	add_filter( 'jetpack_get_available_modules', '\Private_Site\filter_jetpack_get_available_modules' );
	add_filter( 'jetpack_force_disable_site_accelerator', '__return_true' );
}
add_action( 'muplugins_loaded', '\Private_Site\muplugins_loaded' );

/**
 * Fetches an option from the Jetpack cloud site.
 *
 * @param string $option Name of option to be retrieved.
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
	$options = $jetpack->get_cloud_site_options( array( $option ) );

	return $options[ $option ];
}

/**
 * The site is determined to be "coming soon" when both:
 * - The site is private (@see site_is_private)
 * - The `wpcom_coming_soon` option on the "cloud site" is truthy
 *
 * As such, "coming soon" is just a flavor of private sites and is always false on sites that are public.
 *
 * @return bool
 */
function site_is_coming_soon(): bool {
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
 * Checks whether a site is in public coming soon mode.
 * The site is determined to be "public coming soon" when both:
 * - The site is not private (@see site_is_private)
 * - The `wpcom_public_coming_soon` option is truthy
 *
 * In feature-plugins/full-site-editing.php we have an option hook `wpcomsh_coming_soon_get_atomic_persistent_data()` that returns the
 * value of Atomic persistence data.
 *
 * @return bool
 */
function site_is_public_coming_soon(): bool {
	if ( site_is_private() ) {
		return false;
	}

	return 1 === (int) get_option( 'wpcom_public_coming_soon' );
}

/**
 * Sites are created as "unlaunched" and can only be launched once.
 *
 * @return string
 */
function site_launch_status(): string {
	// We need to check for launch status for private by default sites and coming soon + public by default sites.
	if ( ! site_is_private() && ! site_is_public_coming_soon() ) {
		return '';
	}

	$launch_status = wp_cache_get( 'wpcom_launch_status', 'wpcomsh' );

	if ( ! $launch_status ) {
		$launch_status = (string) fetch_option_from_wpcom( 'launch-status' );
		wp_cache_set( 'wpcom_launch_status', $launch_status, 'wpcomsh' );
	}

	return (string) $launch_status;
}

/**
 * Whether the site is launched.
 *
 * @return bool
 */
function is_launched() {
	return 'launched' === site_launch_status();
}

/**
 * Hooked into filter: `pre_update_option_blog_public`.
 *
 * Sets a secondary option (`wpcom_blog_public_updated`) to `1` when the `blog_public` option is updated
 * This will be used to determine that the option has been set after the launch of the Private Site module.
 *
 * This is in contrast to WordPress.com Simple sites which relies on the `blog_public` option.
 *
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

	/*
	 * If Jetpack is enabled, check to see if blog token requests are authenticated before disallowing access.
	 * This allows Jetpack Sync to run for private sites.
	 */
	if ( class_exists( 'Automattic\Jetpack\Connection\Rest_Authentication' ) && Rest_Authentication::is_signed_with_blog_token() ) {
		return $cached = false; // phpcs:ignore Squiz.PHP.DisallowMultipleAssignments
	}

	if (
		( defined( 'WP_CLI' ) && WP_CLI ) ||
		( defined( 'WP_IMPORTING' ) && WP_IMPORTING )
	) {
		// WP-CLI & Importers are always allowed.
		return $cached = false; // phpcs:ignore Squiz.PHP.DisallowMultipleAssignments
	}

	return $cached = ! is_private_blog_user(); // phpcs:ignore Squiz.PHP.DisallowMultipleAssignments
}

/**
 * Adds custom XML-RPC endpoints for private-site.
 *
 * @param array $methods A list of registered XML-RPC methods.
 *
 * @return array
 */
function register_additional_jetpack_xmlrpc_methods( $methods ) {
	return array_merge(
		$methods,
		array(
			'jetpack.getClosestThumbnailSizeUrl' => '\Private_Site\get_closest_thumbnail_size_url',
			'jetpack.getReadAccessCookies'       => '\Private_Site\get_read_access_cookies',
		)
	);
}

/**
 * Returns the closest thumbnail size URL.
 *
 * @param array $args Image arguments.
 *
 * @return array|false
 */
function get_closest_thumbnail_size_url( $args ) {
	$id = attachment_url_to_postid( $args['url'] );
	if ( ! $id ) {
		return false;
	}

	$result = wp_get_attachment_image_src( $id, array( $args['width'], $args['height'] ) );
	if ( ! $result ) {
		return false;
	}

	return $result;
}

/**
 * We use this XMLPC method to ensure wp.com is able to fetch read access cookies even
 * when Jetpack SSO module is disabled.
 *
 * @param array $args Cookie args.
 *
 * @return array|WP_Error
 */
function get_read_access_cookies( $args ) {
	$user = get_user_by( 'id', intval( $args[0] ) );
	if ( ! $user ) {
		return new WP_Error(
			'account_not_found',
			'Account not found. If you already have an account, make sure you have connected to WordPress.com.'
		);
	}
	if ( ! $user->has_cap( 'read' ) ) {
		return new WP_Error( 'access error', 'User does not have "read" capabilities' );
	}

	add_filter( 'send_auth_cookies', '__return_false' );
	add_filter(
		'auth_cookie_expiration',
		function () use ( $args ) {
			return $args[1];
		},
		1000
	);

	$logged_in_cookie            = null;
	$logged_in_cookie_expiration = null;

	add_action(
		'set_logged_in_cookie',
		function ( $_cookie, $args ) use ( &$logged_in_cookie, &$logged_in_cookie_expiration ) {
			$logged_in_cookie            = $_cookie;
			$logged_in_cookie_expiration = $args[1];
		},
		10,
		2
	);
	wp_set_auth_cookie( $user->ID, true );
	if ( ! $logged_in_cookie ) {
		return new WP_Error( 'authorization_failed', 'Authorization cookie was not found' );
	}

	return array(
		array( LOGGED_IN_COOKIE, $logged_in_cookie, $logged_in_cookie_expiration ),
	);
}

/**
 * Checks if current request is a request sent to admin-ajax.php and initiated by remote
 * Jetpack API.
 *
 * @return bool
 */
function is_jetpack_admin_ajax_request() {
	// phpcs:disable WordPress.Security
	return (
		substr( $_SERVER['REQUEST_URI'], 0, 24 ) === '/wp-admin/admin-ajax.php' &&
		substr( $_SERVER['HTTP_AUTHORIZATION'], 0, 9 ) === 'X_JETPACK' &&
		array_key_exists( 'action', $_POST ) &&
		substr( $_POST['action'], 0, 8 ) === 'jetpack_'
	);
	// phpcs:enable
}

/**
 * Tell the client that the site is private and they do not have access.
 * This function always exits PHP (`wp_send_json_error` calls `wp_die` / `die`)
 *
 * @return never
 */
function send_access_denied_error_response() {
	global $wp;

	if ( ( defined( 'DOING_AJAX' ) && DOING_AJAX ) || 'admin-ajax.php' === ( $wp->query_vars['pagename'] ?? '' ) ) {
		wp_send_json_error(
			array(
				'code'    => 'private_site',
				'message' => __(
					'This site is private.',
					'wpcomsh'
				),
			)
		);
	}

	require access_denied_template_path();
	exit;
}

/**
 * Prints robots.txt and prevents access if necessary.
 */
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
 * Returns the original request URL.
 *
 * @return string
 */
function original_request_url() {
	// phpcs:disable WordPress.Security
	$origin = ( is_ssl() ? 'https://' : 'http://' ) . $_SERVER['SERVER_NAME'];

	if ( ! empty( $_SERVER['SERVER_PORT'] ) && ! in_array( $_SERVER['SERVER_PORT'], array( 80, 443 ) ) ) { //phpcs:ignore WordPress.PHP.StrictInArray.MissingTrueStrict
		$origin .= ':' . $_SERVER['SERVER_PORT'];
	}

	return $origin . strtok( $_SERVER['REQUEST_URI'], '?' );
	// phpcs:enable
}

/**
 * Hooked into `rest_api_update_site_settings` filter.
 *
 * This filter updates the cached value of `wpcom_coming_soon` or `launch-status`
 * whenever `wpcom_coming_soon` option is changed on WP.com and this plugin
 * is notified via Jetpack-WPCOM REST API bridge.
 *
 * @param array $input            Filtered POST input.
 * @param array $unfiltered_input Raw and unfiltered POST input.
 *
 * @return array
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
 *
 * @return WP_Error|null  WP_Error on disallowed, null on ok
 */
function rest_dispatch_request( $dispatch_result, $request, $route ) { // phpcs:ignore Generic.CodeAnalysis.UnusedFunctionParameter
	// Don't clobber other plugins.
	if ( $dispatch_result !== null ) {
		return $dispatch_result;
	}

	/*
	 * Allow certain endpoints for plugin-based authentication methods.
	 * These are "anchored" on the left side with `^/`, but not the right, so include the trailing `/`
	 */
	$allowed_routes = array(
		'2fa/', // https://wordpress.org/plugins/application-passwords/
		'jwt-auth/', // https://wordpress.org/plugins/jwt-authentication-for-wp-rest-api/
		'oauth1/', // https://wordpress.org/plugins/rest-api-oauth1/
	);

	if ( preg_match( '#^/(' . implode( '|', $allowed_routes ) . ')#', $route ) ) {
		return null;
	}

	if ( should_prevent_site_access() ) {
		return new WP_Error( 'private_site', __( 'This site is private.', 'wpcomsh' ), array( 'status' => 403 ) );
	}

	return null;
}

/**
 * Limits XML-RPC endpoints to the ones that are allowed.
 *
 * @param array $methods List of XML-RPC methods.
 *
 * @return array
 */
function xmlrpc_methods_limit_to_allowed_list( $methods ) {
	if ( should_prevent_site_access() ) {
		return array_filter(
			$methods,
			function ( $key ) {
				// Permits the Jetpack debug tool. @see p58i-8OX-p2#comment-46085.
				return 'demo.sayHello' === $key || preg_match( '/^jetpack\..+/', $key );
			},
			ARRAY_FILTER_USE_KEY
		);
	}

	return $methods;
}

/**
 * Checks if the current user is a member of the current site.
 *
 * @return bool
 */
function is_private_blog_user() {
	return blog_user_can();
}

/**
 * Checks the current user's capabilities for the current site.
 *
 * Does not check whether the blog is private. Works on current blog & user.
 * Returns true for super admins.
 *
 * @param string $capability Capability name.
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

	// Check if the user has read permissions.
	$the_user = clone $user;
	$the_user->for_site( $blog_id );
	return $the_user->has_cap( $capability );
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
	if ( ! site_is_coming_soon() && should_prevent_site_access() && in_array( $what, array( 'name', 'title' ), true ) ) {
		return __( 'Private Site', 'wpcomsh' );
	}

	return $value;
}

/**
 * Remove the mask_site_name filter.
 */
function remove_mask_site_name_filter() {
	remove_filter( 'bloginfo', '\Private_Site\mask_site_name' );
}

/**
 * Filters new comments so that users can't comment on private blogs.
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

/**
 * Whether the current site is connected to Jetpack.
 *
 * @return bool
 */
function is_jetpack_connected() {
	return class_exists( 'Jetpack' ) && Jetpack::is_connection_ready();
}

/**
 * Whether we're in preview mode.
 *
 * @return bool
 */
function is_site_preview() {
	return site_preview_source() !== false;
}

/**
 * Returns the site preview source.
 *
 * @return false|string
 */
function site_preview_source() {
	// phpcs:disable WordPress.Security.NonceVerification.Recommended -- This request doesn't change any data.
	$ua                = isset( $_SERVER['HTTP_USER_AGENT'] )
			? sanitize_text_field( wp_unslash( $_SERVER['HTTP_USER_AGENT'] ) )
			: '';
	$apps_ua_fragments = array(
		'iphone-app'  => ' wp-iphone/',
		'android-app' => ' wp-android/',
		'desktop-app' => ' WordPressDesktop/',
	);
	foreach ( $apps_ua_fragments as $source => $fragment ) {
		if ( strpos( $ua, $fragment ) !== false ) {
			return $source;
		}
	}

	if (
		(
			isset( $_GET['iframe'] )
			&& 'true' === $_GET['iframe']
			&& (
				( isset( $_GET['theme_preview'] ) && 'true' === $_GET['theme_preview'] )
				|| (
					isset( $_GET['preview'] )
					&& 'true' === $_GET['preview']
				)
			)
		)
		|| isset( $_GET['widgetPreview'] ) // Gutenberg < 9.2
		|| isset( $_GET['widget-preview'] ) // Gutenberg >= 9.2
	) {
		return 'browser-iframe';
	}

	return false;
	// phpcs:enable WordPress.Security.NonceVerification.Recommended
}

/**
 * Grabs a proper access-denied template and returns its path.
 */
function access_denied_template_path() {
	if ( is_site_preview() ) {
		return __DIR__ . '/access-denied-preview-login-template.php';
	}

	if ( site_is_coming_soon() ) {
		return __DIR__ . '/access-denied-coming-soon-template.php';
	} else {
		return __DIR__ . '/access-denied-private-site-template.php';
	}
}

/**
 * Hooked into filter: `allowed_options`.
 *
 * Prevents WordPress from saving blog_public option when site options are saved.
 *
 * This plugin disables the 'Site Visibility' selector in wp-admin and shows a link to Calypso instead. This function
 * effectively prevents wp-admin from accidentally updating 'blog_public' option when other site options are updated.
 *
 * @param array $allow_list Options allow list.
 * @return array
 */
function remove_privacy_option_from_whitelist( $allow_list ) {
	$blog_public_index = array_search( 'blog_public', $allow_list['reading'], true );
	unset( $allow_list['reading'][ $blog_public_index ] );

	return $allow_list;
}

/**
 * Makes it possible to disable WP.com customizations to 'Site Visibility' selector by attaching
 * a 'wpcom_should_update_privacy_selector' filter and making sure it returns false.
 *
 * @return bool
 */
function should_update_privacy_selector() {
	return apply_filters( 'wpcom_should_update_privacy_selector', true );
}

/**
 * Don't let search engines index private sites.
 * If the site is not private, do nothing.
 *
 * @return string The Robots.txt information.
 */
function private_robots_txt() {
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
		<error><?php esc_html_e( 'This site is private.', 'wpcomsh' ); ?></error>
	</head>
</opml>
		<?php
		exit;
	}
}

/**
 * Removes disabled modules from the active list for private sites.
 *
 * @param array $modules Active modules.
 *
 * @return array Array of modules after filtering.
 */
function filter_jetpack_active_modules( $modules ) {
	return array_filter(
		$modules,
		function ( $module_name ) {
			return ! in_array( $module_name, DISABLED_JETPACK_MODULES_WHEN_PRIVATE, true );
		}
	);
}

/**
 * Disables modules for private sites.
 *
 * @param array $modules Available modules.
 *
 * @return array Array of modules after filtering.
 */
function filter_jetpack_get_available_modules( $modules ) {
	return array_filter(
		$modules,
		function ( $module_name ) {
			return ! in_array( $module_name, DISABLED_JETPACK_MODULES_WHEN_PRIVATE, true );
		},
		ARRAY_FILTER_USE_KEY
	);
}

/**
 * Classic editor in calypso don't support displaying private media files because of CORS issues. Adding
 * a support would be super complex and probably not worth it, considering that we're phasing out the classical
 * editor altogether. Classic editor in wp-admin handles private files out of the box so we're redirecting all
 * private+atomic+classic editor users from calypso to wp-admin with ?classic_editor.
 *
 * This hook ensures that all requests to post.php and post-new.php will show classic editor when ?classic_editor query
 * parameter is present.
 */
function use_classic_editor_if_requested() {
	if ( ! is_module_active() ) {
		return;
	}

	if ( ! should_override_editor_with_classic_editor() ) {
		return;
	}

	if ( class_exists( '\Classic_Editor' ) ) {
		// This should never happen since we disabled the plugin in another filter
		return;
	}

	add_action(
		'classic_editor_plugin_settings',
		function () {
			return array(
				'editor'      => 'classic',
				'allow-users' => false,
			);
		}
	);

	require dirname( __DIR__ ) . '/vendor/wordpress/classic-editor-plugin/classic-editor.php';
	\Classic_Editor::init_actions();

	/*
	 * Classic editor registers itself to plugins_loaded action.
	 * By now it was already executed, but let's remove it just to be safe.
	 */
	remove_action( 'plugins_loaded', array( 'Classic_Editor', 'init_actions' ) );

	// In allow-users => false mode, these redirection helpers aren't used. Let's apply them manually.
	add_filter( 'get_edit_post_link', array( 'Classic_Editor', 'get_edit_post_link' ) );
	add_filter( 'redirect_post_location', array( 'Classic_Editor', 'redirect_location' ) );
	add_action( 'edit_form_top', array( 'Classic_Editor', 'add_redirect_helper' ) );
	add_action( 'admin_head-edit.php', array( 'Classic_Editor', 'add_edit_php_inline_style' ) );

	/*
	 * Let's disable Calypsoify - it gets triggered when the user:
	 * 1. Opens Gutenberg.
	 * 2. Clicks "Switch to classic editor".
	 * 3. Clicks "Use Classic editor" in the prompt.
	 */
	add_filter(
		'get_user_metadata',
		function ( $value, $object_id, $meta_key ) { // phpcs:ignore Generic.CodeAnalysis.UnusedFunctionParameter
			if ( $meta_key === 'calypsoify' ) {
				return 0;
			}

			return $value;
		},
		10,
		3
	);
}

/**
 * Disables the classic editor plugin when active.
 *
 * @param array $plugins List of active plugins.
 *
 * @return array
 */
function disable_classic_editor_plugin_when_needed( $plugins ) {
	if ( ! is_module_active() ) {
		return $plugins;
	}

	if ( ! should_override_editor_with_classic_editor() ) {
		return $plugins;
	}

	$key = array_search( 'classic-editor/classic-editor.php', $plugins, true );
	if ( false !== $key ) {
		unset( $plugins[ $key ] );
	}

	return $plugins;
}
add_filter( 'option_active_plugins', '\Private_Site\disable_classic_editor_plugin_when_needed', 1000 );

/**
 * Determines whether to override the editor with the Classic Editor.
 *
 * @return bool
 */
function should_override_editor_with_classic_editor() {
	if ( ! site_is_private() ) {
		return false;
	}

	global $pagenow;
	if ( empty( $pagenow ) ) {
		return false;
	}

	if ( $pagenow !== 'post.php' && $pagenow !== 'post-new.php' ) {
		return false;
	}

	if ( ! array_key_exists( 'classic-editor', $_REQUEST ) ) { // phpcs:ignore WordPress.Security.NonceVerification
		return false;
	}

	if ( array_key_exists( 'classic-editor__forget', $_REQUEST ) ) {  // phpcs:ignore WordPress.Security.NonceVerification
		return false;
	}

	return true;
}
