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
 * @package Jetpack
 */

if ( defined( 'STATS_VERSION' ) ) {
	return;
}

define( 'STATS_VERSION', '9' );
defined( 'STATS_DASHBOARD_SERVER' ) or define( 'STATS_DASHBOARD_SERVER', 'dashboard.wordpress.com' );

add_action( 'jetpack_modules_loaded', 'stats_load' );

/**
 * Load Stats.
 *
 * @access public
 * @return void
 */
function stats_load() {
	Jetpack::enable_module_configurable( __FILE__ );
	Jetpack::module_configuration_load( __FILE__, 'stats_configuration_load' );
	Jetpack::module_configuration_head( __FILE__, 'stats_configuration_head' );
	Jetpack::module_configuration_screen( __FILE__, 'stats_configuration_screen' );

	// Generate the tracking code after wp() has queried for posts.
	add_action( 'template_redirect', 'stats_template_redirect', 1 );

	add_action( 'wp_head', 'stats_admin_bar_head', 100 );

	add_action( 'wp_head', 'stats_hide_smile_css' );

	add_action( 'jetpack_admin_menu', 'stats_admin_menu' );

	// Map stats caps.
	add_filter( 'map_meta_cap', 'stats_map_meta_caps', 10, 3 );

	if ( isset( $_GET['oldwidget'] ) ) {
		// Old one.
		add_action( 'wp_dashboard_setup', 'stats_register_dashboard_widget' );
	} else {
		add_action( 'admin_init', 'stats_merged_widget_admin_init' );
	}

	add_filter( 'jetpack_xmlrpc_methods', 'stats_xmlrpc_methods' );

	add_filter( 'pre_option_db_version', 'stats_ignore_db_version' );

	// Add an icon to see stats in WordPress.com for a particular post
	add_action( 'admin_print_styles-edit.php', 'jetpack_stats_load_admin_css' );
	add_filter( 'manage_posts_columns', 'jetpack_stats_post_table' );
	add_filter( 'manage_pages_columns', 'jetpack_stats_post_table' );
	add_action( 'manage_posts_custom_column', 'jetpack_stats_post_table_cell', 10, 2 );
	add_action( 'manage_pages_custom_column', 'jetpack_stats_post_table_cell', 10, 2 );
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
		add_action( 'wp_dashboard_setup', 'stats_register_widget_control_callback' ); // Hacky but works.
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
 * @return bool
 */
function jetpack_is_dnt_enabled() {
	/**
	 * Filter the option which decides honor DNT or not.
	 *
	 * @module stats
	 * @since 6.1.0
	 *
	 * @param bool false If config honors DNT and client doesn't want to tracked, false if not.
	 */
	if ( false === apply_filters( 'jetpack_honor_dnt_header_for_stats', false ) ) {
		return false;
	}

	foreach ( $_SERVER as $name => $value ) {
		if ( 'http_dnt' == strtolower( $name ) && 1 == $value ) {
			return true;
		}
	}

	return false;
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
		isset( $_GET['page'] ) && 'stats' === $_GET['page'] &&
		isset( $_GET['chart'] ) && strpos($_GET['chart'], 'admin-bar-hours') === 0
	) {
		global $wp_db_version;
		return $wp_db_version;
	}
	return $version;
}

/**
 * Maps view_stats cap to read cap as needed.
 *
 * @access public
 * @param mixed $caps Caps.
 * @param mixed $cap Cap.
 * @param mixed $user_id User ID.
 * @return array Possibly mapped capabilities for meta capability.
 */
function stats_map_meta_caps( $caps, $cap, $user_id ) {
	// Map view_stats to exists.
	if ( 'view_stats' === $cap ) {
		$user        = new WP_User( $user_id );
		$user_role   = array_shift( $user->roles );
		$stats_roles = stats_get_option( 'roles' );

		// Is the users role in the available stats roles?
		if ( is_array( $stats_roles ) && in_array( $user_role, $stats_roles ) ) {
			$caps = array( 'read' );
		}
	}

	return $caps;
}

/**
 * Stats Template Redirect.
 *
 * @access public
 * @return void
 */
function stats_template_redirect() {
	global $current_user, $stats_footer;

	if ( is_feed() || is_robots() || is_trackback() || is_preview() || jetpack_is_dnt_enabled() ) {
		return;
	}

	// Should we be counting this user's views?
	if ( ! empty( $current_user->ID ) ) {
		$count_roles = stats_get_option( 'count_roles' );
		if ( ! is_array( $count_roles ) || ! array_intersect( $current_user->roles, $count_roles ) ) {
			return;
		}
	}

	add_action( 'wp_footer', 'stats_footer', 101 );
	add_action( 'wp_head', 'stats_add_shutdown_action' );

	$script = 'https://stats.wp.com/e-' . gmdate( 'YW' ) . '.js';
	$data = stats_build_view_data();
	$data_stats_array = stats_array( $data );

	$stats_footer = <<<END
<script type='text/javascript' src='{$script}' async='async' defer='defer'></script>
<script type='text/javascript'>
	_stq = window._stq || [];
	_stq.push([ 'view', {{$data_stats_array}} ]);
	_stq.push([ 'clickTrackerInit', '{$data['blog']}', '{$data['post']}' ]);
</script>

END;
}


/**
 * Stats Build View Data.
 *
 * @access public
 * @return array.
 */
function stats_build_view_data() {
	global $wp_the_query;

	$blog = Jetpack_Options::get_option( 'id' );
	$tz = get_option( 'gmt_offset' );
	$v = 'ext';
	$blog_url = parse_url( site_url() );
	$srv = $blog_url['host'];
	$j = sprintf( '%s:%s', JETPACK__API_VERSION, JETPACK__VERSION );
	if ( $wp_the_query->is_single || $wp_the_query->is_page || $wp_the_query->is_posts_page ) {
		// Store and reset the queried_object and queried_object_id
		// Otherwise, redirect_canonical() will redirect to home_url( '/' ) for show_on_front = page sites where home_url() is not all lowercase.
		// Repro:
		// 1. Set home_url = https://ExamPle.com/
		// 2. Set show_on_front = page
		// 3. Set page_on_front = something
		// 4. Visit https://example.com/ !
		$queried_object = ( isset( $wp_the_query->queried_object ) ) ? $wp_the_query->queried_object : null;
		$queried_object_id = ( isset( $wp_the_query->queried_object_id ) ) ? $wp_the_query->queried_object_id : null;
		$post = $wp_the_query->get_queried_object_id();
		$wp_the_query->queried_object = $queried_object;
		$wp_the_query->queried_object_id = $queried_object_id;
	} else {
		$post = '0';
	}

	return compact( 'v', 'j', 'blog', 'post', 'tz', 'srv' );
}

