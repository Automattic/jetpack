<?php

function wp_super_cache_jetpack_admin() {
	global $cache_jetpack, $wp_cache_config_file, $valid_nonce;

	$cache_jetpack = '' === $cache_jetpack ? '0' : $cache_jetpack;

	if ( isset( $_POST['cache_jetpack'] ) && $valid_nonce ) {
		if ( $cache_jetpack === (int) $_POST['cache_jetpack'] ) {
			$changed = false;
		} else {
			$changed = true;
		}
		$cache_jetpack = (int) $_POST['cache_jetpack'];
		wp_cache_replace_line( '^ *\$cache_jetpack', "\$cache_jetpack = '$cache_jetpack';", $wp_cache_config_file );
		if ( $changed && $cache_jetpack ) {
			wp_cache_replace_line( '^ *\$wp_cache_mobile_enabled', '$wp_cache_mobile_enabled = 1;', $wp_cache_config_file );
			wp_cache_replace_line( '^ *\$wp_cache_mod_rewrite', '$wp_cache_mod_rewrite = 0;', $wp_cache_config_file );
			wp_cache_replace_line( '^ *\$super_cache_enabled', '$super_cache_enabled = 1;', $wp_cache_config_file );
		}
	}
	$id = 'jetpack-section';
	?>
	<fieldset id="<?php echo $id; ?>" class="options">
	<h4><?php _e( 'Jetpack Mobile Theme', 'wp-super-cache' ); ?></h4>
	<?php
	if ( false === file_exists( dirname( WPCACHEHOME ) . '/jetpack/class.jetpack-user-agent.php' ) ) {
		echo '<strong>' . sprintf( __( 'Jetpack not found in %s. Install it and enable the mobile theme and this helper plugin to cache visits by mobile visitors.', 'wp-super-cache' ), dirname( WPCACHEHOME ) ) . '</strong>';
	} else {
	?>
		<form name="wp_manager" action="" method="post">
		<label><input type="radio" name="cache_jetpack" value="1" <?php if ( $cache_jetpack ) { echo 'checked="checked" '; } ?>/> <?php _e( 'Enabled', 'wp-super-cache' ); ?></label>
		<label><input type="radio" name="cache_jetpack" value="0" <?php if ( ! $cache_jetpack ) { echo 'checked="checked" '; } ?>/> <?php _e( 'Disabled', 'wp-super-cache' ); ?></label>
		<?php
		echo '<p>' . __( 'Provides support for the <a href="https://wordpress.org/plugins/jetpack/">Jetpack</a> mobile theme and plugin. PHP caching mode and mobile support will be enabled too.', 'wp-super-cache' ) . '</p>';
		if ( isset( $changed ) && $changed ) {
			if ( $cache_jetpack ) {
				$status = __( 'enabled', 'wp-super-cache' );
			} else {
				$status = __( 'disabled', 'wp-super-cache' );
			}
			echo '<p><strong>' . sprintf( __( 'Jetpack Mobile Theme support is now %s', 'wp-super-cache' ), $status ) . '</strong></p>';
		}
		echo '<div class="submit"><input class="button-primary" ' . SUBMITDISABLED . 'type="submit" value="' . __( 'Update', 'wp-super-cache' ) . '" /></div>';
		wp_nonce_field( 'wp-cache' );
		?>
		</form>
	<?php } ?>
	</fieldset>
	<?php
}
add_cacheaction( 'cache_admin_page', 'wp_super_cache_jetpack_admin' );

function wp_super_cache_jetpack_cookie_check( $cache_key ) {
	if ( false === function_exists( 'jetpack_is_mobile' ) ) {

		if ( file_exists( dirname( WPCACHEHOME ) . '/jetpack-dev/class.jetpack-user-agent.php' ) ) {
			wp_cache_debug( "wp_super_cache_jetpack_cookie_check: jetpack dev detected. Returning 'normal' to avoid loading Jetpack." );
			return 'normal';
		} elseif ( file_exists( dirname( WPCACHEHOME ) . '/jetpack/class.jetpack-user-agent.php' ) ) {
			include_once dirname( WPCACHEHOME ) . '/jetpack/class.jetpack-user-agent.php';
		} else {
			wp_cache_debug( 'wp_super_cache_jetpack_cookie_check: jetpack UA file not found.' );
		}
	}

	if ( function_exists( 'jetpack_is_mobile' ) ) {
		if ( jetpack_is_mobile() ) {
			return 'mobile';
		} else {
			return 'normal';
		}
	} else {
		return 'normal';
	}
}

if ( isset( $cache_jetpack ) && '1' === $cache_jetpack ) {
	add_cacheaction( 'wp_cache_check_mobile', 'wp_super_cache_jetpack_cookie_check' );
}

function wpsc_cache_jetpack_list( $list ) {
	$list['jetpack'] = array(
		'key'   => 'jetpack',
		'url'   => 'https://wordpress.org/plugins/jetpack/',
		'title' => __( 'Jetpack Mobile Theme', 'wp-super-cache' ),
		'desc'  => __( 'Provides support for the Jetpack mobile theme and plugin. PHP caching mode and mobile support will be enabled too.', 'wp-super-cache' ),
	);
	return $list;
}
add_cacheaction( 'wpsc_filter_list', 'wpsc_cache_jetpack_list' );
