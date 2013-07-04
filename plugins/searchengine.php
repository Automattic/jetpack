<?php
function wp_supercache_searchengine( $string ) {
	global $passingthrough, $nevershowads, $cache_no_adverts_for_friends;

	if( $cache_no_adverts_for_friends != 'yes' && $cache_no_adverts_for_friends != '1' )
		return $string;

	if( $string != '' )
		return $string;

	if( isset( $_COOKIE[ '7a1254cba80da02d5478d91cfd0a873a' ] ) && $_COOKIE[ '7a1254cba80da02d5478d91cfd0a873a' ] == 1 ) {
		$string = 'searchengine';
	} elseif( isset( $_SERVER[ 'HTTP_REFERER' ] ) && $_SERVER[ 'HTTP_REFERER' ] != '' ) {
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
	$id = 'no_adverts_for_friends-section';
	?>
		<fieldset id="<?php echo $id; ?>" class="options"> 
		<h4><?php _e( 'No Adverts for Friends', 'wp-super-cache' ); ?></h4>
		<form name="wp_manager" action="" method="post">
		<label><input type="radio" name="cache_no_adverts_for_friends" value="1" <?php if( $cache_no_adverts_for_friends == 'yes' ) { echo 'checked="checked" '; } ?>/> <?php _e( 'Enabled', 'wp-super-cache' ); ?></label>
		<label><input type="radio" name="cache_no_adverts_for_friends" value="0" <?php if( $cache_no_adverts_for_friends == 'no' ) { echo 'checked="checked" '; } ?>/> <?php _e( 'Disabled', 'wp-super-cache' ); ?></label>
		<p><?php _e( '', 'wp-super-cache' ); ?></p><?php
		echo '<p>' . __( 'Provides support for <a href="http://ocaoimh.ie/no-adverts-for-friends/">No Adverts for Friends</a>.', 'wp-super-cache' ) . '</p>';
		if ( isset( $changed ) && $changed ) {
			if ( 'yes' == $cache_no_adverts_for_friends )
				$status = __( "enabled" );
			else
				$status = __( "disabled" );
			echo "<p><strong>" . sprintf( __( "No Adverts for Friends support is now %s", 'wp-super-cache' ), $status ) . "</strong></p>";
		}
	echo '<div class="submit"><input ' . SUBMITDISABLED . 'type="submit" value="' . __( 'Update', 'wp-super-cache' ) . '" /></div>';
	wp_nonce_field('wp-cache');
	?>
	</form>
	</fieldset>
<?php

}
add_cacheaction( 'cache_admin_page', 'wp_supercache_searchengine_admin' );

?>