/**
 * Stats Add Shutdown Action.
 *
 * @access public
 * @return void
 */
function stats_add_shutdown_action() {
	// Just in case wp_footer isn't in your theme.
	add_action( 'shutdown',  'stats_footer', 101 );
}

/**
 * Stats Footer.
 *
 * @access public
 * @return void
 */
function stats_footer() {
	global $stats_footer;
	print $stats_footer;
	$stats_footer = '';
}

/**
 * Stats Get Options.
 *
 * @access public
 * @return array.
 */
function stats_get_options() {
	$options = get_option( 'stats_options' );

	if ( ! isset( $options['version'] ) || $options['version'] < STATS_VERSION ) {
		$options = stats_upgrade_options( $options );
	}

	return $options;
}

/**
 * Get Stats Options.
 *
 * @access public
 * @param mixed $option Option.
 * @return mixed|null.
 */
function stats_get_option( $option ) {
	$options = stats_get_options();

	if ( 'blog_id' === $option ) {
		return Jetpack_Options::get_option( 'id' );
	}

	if ( isset( $options[ $option ] ) ) {
		return $options[ $option ];
	}

	return null;
}

/**
 * Stats Set Options.
 *
 * @access public
 * @param mixed $option Option.
 * @param mixed $value Value.
 * @return bool.
 */
function stats_set_option( $option, $value ) {
	$options = stats_get_options();

	$options[ $option ] = $value;

	return stats_set_options( $options );
}

/**
 * Stats Set Options.
 *
 * @access public
 * @param mixed $options Options.
 * @return bool
 */
function stats_set_options( $options ) {
	return update_option( 'stats_options', $options );
}

/**
 * Stats Upgrade Options.
 *
 * @access public
 * @param mixed $options Options.
 * @return array|bool
 */
function stats_upgrade_options( $options ) {
	$defaults = array(
		'admin_bar'    => true,
		'roles'        => array( 'administrator' ),
		'count_roles'  => array(),
		'blog_id'      => Jetpack_Options::get_option( 'id' ),
		'do_not_track' => true, // @todo
		'hide_smile'   => true,
	);

	if ( isset( $options['reg_users'] ) ) {
		if ( ! function_exists( 'get_editable_roles' ) ) {
			require_once ABSPATH . 'wp-admin/includes/user.php';
		}
		if ( $options['reg_users'] ) {
			$options['count_roles'] = array_keys( get_editable_roles() );
		}
		unset( $options['reg_users'] );
	}

	if ( is_array( $options ) && ! empty( $options ) ) {
		$new_options = array_merge( $defaults, $options );
	} else { $new_options = $defaults;
	}

	$new_options['version'] = STATS_VERSION;

	if ( ! stats_set_options( $new_options ) ) {
		return false;
	}

	stats_update_blog();

	return $new_options;
}

/**
 * Stats Array.
 *
 * @access public
 * @param mixed $kvs KVS.
 * @return array
 */
function stats_array( $kvs ) {
	/**
	 * Filter the options added to the JavaScript Stats tracking code.
	 *
	 * @module stats
	 *
	 * @since 1.1.0
	 *
	 * @param array $kvs Array of options about the site and page you're on.
	 */
	$kvs = apply_filters( 'stats_array', $kvs );
	$kvs = array_map( 'addslashes', $kvs );
	foreach ( $kvs as $k => $v ) {
		$jskvs[] = "$k:'$v'";
	}
	return join( ',', $jskvs );
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
	if ( 'index.php' === $pagenow && isset( $_GET['page'] ) && 'stats' === $_GET['page'] ) {
		$redirect_url = str_replace( array( '/wp-admin/index.php?', '/wp-admin/?' ), '/wp-admin/admin.php?', $_SERVER['REQUEST_URI'] );
		$relative_pos = strpos( $redirect_url, '/wp-admin/' );
		if ( false !== $relative_pos ) {
			wp_safe_redirect( admin_url( substr( $redirect_url, $relative_pos + 10 ) ) );
			exit;
		}
	}

	$hook = add_submenu_page( 'jetpack', __( 'Site Stats', 'jetpack' ), __( 'Site Stats', 'jetpack' ), 'view_stats', 'stats', 'stats_reports_page' );
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
	wp_enqueue_script( 'jquery' );
	wp_enqueue_script( 'postbox' );
	wp_enqueue_script( 'underscore' );

	$rtl = is_rtl() ? '.rtl' : '';
	wp_enqueue_style( 'dops-css', plugins_url( "_inc/build/admin.dops-style$rtl.css", JETPACK__PLUGIN_FILE ), array(), JETPACK__VERSION );
	wp_enqueue_style( 'components-css', plugins_url( "_inc/build/style.min$rtl.css", JETPACK__PLUGIN_FILE ), array(), JETPACK__VERSION );

	add_action( 'admin_print_styles', 'stats_reports_css' );

	if ( isset( $_GET['nojs'] ) && $_GET['nojs'] ) {
		$parsed = parse_url( admin_url() );
		// Remember user doesn't want JS.
		setcookie( 'stnojs', '1', time() + 172800, $parsed['path'] ); // 2 days.
	}

	if ( isset( $_COOKIE['stnojs'] ) && $_COOKIE['stnojs'] ) {
		// Detect if JS is on.  If so, remove cookie so next page load is via JS.
		add_action( 'admin_print_footer_scripts', 'stats_js_remove_stnojs_cookie' );
	} else if ( ! isset( $_GET['noheader'] ) && empty( $_GET['nojs'] ) ) {
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
#wpcontent {
	padding-left: 0 !important;
}

.jetpack_page_stats {
	background-color: #f3f6f8;
}

#jp-stats-wrap {
	max-width: 720px;
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
	$parsed = parse_url( admin_url() );
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
		} );
	} );
}
/* ]]> */
</script>
<?php
}

/**
 * Stats Report Page.
 *
 * @access public
 * @param bool $main_chart_only (default: false) Main Chart Only.
 */
