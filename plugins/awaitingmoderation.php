<?php

function awaitingmoderation_action( $buffer ) {
	$buffer = str_replace( __( 'Your comment is awaiting moderation.', 'wp-super-cache' ), '', $buffer );
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
		$cache_awaitingmoderation = (int)$_POST['cache_awaitingmoderation'];
		wp_cache_replace_line('^ *\$cache_awaitingmoderation', "\$cache_awaitingmoderation = '$cache_awaitingmoderation';", $wp_cache_config_file);
		$changed = true;
	} else {
		$changed = false;
	}
	$id = 'awaitingmoderation-section';
	?>
		<fieldset id="<?php echo $id; ?>" class="options">
		<h4><?php _e( 'Awaiting Moderation', 'wp-super-cache' ); ?></h4>
		<form name="wp_manager" action="" method="post">
		<label><input type="radio" name="cache_awaitingmoderation" value="1" <?php if( $cache_awaitingmoderation ) { echo 'checked="checked" '; } ?>/> <?php _e( 'Enabled', 'wp-super-cache' ); ?></label>
		<label><input type="radio" name="cache_awaitingmoderation" value="0" <?php if( !$cache_awaitingmoderation ) { echo 'checked="checked" '; } ?>/> <?php _e( 'Disabled', 'wp-super-cache' ); ?></label>
		<p><?php _e( 'Enables or disables plugin to Remove the text "Your comment is awaiting moderation." when someone leaves a moderated comment.', 'wp-super-cache' ); ?></p>
		<?php
		if ($changed) {
			if ( $cache_awaitingmoderation )
				$status = __( "enabled", 'wp-super-cache' );
			else
				$status = __( "disabled", 'wp-super-cache' );
			echo "<p><strong>" . sprintf( __( "Awaiting Moderation is now %s", 'wp-super-cache' ), $status ) . "</strong></p>";
		}
	echo '<div class="submit"><input class="button-primary" ' . SUBMITDISABLED . 'type="submit" value="' . __( 'Update', 'wp-super-cache' ) . '" /></div>';
	wp_nonce_field('wp-cache');
	?>
	</form>
	</fieldset>
	<?php

}
add_cacheaction( 'cache_admin_page', 'wp_supercache_awaitingmoderation_admin' );
?>
