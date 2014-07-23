<?php
/**
 * Module Name: JSON API
 * Module Description: Allow applications to securely access your content through the cloud.
 * Sort Order: 19
 * First Introduced: 1.9
 * Requires Connection: Yes
 * Auto Activate: Public
 * Module Tags: Writing, Developers
 */

add_action( 'jetpack_activate_module_json-api',   array( Jetpack::init(), 'toggle_module_on_wpcom' ) );
add_action( 'jetpack_deactivate_module_json-api', array( Jetpack::init(), 'toggle_module_on_wpcom' ) );

add_action( 'jetpack_modules_loaded', 'jetpack_json_api_load_module' );

function jetpack_json_api_load_module() {
	Jetpack::enable_module_configurable( __FILE__ );
	Jetpack::module_configuration_load( __FILE__, 'jetpack_json_api_configuration_load' );
	Jetpack::module_configuration_screen( __FILE__, 'jetpack_json_api_configuration_screen' );
}

function jetpack_json_api_configuration_load() {
	if ( isset( $_POST['action'] ) && $_POST['action'] == 'save_options' && wp_verify_nonce( $_POST['_wpnonce'], 'json-api' ) ) {
		Jetpack_Options::update_option( 'json_api_full_management', isset( $_POST['json_api_full_management'] ) );
		Jetpack::state( 'message', 'module_configured' );
		wp_safe_redirect( Jetpack::module_configuration_url( 'json-api' ) );
		exit;
	}
}

function jetpack_json_api_configuration_screen() {
	?>
	<div class="narrow">
		<form method="post">
			<input type='hidden' name='action' value='save_options' />
			<?php wp_nonce_field( 'json-api' ); ?>
			<table id="menu" class="form-table">
				<tr valign="top"><th scope="row"><label for="json_api_full_management"><?php _e( 'Allow management' , 'jetpack' ); ?></label></th>
					<td><label><input type='checkbox'<?php checked( Jetpack_Options::get_option( 'json_api_full_management' ) ); ?> name='json_api_full_management' id='json_api_full_management' /> <?php printf( __( 'Allow remote management of themes, plugins, and WordPress via the JSON API. (<a href="%s" title="Learn more about JSON API">More info</a>).', 'jetpack') , '//jetpack.me/support/json-api'  ); ?></label></td></tr>

			</table>
			<p class="submit"><input type='submit' class='button-primary' value='<?php echo esc_attr( __( 'Save configuration', 'jetpack' ) ); ?>' /></p>
		</form>
	</div>
<?php
}
