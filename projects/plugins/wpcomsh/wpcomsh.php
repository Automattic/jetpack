<?php
/**
 * Plugin Name: WordPress.com Site Helper
 * Description: A helper for connecting WordPress.com sites to external host infrastructure.
 * Version: 3.3.6
 * Author: Automattic
 * Author URI: http://automattic.com/
 *
 * @package wpcomsh
 */

// Increase version number if you change something in wpcomsh.
define( 'WPCOMSH_VERSION', '3.3.6' );

// If true, Typekit fonts will be available in addition to Google fonts
add_filter( 'jetpack_fonts_enable_typekit', '__return_true' );

// This exists only on the Atomic platform. Blank if migrated elsewhere, so it doesn't fatal.
if ( ! class_exists( 'Atomic_Persistent_Data' ) ) {
	require_once __DIR__ . '/class-atomic-persistent-data.php';
}

require_once __DIR__ . '/constants.php';
require_once __DIR__ . '/wpcom-features/functions-wpcom-features.php';
require_once __DIR__ . '/functions.php';
require_once __DIR__ . '/i18n.php';

require_once __DIR__ . '/plugin-hotfixes.php';

require_once __DIR__ . '/footer-credit/footer-credit.php';
require_once __DIR__ . '/block-theme-footer-credits/block-theme-footer-credits.php';
require_once __DIR__ . '/storefront/storefront.php';
require_once __DIR__ . '/custom-colors/colors.php';
require_once __DIR__ . '/storage/storage.php';

// Interoperability with the core WordPress data privacy functionality (See also "GDPR")
require_once __DIR__ . '/privacy/class-wp-privacy-participating-plugins.php';

// Functionality to make sites private and only accessible to members with appropriate capabilities
require_once __DIR__ . '/private-site/private-site.php';

// Updates customizer Save/Publish labels to avoid confusion on launching vs saving changes on a site.
require_once __DIR__ . '/customizer-fixes/customizer-fixes.php';

require_once __DIR__ . '/class-wpcomsh-log.php';
require_once __DIR__ . '/safeguard/plugins.php';
require_once __DIR__ . '/logo-tool/logo-tool.php';
require_once __DIR__ . '/jetpack-token-error-header/class-atomic-record-jetpack-token-errors.php';

/**
 * WP.com Widgets (in alphabetical order)
 */
require_once __DIR__ . '/widgets/class-aboutme-widget.php';
require_once __DIR__ . '/widgets/class-gravatar-widget.php';
require_once __DIR__ . '/widgets/class-jetpack-i-voted-widget.php';
require_once __DIR__ . '/widgets/class-jetpack-posts-i-like-widget.php';
require_once __DIR__ . '/widgets/class-music-player-widget.php';
require_once __DIR__ . '/widgets/class-widget-authors-grid.php';
require_once __DIR__ . '/widgets/class-wpcom-freshly-pressed-widget.php';
require_once __DIR__ . '/widgets/class-wpcom-widget-recent-comments.php';
require_once __DIR__ . '/widgets/class-wpcom-widget-reservations.php';

// WP.com Category Cloud widget
require_once __DIR__ . '/widgets/class-wpcom-category-cloud-widget.php';
// Override core tag cloud widget to add a settable `limit` parameter
require_once __DIR__ . '/widgets/class-wpcom-tag-cloud-widget.php';

require_once __DIR__ . '/widgets/tlkio/class-tlkio-widget.php';
require_once __DIR__ . '/widgets/class-widget-top-clicks.php';
require_once __DIR__ . '/widgets/class-pd-top-rated.php';
require_once __DIR__ . '/widgets/class-jetpack-widget-twitter.php';

// autoload composer sourced plugins
require_once __DIR__ . '/vendor/autoload.php';

// REST API
require_once __DIR__ . '/endpoints/rest-api.php';

// Load feature plugins.
require_once __DIR__ . '/feature-plugins/additional-css.php';
require_once __DIR__ . '/feature-plugins/autoload-homepage-replacement.php';
require_once __DIR__ . '/feature-plugins/autosave-revision.php';
require_once __DIR__ . '/feature-plugins/coblocks-mods.php';
require_once __DIR__ . '/feature-plugins/full-site-editing.php';
require_once __DIR__ . '/feature-plugins/google-fonts.php';
require_once __DIR__ . '/feature-plugins/gutenberg-mods.php';
require_once __DIR__ . '/feature-plugins/hooks.php';
require_once __DIR__ . '/feature-plugins/managed-plugins.php';
require_once __DIR__ . '/feature-plugins/managed-themes.php';
require_once __DIR__ . '/feature-plugins/marketplace.php';
require_once __DIR__ . '/feature-plugins/masterbar.php';
require_once __DIR__ . '/feature-plugins/post-list.php';
require_once __DIR__ . '/feature-plugins/wordpress-mods.php';

