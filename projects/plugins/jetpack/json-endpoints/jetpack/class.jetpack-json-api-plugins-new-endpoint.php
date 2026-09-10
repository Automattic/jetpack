<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName

use Automattic\Jetpack\Automatic_Install_Skin;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

require_once ABSPATH . 'wp-admin/includes/class-wp-upgrader.php';
require_once ABSPATH . 'wp-admin/includes/file.php';

/**
 * Plugins new endpoint class.
 *
 * POST /sites/%s/plugins/new
 *
 * @phan-constructor-used-for-side-effects
 */
class Jetpack_JSON_API_Plugins_New_Endpoint extends Jetpack_JSON_API_Plugins_Endpoint {
	use Jetpack_JSON_API_Attachment_Ownership_Trait;

	/**
	 * Needed capabilities.
	 *
	 * @var string
	 */
	protected $needed_capabilities = 'install_plugins';

	/**
	 * The action.
	 *
	 * @var string
	 */
	protected $action = 'install';

	/**
	 * Validate call.
	 *
	 * @param int    $_blog_id - the blog ID.
	 * @param string $capability - the capability.
	 * @param bool   $check_manage_active - check if manage is active.
	 *
	 * @return bool|WP_Error a WP_Error object or true if things are good.
	 */
	protected function validate_call( $_blog_id, $capability, $check_manage_active = true ) {
		$validate = parent::validate_call( $_blog_id, $capability, $check_manage_active );
		if ( is_wp_error( $validate ) ) {

			// Lets delete the attachment... if the user doesn't have the right permissions to do things.
			// Only clean up an upload the caller actually owns. This runs *after* the capability check
			// has already failed, so without the ownership guard any connected user could name someone
			// else's attachment and have it hard-deleted on their behalf.
			$args = $this->input();
			if ( isset( $args['zip'][0]['id'] ) && is_scalar( $args['zip'][0]['id'] ) ) {
				$attachment_id = (int) $args['zip'][0]['id'];
				if ( true === $this->validate_attachment_ownership( $attachment_id ) ) {
					wp_delete_attachment( $attachment_id, true );
				}
			}
		}

		return $validate;
	}

	/**
	 * No need to try to validate the plugin since we didn't pass one in.
	 *
	 * @param string $plugin - the plugin we're validating.
	 */
	protected function validate_input( $plugin ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		$this->bulk    = false;
		$this->plugins = array();
	}

	/**
	 * Install the plugin.
	 *
	 * @return bool|WP_Error
	 */
	public function install() {
		$args = $this->input();

		if ( isset( $args['zip'][0]['id'] ) ) {
			$plugin_attachment_id = $args['zip'][0]['id'];
			$local_file           = get_attached_file( $plugin_attachment_id );
			if ( ! $local_file ) {
				return new WP_Error( 'local-file-does-not-exist' );
			}
			$skin     = new Automatic_Install_Skin();
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
				$error_code = $skin->get_main_error_code();
				$message    = $skin->get_main_error_message();
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

// POST /sites/%s/plugins/new
new Jetpack_JSON_API_Plugins_New_Endpoint(
	array(
		'description'             => 'Install a plugin to a Jetpack site by uploading a zip file',
		'group'                   => '__do_not_document',
		'stat'                    => 'plugins:new',
		'min_version'             => '1',
		'max_version'             => '1.1',
		'method'                  => 'POST',
		'path'                    => '/sites/%s/plugins/new',
		'path_labels'             => array(
			'$site' => '(int|string) Site ID or domain',
		),
		'request_format'          => array(
			'zip' => '(array) Reference to an uploaded plugin package zip file.',
		),
		'response_format'         => Jetpack_JSON_API_Plugins_Endpoint::$_response_format,
		'allow_jetpack_site_auth' => true,
		'example_request_data'    => array(
			'headers' => array(
				'authorization' => 'Bearer YOUR_API_TOKEN',
			),
		),
		'example_request'         => 'https://public-api.wordpress.com/rest/v1/sites/example.wordpress.org/plugins/new',
	)
);

new Jetpack_JSON_API_Plugins_New_Endpoint(
	array(
		'description'             => 'Install a plugin to a Jetpack site by uploading a zip file',
		'group'                   => '__do_not_document',
		'stat'                    => 'plugins:new',
		'min_version'             => '1.2',
		'method'                  => 'POST',
		'path'                    => '/sites/%s/plugins/new',
		'path_labels'             => array(
			'$site' => '(int|string) Site ID or domain',
		),
		'request_format'          => array(
			'zip' => '(array) Reference to an uploaded plugin package zip file.',
		),
		'response_format'         => Jetpack_JSON_API_Plugins_Endpoint::$_response_format_v1_2,
		'allow_jetpack_site_auth' => true,
		'example_request_data'    => array(
			'headers' => array(
				'authorization' => 'Bearer YOUR_API_TOKEN',
			),
		),
		'example_request'         => 'https://public-api.wordpress.com/rest/v1.2/sites/example.wordpress.org/plugins/new',
	)
);