function stats_reports_page( $main_chart_only = false ) {

	if ( isset( $_GET['dashboard'] ) ) {
		return stats_dashboard_widget_content();
	}

	$blog_id = stats_get_option( 'blog_id' );
	$domain = Jetpack::build_raw_urls( get_home_url() );

	$jetpack_admin_url = admin_url() . 'admin.php?page=jetpack';

	if ( ! $main_chart_only && ! isset( $_GET['noheader'] ) && empty( $_GET['nojs'] ) && empty( $_COOKIE['stnojs'] ) ) {
		$nojs_url = add_query_arg( 'nojs', '1' );
		$http = is_ssl() ? 'https' : 'http';
		// Loading message. No JS fallback message.
?>
<div id="jp-plugin-container">
	<div class="jp-masthead">
		<div class="jp-masthead__inside-container">
			<div class="jp-masthead__logo-container">
				<a class="jp-masthead__logo-link" href="<?php echo esc_url( $jetpack_admin_url ); ?>">
					<svg class="jetpack-logo__masthead" xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" height="32" viewBox="0 0 118 32"><path fill="#00BE28" d="M16,0C7.2,0,0,7.2,0,16s7.2,16,16,16s16-7.2,16-16S24.8,0,16,0z M15,19H7l8-16V19z M17,29V13h8L17,29z"></path><path d="M41.3,26.6c-0.5-0.7-0.9-1.4-1.3-2.1c2.3-1.4,3-2.5,3-4.6V8h-3V6h6v13.4C46,22.8,45,24.8,41.3,26.6z"></path><path d="M65,18.4c0,1.1,0.8,1.3,1.4,1.3c0.5,0,2-0.2,2.6-0.4v2.1c-0.9,0.3-2.5,0.5-3.7,0.5c-1.5,0-3.2-0.5-3.2-3.1V12H60v-2h2.1V7.1 H65V10h4v2h-4V18.4z"></path><path d="M71,10h3v1.3c1.1-0.8,1.9-1.3,3.3-1.3c2.5,0,4.5,1.8,4.5,5.6s-2.2,6.3-5.8,6.3c-0.9,0-1.3-0.1-2-0.3V28h-3V10z M76.5,12.3 c-0.8,0-1.6,0.4-2.5,1.2v5.9c0.6,0.1,0.9,0.2,1.8,0.2c2,0,3.2-1.3,3.2-3.9C79,13.4,78.1,12.3,76.5,12.3z"></path><path d="M93,22h-3v-1.5c-0.9,0.7-1.9,1.5-3.5,1.5c-1.5,0-3.1-1.1-3.1-3.2c0-2.9,2.5-3.4,4.2-3.7l2.4-0.3v-0.3c0-1.5-0.5-2.3-2-2.3 c-0.7,0-2.3,0.5-3.7,1.1L84,11c1.2-0.4,3-1,4.4-1c2.7,0,4.6,1.4,4.6,4.7L93,22z M90,16.4l-2.2,0.4c-0.7,0.1-1.4,0.5-1.4,1.6 c0,0.9,0.5,1.4,1.3,1.4s1.5-0.5,2.3-1V16.4z"></path><path d="M104.5,21.3c-1.1,0.4-2.2,0.6-3.5,0.6c-4.2,0-5.9-2.4-5.9-5.9c0-3.7,2.3-6,6.1-6c1.4,0,2.3,0.2,3.2,0.5V13 c-0.8-0.3-2-0.6-3.2-0.6c-1.7,0-3.2,0.9-3.2,3.6c0,2.9,1.5,3.8,3.3,3.8c0.9,0,1.9-0.2,3.2-0.7V21.3z"></path><path d="M110,15.2c0.2-0.3,0.2-0.8,3.8-5.2h3.7l-4.6,5.7l5,6.3h-3.7l-4.2-5.8V22h-3V6h3V15.2z"></path><path d="M58.5,21.3c-1.5,0.5-2.7,0.6-4.2,0.6c-3.6,0-5.8-1.8-5.8-6c0-3.1,1.9-5.9,5.5-5.9s4.9,2.5,4.9,4.9c0,0.8,0,1.5-0.1,2h-7.3 c0.1,2.5,1.5,2.8,3.6,2.8c1.1,0,2.2-0.3,3.4-0.7C58.5,19,58.5,21.3,58.5,21.3z M56,15c0-1.4-0.5-2.9-2-2.9c-1.4,0-2.3,1.3-2.4,2.9 C51.6,15,56,15,56,15z"></path></svg>
				</a>
			</div>
			<div class="jp-masthead__nav"><span class="dops-button-group"><a href="<?php echo esc_url( $jetpack_admin_url ); ?>" type="button" class="dops-button is-compact"><?php esc_html_e( 'Dashboard', 'jetpack' ); ?></a><a href="<?php echo esc_url( $jetpack_admin_url . '#/settings' ); ?>" type="button" class="dops-button is-compact"><?php esc_html_e( 'Settings', 'jetpack' ); ?></a></span></div>
		</div>
	</div>
	<div id="jp-stats-wrap">
<div class="wrap">
	<h2><?php esc_html_e( 'Site Stats', 'jetpack' ); ?> <?php if ( current_user_can( 'jetpack_manage_modules' ) ) : ?><a style="font-size:13px;" href="<?php echo esc_url( admin_url( 'admin.php?page=jetpack&configure=stats' ) ); ?>"><?php esc_html_e( 'Configure', 'jetpack' ); ?></a><?php endif; ?></h2>
</div>
<div id="stats-loading-wrap" class="wrap">
<p class="hide-if-no-js"><img width="32" height="32" alt="<?php esc_attr_e( 'Loading&hellip;', 'jetpack' ); ?>" src="<?php
		echo esc_url(
			/**
			 * Sets external resource URL.
			 *
			 * @module stats
			 *
			 * @since 1.4.0
			 *
			 * @param string $args URL of external resource.
			 */
			apply_filters( 'jetpack_static_url', "{$http}://en.wordpress.com/i/loading/loading-64.gif" )
		); ?>" /></p>
<p style="font-size: 11pt; margin: 0;"><a href="https://wordpress.com/stats/<?php echo esc_attr( $domain ); ?>" target="_blank"><?php esc_html_e( 'View stats on WordPress.com right now', 'jetpack' ); ?></a></p>
<p class="hide-if-js"><?php esc_html_e( 'Your Site Stats work better with JavaScript enabled.', 'jetpack' ); ?><br />
<a href="<?php echo esc_url( $nojs_url ); ?>"><?php esc_html_e( 'View Site Stats without JavaScript', 'jetpack' ); ?></a>.</p>
</div>
</div>
<div class="jp-footer">
	<ul class="jp-footer__links">
		<li class="jp-footer__link-item">
			<a href="https://jetpack.com" target="_blank" rel="noopener noreferrer" class="jp-footer__link" title="<?php esc_html_e( 'Jetpack version', 'jetpack' ); ?>">Jetpack <?php echo JETPACK__VERSION; ?></a>
		</li>
		<li class="jp-footer__link-item">
			<a href="https://wordpress.com/tos/" target="_blank" rel="noopener noreferrer" title="<?php esc_html__( 'WordPress.com Terms of Service', 'jetpack' ); ?>" class="jp-footer__link"><?php echo esc_html_x( 'Terms', 'Navigation item', 'jetpack' ); ?></a>
		</li>
		<li class="jp-footer__link-item">
			<a href="<?php echo esc_url( $jetpack_admin_url . '#/privacy' ); ?>" rel="noopener noreferrer" title="<?php esc_html_e( 'Automattic\'s Privacy Policy', 'jetpack' ); ?>" class="jp-footer__link"><?php echo esc_html_x( 'Privacy', 'Navigation item', 'jetpack' ); ?></a>
		</li>
		<li class="jp-footer__link-item">
			<a href="<?php echo esc_url( admin_url() . 'admin.php?page=jetpack-debugger' ); ?>" title="<?php esc_html_e( 'Test your site\'s compatibility with Jetpack.', 'jetpack' ); ?>" class="jp-footer__link"><?php echo esc_html_x( 'Debug', 'Navigation item', 'jetpack' ); ?></a>
		</li>
	</ul>
</div>
</div>
<?php
		return;
	}

	$day = isset( $_GET['day'] ) && preg_match( '/^\d{4}-\d{2}-\d{2}$/', $_GET['day'] ) ? $_GET['day'] : false;
	$q = array(
		'noheader' => 'true',
		'proxy' => '',
		'page' => 'stats',
		'day' => $day,
		'blog' => $blog_id,
		'charset' => get_option( 'blog_charset' ),
		'color' => get_user_option( 'admin_color' ),
		'ssl' => is_ssl(),
		'j' => sprintf( '%s:%s', JETPACK__API_VERSION, JETPACK__VERSION ),
	);
	if ( get_locale() !== 'en_US' ) {
		$q['jp_lang'] = get_locale();
	}
	// Only show the main chart, without extra header data, or metaboxes.
	$q['main_chart_only'] = $main_chart_only;
	$args = array(
		'view' => array( 'referrers', 'postviews', 'searchterms', 'clicks', 'post', 'table' ),
		'numdays' => 'int',
		'day' => 'date',
		'unit' => array( 1, 7, 31, 'human' ),
		'humanize' => array( 'true' ),
		'num' => 'int',
		'summarize' => null,
		'post' => 'int',
		'width' => 'int',
		'height' => 'int',
		'data' => 'data',
		'blog_subscribers' => 'int',
		'comment_subscribers' => null,
		'type' => array( 'wpcom', 'email', 'pending' ),
		'pagenum' => 'int',
	);
	foreach ( $args as $var => $vals ) {
		if ( ! isset( $_REQUEST[$var] ) )
			continue;
		if ( is_array( $vals ) ) {
			if ( in_array( $_REQUEST[$var], $vals ) )
				$q[$var] = $_REQUEST[$var];
		} elseif ( 'int' === $vals ) {
			$q[$var] = intval( $_REQUEST[$var] );
		} elseif ( 'date' === $vals ) {
			if ( preg_match( '/^\d{4}-\d{2}-\d{2}$/', $_REQUEST[$var] ) )
				$q[$var] = $_REQUEST[$var];
		} elseif ( null === $vals ) {
			$q[$var] = '';
		} elseif ( 'data' === $vals ) {
			if ( 'index.php' === substr( $_REQUEST[$var], 0, 9 ) )
				$q[$var] = $_REQUEST[$var];
		}
	}

	if ( isset( $_GET['chart'] ) ) {
		if ( preg_match( '/^[a-z0-9-]+$/', $_GET['chart'] ) ) {
			$chart = sanitize_title( $_GET['chart'] );
			$url = 'https://' . STATS_DASHBOARD_SERVER . "/wp-includes/charts/{$chart}.php";
		}
	} else {
		$url = 'https://' . STATS_DASHBOARD_SERVER . "/wp-admin/index.php";
	}

	$url = add_query_arg( $q, $url );
	$method = 'GET';
	$timeout = 90;
	$user_id = JETPACK_MASTER_USER; // means send the wp.com user_id

	$get = Jetpack_Client::remote_request( compact( 'url', 'method', 'timeout', 'user_id' ) );
	$get_code = wp_remote_retrieve_response_code( $get );
	if ( is_wp_error( $get ) || ( 2 !== intval( $get_code / 100 ) && 304 !== $get_code ) || empty( $get['body'] ) ) {
		stats_print_wp_remote_error( $get, $url );
	} else {
		if ( ! empty( $get['headers']['content-type'] ) ) {
			$type = $get['headers']['content-type'];
			if ( substr( $type, 0, 5 ) === 'image' ) {
				$img = $get['body'];
				header( 'Content-Type: ' . $type );
				header( 'Content-Length: ' . strlen( $img ) );
				echo $img;
				die();
			}
		}
		$body = stats_convert_post_titles( $get['body'] );
		$body = stats_convert_chart_urls( $body );
		$body = stats_convert_image_urls( $body );
		$body = stats_convert_admin_urls( $body );
		echo $body;
	}

	if ( isset( $_GET['page'] ) && 'stats' === $_GET['page'] && ! isset( $_GET['chart'] ) ) {
		JetpackTracking::record_user_event( 'wpa_page_view', array( 'path' => 'old_stats' ) );
	}

	if ( isset( $_GET['noheader'] ) ) {
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
	$url = set_url_scheme( 'https://' . STATS_DASHBOARD_SERVER );
	$html = preg_replace( '|(["\'])(/i/stats.+)\\1|', '$1' . $url . '$2$1', $html );
	return $html;
}

/**
 * Callback for preg_replace_callback used in stats_convert_chart_urls()
 *
 * @since 5.6.0
 *
 * @param  array  $matches The matches resulting from the preg_replace_callback call.
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
			'include' => implode( ',', $matches[1] ),
			'post_type' => 'any',
			'post_status' => 'any',
			'numberposts' => -1,
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
	if ( isset( $stats_posts[$post_id] ) )
		return '<a href="' . get_permalink( $post_id ) . '" target="_blank">' . get_the_title( $post_id ) . '</a>';
	return $matches[0];
}

/**
 * Stats Configuration Load.
 *
 * @access public
 * @return void
 */
function stats_configuration_load() {
	if ( isset( $_POST['action'] ) && 'save_options' === $_POST['action'] && $_POST['_wpnonce'] === wp_create_nonce( 'stats' ) ) {
		$options = stats_get_options();
		$options['admin_bar']  = isset( $_POST['admin_bar']  ) && $_POST['admin_bar'];
		$options['hide_smile'] = isset( $_POST['hide_smile'] ) && $_POST['hide_smile'];

		$options['roles'] = array( 'administrator' );
		foreach ( get_editable_roles() as $role => $details ) {
			if ( isset( $_POST["role_$role"] ) && $_POST["role_$role"] ) {
				$options['roles'][] = $role;
			}
		}

		$options['count_roles'] = array();
		foreach ( get_editable_roles() as $role => $details ) {
			if ( isset( $_POST["count_role_$role"] ) && $_POST["count_role_$role"] ) {
				$options['count_roles'][] = $role;
			}
		}

		stats_set_options( $options );
		stats_update_blog();
		Jetpack::state( 'message', 'module_configured' );
		wp_safe_redirect( Jetpack::module_configuration_url( 'stats' ) );
		exit;
	}
}

/**
 * Stats Configuration Head.
 *
 * @access public
 * @return void
 */
function stats_configuration_head() {
?>
	<style type="text/css">
		#statserror {
			border: 1px solid #766;
			background-color: #d22;
			padding: 1em 3em;
		}
		.stats-smiley {
			vertical-align: 1px;
		}
	</style>
	<?php
}

