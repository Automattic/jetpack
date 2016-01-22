<?php

/**
 * Module Name: Mobile Theme
 * Module Description: Optimize your site with a mobile-friendly theme for smartphones.
 * Sort Order: 21
 * Recommendation Order: 11
 * First Introduced: 1.8
 * Requires Connection: No
 * Auto Activate: No
 * Module Tags: Appearance, Mobile, Recommended
 * Feature: Recommended
 * Additional Search Queries: mobile, theme, minileven
 */

function jetpack_load_minileven() {
	include dirname( __FILE__ ) . "/minileven/minileven.php";

	if ( get_option( 'wp_mobile_app_promos' ) != '1' )
		remove_action( 'wp_mobile_theme_footer', 'jetpack_mobile_app_promo' );
}

add_action( 'jetpack_modules_loaded', 'minileven_loaded' );

function minileven_loaded() {
	Jetpack::enable_module_configurable( __FILE__ );
	Jetpack::module_configuration_load( __FILE__, 'minileven_configuration_load' );
	Jetpack::module_configuration_screen( __FILE__, 'minileven_configuration_screen' );
}

function minileven_configuration_load() {
	if ( isset( $_POST['action'] ) && $_POST['action'] == 'save_options' && $_POST['_wpnonce'] == wp_create_nonce( 'minileven' ) ) {
		if ( isset( $_POST['wp_mobile_excerpt'] ) ) {
			update_option( 'wp_mobile_excerpt', '1' == $_POST['wp_mobile_excerpt'] ? '1' : '0' );
		}

		if ( isset( $_POST['wp_mobile_featured_images'] ) ) {
			update_option( 'wp_mobile_featured_images', '1' == $_POST['wp_mobile_featured_images'] ? '1' : '0' );
		}

		update_option( 'wp_mobile_app_promos', ( isset( $_POST['wp_mobile_app_promos'] ) ) ? '1' : '0' );

		Jetpack::state( 'message', 'module_configured' );
		wp_safe_redirect( Jetpack::module_configuration_url( 'minileven' ) );
		exit;
	}
}

function minileven_configuration_screen() {
	$excerpts = ( 0 == get_option( 'wp_mobile_excerpt' ) ) ? 0 : 1;
	$featured_images = ( 0 == get_option( 'wp_mobile_featured_images' ) ) ? 0 : 1;
	$promos = ( '1' == get_option( 'wp_mobile_app_promos' ) ) ? 1 : 0;

	?>
	<form method="post">
		<input type="hidden" name="action" value="save_options" />
		<?php wp_nonce_field( 'minileven' ); ?>
		<table id="menu" class="form-table">
			<tr valign="top">
				<th scope="row"><?php _e( 'Excerpts', 'jetpack' ); ?></th>
				<td>
					<label>
						<input name="wp_mobile_excerpt" type="radio" value="1" class="code" <?php checked( 1, $excerpts, true ); ?> />
						<?php _e( 'Enable excerpts on front page and on archive pages', 'jetpack' ); ?>
					</label>
					<br />
					<label>
						<input name="wp_mobile_excerpt" type="radio" value="0" class="code" <?php checked( 0, $excerpts, true ); ?> />
						<?php _e( 'Show full posts on front page and on archive pages', 'jetpack' ); ?>
					</label>
				</td>
			</tr>
			<tr valign="top">
				<th scope="row"><?php _e( 'Featured Images', 'jetpack' ); ?></th>
				<td>
					<label>
						<input name="wp_mobile_featured_images" type="radio" value="0" class="code" <?php checked( 0, $featured_images, true ); ?> />
						<?php _e( 'Hide all featured images', 'jetpack' ); ?>
					</label>
					<br />
					<label>
						<input name="wp_mobile_featured_images" type="radio" value="1" class="code" <?php checked( 1, $featured_images, true ); ?> />
						<?php _e( 'Display featured images', 'jetpack' ); ?>
					</label>
				</td>
			</tr>
			<tr valign="top">
				<th scope="row"><?php _e( 'Mobile App Promos', 'jetpack' ); ?></th>
				<td>
					<label>
						<input name="wp_mobile_app_promos" type="checkbox" value="1" <?php checked( 1, $promos, true ); ?> />
						<?php _e ( 'Show a promo for the WordPress mobile apps in the footer of the mobile theme.', 'jetpack' ); ?>
					</label>
				</td>
			</tr>
		</table>
		<p class="submit">
			<input type="submit" class="button-primary" value="<?php esc_attr_e( 'Save configuration', 'jetpack' ); ?>" />
		</p>
	</form>
	<h3><?php _e( 'Mobile Apps', 'jetpack' ); ?></h3>
	<p><?php _e( 'Take WordPress with you.', 'jetpack' ); ?></p>
	<a href="https://wordpress.org/mobile/"><img src="<?php echo plugin_dir_url( __FILE__ ); ?>/minileven/images/wp-app-devices.png" width="332" height="73" /></a>
	<p><?php printf( __( 'We have apps for <a href="%s">iOS (iPhone, iPad, iPod Touch) and Android</a>!', 'jetpack' ), 'https://apps.wordpress.org/' ); ?></p>
	<?php
}

function minileven_theme_root( $theme_root ) {
	if ( jetpack_check_mobile() ) {
		return dirname( __FILE__ ) . '/minileven/theme';
	}

	return $theme_root;
}

add_filter( 'theme_root', 'minileven_theme_root' );

function minileven_theme_root_uri( $theme_root_uri ) {
	if ( jetpack_check_mobile() ) {
		return plugins_url( 'modules/minileven/theme', dirname( __FILE__ ) );
	}

	return $theme_root_uri;
}

add_filter( 'theme_root_uri', 'minileven_theme_root_uri' );

function minileven_enabled( $wp_mobile_disable_option ) {
	return true;
}

add_filter( 'option_wp_mobile_disable', 'minileven_enabled' );

jetpack_load_minileven();
