<?php
/**
 * Module Name: Site Stats
 * Module Description: Collect valuable traffic stats and insights.
 * Sort Order: 1
 * Recommendation Order: 2
 * First Introduced: 1.1
 * Requires Connection: Yes
 * Auto Activate: Yes
 * Module Tags: Site Stats, Recommended
 * Feature: Engagement
 * Additional Search Queries: statistics, tracking, analytics, views, traffic, stats
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Connection\Client;
use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Connection\XMLRPC_Async_Call;
use Automattic\Jetpack\Redirect;
use Automattic\Jetpack\Stats\Main as Stats;
use Automattic\Jetpack\Stats\Options as Stats_Options;
use Automattic\Jetpack\Stats\Tracking_Pixel as Stats_Tracking_Pixel;
use Automattic\Jetpack\Stats\XMLRPC_Provider as Stats_XMLRPC;
use Automattic\Jetpack\Tracking;

if ( defined( 'STATS_DASHBOARD_SERVER' ) ) {
	return;
}

define( 'STATS_DASHBOARD_SERVER', 'dashboard.wordpress.com' );

add_action( 'jetpack_modules_loaded', 'stats_load' );

/**
 * Load Stats.
 *
 * @access public
 * @return void
 */
function stats_load() {
	Jetpack::enable_module_configurable( __FILE__ );

	add_action( 'wp_head', 'stats_admin_bar_head', 100 );

	add_action( 'jetpack_admin_menu', 'stats_admin_menu' );

	add_action( 'admin_init', 'stats_merged_widget_admin_init' );

	add_filter( 'pre_option_db_version', 'stats_ignore_db_version' );

	// Add an icon to see stats in WordPress.com for a particular post.
	add_action( 'admin_print_styles-edit.php', 'jetpack_stats_load_admin_css' );
	add_filter( 'manage_posts_columns', 'jetpack_stats_post_table' );
	add_filter( 'manage_pages_columns', 'jetpack_stats_post_table' );
	add_action( 'manage_posts_custom_column', 'jetpack_stats_post_table_cell', 10, 2 );
	add_action( 'manage_pages_custom_column', 'jetpack_stats_post_table_cell', 10, 2 );
	// Filter for adding the Jetpack plugin version to tracking stats.
	add_filter( 'stats_array', 'filter_stats_array_add_jp_version' );

	require_once __DIR__ . '/stats/class-jetpack-stats-upgrade-nudges.php';
	add_action( 'updating_jetpack_version', array( 'Jetpack_Stats_Upgrade_Nudges', 'unset_nudges_setting' ) );
}

/**
 * Delay conditional for current_user_can to after init.
 *
 * @access public
 * @return void
 */
function stats_merged_widget_admin_init() {
	if ( current_user_can( 'view_stats' ) ) {
		add_action( 'load-index.php', 'stats_enqueue_dashboard_head' );
		add_action( 'jetpack_dashboard_widget', 'stats_jetpack_dashboard_widget' );
	}
}

/**
 * Enqueue Stats Dashboard
 *
 * @access public
 * @return void
 */
function stats_enqueue_dashboard_head() {
	add_action( 'admin_head', 'stats_dashboard_head' );
}

/**
 * Checks if filter is set and dnt is enabled.
 *
 * @deprecated 11.5
 * @return bool
 */
function jetpack_is_dnt_enabled() {
	_deprecated_function( __METHOD__, 'jetpack-11.5', 'Automattic\Jetpack\Stats\Main::jetpack_is_dnt_enabled' );
	return Stats::jetpack_is_dnt_enabled();
}

/**
 * Prevent sparkline img requests being redirected to upgrade.php.
 * See wp-admin/admin.php where it checks $wp_db_version.
 *
 * @access public
 * @param mixed $version Version.
 * @return string $version.
 */
function stats_ignore_db_version( $version ) {
	if (
		is_admin() &&
		isset( $_GET['page'] ) && 'stats' === $_GET['page'] && // phpcs:ignore WordPress.Security.NonceVerification.Recommended
		isset( $_GET['chart'] ) && strpos( $_GET['chart'], 'admin-bar-hours' ) === 0 // phpcs:ignore WordPress.Security.NonceVerification.Recommended, WordPress.Security.ValidatedSanitizedInput
	) {
		global $wp_db_version;
		return $wp_db_version;
	}
	return $version;
}

/**
 * Maps view_stats cap to read cap as needed.
 *
 * @deprecated 11.5
 *
 * @access public
 * @param mixed $caps Caps.
 * @param mixed $cap Cap.
 * @param mixed $user_id User ID.
 * @return array Possibly mapped capabilities for meta capability.
 */
function stats_map_meta_caps( $caps, $cap, $user_id ) {
	_deprecated_function( __METHOD__, 'jetpack-11.5', 'Automattic\Jetpack\Stats\Main::map_meta_caps' );
	return Stats::map_meta_caps( $caps, $cap, $user_id );
}

/**
 * Stats Template Redirect.
 *
 * @deprecated 11.5
 * @access public
 * @return void
 */
function stats_template_redirect() {
	_deprecated_function( __METHOD__, 'jetpack-11.5', 'Automattic\Jetpack\Stats\Main::template_redirect' );
	Stats::template_redirect();

}

/**
 * Stats Build View Data.
 *
 * @deprecated 11.5
 * @access public
 * @return array.
 */
function stats_build_view_data() {
	_deprecated_function( __METHOD__, 'jetpack-11.5', 'Automattic\Jetpack\Stats\Tracking_Pixel::build_view_data' );
	return Stats_Tracking_Pixel::build_view_data();
}

/**
 * Stats Footer.
 *
 * @deprecated 11.5
 * @access public
 * @return void
 */
function stats_footer() {
	_deprecated_function( __METHOD__, 'jetpack-11.5', 'Automattic\Jetpack\Stats\Tracking_Pixel::add_to_footer' );
	Stats_Tracking_Pixel::add_to_footer();

}

/**
 * Render the stats footer
 *
 * @deprecated 11.5
 *
 * @param array $data Array of data for the JS stats tracker.
 */
function stats_render_footer( $data ) {
	_deprecated_function( __METHOD__, 'jetpack-11.5', 'Automattic\Jetpack\Stats\Tracking_Pixel::render_footer' );
	Stats_Tracking_Pixel::render_footer( $data );
}

/**
 * Render the stats footer for AMP output.
 *
 * @deprecated 11.5
 *
 * @param array $data Array of data for the AMP pixel tracker.
 */