/**
 * Stats Configuration Screen.
 *
 * @access public
 * @return void
 */
function stats_configuration_screen() {
	$options = stats_get_options();
?>
	<div class="narrow">
		<p><?php printf( __( 'Visit <a href="%s">Site Stats</a> to see your stats.', 'jetpack' ), esc_url( menu_page_url( 'stats', false ) ) ); ?></p>
		<form method="post">
		<input type='hidden' name='action' value='save_options' />
		<?php wp_nonce_field( 'stats' ); ?>
		<table id="menu" class="form-table">
		<tr valign="top"><th scope="row"><label for="admin_bar"><?php esc_html_e( 'Admin bar' , 'jetpack' ); ?></label></th>
		<td><label><input type='checkbox'<?php checked( $options['admin_bar'] ); ?> name='admin_bar' id='admin_bar' /> <?php esc_html_e( 'Put a chart showing 48 hours of views in the admin bar.', 'jetpack' ); ?></label></td></tr>
		<tr valign="top"><th scope="row"><?php esc_html_e( 'Registered users', 'jetpack' ); ?></th>
		<td>
			<?php esc_html_e( "Count the page views of registered users who are logged in.", 'jetpack' ); ?><br/>
			<?php
	$count_roles = stats_get_option( 'count_roles' );
	foreach ( get_editable_roles() as $role => $details ) {
?>
				<label><input type='checkbox' name='count_role_<?php echo $role; ?>'<?php checked( in_array( $role, $count_roles ) ); ?> /> <?php echo translate_user_role( $details['name'] ); ?></label><br/>
				<?php
	}
?>
		</td></tr>
		<tr valign="top"><th scope="row"><?php esc_html_e( 'Smiley' , 'jetpack' ); ?></th>
		<td><label><input type='checkbox'<?php checked( isset( $options['hide_smile'] ) && $options['hide_smile'] ); ?> name='hide_smile' id='hide_smile' /> <?php esc_html_e( 'Hide the stats smiley face image.', 'jetpack' ); ?></label><br /> <span class="description"><?php echo wp_kses( __( 'The image helps collect stats and <strong>makes the world a better place</strong> but should still work when hidden', 'jetpack' ), array( 'strong' => array() ) ); ?> <img class="stats-smiley" alt="<?php esc_attr_e( 'Smiley face', 'jetpack' ); ?>" src="<?php echo esc_url( plugins_url( 'images/stats-smiley.gif', dirname( __FILE__ ) ) ); ?>" width="6" height="5" /></span></td></tr>
		<tr valign="top"><th scope="row"><?php esc_html_e( 'Report visibility' , 'jetpack' ); ?></th>
		<td>
			<?php esc_html_e( 'Select the roles that will be able to view stats reports.', 'jetpack' ); ?><br/>
			<?php
	$stats_roles = stats_get_option( 'roles' );
	foreach ( get_editable_roles() as $role => $details ) {
?>
				<label><input type='checkbox' <?php if ( 'administrator' === $role ) echo "disabled='disabled' "; ?>name='role_<?php echo $role; ?>'<?php checked( 'administrator' === $role || in_array( $role, $stats_roles ) ); ?> /> <?php echo translate_user_role( $details['name'] ); ?></label><br/>
				<?php
	}
?>
		</td></tr>
		</table>
		<p class="submit"><input type='submit' class='button-primary' value='<?php echo esc_attr( __( 'Save configuration', 'jetpack' ) ); ?>' /></p>
		</form>
	</div>
	<?php
}

