<?php
function wp_supercache_searchengine( $string ) {
	global $passingthrough, $nevershowads, $cache_no_adverts_for_friends;

	if( $cache_no_adverts_for_friends != 'yes' )
		return $string;

	if( $string != '' )
		return $string;

	if( $_COOKIE[ '7a1254cba80da02d5478d91cfd0a873a' ] == 1 ) {
		$string = 'searchengine';
	} elseif( $_SERVER[ 'HTTP_REFERER' ] != '' ) {
		if( is_array( $passingthrough ) == false )
			return $string;

		foreach( $passingthrough as $url ) {
			if( strpos( $_SERVER[ 'HTTP_REFERER' ], $url ) ) {
				reset( $nevershowads );
				$se = false;
				foreach( $nevershowads as $whitesite ) {
					if( false == strpos( $_SERVER[ 'HTTP_REFERER' ], $whitesite ) ) {
						$se = true;
					}
				}
				if( $se ) {
					$string = 'searchengine';
					@setcookie( '7a1254cba80da02d5478d91cfd0a873a', 1, time()+3600, '/' );
				}
			}
		}
	}

	return $string;
}
add_cacheaction( 'wp_cache_get_cookies_values', 'wp_supercache_searchengine' );

function searchenginesupercache( $user_info ) {
	if( $user_info == 'searchengine' && is_single() && is_old_post() ) {
		return true;
	} else {
		return false;
	}
	return $user_info;
}

function searchengine_phase2_actions() {
	global $cache_no_adverts_for_friends;
	if( $cache_no_adverts_for_friends == 'yes' ) {
		add_filter( 'do_createsupercache', 'searchenginesupercache' );
	}
}
add_cacheaction( 'add_cacheaction', 'searchengine_phase2_actions' );

function wp_supercache_searchengine_admin() {
	global $cache_no_adverts_for_friends, $wp_cache_config_file, $valid_nonce;
	
	$cache_no_adverts_for_friends = $cache_no_adverts_for_friends == '' ? 'no' : $cache_no_adverts_for_friends;

	if(isset($_POST['cache_no_adverts_for_friends']) && $valid_nonce) {
		$cache_no_adverts_for_friends = $_POST['cache_no_adverts_for_friends'] == __( 'Disable', 'wp-super-cache' ) ? 'no' : 'yes';
		wp_cache_replace_line('^ *\$cache_no_adverts_for_friends', "\$cache_no_adverts_for_friends = '$cache_no_adverts_for_friends';", $wp_cache_config_file);
	}
	echo '<form name="wp_supercache_searchengine_admin" action="'. $_SERVER["REQUEST_URI"] . '" method="post">';
	wp_nonce_field('wp-cache');
	if( $cache_no_adverts_for_friends == 'no' ) {
		$status = __( 'disabled', 'wp-super-cache' );
	} else {
		$status = __( 'enabled', 'wp-super-cache' );
	}
	echo '<strong>' . sprintf( __( '<a href="http://ocaoimh.ie/no-adverts-for-friends/">No Adverts for Friends</a> plugin is %s.', 'wp-super-cache' ), $status );
	echo '</strong> ' . __( '(requires <a href="http://ocaoimh.ie/no-adverts-for-friends/">friendsadverts.php</a> too) ', 'wp-super-cache' );
	if( $cache_no_adverts_for_friends == 'no' ) {
		echo '<input type="submit" name="cache_no_adverts_for_friends" value="' . __( 'Enable', 'wp-super-cache' ) . '" />';
	} else {
		echo '<input type="submit" name="cache_no_adverts_for_friends" value="' . __( 'Disable', 'wp-super-cache' ) . '" />';
	}
	echo "</form>\n";

}
add_cacheaction( 'cache_admin_page', 'wp_supercache_searchengine_admin' );

?>
