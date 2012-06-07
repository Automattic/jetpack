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
	
	$cache_badbehaviour = $cache_badbehaviour == '' ? 0 : $cache_badbehaviour;
	if ( $cache_badbehaviour == 'no' )
		$cache_badbehaviour = 0;

	$err = false;

	if ( isset( $_POST['cache_badbehaviour'] ) && $valid_nonce ) {
		$bbfile = get_bb_file_loc();
		if( !$bbfile ) {
			$_POST[ 'cache_badbehaviour' ] = 0;
			$err = __( 'Bad Behaviour not found. Please check your install.', 'wp-super-cache' );
		}
		if ( $cache_badbehaviour == (int)$_POST['cache_badbehaviour'] ) {
			$changed = false;
		} else {
			$changed = true;
		}
		$cache_badbehaviour = (int)$_POST['cache_badbehaviour'];
		wp_cache_replace_line('^ *\$cache_compression', "\$cache_compression = 0;", $wp_cache_config_file);
		wp_cache_replace_line('^ *\$cache_badbehaviour', "\$cache_badbehaviour = $cache_badbehaviour;", $wp_cache_config_file);
		wp_cache_replace_line('^ *\$cache_badbehaviour_file', "\$cache_badbehaviour_file = '$bbfile';", $wp_cache_config_file);
		$changed = true;
	}
	$id = 'badbehavior-section';
	?>
		<fieldset id="<?php echo $id; ?>" class="options"> 
		<h4><?php _e( 'Bad Behavior', 'wp-super-cache' ); ?></h4>
		<form name="wp_manager" action="<?php echo $_SERVER[ "REQUEST_URI" ]; ?>" method="post">
		<label><input type="radio" name="cache_badbehaviour" value="1" <?php if( $cache_badbehaviour ) { echo 'checked="checked" '; } ?>/> <?php _e( 'Enabled', 'wp-super-cache' ); ?></label>
		<label><input type="radio" name="cache_badbehaviour" value="0" <?php if( !$cache_badbehaviour ) { echo 'checked="checked" '; } ?>/> <?php _e( 'Disabled', 'wp-super-cache' ); ?></label>
		<p><?php _e( '', 'wp-super-cache' ); ?></p><?php
		echo '<p>' . sprintf( __( '(Only legacy caching supported, disabled compression and requires <a href="http://www.bad-behavior.ioerror.us/">Bad Behavior</a> in "%s/plugins/bad-behavior/") ', 'wp-super-cache' ), WP_CONTENT_DIR ) . '</p>';
		if ( isset( $changed ) && $changed ) {
			if ( $cache_badbehaviour )
				$status = __( "enabled" );
			else
				$status = __( "disabled" );
			echo "<p><strong>" . sprintf( __( "Bad Behavior support is now %s", 'wp-super-cache' ), $status ) . "</strong></p>";
		}
	echo '<div class="submit"><input ' . SUBMITDISABLED . 'type="submit" value="' . __( 'Update', 'wp-super-cache' ) . '" /></div>';
	wp_nonce_field('wp-cache');
	?>
	</form>
	</fieldset>
	<?php
	if( $err )
		echo "<p><strong>" . __( 'Warning!', 'wp-super-cache' ) . "</strong> $err</p>";

}
add_cacheaction( 'cache_admin_page', 'wp_supercache_badbehaviour_admin' );

?>