/**
 * Stats Hide Smile.
 *
 * @access public
 * @return void
 */
function stats_hide_smile_css() {
	$options = stats_get_options();
	if ( isset( $options['hide_smile'] ) && $options['hide_smile'] ) {
?>
<style type='text/css'>img#wpstats{display:none}</style><?php
	}
}

/**
 * Stats Admin Bar Head.
 *
 * @access public
 * @return void
 */
function stats_admin_bar_head() {
	if ( ! stats_get_option( 'admin_bar' ) )
		return;

	if ( ! current_user_can( 'view_stats' ) )
		return;

	if ( function_exists( 'is_admin_bar_showing' ) && ! is_admin_bar_showing() ) {
		return;
	}

	add_action( 'admin_bar_menu', 'stats_admin_bar_menu', 100 );
?>

<style type='text/css'>
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
	padding: 4px 0;
	max-width: none;
	border: none;
}
</style>
<?php
}

/**
 * Stats AdminBar.
 *
 * @access public
 * @param mixed $wp_admin_bar WPAdminBar.
 * @return void
 */
function stats_admin_bar_menu( &$wp_admin_bar ) {
	$url = add_query_arg( 'page', 'stats', admin_url( 'admin.php' ) ); // no menu_page_url() blog-side.

	$img_src = esc_attr( add_query_arg( array( 'noheader' => '', 'proxy' => '', 'chart' => 'admin-bar-hours-scale' ), $url ) );
	$img_src_2x = esc_attr( add_query_arg( array( 'noheader' => '', 'proxy' => '', 'chart' => 'admin-bar-hours-scale-2x' ), $url ) );

	$alt = esc_attr( __( 'Stats', 'jetpack' ) );

	$title = esc_attr( __( 'Views over 48 hours. Click for more Site Stats.', 'jetpack' ) );

	$menu = array( 'id' => 'stats', 'title' => "<div><script type='text/javascript'>var src;if(typeof(window.devicePixelRatio)=='undefined'||window.devicePixelRatio<2){src='$img_src';}else{src='$img_src_2x';}document.write('<img src=\''+src+'\' alt=\'$alt\' title=\'$title\' />');</script></div>", 'href' => $url );

	$wp_admin_bar->add_menu( $menu );
}

