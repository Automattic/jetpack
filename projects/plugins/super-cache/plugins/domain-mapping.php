<?php

function domain_mapping_gc_cache( $function, $directory ) {
	global $cache_path;

	if ( ! function_exists( 'domain_mapping_warning' ) ) {
		return;
	}

	$siteurl = domain_mapping_siteurl( false );
	if ( ! $siteurl ) {
		return;
	}

	$sitedir = trailingslashit( preg_replace( '`^(https?:)?//`', '', $siteurl ) );

	if ( 'homepage' === $directory ) {
		$directory = '';
	}

	switch ( $function ) {
		case 'rebuild':
			wpsc_rebuild_files( $cache_path . 'supercache/' . $sitedir . $directory );
			break;
		case 'prune':
			wpsc_delete_files( $cache_path . 'supercache/' . $sitedir . $directory );
			break;
	}
}

function domain_mapping_supercachedir( $dir ) {
	global $cache_path;

	if ( ! function_exists( 'domain_mapping_warning' ) ) {
		return $dir;
	}

	$siteurl = domain_mapping_siteurl( false );
	if ( ! $siteurl ) {
		return $dir;
	}

	$sitedir = trailingslashit( preg_replace( '`^(https?:)?//`', '', $siteurl ) );

	return trailingslashit( $cache_path . 'supercache/' . $sitedir );
}

function domain_mapping_actions() {
	global $cache_domain_mapping;

	$cache_domain_mapping = (int) $cache_domain_mapping;
	if ( 1 !== $cache_domain_mapping ) {
		return;
	}

	add_filter( 'wp_super_cache_supercachedir', 'domain_mapping_supercachedir' );
	add_action( 'gc_cache', 'domain_mapping_gc_cache', 10, 2 );
}
add_cacheaction( 'add_cacheaction', 'domain_mapping_actions' );

function wp_supercache_domain_mapping_admin() {
	global $cache_domain_mapping, $wp_cache_config_file, $valid_nonce;

	$requested_state      = isset( $_POST['cache_domain_mapping'] ) ? (int) $_POST['cache_domain_mapping'] : null;
	$cache_domain_mapping = (int) $cache_domain_mapping;

	$changed = false;
	if ( null !== $requested_state && $valid_nonce ) {
		$cache_domain_mapping = $requested_state;

		wp_cache_replace_line( '^\s*\$cache_domain_mapping\s*=', '$cache_domain_mapping = ' . intval( $cache_domain_mapping ) . ';', $wp_cache_config_file );
		$changed = true;
	}

	$id = 'domain_mapping-section';
	?>
	<fieldset id="<?php echo esc_attr( $id ); ?>" class="options">

		<h4><?php esc_html_e( 'Domain Mapping', 'wp-super-cache' ); ?></h4>

		<form name="wp_manager" action="" method="post">
		<label><input type="radio" name="cache_domain_mapping" value="1" <?php checked( $cache_domain_mapping ); ?>/> <?php esc_html_e( 'Enabled', 'wp-super-cache' ); ?></label>
		<label><input type="radio" name="cache_domain_mapping" value="0" <?php checked( ! $cache_domain_mapping ); ?>/> <?php esc_html_e( 'Disabled', 'wp-super-cache' ); ?></label>
		<?php
		echo '<p>' . __( 'Provides support for <a href="https://wordpress.org/plugins/wordpress-mu-domain-mapping/">Domain Mapping</a> plugin to map multiple domains to a blog.', 'wp-super-cache' ) . '</p>';

		if ( $changed ) {
			echo '<p><strong>' . sprintf(
				esc_html__( 'Domain Mapping support is now %s', 'wp-super-cache' ),
				esc_html( $cache_domain_mapping ? __( 'enabled', 'wp-super-cache' ) : __( 'disabled', 'wp-super-cache' ) )
			) . '</strong></p>';
		}

		echo '<div class="submit"><input class="button-primary" ' . SUBMITDISABLED . ' type="submit" value="' . esc_html__( 'Update', 'wp-super-cache' ) . '" /></div>';
		wp_nonce_field( 'wp-cache' );
		?>
		</form>

	</fieldset>
	<?php
}
add_cacheaction( 'cache_admin_page', 'wp_supercache_domain_mapping_admin' );

function wp_supercache_domain_mapping_notice() {
	global $cache_enabled;

	if ( $cache_enabled ) {
		echo '<div class="error"><p><strong>' . esc_html__( 'Domain Mapping plugin detected! Please go to the Supercache plugins page and enable the domain mapping helper plugin.', 'wp-super-cache' ) . '</strong></p></div>';
	}
}
function wp_supercache_domain_mapping_exists() {
	global $cache_domain_mapping;

	$cache_domain_mapping = (int) $cache_domain_mapping;
	if ( 1 === $cache_domain_mapping ) {
		return;
	}

	if ( is_admin() && function_exists( 'domain_mapping_warning' ) ) {
		add_action( 'admin_notices', 'wp_supercache_domain_mapping_notice' );
	}
}

if ( isset( $_GET['page'] ) && 'wpsupercache' === $_GET['page'] ) {
	add_cacheaction( 'add_cacheaction', 'wp_supercache_domain_mapping_exists' );
}

function wpsc_domain_mapping_list( $list ) {
	$list['domain_mapping'] = array(
		'key'   => 'domain_mapping',
		'url'   => 'https://wordpress.org/plugins/wordpress-mu-domain-mapping/',
		'title' => esc_html__( 'Domain Mapping', 'wp-super-cache' ),
		'desc'  => esc_html__( 'Provides support for Domain Mapping plugin to map multiple domains to a blog.', 'wp-super-cache' ),
	);
	return $list;
}
add_cacheaction( 'wpsc_filter_list', 'wpsc_domain_mapping_list' );
