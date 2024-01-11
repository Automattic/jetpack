<div class="wpsc-card">
<a name='lockdown'></a>
	<fieldset class="options">
	<h4><?php _e( 'Lock Down:', 'wp-super-cache' ); ?> <?php echo $wp_lock_down == '0' ? '<span style="color:red">' . __( 'Disabled', 'wp-super-cache' ) . '</span>' : '<span style="color:green">' . __( 'Enabled', 'wp-super-cache' ) . '</span>'; ?></h4>
	<p><?php _e( 'Prepare your server for an expected spike in traffic by enabling the lock down. When this is enabled, new comments on a post will not refresh the cached static files.', 'wp-super-cache' ); ?></p>
	<p><?php _e( 'Developers: Make your plugin lock down compatible by checking the "WPLOCKDOWN" constant. The following code will make sure your plugin respects the WPLOCKDOWN setting.', 'wp-super-cache' ); ?>
	<blockquote><code>if( defined( 'WPLOCKDOWN' ) && constant( 'WPLOCKDOWN' ) ) {
		&nbsp;&nbsp;&nbsp;&nbsp;echo "<?php _e( 'Sorry. My blog is locked down. Updates will appear shortly', 'wp-super-cache' ); ?>";
		}</code></blockquote>
<?php
if( $wp_lock_down == '1' ) {
	?><p><?php _e( 'WordPress is locked down. Super Cache static files will not be deleted when new comments are made.', 'wp-super-cache' ); ?></p><?php
} else {
	?><p><?php _e( 'WordPress is not locked down. New comments will refresh Super Cache static files as normal.', 'wp-super-cache' ); ?></p><?php
}
$new_lockdown =  $wp_lock_down == '1' ? '0' : '1';
$new_lockdown_desc =  $wp_lock_down == '1' ? __( 'Disable', 'wp-super-cache' ) : __( 'Enable', 'wp-super-cache' );
echo '<form name="wp_lock_down" action="' . esc_url_raw( add_query_arg( 'tab', 'settings', $admin_url ) . '#lockdown' ) . '" method="post">';
echo "<input type='hidden' name='wp_lock_down' value='{$new_lockdown}' />";
echo '<div class="submit"><input class="button-primary" type="submit" ' . SUBMITDISABLED . ' value="' . esc_attr( $new_lockdown_desc . ' ' . __( 'Lock Down', 'wp-super-cache' ) ) . '" /></div>';
wp_nonce_field( 'wp-cache' );
echo '</form>';

?></fieldset><?php
if( $cache_enabled == true && $super_cache_enabled == true ) {
?><a name='direct'></a>
	<fieldset class="options">
	<h4><?php _e( 'Directly Cached Files', 'wp-super-cache' ); ?></h4><?php

	$cached_direct_pages = wpsc_update_direct_pages();

$readonly = '';
if( !is_writeable_ACLSafe( ABSPATH ) ) {
	$readonly = 'READONLY';
	?><p style='padding:0 8px;color:#9f6000;background-color:#feefb3;border:1px solid #9f6000;'><strong><?php _e( 'Warning!', 'wp-super-cache' ); ?></strong> <?php printf( __( 'You must make %s writable to enable this feature. As this is a security risk, please make it read-only after your page is generated.', 'wp-super-cache' ), ABSPATH ); ?></p><?php
} else {
	$abspath_stat = stat(ABSPATH . '/');
	$abspath_mode = decoct( $abspath_stat[ 'mode' ] & 0777 );
	if ( substr( $abspath_mode, -2 ) == '77' ) {
		?><p style='padding:0 8px;color:#9f6000;background-color:#feefb3;border:1px solid #9f6000;'><strong><?php _e( 'Warning!', 'wp-super-cache' ); ?></strong> <?php printf( __( '%s is writable. Please make it readonly after your page is generated as this is a security risk.', 'wp-super-cache' ), ABSPATH ); ?></p><?php
	}
}
echo '<form name="direct_page" action="' . esc_url_raw( add_query_arg( 'tab', 'settings', $admin_url ) . '#direct' ) . '" method="post">';
if( is_array( $cached_direct_pages ) ) {
	$out = '';
	foreach( $cached_direct_pages as $page ) {
		if( $page == '' )
			continue;
		$generated = '';
		if( is_file( ABSPATH . $page . '/index.html' ) )
			$generated = '<input class="button-secondary" type="Submit" name="deletepage" value="' . $page . '">';
		$out .= "<tr><td><input type='text' $readonly name='direct_pages[]' size='30' value='$page' /></td><td>$generated</td></tr>";
	}
	if( $out != '' ) {
		?><table><tr><th><?php _e( 'Existing direct page', 'wp-super-cache' ); ?></th><th><?php _e( 'Delete cached file', 'wp-super-cache' ); ?></th></tr><?php
		echo "$out</table>";
	}
}

if ( 'READONLY' !== $readonly ) {
	echo esc_html__( 'Add direct page:', 'wp-super-cache' ) . '<input type="text" name="new_direct_page" size="30" value="" />';
}
echo '<p>' . sprintf(
	esc_html__( 'Directly cached files are files created directly off %s where your blog lives. This feature is only useful if you are expecting a major Digg or Slashdot level of traffic to one post or page.', 'wp-super-cache' ),
	esc_attr( ABSPATH )
) . '</p>';
if ( 'READONLY' !== $readonly ) {
	echo '<p>' . sprintf( __( 'For example: to cache <em>%1$sabout/</em>, you would enter %1$sabout/ or /about/. The cached file will be generated the next time an anonymous user visits that page.', 'wp-super-cache' ),
		esc_attr( trailingslashit( get_option( 'home' ) ) )
	) . '</p>';
	echo '<p>' . esc_html__( 'Make the textbox blank to remove it from the list of direct pages and delete the cached file.', 'wp-super-cache' ) . '</p>';

	echo '<div class="submit"><input class="button-primary" type="submit" ' . SUBMITDISABLED . ' value="' . esc_attr__( 'Update Direct Pages', 'wp-super-cache' ) . '" /></div>';
}
wp_nonce_field( 'wp-cache' );
echo '</form>';
?>
	</fieldset>
<?php
} // if $super_cache_enabled
echo '</div>';
