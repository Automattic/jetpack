<?php
// don't call the file directly
defined( 'ABSPATH' ) or die();

include_once dirname( __FILE__ ) . '/vp-scanner.php';

if ( !function_exists( 'apply_filters_ref_array' ) ) :

function apply_filters_ref_array($tag, $args) {
	global $wp_filter, $merged_filters, $wp_current_filter;

	// Do 'all' actions first
	if ( isset($wp_filter['all']) ) {
		$wp_current_filter[] = $tag;
		$all_args = func_get_args();
		_wp_call_all_hook($all_args);
	}

	if ( !isset($wp_filter[$tag]) ) {
		if ( isset($wp_filter['all']) )
			array_pop($wp_current_filter);
			return $args[0];
	}

	if ( !isset($wp_filter['all']) )
		$wp_current_filter[] = $tag;

	// Sort
	if ( !isset( $merged_filters[ $tag ] ) ) {
		ksort($wp_filter[$tag]);
		$merged_filters[ $tag ] = true;
	}

	reset( $wp_filter[ $tag ] );

	do {
		foreach( (array) current($wp_filter[$tag]) as $the_ )
			if ( !is_null($the_['function']) )
				$args[0] = call_user_func_array($the_['function'], array_slice($args, 0, (int) $the_['accepted_args']));

	} while ( next($wp_filter[$tag]) !== false );

	array_pop( $wp_current_filter );

	return $args[0];
}

endif;

class VP_Site_Scanner {
	function __construct() {
		// Only scan once in multisites.
		if( function_exists( 'is_main_site' ) && !is_main_site() )
			return;
		add_action( 'vp_scan_site'      , array( $this, '_scan_site') );
		add_filter( 'cron_schedules'    , array( $this, '_custom_cron' ) );
		add_action( 'vp_scan_next_batch', array( $this, '_scan_batch' ) );

		$signatures = get_option( '_vp_signatures' );
		if ( $signatures && ! wp_next_scheduled( 'vp_scan_site' ) )
			wp_schedule_event( time(), 'daily', 'vp_scan_site' );
		if ( $signatures && ! wp_next_scheduled( 'vp_scan_next_batch' ) )
			wp_schedule_event( time(), 'five_minutes_interval', 'vp_scan_next_batch' );
	}

	function _custom_cron( $schedules ) {
		$schedules['five_minutes_interval'] = array(
			'interval' => 300,
			'display'  => __( 'Once every five minutes' , 'vaultpress'),
		);
		return $schedules;
	}

	function _scan_site() {
		if ( !get_option( '_vp_current_scan' ) ) {
			$ignore_symlinks = get_option( '_vp_ignore_symlinks', false );
			$paths = array( 'root' => new VP_FileScan( ABSPATH, $ignore_symlinks ) );

			// Is WP_CONTENT_DIR inside ABSPATH?
			if ( is_dir( WP_CONTENT_DIR ) && strpos( realpath( WP_CONTENT_DIR ), realpath( ABSPATH ) . DIRECTORY_SEPARATOR ) !== 0 )
				$paths['content'] = new VP_FileScan( WP_CONTENT_DIR, $ignore_symlinks );

			// Is WP_PLUGIN_DIR inside ABSPATH or WP_CONTENT_DIR?
			if ( is_dir( WP_PLUGIN_DIR ) && strpos( realpath( WP_PLUGIN_DIR ), realpath( WP_CONTENT_DIR ) . DIRECTORY_SEPARATOR ) !== 0 && strpos( realpath( WP_PLUGIN_DIR ), realpath( ABSPATH ) . DIRECTORY_SEPARATOR ) !== 0 )
				$paths['plugins'] = new VP_FileScan( WP_PLUGIN_DIR, $ignore_symlinks );

			// Is WPMU_PLUGIN_DIR inside ABSPATH or WP_CONTENT_DIR?
			if ( is_dir( WPMU_PLUGIN_DIR ) && strpos( realpath( WPMU_PLUGIN_DIR ), realpath( WP_CONTENT_DIR ) . DIRECTORY_SEPARATOR ) !== 0 && strpos( realpath( WPMU_PLUGIN_DIR ), realpath( ABSPATH ) . DIRECTORY_SEPARATOR ) !== 0 )
				$paths['mu-plugins'] = new VP_FileScan( WPMU_PLUGIN_DIR, $ignore_symlinks );

			update_option( '_vp_current_scan', $paths );
		}
	}

	function _scan_clean_up( &$paths, $type = null ) {
		if( is_array( $paths ) )
			unset( $paths[$type] );
		if ( empty( $paths ) || !is_array( $paths ) ) {
			delete_option( '_vp_current_scan' );
			return true;
		}
		return false;
	}

	function _scan_batch() {
		$paths = get_option( '_vp_current_scan' );
		if ( empty( $paths ) || $this->_scan_clean_up( $paths ) )
			return false;

		reset( $paths );
		list( $type, $current ) = each( $paths );
		if ( !is_object( $current ) || empty( $current->last_dir ) )
			return $this->_scan_clean_up( $paths, $type );

		$default_batch_limit = 400;
		if ( ! function_exists( 'set_time_limit' ) || ! @set_time_limit( 0 ) ) {
			$default_batch_limit = 100; // avoid timeouts
		}

		$GLOBALS['vp_signatures'] = get_option( '_vp_signatures' );
		if ( empty( $GLOBALS['vp_signatures'] ) )
			return false;

		$limit = get_option( '_vp_batch_file_size', $default_batch_limit );
		$files = $current->get_files( $limit );

		// No more files to scan.
		if ( !$current->last_dir || count( $files ) < $limit )
			unset( $paths[$type] );

		update_option( '_vp_current_scan', $paths );
		$results = array();
		foreach ( $files as $file ) {
			$verdict = vp_scan_file( $file );
			if ( !empty( $verdict ) )
				$results[$file] = array( 'hash' => @md5_file( $file ), 'verdict' => $verdict );
		}

		if ( !empty( $results ) ) {
			$vaultpress = VaultPress::init();
			$vaultpress->add_ping( 'security', array( 'suspicious_v2' => $results ) );
		}
	}

	static function &init() {
		static $instance = false;
		if ( !$instance )
			$instance = new VP_Site_Scanner();
		return $instance;
	}
}
VP_Site_Scanner::init();
