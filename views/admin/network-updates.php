<?php extract( $data ); ?>
<div class="wrap">
	<h2><?php _e( 'Jetpack Network Update', 'jetpack' ); ?></h2>
</div>

<?php

$new_nonce = wp_create_nonce( 'jetpack-network-update' );

if ( $action = 'update' && wp_verify_nonce( $nonce, 'jetpack-network-update' ) ) {
	$next_page = $num + 1;
	$size = 2;
	$sites = get_sites( array( 'offset' => $num * $size, 'number' => $size ) );
	$done = sprintf( __( 'We sucessfully updated Jetpack to %s across your network.','jetpack' ), JETPACK__VERSION );
	if ( ! $sites ) {
		?>
		<div class="updated"><p><?php echo $done;?></p></div>
		<?php
		return;
	}
	wp_enqueue_script( 'jetpack-network-update', plugins_url( '_inc/jetpack-network-update.js', JETPACK__PLUGIN_FILE ), array( 'jquery' ), JETPACK__VERSION, true );

	foreach( $sites as $site ) {
		switch_to_blog( $site->blog_id );
		$site_info[] = array(
			'admin_url' => admin_url( 'admin-ajax.php' ),
			'blog_id' => $site->blog_id,
			'title' => get_bloginfo(),
			'url' => get_site_url(),
			'skip_update' => get_option( 'jetpack_network_version' ) === JETPACK__VERSION,
			);
		restore_current_blog();
	}

	$js_data = array(
		'sites' => $site_info,
		'redirect_to' =>network_admin_url('admin.php?page=jetpack-update&action=update&_nonce=' . $new_nonce ) .'&num='. $next_page ,
		'count' => $size,
		'done' => $done,
 		'success' => __('Succesffully updated', 'jetpack' ),
	);
	wp_localize_script('jetpack-network-update', 'jetpackUpdateNetwork', $js_data );

	?><div id="jetpack-network-update-shell"></div>
	<style>
		#jetpack-network-update-shell p {
			padding:10px;

		}
		#jetpack-network-update-shell span {
			display: block;
		}
	</style>
	<?php
} else {
	?>
	<p><a class="button button-primary" href="<?php echo network_admin_url('admin.php?page=jetpack-update&action=update&_nonce=' . $new_nonce ); ?>"><?php _e( 'Update Jetpack across the network', 'jetpack' ); ?></a></p>
	<?php
}
