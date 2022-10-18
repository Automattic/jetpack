<?php
/**
 * Settings Catch page where th functions which were just littered on the main page live
 * Adding as a file which we can include to the wpsc_header_render()
 *
 */

if ( ! wpsupercache_site_admin() ) {
	return false;
}

$valid_nonce = isset( $_REQUEST['_wpnonce'] ) ? wp_verify_nonce( $_REQUEST['_wpnonce'], 'wp-cache' ) : false;

// used by mod_rewrite rules and config file
if ( function_exists( 'cfmobi_default_browsers' ) ) {
	$wp_cache_mobile_browsers = cfmobi_default_browsers( 'mobile' );
	$wp_cache_mobile_browsers = array_merge( $wp_cache_mobile_browsers, cfmobi_default_browsers( 'touch' ) );
} elseif ( function_exists( 'lite_detection_ua_contains' ) ) {
	$wp_cache_mobile_browsers = explode( '|', lite_detection_ua_contains() );
} else {
	$wp_cache_mobile_browsers = array( '2.0 MMP', '240x320', '400X240', 'AvantGo', 'BlackBerry', 'Blazer', 'Cellphone', 'Danger', 'DoCoMo', 'Elaine/3.0', 'EudoraWeb', 'Googlebot-Mobile', 'hiptop', 'IEMobile', 'KYOCERA/WX310K', 'LG/U990', 'MIDP-2.', 'MMEF20', 'MOT-V', 'NetFront', 'Newt', 'Nintendo Wii', 'Nitro', 'Nokia', 'Opera Mini', 'Palm', 'PlayStation Portable', 'portalmmm', 'Proxinet', 'ProxiNet', 'SHARP-TQ-GX10', 'SHG-i900', 'Small', 'SonyEricsson', 'Symbian OS', 'SymbianOS', 'TS21i-10', 'UP.Browser', 'UP.Link', 'webOS', 'Windows CE', 'WinWAP', 'YahooSeeker/M1A1-R2D2', 'iPhone', 'iPod', 'iPad', 'Android', 'BlackBerry9530', 'LG-TU915 Obigo', 'LGE VX', 'webOS', 'Nokia5800' );
}
if ( function_exists( 'lite_detection_ua_prefixes' ) ) {
	$wp_cache_mobile_prefixes = lite_detection_ua_prefixes();
} else {
	$wp_cache_mobile_prefixes = array( 'w3c ', 'w3c-', 'acs-', 'alav', 'alca', 'amoi', 'audi', 'avan', 'benq', 'bird', 'blac', 'blaz', 'brew', 'cell', 'cldc', 'cmd-', 'dang', 'doco', 'eric', 'hipt', 'htc_', 'inno', 'ipaq', 'ipod', 'jigs', 'kddi', 'keji', 'leno', 'lg-c', 'lg-d', 'lg-g', 'lge-', 'lg/u', 'maui', 'maxo', 'midp', 'mits', 'mmef', 'mobi', 'mot-', 'moto', 'mwbp', 'nec-', 'newt', 'noki', 'palm', 'pana', 'pant', 'phil', 'play', 'port', 'prox', 'qwap', 'sage', 'sams', 'sany', 'sch-', 'sec-', 'send', 'seri', 'sgh-', 'shar', 'sie-', 'siem', 'smal', 'smar', 'sony', 'sph-', 'symb', 't-mo', 'teli', 'tim-', 'tosh', 'tsm-', 'upg1', 'upsi', 'vk-v', 'voda', 'wap-', 'wapa', 'wapi', 'wapp', 'wapr', 'webc', 'winw', 'winw', 'xda ', 'xda-' ); // from http://svn.wp-plugins.org/wordpress-mobile-pack/trunk/plugins/wpmp_switcher/lite_detection.php
}
$wp_cache_mobile_browsers = apply_filters( 'cached_mobile_browsers', $wp_cache_mobile_browsers ); // Allow mobile plugins access to modify the mobile UA list
$wp_cache_mobile_prefixes = apply_filters( 'cached_mobile_prefixes', $wp_cache_mobile_prefixes ); // Allow mobile plugins access to modify the mobile UA prefix list
if ( function_exists( 'do_cacheaction' ) ) {
	$wp_cache_mobile_browsers = do_cacheaction( 'wp_super_cache_mobile_browsers', $wp_cache_mobile_browsers );
	$wp_cache_mobile_prefixes = do_cacheaction( 'wp_super_cache_mobile_prefixes', $wp_cache_mobile_prefixes );
}
$mobile_groups = apply_filters( 'cached_mobile_groups', array() ); // Group mobile user agents by capabilities. Lump them all together by default
// mobile_groups = array( 'apple' => array( 'ipod', 'iphone' ), 'nokia' => array( 'nokia5800', 'symbianos' ) );

$wp_cache_mobile_browsers = implode( ', ', $wp_cache_mobile_browsers );
$wp_cache_mobile_prefixes = implode( ', ', $wp_cache_mobile_prefixes );

if ( false == apply_filters( 'wp_super_cache_error_checking', true ) ) {
	return false;
}

if ( function_exists( 'get_supercache_dir' ) ) {
	$supercachedir = get_supercache_dir();
}
if ( get_option( 'gzipcompression' ) == 1 ) {
	update_option( 'gzipcompression', 0 );
}
if ( ! isset( $cache_rebuild_files ) ) {
	$cache_rebuild_files = 0;
}

if ( substr( get_option( 'permalink_structure' ), -1 ) == '/' ) {
	wp_cache_replace_line( '^ *\$wp_cache_slash_check', '$wp_cache_slash_check = 1;', $wp_cache_config_file );
} else {
	wp_cache_replace_line( '^ *\$wp_cache_slash_check', '$wp_cache_slash_check = 0;', $wp_cache_config_file );
}
$home_path = parse_url( site_url() );
$home_path = trailingslashit( array_key_exists( 'path', $home_path ) ? $home_path['path'] : '' );
if ( ! isset( $wp_cache_home_path ) ) {
	$wp_cache_home_path = '/';
	wp_cache_setting( 'wp_cache_home_path', '/' );
}
if ( "$home_path" != "$wp_cache_home_path" ) {
	wp_cache_setting( 'wp_cache_home_path', $home_path );
}

if ( $wp_cache_mobile_enabled == 1 ) {
	update_cached_mobile_ua_list( $wp_cache_mobile_browsers, $wp_cache_mobile_prefixes, $mobile_groups );
}

if ( false === $cache_enabled && ! isset( $wp_cache_mod_rewrite ) ) {
	$wp_cache_mod_rewrite = 0;
} elseif ( ! isset( $wp_cache_mod_rewrite ) && $cache_enabled && $super_cache_enabled ) {
	$wp_cache_mod_rewrite = 1;
}

if ( isset( $wp_super_cache_front_page_check ) && $wp_super_cache_front_page_check == 1 && ! wp_next_scheduled( 'wp_cache_check_site_hook' ) ) {
	wp_schedule_single_event( time() + 360, 'wp_cache_check_site_hook' );
	wp_cache_debug( 'scheduled wp_cache_check_site_hook for 360 seconds time.', 2 );
}

if ( isset( $_REQUEST['wp_restore_config'] ) && $valid_nonce ) {
	unlink( $wp_cache_config_file );
	echo '<strong>' . esc_html__( 'Configuration file changed, some values might be wrong. Load the page again from the "Settings" menu to reset them.', 'wp-super-cache' ) . '</strong>';
}


