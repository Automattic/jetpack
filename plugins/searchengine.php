<?php

function wp_supercache_searchengine( $string ) {
	global $passingthrough, $nevershowads, $cache_no_adverts_for_friends;

	$cache_no_adverts_for_friends = wpsc_get_searchengine_setting();
	if ( ! $cache_no_adverts_for_friends || '' != $string ) {
		return $string;
	}

	if ( isset( $_COOKIE['7a1254cba80da02d5478d91cfd0a873a'] ) && '1' === $_COOKIE['7a1254cba80da02d5478d91cfd0a873a'] ) {
		$string = 'searchengine';
	} elseif ( ! empty( $_SERVER['HTTP_REFERER'] ) ) {
		if ( is_array( $passingthrough ) === false ) {
			return $string;
		}

		foreach ( $passingthrough as $url ) {
			if ( strpos( $_SERVER['HTTP_REFERER'], $url ) ) {
				reset( $nevershowads );
				$se = false;
				foreach ( $nevershowads as $whitesite ) {
					if ( false === strpos( $_SERVER['HTTP_REFERER'], $whitesite ) ) {
						$se = true;
					}
				}
				if ( $se ) {
					$string = 'searchengine';
					@setcookie( '7a1254cba80da02d5478d91cfd0a873a', 1, time() + 3600, '/' );
				}
			}
		}
	}

	return $string;
}
add_cacheaction( 'wp_cache_get_cookies_values', 'wp_supercache_searchengine' );

function searchenginesupercache( $user_info ) {
	if ( 'searchengine' === $user_info && is_single() && is_old_post() ) {
		return true;
	} else {
		return false;
	}
}

function wpsc_get_searchengine_setting() {
	global $cache_no_adverts_for_friends;

	if ( ! isset( $cache_no_adverts_for_friends ) ) {
		return 0;
	}

	$changed = false;
	if ( 'yes' === $cache_no_adverts_for_friends || '1' === $cache_no_adverts_for_friends ) {
		$cache_no_adverts_for_friends = 1;
		$changed = true;
	} elseif ( 'no' === $cache_no_adverts_for_friends ) {
		$cache_no_adverts_for_friends = 0;
		$changed = true;
	}
	if ( $changed && function_exists( 'wp_cache_setting' ) ) {
		wp_cache_setting( 'cache_no_adverts_for_friends', $cache_no_adverts_for_friends );
	}

	return $cache_no_adverts_for_friends;
}

function searchengine_phase2_actions() {
	global $cache_no_adverts_for_friends;

	$cache_no_adverts_for_friends = wpsc_get_searchengine_setting();
	if ( $cache_no_adverts_for_friends ) {
		add_filter( 'do_createsupercache', 'searchenginesupercache' );
	}
}
add_cacheaction( 'add_cacheaction', 'searchengine_phase2_actions' );

function wp_supercache_searchengine_admin() {
	global $cache_no_adverts_for_friends, $valid_nonce;

	$cache_no_adverts_for_friends = wpsc_get_searchengine_setting();

	if ( isset( $_POST['cache_no_adverts_for_friends'] ) && $valid_nonce ) {
		if ( $cache_no_adverts_for_friends !== (int) $_POST['cache_no_adverts_for_friends'] ) {
			$changed = 1;
		} else {
			$changed = 0;
		}
		$cache_no_adverts_for_friends = (int) $_POST['cache_no_adverts_for_friends'];
		wp_cache_setting( 'cache_no_adverts_for_friends', $cache_no_adverts_for_friends );
	}
	?>
		<fieldset id="no_adverts_for_friends-section" class="options">
		<h4><?php _e( 'No Adverts for Friends', 'wp-super-cache' ); ?></h4>
		<form name="wp_manager" action="" method="post">
		<label><input type="radio" name="cache_no_adverts_for_friends" value="1" <?php if ( $cache_no_adverts_for_friends ) { echo 'checked="checked" '; } ?>/> <?php _e( 'Enabled', 'wp-super-cache' ); ?></label>
		<label><input type="radio" name="cache_no_adverts_for_friends" value="0" <?php if ( ! $cache_no_adverts_for_friends ) { echo 'checked="checked" '; } ?>/> <?php _e( 'Disabled', 'wp-super-cache' ); ?></label>
	<?php
	echo '<p>' . __( 'Provides support for <a href="https://odd.blog/no-adverts-for-friends/">No Adverts for Friends</a>.', 'wp-super-cache' ) . '</p>';
	if ( isset( $changed ) && $changed ) {
		if ( $cache_no_adverts_for_friends ) {
			$status = __( 'enabled', 'wp-super-cache' );
		} else {
			$status = __( 'disabled', 'wp-super-cache' );
		}
		echo '<p><strong>' . sprintf( __( 'No Adverts for Friends support is now %s', 'wp-super-cache' ), $status ) . '</strong></p>';
	}
	echo '<div class="submit"><input class="button-primary" ' . SUBMITDISABLED . 'type="submit" value="' . __( 'Update', 'wp-super-cache' ) . '" /></div>';
	wp_nonce_field( 'wp-cache' );
	?>
	</form>
	</fieldset>
<?php

}
add_cacheaction( 'cache_admin_page', 'wp_supercache_searchengine_admin' );

function wpsc_cache_no_adverts_for_friends_list( $list ) {
	$list['no_adverts_for_friends'] = array(
		'key'   => 'no_adverts_for_friends',
		'url'   => 'https://odd.blog/no-adverts-for-friends/',
		'title' => __( 'No Adverts for Friends', 'wp-super-cache' ),
		'desc'  => __( 'Provides support for No Adverts for Friends plugin.', 'wp-super-cache' ),
	);
	return $list;
}
add_cacheaction( 'wpsc_filter_list', 'wpsc_cache_no_adverts_for_friends_list' );