function stats_render_amp_footer( $data ) {
	_deprecated_function( __METHOD__, 'jetpack-11.5', 'Automattic\Jetpack\Stats\Tracking_Pixel::render_amp_footer' );
	Stats_Tracking_Pixel::render_amp_footer( $data );
}

/**
 * Stats Get Options.
 *
 * @deprecated 11.5
 *
 * @access public
 * @return array.
 */
function stats_get_options() {
	_deprecated_function( __METHOD__, 'jetpack-11.5', 'Automattic\Jetpack\Stats\Options::get_options' );
	return Stats_Options::get_options();
}

/**
 * Get Stats Options.
 *
 * @deprecated 11.5
 *
 * @access public
 * @param mixed $option Option.
 * @return mixed|null.
 */
function stats_get_option( $option ) {
	_deprecated_function( __METHOD__, 'jetpack-11.5', 'Automattic\Jetpack\Stats\Options::get_option' );
	return Stats_Options::get_option( $option );
}

/**
 * Stats Set Options.
 *
 * @deprecated 11.5
 *
 * @access public
 * @param mixed $option Option.
 * @param mixed $value Value.
 * @return bool.
 */
function stats_set_option( $option, $value ) {
	_deprecated_function( __METHOD__, 'jetpack-11.5', 'Automattic\Jetpack\Stats\Options::set_option' );
	return Stats_Options::set_option( $option, $value );
}

/**
 * Stats Set Options.
 *
 * @deprecated 11.5
 *
 * @access public
 * @param mixed $options Options.
 * @return bool
 */
function stats_set_options( $options ) {
	_deprecated_function( __METHOD__, 'jetpack-11.5', 'Automattic\Jetpack\Stats\Options::set_options' );
	return Stats_Options::set_options( $options );
}

/**
 * Stats Upgrade Options.
 *
 * @deprecated 11.5
 *
 * @access public
 * @param mixed $options Options.
 * @return array|bool
 */
function stats_upgrade_options( $options ) {
	_deprecated_function( __METHOD__, 'jetpack-11.5', 'Automattic\Jetpack\Stats\Options::upgrade_options' );
	return Stats_Options::upgrade_options( $options );
}

/**
 * Admin Pages.
 *
 * @access public
 * @return void
 */
function stats_admin_menu() {
	global $pagenow;

	// If we're at an old Stats URL, redirect to the new one.
	// Don't even bother with caps, menu_page_url(), etc.  Just do it.
	if ( 'index.php' === $pagenow && isset( $_GET['page'] ) && 'stats' === $_GET['page'] ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
		$redirect_url = str_replace( array( '/wp-admin/index.php?', '/wp-admin/?' ), '/wp-admin/admin.php?', isset( $_SERVER['REQUEST_URI'] ) ? filter_var( wp_unslash( $_SERVER['REQUEST_URI'] ) ) : null );
		$relative_pos = strpos( $redirect_url, '/wp-admin/' );
		if ( false !== $relative_pos ) {
			wp_safe_redirect( admin_url( substr( $redirect_url, $relative_pos + 10 ) ) );
			exit;
		}
	}

	$hook = add_submenu_page( 'jetpack', __( 'Stats', 'jetpack' ), __( 'Stats', 'jetpack' ), 'view_stats', 'stats', 'jetpack_admin_ui_stats_report_page_wrapper' );
	add_action( "load-$hook", 'stats_reports_load' );
}

/**
 * Stats Admin Path.
 *
 * @access public
 * @return string
 */
function stats_admin_path() {
	return Jetpack::module_configuration_url( __FILE__ );
}

/**
 * Stats Reports Load.
 *
 * @access public
 * @return void
 */