/**
 * Stats Update Blog.
 *
 * @access public
 * @return void
 */
function stats_update_blog() {
	Jetpack::xmlrpc_async_call( 'jetpack.updateBlog', stats_get_blog() );
}

/**
 * Stats Get Blog.
 *
 * @access public
 * @return string
 */
function stats_get_blog() {
	$home = parse_url( trailingslashit( get_option( 'home' ) ) );
	$blog = array(
		'host'                => $home['host'],
		'path'                => $home['path'],
		'blogname'            => get_option( 'blogname' ),
		'blogdescription'     => get_option( 'blogdescription' ),
		'siteurl'             => get_option( 'siteurl' ),
		'gmt_offset'          => get_option( 'gmt_offset' ),
		'timezone_string'     => get_option( 'timezone_string' ),
		'stats_version'       => STATS_VERSION,
		'stats_api'           => 'jetpack',
		'page_on_front'       => get_option( 'page_on_front' ),
		'permalink_structure' => get_option( 'permalink_structure' ),
		'category_base'       => get_option( 'category_base' ),
		'tag_base'            => get_option( 'tag_base' ),
	);
	$blog = array_merge( stats_get_options(), $blog );
	unset( $blog['roles'], $blog['blog_id'] );
	return stats_esc_html_deep( $blog );
}

/**
 * Modified from stripslashes_deep()
 *
 * @access public
 * @param mixed $value Value.
 * @return string
 */
function stats_esc_html_deep( $value ) {
	if ( is_array( $value ) ) {
		$value = array_map( 'stats_esc_html_deep', $value );
	} elseif ( is_object( $value ) ) {
		$vars = get_object_vars( $value );
		foreach ( $vars as $key => $data ) {
			$value->{$key} = stats_esc_html_deep( $data );
		}
	} elseif ( is_string( $value ) ) {
		$value = esc_html( $value );
	}

	return $value;
}

/**
 * Stats xmlrpc_methods function.
 *
 * @access public
 * @param mixed $methods Methods.
 * @return array
 */
function stats_xmlrpc_methods( $methods ) {
	$my_methods = array(
		'jetpack.getBlog' => 'stats_get_blog',
	);

	return array_merge( $methods, $my_methods );
}

/**
 * Register Stats Dashboard Widget.
 *
 * @access public
 * @return void
 */
function stats_register_dashboard_widget() {
	if ( ! current_user_can( 'view_stats' ) )
		return;

	// With wp_dashboard_empty: we load in the content after the page load via JS.
	wp_add_dashboard_widget( 'dashboard_stats', __( 'Site Stats', 'jetpack' ), 'wp_dashboard_empty', 'stats_dashboard_widget_control' );

	add_action( 'admin_head', 'stats_dashboard_head' );
}

/**
 * Stats Dashboard Widget Options.
 *
 * @access public
 * @return array
 */
function stats_dashboard_widget_options() {
	$defaults = array( 'chart' => 1, 'top' => 1, 'search' => 7 );
	if ( ( ! $options = get_option( 'stats_dashboard_widget' ) ) || ! is_array( $options ) ) {
		$options = array();
	}

	// Ignore obsolete option values.
	$intervals = array( 1, 7, 31, 90, 365 );
	foreach ( array( 'top', 'search' ) as $key ) {
		if ( isset( $options[ $key ] ) && ! in_array( $options[ $key ], $intervals ) ) {
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
		'1' => __( 'day', 'jetpack' ),
		'7' => __( 'week', 'jetpack' ),
		'31' => __( 'month', 'jetpack' ),
	);
	$intervals = array(
		'1' => __( 'the past day', 'jetpack' ),
		'7' => __( 'the past week', 'jetpack' ),
		'31' => __( 'the past month', 'jetpack' ),
		'90' => __( 'the past quarter', 'jetpack' ),
		'365' => __( 'the past year', 'jetpack' ),
	);
	$defaults = array(
		'top' => 1,
		'search' => 7,
	);

	$options = stats_dashboard_widget_options();

	if ( 'post' === strtolower( $_SERVER['REQUEST_METHOD'] ) && isset( $_POST['widget_id'] ) && 'dashboard_stats' === $_POST['widget_id'] ) {
		if ( isset( $periods[ $_POST['chart'] ] ) ) {
			$options['chart'] = $_POST['chart'];
		}
		foreach ( array( 'top', 'search' ) as $key ) {
			if ( isset( $intervals[ $_POST[ $key ] ] ) ) {
				$options[ $key ] = $_POST[ $key ];
			} else { $options[ $key ] = $defaults[ $key ];
			}
		}
		update_option( 'stats_dashboard_widget', $options );
	}
?>
	<p>
	<label for="chart"><?php esc_html_e( 'Chart stats by' , 'jetpack' ); ?></label>
	<select id="chart" name="chart">
	<?php
	foreach ( $periods as $val => $label ) {
?>
		<option value="<?php echo $val; ?>"<?php selected( $val, $options['chart'] ); ?>><?php echo esc_html( $label ); ?></option>
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
		<option value="<?php echo $val; ?>"<?php selected( $val, $options['top'] ); ?>><?php echo esc_html( $label ); ?></option>
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
		<option value="<?php echo $val; ?>"<?php selected( $val, $options['search'] ); ?>><?php echo esc_html( $label ); ?></option>
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
		<input type="hidden" name="widget_id" value="dashboard_stats" />
		<?php submit_button( __( 'Submit', 'jetpack' ) ); ?>
	</form>
	<span id="js-toggle-stats_dashboard_widget_control">
		<?php esc_html_e( 'Configure', 'jetpack' ); ?>
	</span>
	<div id="dashboard_stats">
		<div class="inside">
			<div style="height: 250px;"></div>
		</div>
	</div>
	<script>
		jQuery(document).ready(function($){
			var $toggle = $('#js-toggle-stats_dashboard_widget_control');

			$toggle.parent().prev().append( $toggle );
			$toggle.show().click(function(e){
				e.preventDefault();
				e.stopImmediatePropagation();
				$(this).parent().toggleClass('controlVisible');
				$('#stats_dashboard_widget_control').slideToggle();
			});
		});
	</script>
	<style>
		#js-toggle-stats_dashboard_widget_control {
			display: none;
			float: right;
			margin-top: 0.2em;
			font-weight: 400;
			color: #444;
			font-size: .8em;
			text-decoration: underline;
			cursor: pointer;
		}
		#stats_dashboard_widget_control {
			display: none;
			padding: 0 10px;
			overflow: hidden;
		}
		#stats_dashboard_widget_control .button-primary {
			float: right;
		}
		#dashboard_stats {
			box-sizing: border-box;
			width: 100%;
			padding: 0 10px;
		}
	</style>
	<?php
}

