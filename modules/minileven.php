<?php

/**
 * Module Name: Mobile Theme
 * Module Description: Automatically optimize your site for mobile devices.
 * Sort Order: 11
 * First Introduced: 1.8
 */

function jetpack_load_minileven() {
	include dirname( __FILE__ ) . "/minileven/minileven.php";
}

add_action( 'jetpack_modules_loaded', 'minileven_loaded' );

function minileven_loaded() {
        Jetpack::enable_module_configurable( __FILE__ );
        Jetpack::module_configuration_load( __FILE__, 'minileven_configuration_load' );
        Jetpack::module_configuration_screen( __FILE__, 'minileven_configuration_screen' );
}

function minileven_configuration_load() {
	if ( isset( $_POST['action'] ) && $_POST['action'] == 'save_options' && $_POST['_wpnonce'] == wp_create_nonce( 'minileven' ) ) {
		if ( isset( $_POST['wp_mobile_excerpt'] ) )
			update_option( 'wp_mobile_excerpt', '1' == $_POST['wp_mobile_excerpt'] ? '1' : '0' );

		Jetpack::state( 'message', 'module_configured' );
		wp_safe_redirect( Jetpack::module_configuration_url( 'minileven' ) );
		exit;
	}
}

function minileven_configuration_screen() {
	$excerpts = ( 0 == get_option( 'wp_mobile_excerpt' ) ) ? 0 : 1;

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
		</table>
		<p class="submit">
			<input type="submit" class="button-primary" value="<?php esc_attr_e( __( 'Save configuration', 'jetpack' ) ); ?>" />
		</p>
	</form>
	<?php
}

function minileven_theme_root( $theme_root ) {
	if ( jetpack_check_mobile() ) {
		return dirname( __FILE__ ) . '/theme';
	}

	return $theme_root;
}

add_filter( 'theme_root', 'minileven_theme_root' );

function minileven_theme_root_uri( $theme_root_uri ) {
	if ( jetpack_check_mobile() ) {
		return plugins_url( 'minileven/theme', dirname( __FILE__ ) );
	}

	return $theme_root_uri;
}

add_filter( 'theme_root_uri', 'minileven_theme_root_uri' );

function minileven_enabled( $wp_mobile_disable_option ) {
	return true;
}

add_filter( 'option_wp_mobile_disable', 'minileven_enabled' );

jetpack_load_minileven();