function stats_reports_load() {
	require_once __DIR__ . '/stats/class-jetpack-stats-upgrade-nudges.php';
	Jetpack_Stats_Upgrade_Nudges::init();

	wp_enqueue_script( 'jquery' );
	wp_enqueue_script( 'postbox' );
	wp_enqueue_script( 'underscore' );

	Jetpack_Admin_Page::load_wrapper_styles();
	add_action( 'admin_print_styles', 'stats_reports_css' );

	if ( ! empty( $_GET['nojs'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
		$parsed = wp_parse_url( admin_url() );
		// Remember user doesn't want JS.
		setcookie( 'stnojs', '1', time() + 172800, $parsed['path'], COOKIE_DOMAIN, is_ssl(), true ); // 2 days.
	}

	if ( ! empty( $_COOKIE['stnojs'] ) ) {
		// Detect if JS is on.  If so, remove cookie so next page load is via JS.
		add_action( 'admin_print_footer_scripts', 'stats_js_remove_stnojs_cookie' );
	} elseif ( ! isset( $_GET['noheader'] ) && empty( $_GET['nojs'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
		// Normal page load.  Load page content via JS.
		add_action( 'admin_print_footer_scripts', 'stats_js_load_page_via_ajax' );
	}
}

/**
 * Stats Reports CSS.
 *
 * @access public
 * @return void
 */
function stats_reports_css() {
	?>
<style type="text/css">
#jp-stats-wrap, #jp-stats-report-bottom {
	max-width: 1040px;
	margin: 0 auto;
	overflow: hidden;
}

#stats-loading-wrap p {
	text-align: center;
	font-size: 2em;
	margin: 7.5em 15px 0 0;
	height: 64px;
	line-height: 64px;
}
</style>
	<?php
}

/**
 * Detect if JS is on.  If so, remove cookie so next page load is via JS.
 *
 * @access public
 * @return void
 */
function stats_js_remove_stnojs_cookie() {
	$parsed = wp_parse_url( admin_url() );
	?>
<script type="text/javascript">
/* <![CDATA[ */
document.cookie = 'stnojs=0; expires=Wed, 9 Mar 2011 16:55:50 UTC; path=<?php echo esc_js( $parsed['path'] ); ?>';
/* ]]> */
</script>
	<?php
}

/**
 * Normal page load.  Load page content via JS.
 *
 * @access public
 * @return void
 */
function stats_js_load_page_via_ajax() {
	?>
<script type="text/javascript">
/* <![CDATA[ */
if ( -1 == document.location.href.indexOf( 'noheader' ) ) {
	jQuery( function( $ ) {
		$.get( document.location.href + '&noheader', function( responseText ) {
			$( '#stats-loading-wrap' ).replaceWith( responseText );
			$( '#jp-stats-wrap' )[0].dispatchEvent( new Event( 'stats-loaded' ) );
		} );
	} );
}
/* ]]> */
</script>
	<?php
}

/**
 * Jetpack Admin Page Wrapper.
 */
function jetpack_admin_ui_stats_report_page_wrapper() {
	if ( ! isset( $_GET['noheader'] ) && empty( $_GET['nojs'] ) && empty( $_COOKIE['stnojs'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
		Jetpack_Admin_Page::wrap_ui( 'stats_reports_page', array( 'is-wide' => true ) );
	} else {
		stats_reports_page();
	}

}

/**
 * Stats Report Page.
 *
 * @access public
 * @param bool $main_chart_only (default: false) Main Chart Only.
 */
function stats_reports_page( $main_chart_only = false ) {

	if ( isset( $_GET['dashboard'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
		return stats_dashboard_widget_content();
	}

	$blog_id   = Stats_Options::get_option( 'blog_id' );
	$stats_url = Redirect::get_url( 'calypso-stats' );

	if ( ! $main_chart_only && ! isset( $_GET['noheader'] ) && empty( $_GET['nojs'] ) && empty( $_COOKIE['stnojs'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
		$nojs_url = add_query_arg( 'nojs', '1' );
		$http     = is_ssl() ? 'https' : 'http';
		// Loading message. No JS fallback message.
		?>

	<div id="jp-stats-wrap">
		<div class="wrap">
			<h1><?php esc_html_e( 'Jetpack Stats', 'jetpack' ); ?>
			<?php
			if ( current_user_can( 'jetpack_manage_modules' ) ) :
				$i18n_headers = jetpack_get_module_i18n( 'stats' );
				?>
				<a
					style="font-size:13px;"
					href="<?php echo esc_url( admin_url( 'admin.php?page=jetpack#/settings?term=' . rawurlencode( $i18n_headers['name'] ) ) ); ?>"
				>
				<?php esc_html_e( 'Configure', 'jetpack' ); ?>
				</a>
				<?php
				endif;

			/**
			 * Sets external resource URL.
			 *
			 * @module stats
			 *
			 * @since 1.4.0
			 * @todo Clean up various uses of this filter. It's seemingly filtering different types of images in different places.
			 *
			 * @param string $args URL of external resource.
			 */
			$static_url = apply_filters( 'jetpack_static_url', "{$http}://en.wordpress.com/i/loading/loading-64.gif" );
			?>
			</h2>
		</div>
		<div id="stats-loading-wrap" class="wrap">
		<p class="hide-if-no-js"><img width="32" height="32" alt="<?php esc_attr_e( 'Loading&hellip;', 'jetpack' ); ?>" src="<?php echo esc_url( $static_url ); ?>" /></p>
		<p style="font-size: 11pt; margin: 0;"><a href="<?php echo esc_url( $stats_url ); ?>" rel="noopener noreferrer" target="_blank"><?php esc_html_e( 'View stats on WordPress.com right now', 'jetpack' ); ?></a></p>
		<p class="hide-if-js"><?php esc_html_e( 'Your Site Stats work better with JavaScript enabled.', 'jetpack' ); ?><br />
		<a href="<?php echo esc_url( $nojs_url ); ?>"><?php esc_html_e( 'View Site Stats without JavaScript', 'jetpack' ); ?></a>.</p>
		</div>
	</div>
		<?php
		return;
	}

	$day = isset( $_GET['day'] ) && preg_match( '/^\d{4}-\d{2}-\d{2}$/', $_GET['day'] ) ? $_GET['day'] : false; // phpcs:ignore WordPress.Security.NonceVerification.Recommended, WordPress.Security.ValidatedSanitizedInput
	$q   = array(
		'noheader' => 'true',
		'proxy'    => '',
		'page'     => 'stats',
		'day'      => $day,
		'blog'     => $blog_id,
		'charset'  => get_option( 'blog_charset' ),
		'color'    => get_user_option( 'admin_color' ),
		'ssl'      => is_ssl(),
		'j'        => sprintf( '%s:%s', JETPACK__API_VERSION, JETPACK__VERSION ),
	);
	if ( get_locale() !== 'en_US' ) {
		$q['jp_lang'] = get_locale();
	}
	// Only show the main chart, without extra header data, or metaboxes.
	$q['main_chart_only'] = $main_chart_only;
	$args                 = array(
		'view'                => array( 'referrers', 'postviews', 'searchterms', 'clicks', 'post', 'table' ),
		'numdays'             => 'int',
		'day'                 => 'date',
		'unit'                => array( '1', '7', '31', 'human' ),
		'humanize'            => array( 'true' ),
		'num'                 => 'int',
		'summarize'           => null,
		'post'                => 'int',
		'width'               => 'int',
		'height'              => 'int',
		'data'                => 'data',
		'blog_subscribers'    => 'int',
		'comment_subscribers' => null,
		'type'                => array( 'wpcom', 'email', 'pending' ),
		'pagenum'             => 'int',
		'masterbar'           => null,
	);
	foreach ( $args as $var => $vals ) {
		if ( ! isset( $_REQUEST[ $var ] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
			continue;
		}
		$val = wp_unslash( $_REQUEST[ $var ] ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended, WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
		if ( is_array( $vals ) ) {
			if ( in_array( $val, $vals, true ) ) {
				$q[ $var ] = $val;
			}
		} elseif ( 'int' === $vals ) {
			$q[ $var ] = (int) $val;
		} elseif ( 'date' === $vals ) {
			if ( preg_match( '/^\d{4}-\d{2}-\d{2}$/', $val ) ) {
				$q[ $var ] = $val;
			}
		} elseif ( null === $vals ) {
			$q[ $var ] = '';
		} elseif ( 'data' === $vals ) {
			if ( 'index.php' === substr( $val, 0, 9 ) ) {
				$q[ $var ] = $val;
			}
		}
	}

	if ( isset( $_GET['chart'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
		if ( preg_match( '/^[a-z0-9-]+$/', $_GET['chart'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended, WordPress.Security.ValidatedSanitizedInput
			$chart = sanitize_title( $_GET['chart'] ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended, WordPress.Security.ValidatedSanitizedInput
			$url   = 'https://' . STATS_DASHBOARD_SERVER . "/wp-includes/charts/{$chart}.php";
		}
	} else {
		$url = 'https://' . STATS_DASHBOARD_SERVER . '/wp-admin/index.php';
	}

	$url     = add_query_arg( $q, $url );
	$method  = 'GET';
	$timeout = 90;
	$user_id = 0; // Means use the blog token.

	$get      = Client::remote_request( compact( 'url', 'method', 'timeout', 'user_id' ) );
	$get_code = wp_remote_retrieve_response_code( $get );
	if ( is_wp_error( $get ) || ( 2 !== (int) ( $get_code / 100 ) && 304 !== $get_code ) || empty( $get['body'] ) ) {
		stats_print_wp_remote_error( $get, $url );
	} else {
		if ( ! empty( $get['headers']['content-type'] ) ) {
			$type = $get['headers']['content-type'];
			if ( substr( $type, 0, 5 ) === 'image' ) {
				$img = $get['body'];
				header( 'Content-Type: ' . $type );
				header( 'Content-Length: ' . strlen( $img ) );
				echo $img; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
				die();
			}
		}
		$body = stats_convert_post_titles( $get['body'] );
		$body = stats_convert_chart_urls( $body );
		$body = stats_convert_image_urls( $body );
		$body = stats_convert_admin_urls( $body );
		echo $body; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	}

	if ( isset( $_GET['page'] ) && 'stats' === $_GET['page'] && ! isset( $_GET['chart'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
		$tracking = new Tracking();
		$tracking->record_user_event( 'wpa_page_view', array( 'path' => 'old_stats' ) );
	}

	if ( isset( $_GET['noheader'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
		die;
	}
}

/**
 * Stats Convert Admin Urls.
 *
 * @access public
 * @param mixed $html HTML.
 * @return string
 */
function stats_convert_admin_urls( $html ) {
	return str_replace( 'index.php?page=stats', 'admin.php?page=stats', $html );
}

/**
 * Stats Convert Image URLs.
 *
 * @access public
 * @param mixed $html HTML.
 * @return string
 */
function stats_convert_image_urls( $html ) {
	$url  = set_url_scheme( 'https://' . STATS_DASHBOARD_SERVER );
	$html = preg_replace( '|(["\'])(/i/stats.+)\\1|', '$1' . $url . '$2$1', $html );
	return $html;
}

/**
 * Callback for preg_replace_callback used in stats_convert_chart_urls()
 *
 * @since 5.6.0
 *
 * @param  array $matches The matches resulting from the preg_replace_callback call.
 * @return string          The admin url for the chart.
 */
function jetpack_stats_convert_chart_urls_callback( $matches ) {
	// If there is a query string, change the beginning '?' to a '&' so it fits into the middle of this query string.
	return 'admin.php?page=stats&noheader&chart=' . $matches[1] . str_replace( '?', '&', $matches[2] );
}

/**
 * Stats Convert Chart URLs.
 *
 * @access public
 * @param mixed $html HTML.
 * @return string
 */
function stats_convert_chart_urls( $html ) {
	$html = preg_replace_callback(
		'|https?://[-.a-z0-9]+/wp-includes/charts/([-.a-z0-9]+).php(\??)|',
		'jetpack_stats_convert_chart_urls_callback',
		$html
	);
	return $html;
}

/**
 * Stats Convert Post Title HTML
 *
 * @access public
 * @param mixed $html HTML.
 * @return string
 */
function stats_convert_post_titles( $html ) {
	global $stats_posts;
	$pattern = "<span class='post-(\d+)-link'>.*?</span>";
	if ( ! preg_match_all( "!$pattern!", $html, $matches ) ) {
		return $html;
	}
	$posts = get_posts(
		array(
			'include'          => implode( ',', $matches[1] ),
			'post_type'        => 'any',
			'post_status'      => 'any',
			'numberposts'      => -1,
			'suppress_filters' => false,
		)
	);
	foreach ( $posts as $post ) {
		$stats_posts[ $post->ID ] = $post;
	}
	$html = preg_replace_callback( "!$pattern!", 'stats_convert_post_title', $html );
	return $html;
}

/**
 * Stats Convert Post Title Matches.
 *
 * @access public
 * @param mixed $matches Matches.
 * @return string
 */
function stats_convert_post_title( $matches ) {
	global $stats_posts;
	$post_id = $matches[1];
	if ( isset( $stats_posts[ $post_id ] ) ) {
		return '<a href="' . get_permalink( $post_id ) . '" target="_blank">' . get_the_title( $post_id ) . '</a>';
	}
	return $matches[0];
}

/**
 * CSS to hide the tracking pixel smiley.
 * It is now hidden for everyone (used to be visible if you had set the hide_smile option).
 *
 * @access public
 * @return void
 */
function stats_hide_smile_css() {
	?>
<style>img#wpstats{display:none}</style>
	<?php
}

/**
 * Stats Admin Bar Head.
 *
 * @access public
 * @return void
 */
function stats_admin_bar_head() {
	if ( ! Stats_Options::get_option( 'admin_bar' ) ) {
		return;
	}

	if ( ! current_user_can( 'view_stats' ) ) {
		return;
	}

	if ( ! is_admin_bar_showing() ) {
		return;
	}

	add_action( 'admin_bar_menu', 'stats_admin_bar_menu', 100 );
	?>

<style data-ampdevmode type='text/css'>
#wpadminbar .quicklinks li#wp-admin-bar-stats {
	height: 32px;
}
#wpadminbar .quicklinks li#wp-admin-bar-stats a {
	height: 32px;
	padding: 0;
}
#wpadminbar .quicklinks li#wp-admin-bar-stats a div {
	height: 32px;
	width: 95px;
	overflow: hidden;
	margin: 0 10px;
}
#wpadminbar .quicklinks li#wp-admin-bar-stats a:hover div {
	width: auto;
	margin: 0 8px 0 10px;
}
#wpadminbar .quicklinks li#wp-admin-bar-stats a img {
	height: 24px;
	margin: 4px 0;
	max-width: none;
	border: none;
}
</style>
	<?php
}

/**
 * Gets the image source of the given stats chart.
 *
 * @param string $chart Name of the chart.
 * @param array  $args Extra list of argument to use in the image source.
 * @return string An image source.
 */
function stats_get_image_chart_src( $chart, $args = array() ) {
	$url = add_query_arg( 'page', 'stats', admin_url( 'admin.php' ) );

	return add_query_arg(
		array_merge(
			array(
				'noheader' => '',
				'proxy'    => '',
				'chart'    => $chart,
			),
			$args
		),
		$url
	);
}

/**
 * Stats AdminBar.
 *
 * @access public
 * @param mixed $wp_admin_bar WPAdminBar.
 * @return void
 */
function stats_admin_bar_menu( &$wp_admin_bar ) {
	$img_src    = esc_attr( stats_get_image_chart_src( 'admin-bar-hours-scale' ) );
	$img_src_2x = esc_attr( stats_get_image_chart_src( 'admin-bar-hours-scale-2x' ) );
	$alt        = esc_attr( __( 'Stats', 'jetpack' ) );
	$title      = esc_attr( __( 'Views over 48 hours. Click for more Site Stats.', 'jetpack' ) );

	$menu = array(
		'id'    => 'stats',
		'href'  => add_query_arg( 'page', 'stats', admin_url( 'admin.php' ) ), // no menu_page_url() blog-side.
		'title' => "<div><img src='$img_src' srcset='$img_src 1x, $img_src_2x 2x' width='112' height='24' alt='$alt' title='$title'></div>",
	);

	$wp_admin_bar->add_menu( $menu );
}

/**
 *
 * Deprecated. The stats module should not update blog details. This is handled by Sync.
 *
 * Stats Update Blog.
 *
 * @access public
 * @return void
 *
 * @deprecated since 10.3.
 */
function stats_update_blog() {
	_deprecated_function( __METHOD__, 'jetpack-10.3' );
	XMLRPC_Async_Call::add_call( 'jetpack.updateBlog', 0, stats_get_blog() );
}

/**
 * Stats Get Blog.
 *
 * @deprecated 11.5
 *
 * @access public
 * @return string
 */
function stats_get_blog() {
	_deprecated_function( __METHOD__, 'jetpack-11.5' );
	return Stats_XMLRPC::init()->get_blog();
}

/**
 * Stats Dashboard Widget Options.
 *
 * @access public
 * @return array
 */
function stats_dashboard_widget_options() {
	$defaults = array(
		'chart'  => 1,
		'top'    => 1,
		'search' => 7,
	);
	$options  = get_option( 'stats_dashboard_widget' );
	if ( ( ! $options ) || ! is_array( $options ) ) {
		$options = array();
	}

	// Ignore obsolete option values.
	$intervals = array( 1, 7, 31, 90, 365 );
	foreach ( array( 'top', 'search' ) as $key ) {
		if ( isset( $options[ $key ] ) && ! in_array( (int) $options[ $key ], $intervals, true ) ) {
			unset( $options[ $key ] );
		}
	}

		return array_merge( $defaults, $options );
}

/**
 * Stats Dashboard Widget Control.
 *
 * @access public
 * @return void
 */
function stats_dashboard_widget_control() {
	$periods   = array(
		'1'  => __( 'day', 'jetpack' ),
		'7'  => __( 'week', 'jetpack' ),
		'31' => __( 'month', 'jetpack' ),
	);
	$intervals = array(
		'1'   => __( 'the past day', 'jetpack' ),
		'7'   => __( 'the past week', 'jetpack' ),
		'31'  => __( 'the past month', 'jetpack' ),
		'90'  => __( 'the past quarter', 'jetpack' ),
		'365' => __( 'the past year', 'jetpack' ),
	);
	$defaults  = array(
		'top'    => 1,
		'search' => 7,
	);

	$options = stats_dashboard_widget_options();

	if ( isset( $_SERVER['REQUEST_METHOD'] ) && 'post' === strtolower( filter_var( wp_unslash( $_SERVER['REQUEST_METHOD'] ) ) ) && isset( $_POST['stats_id'] ) && 'dashboard_stats' === $_POST['stats_id'] ) { // phpcs:ignore WordPress.Security.NonceVerification
		if ( isset( $periods[ $_POST['chart'] ] ) ) { // phpcs:ignore WordPress.Security.NonceVerification
			$options['chart'] = filter_var( wp_unslash( $_POST['chart'] ) ); // phpcs:ignore WordPress.Security.NonceVerification
		}
		foreach ( array( 'top', 'search' ) as $key ) {
			if ( isset( $intervals[ $_POST[ $key ] ] ) ) { // phpcs:ignore WordPress.Security.NonceVerification
				$options[ $key ] = filter_var( wp_unslash( $_POST[ $key ] ) ); // phpcs:ignore WordPress.Security.NonceVerification
			} else {
				$options[ $key ] = $defaults[ $key ];
			}
		}
		update_option( 'stats_dashboard_widget', $options );
	}
	?>
	<p>
	<label for="chart"><?php esc_html_e( 'Chart stats by', 'jetpack' ); ?></label>
	<select id="chart" name="chart">
	<?php
	foreach ( $periods as $val => $label ) {
		?>
		<option value="<?php echo esc_attr( $val ); ?>"<?php selected( $val, $options['chart'] ); ?>><?php echo esc_html( $label ); ?></option>
		<?php
	}
	?>
	</select>.
	</p>

	<p>
	<label for="top"><?php esc_html_e( 'Show top posts over', 'jetpack' ); ?></label>
	<select id="top" name="top">
	<?php
	foreach ( $intervals as $val => $label ) {
		?>
		<option value="<?php echo esc_attr( $val ); ?>"<?php selected( $val, $options['top'] ); ?>><?php echo esc_html( $label ); ?></option>
		<?php
	}
	?>
	</select>.
	</p>

	<p>
	<label for="search"><?php esc_html_e( 'Show top search terms over', 'jetpack' ); ?></label>
	<select id="search" name="search">
	<?php
	foreach ( $intervals as $val => $label ) {
		?>
		<option value="<?php echo esc_attr( $val ); ?>"<?php selected( $val, $options['search'] ); ?>><?php echo esc_html( $label ); ?></option>
		<?php
	}
	?>
	</select>.
	</p>
	<?php
}

/**
 * Jetpack Stats Dashboard Widget.
 *
 * @access public
 * @return void
 */
function stats_jetpack_dashboard_widget() {
	?>
	<form id="stats_dashboard_widget_control" action="<?php echo esc_url( admin_url() ); ?>" method="post">
		<?php stats_dashboard_widget_control(); ?>
		<?php wp_nonce_field( 'edit-dashboard-widget_dashboard_stats', 'dashboard-widget-nonce' ); ?>
		<input type="hidden" name="stats_id" value="dashboard_stats" />
		<?php submit_button( __( 'Submit', 'jetpack' ) ); ?>
	</form>
	<button type="button" class="handlediv js-toggle-stats_dashboard_widget_control" aria-expanded="true">
		<span class="screen-reader-text"><?php esc_html_e( 'Configure', 'jetpack' ); ?></span>
		<span class="toggle-indicator" aria-hidden="true"></span>
	</button>
	<div id="dashboard_stats">
		<div class="inside">
			<div style="height: 250px;"></div>
		</div>
	</div>
	<?php
}

/**
 * JavaScript and CSS for dashboard widget.
 *
 * @access public
 * @return void
 */
function stats_dashboard_head() {
	?>
<script type="text/javascript">
/* <![CDATA[ */
jQuery( function($) {
	var dashStats = jQuery( '#dashboard_stats div.inside' );

	if ( dashStats.find( '.dashboard-widget-control-form' ).length ) {
		return;
	}

	if ( ! dashStats.length ) {
		dashStats = jQuery( '#dashboard_stats div.dashboard-widget-content' );
		var h = parseInt( dashStats.parent().height() ) - parseInt( dashStats.prev().height() );
		var args = 'width=' + dashStats.width() + '&height=' + h.toString();
	} else {
		if ( jQuery('#dashboard_stats' ).hasClass('postbox') ) {
			var args = 'width=' + ( dashStats.prev().width() * 2 ).toString();
		} else {
			var args = 'width=' + ( dashStats.width() * 2 ).toString();
		}
	}

	dashStats
		.not( '.dashboard-widget-control' )
		.load( 'admin.php?page=stats&noheader&dashboard&' + args );

	jQuery( window ).one( 'resize', function() {
		jQuery( '#stat-chart' ).css( 'width', 'auto' );
	} );


	// Widget settings toggle container.
	var toggle = $( '.js-toggle-stats_dashboard_widget_control' );

	// Move the toggle in the widget header.
	toggle.appendTo( '#jetpack_summary_widget .handle-actions' );

	// Toggle settings when clicking on it.
	toggle.show().click( function( e ) {
		e.preventDefault();
		e.stopImmediatePropagation();
		$( this ).parent().toggleClass( 'controlVisible' );
		$( '#stats_dashboard_widget_control' ).slideToggle();
	} );
} );
/* ]]> */
</script>
	<?php
}

/**
 * Stats Dashboard Widget Content.
 *
 * @access public
 * @return void
 */
function stats_dashboard_widget_content() {
	$width  = isset( $_GET['width'] ) ? intval( $_GET['width'] ) / 2 : null; // phpcs:ignore WordPress.Security.NonceVerification.Recommended
	$height = isset( $_GET['height'] ) ? intval( $_GET['height'] ) - 36 : null; // phpcs:ignore WordPress.Security.NonceVerification.Recommended
	if ( ! $width || $width < 250 ) {
		$width = 370;
	}
	if ( ! $height || $height < 230 ) {
		$height = 180;
	}

	$_width  = $width - 5;
	$_height = $height - 5;

	$options = stats_dashboard_widget_options();
	$blog_id = Jetpack_Options::get_option( 'id' );

	$q = array(
		'noheader' => 'true',
		'proxy'    => '',
		'blog'     => $blog_id,
		'page'     => 'stats',
		'chart'    => '',
		'unit'     => $options['chart'],
		'color'    => get_user_option( 'admin_color' ),
		'width'    => $_width,
		'height'   => $_height,
		'ssl'      => is_ssl(),
		'j'        => sprintf( '%s:%s', JETPACK__API_VERSION, JETPACK__VERSION ),
	);

	$url = 'https://' . STATS_DASHBOARD_SERVER . '/wp-admin/index.php';

	$url     = add_query_arg( $q, $url );
	$method  = 'GET';
	$timeout = 90;
	$user_id = 0; // Means use the blog token.

	$get      = Client::remote_request( compact( 'url', 'method', 'timeout', 'user_id' ) );
	$get_code = wp_remote_retrieve_response_code( $get );
	if ( is_wp_error( $get ) || ( 2 !== (int) ( $get_code / 100 ) && 304 !== $get_code ) || empty( $get['body'] ) ) {
		stats_print_wp_remote_error( $get, $url );
	} else {
		$body = stats_convert_post_titles( $get['body'] );
		$body = stats_convert_chart_urls( $body );
		$body = stats_convert_image_urls( $body );
		echo $body; // phpcs:ignore WordPress.Security.EscapeOutput
	}

	$post_ids = array();

	$csv_end_date = current_time( 'Y-m-d' );
	$csv_args     = array(
		'top'    => "&limit=8&end=$csv_end_date",
		'search' => "&limit=5&end=$csv_end_date",
	);

	$top_posts = stats_get_csv( 'postviews', "days=$options[top]$csv_args[top]" );
	foreach ( $top_posts as $i => $post ) {
		if ( 0 === $post['post_id'] ) {
			unset( $top_posts[ $i ] );
			continue;
		}
		$post_ids[] = $post['post_id'];
	}

	// Cache.
	get_posts( array( 'include' => join( ',', array_unique( $post_ids ) ) ) );

	$searches     = array();
	$search_terms = stats_get_csv( 'searchterms', "days=$options[search]$csv_args[search]" );
	foreach ( $search_terms as $search_term ) {
		if ( 'encrypted_search_terms' === $search_term['searchterm'] ) {
			continue;
		}
		$searches[] = esc_html( $search_term['searchterm'] );
	}

	?>
<div id="stats-info">
	<div id="top-posts" class='stats-section'>
		<div class="stats-section-inner">
		<h3 class="heading"><?php esc_html_e( 'Top Posts', 'jetpack' ); ?></h3>
		<?php
		if ( empty( $top_posts ) ) {
			?>
			<p class="nothing"><?php esc_html_e( 'Sorry, nothing to report.', 'jetpack' ); ?></p>
			<?php
		} else {
			foreach ( $top_posts as $post ) {
				if ( ! get_post( $post['post_id'] ) ) {
					continue;
				}
				?>
				<p>
				<?php
				printf(
					esc_html(
						/* Translators: Stats dashboard widget Post list with view count: "Post Title 1 View (or Views if plural)". */
						_n( '%1$s %2$s View', '%1$s %2$s Views', $post['views'], 'jetpack' )
					),
					'<a href="' . esc_url( get_permalink( $post['post_id'] ) ) . '">' . esc_html( get_the_title( $post['post_id'] ) ) . '</a>',
					esc_html( number_format_i18n( $post['views'] ) )
				);
				?>
			</p>
				<?php
			}
		}
		?>
		</div>
	</div>
	<div id="top-search" class='stats-section'>
		<div class="stats-section-inner">
		<h3 class="heading"><?php esc_html_e( 'Top Searches', 'jetpack' ); ?></h3>
		<?php
		if ( empty( $searches ) ) {
			?>
			<p class="nothing"><?php esc_html_e( 'Sorry, nothing to report.', 'jetpack' ); ?></p>
			<?php
		} else {
			foreach ( $searches as $search_term_item ) {
				printf(
					'<p>%s</p>',
					esc_html( $search_term_item )
				);
			}
		}
		?>
		</div>
	</div>
</div>
<div class="clear"></div>
<div class="stats-view-all">
	<?php
	$stats_day_url = Redirect::get_url( 'calypso-stats-day' );
	printf(
		'<a class="button" target="_blank" rel="noopener noreferrer" href="%1$s">%2$s</a>',
		esc_url( $stats_day_url ),
		esc_html__( 'View all stats', 'jetpack' )
	);
	?>
</div>
<div class="clear"></div>
	<?php
	exit;
}

/**
 * Stats Print WP Remote Error.
 *
 * @access public
 * @param mixed $get Get.
 * @param mixed $url URL.
 * @return void
 */
function stats_print_wp_remote_error( $get, $url ) {
	$state_name     = 'stats_remote_error_' . substr( md5( $url ), 0, 8 );
	$previous_error = Jetpack::state( $state_name );
	$error          = md5( wp_json_encode( compact( 'get', 'url' ) ) );
	Jetpack::state( $state_name, $error );
	if ( $error !== $previous_error ) {
		?>
	<div class="wrap">
	<p><?php esc_html_e( 'We were unable to get your stats just now. Please reload this page to try again.', 'jetpack' ); ?></p>
	</div>
		<?php
		return;
	}
	?>
	<div class="wrap">
	<p>
	<?php
		printf(
			/* translators: placeholder is an a href for a support site. */
			esc_html__( 'We were unable to get your stats just now. Please reload this page to try again. If this error persists, please contact %1$s. In your report, please include the information below.', 'jetpack' ),
			sprintf(
				'<a href="https://support.wordpress.com/contact/?jetpack=needs-service">%s</a>',
				esc_html__( 'Jetpack Support', 'jetpack' )
			)
		);
	?>
		</p>
	<pre>
	User Agent: "<?php echo isset( $_SERVER['HTTP_USER_AGENT'] ) ? esc_html( wp_unslash( $_SERVER['HTTP_USER_AGENT'] ) ) : ''; // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized ?>"
	Page URL: "http<?php echo ( is_ssl() ? 's' : '' ) . '://' . esc_html( ( isset( $_SERVER['HTTP_HOST'] ) ? wp_unslash( $_SERVER['HTTP_HOST'] ) : '' ) . ( isset( $_SERVER['REQUEST_URI'] ) ? wp_unslash( $_SERVER['REQUEST_URI'] ) : '' ) ); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized ?>"
	API URL: "<?php echo esc_url( $url ); ?>"
	<?php
	if ( is_wp_error( $get ) ) {
		foreach ( $get->get_error_codes() as $code ) {
			foreach ( $get->get_error_messages( $code ) as $message ) {
				?>
				<?php print esc_html( $code ) . ': "' . esc_html( $message ) . '"'; ?>

				<?php
			}
		}
	} else {
		$get_code       = wp_remote_retrieve_response_code( $get );
		$content_length = strlen( wp_remote_retrieve_body( $get ) );
		?>
Response code: "<?php print esc_html( $get_code ); ?>"
Content length: "<?php print esc_html( $content_length ); ?>"

		<?php
	}
	?>
	</pre>
	</div>
	<?php
}

/**
 * Get stats from WordPress.com
 *
 * @param string $table The stats which you want to retrieve: postviews, or searchterms.
 * @param array  $args {
 *      An associative array of arguments.
 *
 *      @type bool    $end        The last day of the desired time frame. Format is 'Y-m-d' (e.g. 2007-05-01)
 *                                and default timezone is UTC date. Default value is Now.
 *      @type string  $days       The length of the desired time frame. Default is 30. Maximum 90 days.
 *      @type int     $limit      The maximum number of records to return. Default is 10. Maximum 100.
 *      @type int     $post_id    The ID of the post to retrieve stats data for
 *      @type string  $summarize  If present, summarizes all matching records. Default Null.
 *
 * }
 *
 * @return array {
 *      An array of post view data, each post as an array
 *
 *      array {
 *          The post view data for a single post
 *
 *          @type string  $post_id         The ID of the post
 *          @type string  $post_title      The title of the post
 *          @type string  $post_permalink  The permalink for the post
 *          @type string  $views           The number of views for the post within the $num_days specified
 *      }
 * }
 */
function stats_get_csv( $table, $args = null ) {
	$defaults = array(
		'end'       => false,
		'days'      => false,
		'limit'     => 3,
		'post_id'   => false,
		'summarize' => '',
	);

	$args            = wp_parse_args( $args, $defaults );
	$args['table']   = $table;
	$args['blog_id'] = Jetpack_Options::get_option( 'id' );

	$stats_csv_url = add_query_arg( $args, 'https://stats.wordpress.com/csv.php' );

	$key = md5( $stats_csv_url );

	// Get cache.
	$stats_cache = get_option( 'stats_cache' );
	if ( ! $stats_cache || ! is_array( $stats_cache ) ) {
		$stats_cache = array();
	}

	// Return or expire this key.
	if ( isset( $stats_cache[ $key ] ) ) {
		$time = key( $stats_cache[ $key ] );
		if ( time() - $time < 300 ) {
			return $stats_cache[ $key ][ $time ];
		}
		unset( $stats_cache[ $key ] );
	}

	$stats_rows = array();
	do {
		$stats = stats_get_remote_csv( $stats_csv_url );
		if ( ! $stats ) {
			break;
		}

		$labels = array_shift( $stats );

		if ( 0 === stripos( $labels[0], 'error' ) ) {
			break;
		}

		$stats_rows = array();
		for ( $s = 0; isset( $stats[ $s ] ); $s++ ) {
			$row = array();
			foreach ( $labels as $col => $label ) {
				$row[ $label ] = $stats[ $s ][ $col ];
			}
			$stats_rows[] = $row;
		}
	} while ( 0 );

	// Expire old keys.
	foreach ( $stats_cache as $k => $cache ) {
		if ( ! is_array( $cache ) || 300 < time() - key( $cache ) ) {
			unset( $stats_cache[ $k ] );
		}
	}

		// Set cache.
		$stats_cache[ $key ] = array( time() => $stats_rows );
	update_option( 'stats_cache', $stats_cache );

	return $stats_rows;
}

/**
 * Stats get remote CSV.
 *
 * @access public
 * @param mixed $url URL.
 * @return array
 */
function stats_get_remote_csv( $url ) {
	$method  = 'GET';
	$timeout = 90;
	$user_id = 0; // Blog token.

	$get      = Client::remote_request( compact( 'url', 'method', 'timeout', 'user_id' ) );
	$get_code = wp_remote_retrieve_response_code( $get );
	if ( is_wp_error( $get ) || ( 2 !== (int) ( $get_code / 100 ) && 304 !== $get_code ) || empty( $get['body'] ) ) {
		return array(); // @todo: return an error?
	} else {
		return stats_str_getcsv( $get['body'] );
	}
}

/**
 * Recursively run str_getcsv on the stats csv.
 *
 * @since 9.7.0 Remove custom handling since str_getcsv is available on all servers running this now.
 *
 * @param mixed $csv CSV.
 * @return array.
 */
function stats_str_getcsv( $csv ) {
	$lines = str_getcsv( $csv, "\n" );
	return array_map( 'str_getcsv', $lines );
}

/**
 * Abstract out building the rest api stats path.
 *
 * @param  string $resource Resource.
 * @return string
 */
function jetpack_stats_api_path( $resource = '' ) {
	$resource = ltrim( $resource, '/' );
	return sprintf( '/sites/%d/stats/%s', Stats_Options::get_option( 'blog_id' ), $resource );
}

/**
 * Fetches stats data from the REST API.  Caches locally for 5 minutes.
 *
 * @link: https://developer.wordpress.com/docs/api/1.1/get/sites/%24site/stats/
 * @access public
 * @param array  $args (default: array())  The args that are passed to the endpoint.
 * @param string $resource (default: '') Optional sub-endpoint following /stats/.
 * @return array|WP_Error.
 */
function stats_get_from_restapi( $args = array(), $resource = '' ) {
	$endpoint    = jetpack_stats_api_path( $resource );
	$api_version = '1.1';
	$args        = wp_parse_args( $args, array() );
	$cache_key   = md5( implode( '|', array( $endpoint, $api_version, wp_json_encode( $args ) ) ) );

	$transient_name = "jetpack_restapi_stats_cache_{$cache_key}";

	$stats_cache = get_transient( $transient_name );

	// Return or expire this key.
	if ( $stats_cache ) {
		$time = key( $stats_cache );
		$data = $stats_cache[ $time ]; // WP_Error or string (JSON encoded object).

		if ( is_wp_error( $data ) ) {
			return $data;
		}

		return (object) array_merge( array( 'cached_at' => $time ), (array) json_decode( $data ) );
	}

	// Do the dirty work.
	$response = Client::wpcom_json_api_request_as_blog( $endpoint, $api_version, $args );
	if ( 200 !== wp_remote_retrieve_response_code( $response ) ) {
		// WP_Error.
		$data = is_wp_error( $response ) ? $response : new WP_Error( 'stats_error' );
		// WP_Error.
		$return = $data;
	} else {
		// string (JSON encoded object).
		$data = wp_remote_retrieve_body( $response );
		// object (rare: null on JSON failure).
		$return = json_decode( $data );
	}

	// To reduce size in storage: store with time as key, store JSON encoded data (unless error).
	set_transient( $transient_name, array( time() => $data ), 5 * MINUTE_IN_SECONDS );

	return $return;
}

/**
 * Load CSS needed for Stats column width in WP-Admin area.
 *
 * @since 4.7.0
 */
function jetpack_stats_load_admin_css() {
	?>
	<style type="text/css">
		.fixed .column-stats {
			width: 5em;
		}
	</style>
	<?php
}

/**
 * Set header for column that allows to go to WordPress.com to see an entry's stats.
 *
 * @param array $columns An array of column names.
 *
 * @since 4.7.0
 *
 * @return mixed
 */
function jetpack_stats_post_table( $columns ) {
	// Adds a stats link on the edit posts page.
	if ( ! current_user_can( 'view_stats' ) || ! ( new Connection_Manager( 'jetpack' ) )->is_user_connected() ) {
		return $columns;
	}

	// Array-Fu to add before comments.
	$pos = array_search( 'comments', array_keys( $columns ), true );

	// Fallback to the last position if the post type does not support comments.
	if ( ! is_int( $pos ) ) {
		$pos = count( $columns );
	}

	// Final fallback, if the array was malformed by another plugin for example.
	if ( ! is_int( $pos ) ) {
		return $columns;
	}

	$chunks             = array_chunk( $columns, $pos, true );
	$chunks[0]['stats'] = esc_html__( 'Stats', 'jetpack' );

	return call_user_func_array( 'array_merge', $chunks );
}

/**
 * Set content for cell with link to an entry's stats in WordPress.com.
 *
 * @param string $column  The name of the column to display.
 * @param int    $post_id The current post ID.
 *
 * @since 4.7.0
 *
 * @return mixed
 */
function jetpack_stats_post_table_cell( $column, $post_id ) {
	if ( 'stats' === $column ) {
		if ( 'publish' !== get_post_status( $post_id ) ) {
			printf(
				'<span aria-hidden="true">—</span><span class="screen-reader-text">%s</span>',
				esc_html__( 'No stats', 'jetpack' )
			);
		} else {
			$stats_post_url = Redirect::get_url(
				'calypso-stats-post',
				array(
					'path' => $post_id,
				)
			);
			printf(
				'<a href="%s" title="%s" class="dashicons dashicons-chart-bar" target="_blank"></a>',
				esc_url( $stats_post_url ),
				esc_html__( 'View stats for this post at WordPress.com', 'jetpack' )
			);
		}
	}
}

/**
 * Add the Jetpack plugin version to the stats tracking data.
 *
 * @param  param array $kvs The stats array in key values.
 * @return array
 */
function filter_stats_array_add_jp_version( $kvs ) {
	$kvs['j'] = sprintf( '%s:%s', JETPACK__API_VERSION, JETPACK__VERSION );

	return $kvs;
}
