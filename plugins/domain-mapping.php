<?php

function domain_mapping_gc_cache( $function, $directory ) {
	global $cache_path;

	if ( !function_exists( 'domain_mapping_warning' ) )
		return false;

	$siteurl = domain_mapping_siteurl( false );
	if ( !$siteurl )
		return false;

	$protocol = ( isset( $_SERVER['HTTPS' ] ) && 'on' == strtolower( $_SERVER['HTTPS' ] ) ) ? 'https://' : 'http://';
	$siteurl = trailingslashit( str_replace( $protocol, '', $siteurl ) );

	if ( $directory == 'homepage' )
		$directory = '';

	switch( $function ) {
		case "rebuild":
			@wp_cache_rebuild_or_delete( $cache_path . 'supercache/' . $siteurl . $directory . 'index.html' );
			@wp_cache_rebuild_or_delete( $cache_path . 'supercache/' . $siteurl . $directory . 'index.html.gz' );
		break;
		case "prune":
			prune_super_cache( $cache_path . 'supercache/' . $siteurl . $directory . 'index.html', true, true );
			prune_super_cache( $cache_path . 'supercache/' . $siteurl . $directory . 'index.html.gz', true, true );
		break;
	}

	return $directory;
}

function domain_mapping_supercachedir( $dir ) {
	global $cache_path;
	if ( !function_exists( 'domain_mapping_warning' ) )
		return $dir;

	$siteurl = domain_mapping_siteurl( false );
	if ( !$siteurl )
		return $dir;

	$protocol = ( isset( $_SERVER['HTTPS' ] ) && 'on' == strtolower( $_SERVER['HTTPS' ] ) ) ? 'https://' : 'http://';
	$siteurl = str_replace( $protocol, '', $siteurl );
	return $cache_path . 'supercache/' . $siteurl;
}

function domain_mapping_actions() {
	global $cache_domain_mapping;
	if( $cache_domain_mapping == '1' ) {
		add_filter( 'wp_super_cache_supercachedir', 'domain_mapping_supercachedir' );
		add_action( 'gc_cache', 'domain_mapping_gc_cache', 10, 2 );
	}
}
add_cacheaction( 'add_cacheaction', 'domain_mapping_actions' );

function wp_supercache_domain_mapping_admin() {
	global $cache_domain_mapping, $wp_cache_config_file, $valid_nonce;

	$cache_domain_mapping = $cache_domain_mapping == '' ? '0' : $cache_domain_mapping;

	if(isset($_POST['cache_domain_mapping']) && $valid_nonce) {
		if ( $cache_domain_mapping == (int)$_POST['cache_domain_mapping'] ) {
			$changed = false;
		} else {
			$changed = true;
		}
		$cache_domain_mapping = (int)$_POST['cache_domain_mapping'];
		wp_cache_replace_line('^ *\$cache_domain_mapping', "\$cache_domain_mapping = '$cache_domain_mapping';", $wp_cache_config_file);
	}
	$id = 'domain_mapping-section';
	?>
		<fieldset id="<?php echo $id; ?>" class="options">
		<h4><?php _e( 'Domain Mapping', 'wp-super-cache' ); ?></h4>
		<form name="wp_manager" action="" method="post">
		<label><input type="radio" name="cache_domain_mapping" value="1" <?php if( $cache_domain_mapping ) { echo 'checked="checked" '; } ?>/> <?php _e( 'Enabled', 'wp-super-cache' ); ?></label>
		<label><input type="radio" name="cache_domain_mapping" value="0" <?php if( !$cache_domain_mapping ) { echo 'checked="checked" '; } ?>/> <?php _e( 'Disabled', 'wp-super-cache' ); ?></label>
		<p><?php _e( '', 'wp-super-cache' ); ?></p><?php
		echo '<p>' . __( 'Provides support for <a href="http://wordpress.org/extend/plugins/wordpress-mu-domain-mapping/">Domain Mapping</a> plugin to map multiple domains to a blog.', 'wp-super-cache' ) . '</p>';
		if ( isset( $changed ) && $changed ) {
			if ( $cache_domain_mapping )
				$status = __( "enabled" );
			else
				$status = __( "disabled" );
			echo "<p><strong>" . sprintf( __( "Domain Mapping support is now %s", 'wp-super-cache' ), $status ) . "</strong></p>";
		}
	echo '<div class="submit"><input class="button-primary" ' . SUBMITDISABLED . 'type="submit" value="' . __( 'Update', 'wp-super-cache' ) . '" /></div>';
	wp_nonce_field('wp-cache');
	?>
	</form>
	</fieldset>
	<?php
}
add_cacheaction( 'cache_admin_page', 'wp_supercache_domain_mapping_admin' );

function wp_supercache_domain_mapping_notice() {
	global $cache_enabled, $cache_domain_mapping;
	if( $cache_enabled )
		echo '<div class="error"><p><strong>' . __('Domain Mapping plugin detected! Please go to the Supercache plugins page and enable the domain mapping helper plugin.', 'wp-super-cache' ) . '</strong></p></div>';
}
function wp_supercache_domain_mapping_exists() {
	global $cache_domain_mapping;
	if ( $cache_domain_mapping == 1 )
		return false;

	if ( is_admin() && function_exists( 'domain_mapping_warning' ) )
		add_action( 'admin_notices', 'wp_supercache_domain_mapping_notice' );
}

if ( isset( $_GET[ 'page' ] ) && $_GET[ 'page' ] == 'wpsupercache' ) {
	add_cacheaction( 'add_cacheaction', 'wp_supercache_domain_mapping_exists' );
}
?>