/**
 * Register Stats Widget Control Callback.
 *
 * @access public
 * @return void
 */
function stats_register_widget_control_callback() {
	$GLOBALS['wp_dashboard_control_callbacks']['dashboard_stats'] = 'stats_dashboard_widget_control';
}

/**
 * JavaScript and CSS for dashboard widget.
 *
 * @access public
 * @return void
 */
function stats_dashboard_head() { ?>
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
} );
/* ]]> */
</script>
<style type="text/css">
/* <![CDATA[ */
#stat-chart {
	background: none !important;
}
#dashboard_stats .inside {
	margin: 10px 0 0 0 !important;
}
#dashboard_stats #stats-graph {
	margin: 0;
}
#stats-info {
	border-top: 1px solid #dfdfdf;
	margin: 7px -10px 0 -10px;
	padding: 10px;
	background: #fcfcfc;
	-moz-box-shadow:inset 0 1px 0 #fff;
	-webkit-box-shadow:inset 0 1px 0 #fff;
	box-shadow:inset 0 1px 0 #fff;
	overflow: hidden;
	border-radius: 0 0 2px 2px;
	-webkit-border-radius: 0 0 2px 2px;
	-moz-border-radius: 0 0 2px 2px;
	-khtml-border-radius: 0 0 2px 2px;
}
#stats-info #top-posts, #stats-info #top-search {
	float: left;
	width: 50%;
}
#stats-info #top-posts {
	padding-right: 3%;
}
#top-posts .stats-section-inner p {
	white-space: nowrap;
	overflow: hidden;
}
#top-posts .stats-section-inner p a {
	overflow: hidden;
	text-overflow: ellipsis;
}
#stats-info div#active {
	border-top: 1px solid #dfdfdf;
	margin: 0 -10px;
	padding: 10px 10px 0 10px;
	-moz-box-shadow:inset 0 1px 0 #fff;
	-webkit-box-shadow:inset 0 1px 0 #fff;
	box-shadow:inset 0 1px 0 #fff;
	overflow: hidden;
}
#top-search p {
	color: #999;
}
#stats-info h3 {
	font-size: 1em;
	margin: 0 0 .5em 0 !important;
}
#stats-info p {
	margin: 0 0 .25em;
	color: #999;
}
#stats-info p.widget-loading {
	margin: 1em 0 0;
	color: #333;
}
#stats-info p a {
	display: block;
}
#stats-info p a.button {
	display: inline;
}
/* ]]> */
</style>
<?php
}

/**
 * Stats Dashboard Widget Content.
 *
 * @access public
 * @return void
 */
