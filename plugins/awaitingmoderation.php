<?php

function awaitingmoderation_action( $buffer ) {
	$buffer = str_replace( __( 'Your comment is awaiting moderation.' ), '', $buffer );
	return $buffer;
}

function awaitingmoderation_actions() {
	global $cache_awaitingmoderation;
	if( $cache_awaitingmoderation == '1' ) {
		add_filter( 'wpsupercache_buffer', 'awaitingmoderation_action' );
	}
}
add_cacheaction( 'add_cacheaction', 'awaitingmoderation_actions' );

//Your comment is awaiting moderation.
function wp_supercache_awaitingmoderation_admin() {
	global $cache_awaitingmoderation, $wp_cache_config_file, $valid_nonce;
	
	$cache_awaitingmoderation = $cache_awaitingmoderation == '' ? '0' : $cache_awaitingmoderation;

	if(isset($_POST['cache_awaitingmoderation']) && $valid_nonce) {
		$cache_awaitingmoderation = $_POST['cache_awaitingmoderation'] == __( 'Disable', 'wp-super-cache' ) ? '0' : '1';
		wp_cache_replace_line('^ *\$cache_awaitingmoderation', "\$cache_awaitingmoderation = '$cache_awaitingmoderation';", $wp_cache_config_file);
	}
	echo '<li><form name="wp_supercache_searchengine_admin" action="'. $_SERVER["REQUEST_URI"] . '" method="post">';
	wp_nonce_field('wp-cache');
	if( $cache_awaitingmoderation == '0' ) {
		$status = __( 'disabled', 'wp-super-cache' );
	} else {
		$status = __( 'enabled', 'wp-super-cache' );
	}
	echo '<strong>' . sprintf( __( 'Awaiting Moderation plugin is %s', 'wp-super-cache' ), $status );
	echo '.</strong> ' . __( '(Remove the text "Your comment is awaiting moderation." when someone leaves a moderated comment.) ', 'wp-super-cache' );
	if( $cache_awaitingmoderation == '0' ) {
		echo '<input type="submit" name="cache_awaitingmoderation" value="' . __( 'Enable', 'wp-super-cache' ) . '" />';
	} else {
		echo '<input type="submit" name="cache_awaitingmoderation" value="' . __( 'Disable', 'wp-super-cache' ) . '" />';
	}
	echo "</form></li>\n";

}
add_cacheaction( 'cache_admin_page', 'wp_supercache_awaitingmoderation_admin' );
?>