if ( ! class_exists( 'Jetpack_Data' ) ) {
	require_once __DIR__ . '/feature-plugins/class-jetpack-data.php';
}

// wp-admin Notices
require_once __DIR__ . '/notices/plan-notices.php';
require_once __DIR__ . '/notices/storage-notices.php';
require_once __DIR__ . '/notices/php-version-notices.php';

if ( defined( 'WP_CLI' ) && WP_CLI ) {
	require_once __DIR__ . '/class-wpcomsh-cli-commands.php';
}

require_once __DIR__ . '/wpcom-migration-helpers/site-migration-helpers.php';

require_once __DIR__ . '/class-jetpack-plugin-compatibility.php';
new Jetpack_Plugin_Compatibility();

require_once __DIR__ . '/support-session.php';

// Adds fallback behavior for non-Gutenframed sites to be able to use the 'Share Post' functionality from WPCOM Reader.
require_once __DIR__ . '/share-post/share-post.php';

// Jetpack Token Resilience.
require_once __DIR__ . '/jetpack-token-resilience/class-wpcomsh-blog-token-resilience.php';

// Require a Jetpack Connection Owner.
require_once __DIR__ . '/jetpack-require-connection-owner/class-wpcomsh-require-connection-owner.php';

// Jetpack Token Migration Cleanup.
require_once __DIR__ . '/jetpack-token-migration-cleanup/class-wpcomsh-token-migration-cleanup.php';

// Enable MailPoet subscriber stats reports
require_once __DIR__ . '/mailpoet/class-wpcomsh-mailpoet-subscribers-stats-report.php';

// Force Jetpack to update plugins one-at-a-time to avoid a site-breaking core concurrent update bug
// https://core.trac.wordpress.org/ticket/53705
if (
	! defined( 'JETPACK_PLUGIN_AUTOUPDATE' ) &&
	0 === strncmp( $_SERVER['REQUEST_URI'], '/xmlrpc.php?', strlen( '/xmlrpc.php?' ) ) ) { //phpcs:ignore WordPress.Security.ValidatedSanitizedInput
	define( 'JETPACK_PLUGIN_AUTOUPDATE', true );
}

/**
 * Filter attachment URLs if the 'wpcom_attachment_subdomain' option is present.
 * Local image files will be unaffected, as they will pass a file_exists check.
 * Files stored remotely will be filtered to have the correct URL.
 *
 * Once the files have been transferred, the 'wpcom_attachment_subdomain' will
 * be removed, preventing further stats.
 *
 * @param string $url The attachment URL
 * @param int    $post_id The post id
 * @return string The filtered attachment URL
 */
function wpcomsh_get_attachment_url( $url, $post_id ) {
	$attachment_subdomain = get_option( 'wpcom_attachment_subdomain' );
	if ( $attachment_subdomain ) {
		$file = get_post_meta( $post_id, '_wp_attached_file', true );

		if ( $file ) {
			$local_file = WP_CONTENT_DIR . '/uploads/' . $file;
			if ( ! file_exists( $local_file ) ) {
				return esc_url( 'https://' . $attachment_subdomain . '/' . $file );
			}
		}
	}
	return $url;
}
add_filter( 'wp_get_attachment_url', 'wpcomsh_get_attachment_url', 11, 2 );

/**
 * When WordPress.com passes along an expiration for auth cookies and it is smaller
 * than the value set by Jetpack by default (YEAR_IN_SECONDS), use the smaller value.
 *
 * @param int $seconds The cookie expiration in seconds
 * @return int The filtered cookie expiration in seconds
 */
function wpcomsh_jetpack_sso_auth_cookie_expiration( $seconds ) {
	if ( isset( $_GET['expires'] ) ) { //phpcs:ignore WordPress.Security.NonceVerification.Recommended
		$expires = absint( $_GET['expires'] ); //phpcs:ignore WordPress.Security.NonceVerification.Recommended

		if ( ! empty( $expires ) && $expires < $seconds ) {
			$seconds = $expires;
		}
	}
	return intval( $seconds );
}
add_filter( 'jetpack_sso_auth_cookie_expiration', 'wpcomsh_jetpack_sso_auth_cookie_expiration' );

/**
 * If a user is logged in to WordPress.com, log him in automatically to wp-login
 */
