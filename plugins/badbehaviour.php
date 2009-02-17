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
	require_once( WP_CONTENT_DIR . '/plugins/Bad-Behavior/bad-behavior-generic.php' );
}

function wp_supercache_badbehaviour_admin() {
	global $cache_badbehaviour, $wp_cache_config_file, $valid_nonce;
	
	$cache_badbehaviour = $cache_badbehaviour == '' ? 'no' : $cache_badbehaviour;

	$err = false;

	if(isset($_POST['cache_badbehaviour']) && $valid_nonce) {
		if( !file_exists( WP_CONTENT_DIR . '/plugins/Bad-Behavior/bad-behavior-generic.php' ) ) {
			$_POST[ 'cache_badbehaviour' ] = 'Disable';
			$err = 'Bad Behaviour not found. Please check your install.';
		}
		$cache_badbehaviour = $_POST['cache_badbehaviour'] == 'Disable' ? 0 : 1;
		wp_cache_replace_line('^ *\$cache_badbehaviour', "\$cache_badbehaviour = $cache_badbehaviour;", $wp_cache_config_file);
	}
	echo '<form name="wp_supercache_badbehaviour_admin" action="'. $_SERVER["REQUEST_URI"] . '" method="post">';
	wp_nonce_field('wp-cache');
	echo '<strong>Bad Behaviour support is ';
	if( $cache_badbehaviour == 0 ) {
		echo 'disabled';
	} else {
		echo 'enabled';
		wp_super_cache_disable();
	}
	echo '.</strong> (Only half-on caching supported and requires <a href="http://www.bad-behavior.ioerror.us/">Bad Behaviour</a> in "' . WP_CONTENT_DIR . '/plugins/Bad-Behaviour/") ';
	if( $cache_badbehaviour == 0 ) {
		echo '<input type="submit" name="cache_badbehaviour" value="Enable" />';
	} else {
		echo '<input type="submit" name="cache_badbehaviour" value="Disable" />';
	}
	echo "</form>\n";
	if( $err )
		echo "<p><strong>Warning!</strong> $err</p>";

}
add_cacheaction( 'cache_admin_page', 'wp_supercache_badbehaviour_admin' );

?>