function stats_dashboard_widget_content() {
	if ( ! isset( $_GET['width'] ) || ( ! $width = (int) ( $_GET['width'] / 2 ) ) || $width < 250 ) {
		$width = 370;
	}
	if ( ! isset( $_GET['height'] ) || ( ! $height = (int) $_GET['height'] - 36 ) || $height < 230 ) {
		$height = 180;
	}

	$_width  = $width  - 5;
	$_height = $height - ( $GLOBALS['is_winIE'] ? 16 : 5 ); // Hack!

	$options = stats_dashboard_widget_options();
	$blog_id = Jetpack_Options::get_option( 'id' );

	$q = array(
		'noheader' => 'true',
		'proxy' => '',
		'blog' => $blog_id,
		'page' => 'stats',
		'chart' => '',
		'unit' => $options['chart'],
		'color' => get_user_option( 'admin_color' ),
		'width' => $_width,
		'height' => $_height,
		'ssl' => is_ssl(),
		'j' => sprintf( '%s:%s', JETPACK__API_VERSION, JETPACK__VERSION ),
	);

	$url = 'https://' . STATS_DASHBOARD_SERVER . "/wp-admin/index.php";

	$url = add_query_arg( $q, $url );
	$method = 'GET';
	$timeout = 90;
	$user_id = JETPACK_MASTER_USER;

	$get = Jetpack_Client::remote_request( compact( 'url', 'method', 'timeout', 'user_id' ) );
	$get_code = wp_remote_retrieve_response_code( $get );
	if ( is_wp_error( $get ) || ( 2 !== intval( $get_code / 100 ) && 304 !== $get_code ) || empty( $get['body'] ) ) {
		stats_print_wp_remote_error( $get, $url );
	} else {
		$body = stats_convert_post_titles( $get['body'] );
		$body = stats_convert_chart_urls( $body );
		$body = stats_convert_image_urls( $body );
		echo $body;
	}

	$post_ids = array();

	$csv_end_date = date( 'Y-m-d', current_time( 'timestamp' ) );
	$csv_args = array( 'top' => "&limit=8&end=$csv_end_date", 'search' => "&limit=5&end=$csv_end_date" );
	/* Translators: Stats dashboard widget postviews list: "$post_title $views Views". */
	$printf = __( '%1$s %2$s Views' , 'jetpack' );

	foreach ( $top_posts = stats_get_csv( 'postviews', "days=$options[top]$csv_args[top]" ) as $i => $post ) {
		if ( 0 === $post['post_id'] ) {
			unset( $top_posts[$i] );
			continue;
		}
		$post_ids[] = $post['post_id'];
	}

	// Cache.
	get_posts( array( 'include' => join( ',', array_unique( $post_ids ) ) ) );

	$searches = array();
	foreach ( $search_terms = stats_get_csv( 'searchterms', "days=$options[search]$csv_args[search]" ) as $search_term ) {
		if ( 'encrypted_search_terms' === $search_term['searchterm'] ) {
			continue;
		}
		$searches[] = esc_html( $search_term['searchterm'] );
	}

?>
<a class="button" href="admin.php?page=stats"><?php  esc_html_e( 'View All', 'jetpack' ); ?></a>
<div id="stats-info">
	<div id="top-posts" class='stats-section'>
		<div class="stats-section-inner">
		<h3 class="heading"><?php  esc_html_e( 'Top Posts' , 'jetpack' ); ?></h3>
		<?php
	if ( empty( $top_posts ) ) {
?>
			<p class="nothing"><?php  esc_html_e( 'Sorry, nothing to report.', 'jetpack' ); ?></p>
			<?php
	} else {
		foreach ( $top_posts as $post ) {
			if ( ! get_post( $post['post_id'] ) ) {
				continue;
			}
?>
				<p><?php printf(
				$printf,
				'<a href="' . get_permalink( $post['post_id'] ) . '">' . get_the_title( $post['post_id'] ) . '</a>',
				number_format_i18n( $post['views'] )
			); ?></p>
				<?php
		}
	}
?>
		</div>
	</div>
	<div id="top-search" class='stats-section'>
		<div class="stats-section-inner">
		<h3 class="heading"><?php  esc_html_e( 'Top Searches' , 'jetpack' ); ?></h3>
		<?php
	if ( empty( $searches ) ) {
?>
			<p class="nothing"><?php  esc_html_e( 'Sorry, nothing to report.', 'jetpack' ); ?></p>
			<?php
	} else {
?>
			<p><?php echo join( ',&nbsp; ', $searches );?></p>
			<?php
	}
?>
		</div>
	</div>
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
	$state_name = 'stats_remote_error_' . substr( md5( $url ), 0, 8 );
	$previous_error = Jetpack::state( $state_name );
	$error = md5( serialize( compact( 'get', 'url' ) ) );
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
	<p><?php printf( __( 'We were unable to get your stats just now. Please reload this page to try again. If this error persists, please <a href="%1$s" target="_blank">contact support</a>. In your report please include the information below.', 'jetpack' ), 'https://support.wordpress.com/contact/?jetpack=needs-service' ); ?></p>
	<pre>
	User Agent: "<?php echo esc_html( $_SERVER['HTTP_USER_AGENT'] ); ?>"
	Page URL: "http<?php echo (is_ssl()?'s':'') . '://' . esc_html( $_SERVER['HTTP_HOST'] . $_SERVER['REQUEST_URI'] ); ?>"
	API URL: "<?php echo esc_url( $url ); ?>"
<?php
if ( is_wp_error( $get ) ) {
	foreach ( $get->get_error_codes() as $code ) {
		foreach ( $get->get_error_messages( $code ) as $message ) {
?>
<?php print $code . ': "' . $message . '"' ?>

<?php
		}
	}
} else {
	$get_code = wp_remote_retrieve_response_code( $get );
	$content_length = strlen( wp_remote_retrieve_body( $get ) );
?>
Response code: "<?php print $get_code ?>"
Content length: "<?php print $content_length ?>"

<?php
}
	?></pre>
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
	$defaults = array( 'end' => false, 'days' => false, 'limit' => 3, 'post_id' => false, 'summarize' => '' );

	$args = wp_parse_args( $args, $defaults );
	$args['table'] = $table;
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
		if ( ! $stats = stats_get_remote_csv( $stats_csv_url ) ) {
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
	$method = 'GET';
	$timeout = 90;
	$user_id = JETPACK_MASTER_USER;

	$get = Jetpack_Client::remote_request( compact( 'url', 'method', 'timeout', 'user_id' ) );
	$get_code = wp_remote_retrieve_response_code( $get );
	if ( is_wp_error( $get ) || ( 2 !== intval( $get_code / 100 ) && 304 !== $get_code ) || empty( $get['body'] ) ) {
		return array(); // @todo: return an error?
	} else {
		return stats_str_getcsv( $get['body'] );
	}
}

/**
 * Rather than parsing the csv and its special cases, we create a new file and do fgetcsv on it.
 *
 * @access public
 * @param mixed $csv CSV.
 * @return array.
 */
function stats_str_getcsv( $csv ) {
	if ( function_exists( 'str_getcsv' ) ) {
		$lines = str_getcsv( $csv, "\n" );
		return array_map( 'str_getcsv', $lines );
	}
	if ( ! $temp = tmpfile() ) { // The tmpfile() automatically unlinks.
		return false;
	}

	$data = array();

	fwrite( $temp, $csv, strlen( $csv ) );
	fseek( $temp, 0 );
	while ( false !== $row = fgetcsv( $temp, 2000 ) ) {
		$data[] = $row;
	}
	fclose( $temp );

	return $data;
}

/**
 * Abstract out building the rest api stats path.
 *
 * @param  string $resource Resource.
 * @return string
 */
function jetpack_stats_api_path( $resource = '' ) {
	$resource = ltrim( $resource, '/' );
	return sprintf( '/sites/%d/stats/%s', stats_get_option( 'blog_id' ), $resource );
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
	$cache_key   = md5( implode( '|', array( $endpoint, $api_version, serialize( $args ) ) ) );

	// Get cache.
	$stats_cache = Jetpack_Options::get_option( 'restapi_stats_cache', array() );
	if ( ! is_array( $stats_cache ) ) {
		$stats_cache = array();
	}

	// Return or expire this key.
	if ( isset( $stats_cache[ $cache_key ] ) ) {
		$time = key( $stats_cache[ $cache_key ] );
		if ( time() - $time < ( 5 * MINUTE_IN_SECONDS ) ) {
			$cached_stats = $stats_cache[ $cache_key ][ $time ];
			$cached_stats = (object) array_merge( array( 'cached_at' => $time ), (array) $cached_stats );
			return $cached_stats;
		}
		unset( $stats_cache[ $cache_key ] );
	}

	// Do the dirty work.
	$response = Jetpack_Client::wpcom_json_api_request_as_blog( $endpoint, $api_version, $args );
	if ( 200 !== wp_remote_retrieve_response_code( $response ) ) {
		// If bad, just return it, don't cache.
		return $response;
	}

	$data = json_decode( wp_remote_retrieve_body( $response ) );

	// Expire old keys.
	foreach ( $stats_cache as $k => $cache ) {
		if ( ! is_array( $cache ) || ( 5 * MINUTE_IN_SECONDS ) < time() - key( $cache ) ) {
			unset( $stats_cache[ $k ] );
		}
	}

	// Set cache.
	$stats_cache[ $cache_key ] = array(
		time() => $data,
	);
	Jetpack_Options::update_option( 'restapi_stats_cache', $stats_cache, false );

	return $data;
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
function jetpack_stats_post_table( $columns ) { // Adds a stats link on the edit posts page
	if ( ! current_user_can( 'view_stats' ) || ! Jetpack::is_user_connected() ) {
		return $columns;
	}
	// Array-Fu to add before comments
	$pos = array_search( 'comments', array_keys( $columns ) );
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
	if ( 'stats' == $column ) {
		if ( 'publish' != get_post_status( $post_id ) ) {
			printf(
				'<span aria-hidden="true">—</span><span class="screen-reader-text">%s</span>',
				esc_html__( 'No stats', 'jetpack' )
			);
		} else {
			printf(
				'<a href="%s" title="%s" class="dashicons dashicons-chart-bar" target="_blank"></a>',
				esc_url( "https://wordpress.com/stats/post/$post_id/" . Jetpack::build_raw_urls( get_home_url() ) ),
				esc_html__( 'View stats for this post in WordPress.com', 'jetpack' )
			);
		}
	}
}
