<?php

function wp_super_cache_wptouch_admin() {
	global $cache_wptouch, $wp_cache_config_file, $valid_nonce;

	$cache_wptouch = '' === $cache_wptouch ? '0' : $cache_wptouch;

	if ( isset( $_POST['cache_wptouch'] ) && $valid_nonce ) {
		if ( $cache_wptouch === (int) $_POST['cache_wptouch'] ) {
			$changed = false;
		} else {
			$changed = true;
		}
		$cache_wptouch = (int) $_POST['cache_wptouch'];
		wp_cache_replace_line( '^ *\$cache_wptouch', "\$cache_wptouch = '$cache_wptouch';", $wp_cache_config_file );
	}
	$id = 'wptouch-section';
	?>
		<fieldset id="<?php echo $id; ?>" class="options">
		<h4><?php _e( 'WPTouch', 'wp-super-cache' ); ?></h4>
		<form name="wp_manager" action="" method="post">
		<label><input type="radio" name="cache_wptouch" value="1" <?php if ( $cache_wptouch ) { echo 'checked="checked" '; } ?>/> <?php _e( 'Enabled', 'wp-super-cache' ); ?></label>
		<label><input type="radio" name="cache_wptouch" value="0" <?php if ( ! $cache_wptouch ) { echo 'checked="checked" '; } ?>/> <?php _e( 'Disabled', 'wp-super-cache' ); ?></label>
	<?php
	echo '<p>' . __( 'Provides support for <a href="https://wordpress.org/plugins/wptouch/">WPTouch</a> mobile theme and plugin.', 'wp-super-cache' ) . '</p>';
	if ( isset( $changed ) && $changed ) {
		if ( $cache_wptouch ) {
			$status = __( 'enabled', 'wp-super-cache' );
		} else {
			$status = __( 'disabled', 'wp-super-cache' );
		}
		echo '<p><strong>' . sprintf( __( 'WPTouch support is now %s', 'wp-super-cache' ), $status ) . '</strong></p>';
	}
	echo '<div class="submit"><input class="button-primary" ' . SUBMITDISABLED . 'type="submit" value="' . __( 'Update', 'wp-super-cache' ) . '" /></div>';
	wp_nonce_field( 'wp-cache' );
	?>
	</form>
	</fieldset>
	<?php
}
add_cacheaction( 'cache_admin_page', 'wp_super_cache_wptouch_admin' );

function wp_super_cache_wptouch_notice() {
	global $cache_enabled;
	if ( $cache_enabled ) {
		echo '<div class="error"><p><strong>' . __( 'WPTouch plugin detected! Please go to the Supercache plugins page and enable the WPTouch helper plugin.', 'wp-super-cache' ) . '</strong></p></div>';
	}
}
function wp_super_cache_wptouch_exists() {
	global $cache_wptouch;
	if ( '1' === $cache_wptouch ) {
		return false;
	}

	if ( is_admin() && function_exists( 'wptouch_get_plugin_dir_name' ) ) {
		add_action( 'admin_notices', 'wp_super_cache_wptouch_notice' );
	}
}

if ( isset( $_GET['page'] ) && 'wpsupercache' === $_GET['page'] ) {
	add_cacheaction( 'add_cacheaction', 'wp_super_cache_wptouch_exists' );
}

// disable mobile checking if.
function wp_super_cache_maybe_disable_wptouch( $t ) {
	global $cache_wptouch, $wptouch_exclude_ua;
	if ( '1' !== $cache_wptouch ) {
		return false;
	}

	if ( ( isset( $_COOKIE['wptouch_switch_toggle'] ) && 'normal' === $_COOKIE['wptouch_switch_toggle'] ) ||
		( isset( $_COOKIE['wptouch-pro-view'] ) && 'desktop' === $_COOKIE['wptouch-pro-view'] ) ) {
		return true;
	}

	$ua = explode( ',', $wptouch_exclude_ua );
	foreach ( $ua as $agent ) {
		if ( preg_match( "#$agent#i", $_SERVER['HTTP_HOST'] ) ) {
			return true; // disable mobile ua check if matches the exclude list in wptouch.
		}
	}

	return false;

}

add_cacheaction( 'disable_mobile_check', 'wp_super_cache_maybe_disable_wptouch' );

function wp_super_cache_wptouch_browsers( $browsers ) {
	global $wptouch_exclude_ua, $wp_cache_config_file;

	if ( false === function_exists( 'bnc_wptouch_get_exclude_user_agents' ) || false === function_exists( 'bnc_wptouch_get_user_agents' ) ) {
		return $browsers;
	}

	$browsers = implode( ',', bnc_wptouch_get_exclude_user_agents() ); // hack, support exclude agents too.
	if ( $browsers !== $wptouch_exclude_ua ) {
		wp_cache_replace_line( '^ *\$wptouch_exclude_ua', "\$wptouch_exclude_ua = '$browsers';", $wp_cache_config_file );
		$wptouch_exclude_ua = $browsers;
	}

	return bnc_wptouch_get_user_agents();
}

function wp_super_cache_wptouch_prefixes( $prefixes ) {
	return array(); // wptouch doesn't support UA prefixes.
}

function wp_super_cache_wptouch_cookie_check( $cache_key ) {
	if ( false === isset( $_COOKIE['wptouch_switch_toggle'] ) ) {
		return $cache_key;
	}
	if ( 'normal' === $_COOKIE['wptouch_switch_toggle'] || 'mobile' === $_COOKIE['wptouch_switch_toggle'] ) {
		return $_COOKIE['wptouch_switch_toggle'];
	}

	if ( isset( $_COOKIE['wptouch-pro-view'] ) ) {
		if ( 'desktop' === $_COOKIE['wptouch-pro-view'] ) {
			return 'normal';
		} else {
			return $_COOKIE['wptouch-pro-view'];
		}
	}

	return $cache_key;
}

if ( isset( $cache_wptouch ) && '1' === $cache_wptouch ) {
	add_cacheaction( 'wp_super_cache_mobile_browsers', 'wp_super_cache_wptouch_browsers' );
	add_cacheaction( 'wp_super_cache_mobile_prefixes', 'wp_super_cache_wptouch_prefixes' );
	add_cacheaction( 'wp_cache_check_mobile', 'wp_super_cache_wptouch_cookie_check' );
}

function wpsc_wptouch_list( $list ) {
	$list['wptouch'] = array(
		'key'   => 'wptouch',
		'url'   => 'https://wordpress.org/plugins/wptouch/',
		'title' => __( 'WPTouch', 'wp-super-cache' ),
		'desc'  => __( 'Provides support for WPTouch mobile theme and plugin.', 'wp-super-cache' ),
	);
	return $list;
}
add_cacheaction( 'wpsc_filter_list', 'wpsc_wptouch_list' );