add_filter( 'jetpack_sso_bypass_login_forward_wpcom', '__return_true' );

/**
 * Admin enqueue style
 */
function wpcomsh_admin_enqueue_style() {
	wp_enqueue_style(
		'wpcomsh-admin-style',
		plugins_url( 'assets/admin-style.css', __FILE__ ),
		null,
		WPCOMSH_VERSION
	);
}
add_action( 'admin_enqueue_scripts', 'wpcomsh_admin_enqueue_style', 999 );

/**
 * Allow custom wp options
 *
 * @param array $options The options
 *
 * @return array
 */
function wpcomsh_allow_custom_wp_options( $options ) {
	// For storing AT options.
	$options[] = 'at_options';
	$options[] = 'at_options_logging_on';
	$options[] = 'at_wpcom_premium_theme';
	$options[] = 'jetpack_fonts';
	$options[] = 'site_logo';
	$options[] = 'footercredit';

	return $options;
}
add_filter( 'jetpack_options_whitelist', 'wpcomsh_allow_custom_wp_options' );

add_filter( 'jetpack_site_automated_transfer', '__return_true' );

/**
 * Check site has pending automated transfer
 *
 * @return bool
 */
function check_site_has_pending_automated_transfer() {
	return get_option( 'has_pending_automated_transfer' );
}

add_filter( 'jetpack_site_pending_automated_transfer', 'check_site_has_pending_automated_transfer' );

/**
 * Require library helper function
 *
 * @param mixed $slug Slug of library
 * @return void
 */
function require_lib( $slug ) {
	if ( ! preg_match( '|^[a-z0-9/_.-]+$|i', $slug ) ) {
		return;
	}

	// these are whitelisted libraries that Jetpack has
	$in_jetpack = array(
		'tonesque',
		'class.color',
	);

	// hand off to `jetpack_require_lib`, if possible.
	if ( in_array( $slug, $in_jetpack, true ) && function_exists( 'jetpack_require_lib' ) ) {
		return jetpack_require_lib( $slug );
	}

	$basename = basename( $slug );

	$lib_dir = __DIR__ . '/lib';

	/**
	 * Filter the location of the library directory.
	 *
	 * @since 2.5.0
	 *
	 * @param string $lib_dir Path to the library directory.
	 */
	$lib_dir = apply_filters( 'require_lib_dir', $lib_dir );

	$choices = array(
		"$lib_dir/$slug.php",
		"$lib_dir/$slug/0-load.php",
		"$lib_dir/$slug/$basename.php",
	);
	foreach ( $choices as $file_name ) {
		if ( is_readable( $file_name ) ) {
			require_once $file_name;
			return;
		}
	}
}

/**
 * Provides a fallback Google Maps API key when otherwise not configured by the
 * user. This is subject to a usage quota.
 *
 * @see p5j4vm-1gT-p2
 *
 * @param string $api_key Google Maps API key
 * @return string Google Maps API key
 */
function wpcomsh_google_maps_api_key( $api_key ) {
	// Fall back to the dotcom API key if the user has not set their own.
	return ( empty( $api_key ) ) ? 'AIzaSyCq4vWNv6eCGe2uvhPRGWQlv80IQp8dwTE' : $api_key;
}
add_filter( 'jetpack_google_maps_api_key', 'wpcomsh_google_maps_api_key' );


/**
 * We have some instances where `track_number` of an audio attachment is `??0` and shows up as type string.
 * However the problem is, that if post has nested property attachments with this track_number, `json_serialize` fails silently.
 * Of course, this should be fixed during audio upload, but we need this fix until we can clean this up properly.
 * More detail here: 235-gh-Automattic/automated-transfer
 *
 * @param array $exif_data The file exif data
 *
 * @return array
 */
function wpcomsh_jetpack_api_fix_unserializable_track_number( $exif_data ) {
	if ( isset( $exif_data['track_number'] ) ) {
		$exif_data['track_number'] = intval( $exif_data['track_number'] );
	}
	return $exif_data;
}
add_filter( 'wp_get_attachment_metadata', 'wpcomsh_jetpack_api_fix_unserializable_track_number' );

// Jetpack for Atomic sites are always production version
add_filter( 'jetpack_development_version', '__return_false' );

/**
 * Make User Agent consistent with the rest of WordPress.com.
 *
 * @param mixed $agent The agent
 */
function wpcomsh_filter_outgoing_user_agent( $agent ) {
	global $wp_version;

	return str_replace( "WordPress/$wp_version", 'WordPress.com', $agent );
}
add_filter( 'http_headers_useragent', 'wpcomsh_filter_outgoing_user_agent', 999 );

