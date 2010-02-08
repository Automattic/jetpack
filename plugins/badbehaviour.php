<?php

function wp_supercache_badbehaviour( $file ) {
	global $cache_badbehaviour;

	if( $cache_badbehaviour != 1 )
		return $file;
	wp_supercache_badbehaviour_include();
	return $file;
}
add_cacheaction( 'wp_cache_served_cache_file', 'wp_supercache_badbehaviour' );

function wp_supercache_badbehaviour_include() {
	$bbfile = get_bb_file_loc();
	if( !$bbfile )
		require_once( $bbfile );
}

function get_bb_file_loc() {
	global $cache_badbehaviour_file;
	if( $cache_badbehaviour_file )
		return $cache_badbehaviour_file;

	if( file_exists( WP_CONTENT_DIR . '/plugins/bad-behavior/bad-behavior-generic.php' ) ) {
		$bbfile = WP_CONTENT_DIR . '/plugins/bad-behavior/bad-behavior-generic.php';
	} elseif( file_exists( WP_CONTENT_DIR . '/plugins/Bad-Behavior/bad-behavior-generic.php' ) ) {
		$bbfile = WP_CONTENT_DIR . '/plugins/Bad-Behavior/bad-behavior-generic.php';
	} else {
		$bbfile = false;
	}
	return $bbfile;
}

function wp_supercache_badbehaviour_admin() {
	global $cache_badbehaviour, $wp_cache_config_file, $valid_nonce;
	
	$cache_badbehaviour = $cache_badbehaviour == '' ? 'no' : $cache_badbehaviour;

	$err = false;

	if(isset($_POST['cache_badbehaviour']) && $valid_nonce) {
		$bbfile = get_bb_file_loc();
		if( !$bbfile ) {
			$_POST[ 'cache_badbehaviour' ] = 'Disable';
			$err = __( 'Bad Behaviour not found. Please check your install.', 'wp-super-cache' );
		}
		$cache_badbehaviour = $_POST['cache_badbehaviour'] == __( 'Disable', 'wp-super-cache' ) ? 0 : 1;
		wp_cache_replace_line('^ *\$cache_compression', "\$cache_compression = 0;", $wp_cache_config_file);
		wp_cache_replace_line('^ *\$cache_badbehaviour', "\$cache_badbehaviour = $cache_badbehaviour;", $wp_cache_config_file);
		wp_cache_replace_line('^ *\$cache_badbehaviour_file', "\$cache_badbehaviour_file = '$bbfile';", $wp_cache_config_file);
	}
	echo '<form name="wp_supercache_badbehaviour_admin" action="'. $_SERVER["REQUEST_URI"] . '" method="post">';
	wp_nonce_field('wp-cache');
	if( $cache_badbehaviour == 0 ) {
		$bb_status = __( 'disabled', 'wp-super-cache' );
	} else {
		$bb_status = __( 'enabled', 'wp-super-cache' );
		wp_super_cache_disable();
	}
	echo '<strong>' . sprintf( __( 'Bad Behaviour support is %s.', 'wp-super-cache' ), $bb_status ) . '</strong>';
	printf( __( '(Only half-on caching supported, disabled compression and requires <a href="http://www.bad-behavior.ioerror.us/">Bad Behavior</a> in "%s/plugins/bad-behavior/") ', 'wp-super-cache' ), WP_CONTENT_DIR );
	if( $cache_badbehaviour == 0 ) {
		echo '<input type="submit" name="cache_badbehaviour" value="' . __( 'Enable', 'wp-super-cache' ) . '" />';
	} else {
		echo '<input type="submit" name="cache_badbehaviour" value="' . __( 'Disable', 'wp-super-cache' ) . '" />';
	}
	echo "</form>\n";
	if( $err )
		echo "<p><strong>" . __( 'Warning!', 'wp-super-cache' ) . "</strong> $err</p>";

}
add_cacheaction( 'cache_admin_page', 'wp_supercache_badbehaviour_admin' );

?>
