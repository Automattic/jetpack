<?php

include_once ABSPATH . 'wp-admin/includes/class-wp-upgrader.php';
include_once ABSPATH . 'wp-admin/includes/file.php';

class Jetpack_JSON_API_Plugins_New_Endpoint extends Jetpack_JSON_API_Plugins_Endpoint {

	// POST /sites/%s/plugins/new
	protected $needed_capabilities = 'install_plugins';
	protected $action = 'install';

	protected function validate_call( $_blog_id, $capability, $check_manage_active = true ) {
		$validate = parent::validate_call( $_blog_id, $capability, $check_manage_active );
		if ( is_wp_error( $validate ) ) {

			// Lets delete the attachment... if the user doesn't have the right permissions to do things.
			$args = $this->input();
			if ( isset( $args['zip'][0]['id'] ) ) {
				wp_delete_attachment( $args['zip'][0]['id'], true );
			}
		}

		return $validate;
	}

	// no need to try to validate the plugin since we didn't pass one in.
	protected function validate_input( $plugin ) {
		$this->bulk    = false;
		$this->plugins = array();
	}

	function install() {
		$args = $this->input();

		if ( isset( $args['zip'][0]['id'] ) ) {
			$plugin_attachment_id = $args['zip'][0]['id'];
			$local_file           = get_attached_file( $plugin_attachment_id );
			if ( ! $local_file ) {
				return new WP_Error( 'local-file-does-not-exist' );
			}
			$skin     = new Jetpack_Automatic_Install_Skin();
			$upgrader = new Plugin_Upgrader( $skin );

			$pre_install_plugin_list = get_plugins();
			$result                  = $upgrader->install( $local_file );

			// clean up.
			wp_delete_attachment( $plugin_attachment_id, true );

			if ( is_wp_error( $result ) ) {
				return $result;
			}

			$after_install_plugin_list = get_plugins();
			$plugin                    = array_values( array_diff( array_keys( $after_install_plugin_list ), array_keys( $pre_install_plugin_list ) ) );

			if ( ! $result ) {
				$error_code = $upgrader->skin->get_main_error_code();
				$message    = $upgrader->skin->get_main_error_message();
				if ( empty( $message ) ) {
					$message = __( 'An unknown error occurred during installation', 'jetpack' );
				}

				if ( 'download_failed' === $error_code ) {
					$error_code = 'no_package';
				}

				return new WP_Error( $error_code, $message, 400 );
			}

			if ( empty( $plugin ) ) {
				return new WP_Error( 'plugin_already_installed' );
			}

			$this->plugins           = $plugin;
			$this->log[ $plugin[0] ] = $upgrader->skin->get_upgrade_messages();

			return true;
		}

		return new WP_Error( 'no_plugin_installed' );
	}
}