/**
 * Allow redirects to WordPress.com from Customizer.
 *
 * @param array $hosts The hosts
 */
function wpcomsh_allowed_redirect_hosts( $hosts ) {
	if ( is_array( $hosts ) ) {
		$hosts[] = 'wordpress.com';
		$hosts[] = 'calypso.localhost';
		$hosts   = array_unique( $hosts );
	}
	return $hosts;
}
add_filter( 'allowed_redirect_hosts', 'wpcomsh_allowed_redirect_hosts', 11 );

/**
 * WP.com make clickable
 *
 * Converts all plain-text HTTP URLs in post_content to links on display
 *
 * @param string $content The content
 *
 * @uses make_clickable()
 * @since 20121125
 */
function wpcomsh_make_content_clickable( $content ) {
	// make_clickable() is expensive, check if plain-text URLs exist before running it
	// don't look inside HTML tags
	// don't look in <a></a>, <pre></pre>, <script></script> and <style></style>
	// use <div class="skip-make-clickable"> in support docs where linkifying
	// breaks shortcodes, etc.
	$_split  = preg_split( '/(<[^<>]+>)/i', $content, -1, PREG_SPLIT_DELIM_CAPTURE );
	$end     = '';
	$out     = '';
	$combine = '';
	$split   = array();

	// filter the array and combine <a></a>, <pre></pre>, <script></script> and <style></style> into one
	// (none of these tags can be nested so when we see the opening tag, we grab everything untill we reach the closing tag)
	foreach ( $_split as $chunk ) {
		if ( $chunk === '' ) {
			continue;
		}

		if ( $end ) {
			$combine .= $chunk;

			if ( $end === strtolower( str_replace( array( "\t", ' ', "\r", "\n" ), '', $chunk ) ) ) {
				$split[] = $combine;
				$end     = '';
				$combine = '';
			}
			continue;
		}

		if ( strpos( strtolower( $chunk ), '<a ' ) === 0 ) {
			$combine .= $chunk;
			$end      = '</a>';
		} elseif ( strpos( strtolower( $chunk ), '<pre' ) === 0 ) {
			$combine .= $chunk;
			$end      = '</pre>';
		} elseif ( strpos( strtolower( $chunk ), '<style' ) === 0 ) {
			$combine .= $chunk;
			$end      = '</style>';
		} elseif ( strpos( strtolower( $chunk ), '<script' ) === 0 ) {
			$combine .= $chunk;
			$end      = '</script>';
		} elseif ( strpos( strtolower( $chunk ), '<div class="skip-make-clickable' ) === 0 ) {
			$combine .= $chunk;
			$end      = '</div>';
		} elseif ( strpos( strtolower( $chunk ), '<textarea' ) === 0 ) {
			$combine .= $chunk;
			$end      = '</textarea>';
		} else {
			$split[] = $chunk;
		}
	}

	foreach ( $split as $chunk ) {
		// if $chunk is white space or a tag (or a combined tag), add it and continue
		if ( preg_match( '/^\s+$/', $chunk ) || ( $chunk[0] === '<' && $chunk[ strlen( $chunk ) - 1 ] === '>' ) ) {
			$out .= $chunk;
			continue;
		}

		// three strpos() are faster than one preg_match() here. If we need to check for more protocols, preg_match() would probably be better
		if ( strpos( $chunk, 'http://' ) !== false || strpos( $chunk, 'https://' ) !== false || strpos( $chunk, 'www.' ) !== false ) {
			// looks like there is a plain-text url
			$out .= make_clickable( $chunk );
		} else {
			$out .= $chunk;
		}
	}

	return $out;
}
add_filter( 'the_content', 'wpcomsh_make_content_clickable', 120 );
add_filter( 'the_excerpt', 'wpcomsh_make_content_clickable', 120 );

/**
 * Hide scan threats from transients
 *
 * @param mixed $response The response
 *
 * @return mixed
 */
function wpcomsh_hide_scan_threats_from_transients( $response ) {
	if ( ! empty( $response->threats ) ) {
		$response->threats = array();
	}
	return $response;
}
add_filter( 'transient_jetpack_scan_state', 'wpcomsh_hide_scan_threats_from_transients' );

/**
 * Hide scan threats from api
 *
 * @param mixed $response The reponse
 *
 * @return mixed
 */
function wpcom_hide_scan_threats_from_api( $response ) {
	if (
		! ( $response instanceof WP_REST_Response )
		|| $response->get_matched_route() !== '/jetpack/v4/scan'
	) {
		return $response;
	}
	$response_data = $response->get_data();
	if ( empty( $response_data['data'] ) || ! is_string( $response_data['data'] ) ) {
		return $response;
	}

	$json_body = json_decode( $response_data['data'], true );
	if ( null === $json_body || empty( $json_body['threats'] ) ) {
		return $response;
	}

	$json_body['threats']  = array();
	$response_data['data'] = wp_json_encode( $json_body );
	$response->set_data( $response_data );

	return $response;
}
add_filter( 'rest_post_dispatch', 'wpcom_hide_scan_threats_from_api' );

/**
 * Collect RUM performance data
 * p9o2xV-XY-p2
 */
function wpcomsh_footer_rum_js() {
	$service      = 'atomic';
	$allow_iframe = '';
	if ( 'admin_footer' === current_action() ) {
		global $pagenow;

		$service = 'atomic-wpadmin';

		if ( method_exists( 'Jetpack_WPCOM_Block_Editor', 'init' ) ) {
			$block_editor = Jetpack_WPCOM_Block_Editor::init();
			if ( $block_editor->is_iframed_block_editor() ) {
				$service      = 'atomic-gutenframe';
				$allow_iframe = 'data-allow-iframe="true"';
			}
		}
	}

	printf(
		'<script defer id="bilmur" data-provider="wordpress.com" data-service="%1$s" %2$s src="%3$s"></script>' . "\n", //phpcs:ignore WordPress.WP.EnqueuedResources.NonEnqueuedScript
		esc_attr( $service ),
		wp_kses_post( $allow_iframe ),
		esc_url( 'https://s0.wp.com/wp-content/js/bilmur.min.js?m=' . gmdate( 'YW' ) )
	);
}
add_action( 'wp_footer', 'wpcomsh_footer_rum_js' );
add_action( 'admin_footer', 'wpcomsh_footer_rum_js' );

add_filter( 'amp_dev_tools_user_default_enabled', '__return_false' );

/**
 * Tracks helper. Filters Jetpack TOS option if class exists.
 *
 * @param mixed $event The event
 * @param mixed $event_properties The event property
 *
 * @return void
 */
function wpcomsh_record_tracks_event( $event, $event_properties ) {
	if ( class_exists( '\Automattic\Jetpack\Tracking' ) ) {
		// User has to agree to ToS for tracking. Thing is, on initial Simple -> Atomic we never set the ToS option.
		// And since they agreed to WP.com ToS, we can track but in a roundabout way. :)
		add_filter( 'jetpack_options', 'wpcomsh_jetpack_filter_tos_for_tracking', 10, 2 );

		$jetpack_tracks = new \Automattic\Jetpack\Tracking( 'atomic' );
		$jetpack_tracks->tracks_record_event(
			wp_get_current_user(),
			$event,
			$event_properties
		);

		remove_filter( 'jetpack_options', 'wpcomsh_jetpack_filter_tos_for_tracking', 10 );
	}
}

/**
 * Helper for filtering tos_agreed for tracking purposes.
 * Explicit function so it can be removed afterwards.
 *
 * @param mixed $value The value
 * @param mixed $name Name
 *
 * @return mixed
 */
function wpcomsh_jetpack_filter_tos_for_tracking( $value, $name ) {
	if ( 'tos_agreed' === $name ) {
		return true;
	}

	return $value;
}

/**
 * Avoid proxied v2 banner
 *
 * @return void
 */
function wpcomsh_avoid_proxied_v2_banner() {
	$priority = has_action( 'wp_footer', 'atomic_proxy_bar' );
	if ( false !== $priority ) {
		remove_action( 'wp_footer', 'atomic_proxy_bar', $priority );
	}

	$priority = has_action( 'admin_footer', 'atomic_proxy_bar' );
	if ( false !== $priority ) {
		remove_action( 'admin_footer', 'atomic_proxy_bar', $priority );
	}
}

// We don't want to show a "PROXIED V2" banner for legacy widget previews
// which are normally embedded within another page
if (
	defined( 'AT_PROXIED_REQUEST' ) && AT_PROXIED_REQUEST &&
	isset( $_GET['legacy-widget-preview'] ) && //phpcs:ignore WordPress.Security.NonceVerification
	0 === strncmp( $_SERVER['REQUEST_URI'], '/wp-admin/widgets.php?', strlen( '/wp-admin/widgets.php?' ) ) ) { //phpcs:ignore WordPress.Security.ValidatedSanitizedInput
	add_action( 'plugins_loaded', 'wpcomsh_avoid_proxied_v2_banner' );
}
