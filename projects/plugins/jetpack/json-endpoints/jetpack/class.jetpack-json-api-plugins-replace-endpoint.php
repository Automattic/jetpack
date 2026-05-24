<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName

use Automattic\Jetpack\Automatic_Install_Skin;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

require_once ABSPATH . 'wp-admin/includes/class-wp-upgrader.php';
require_once ABSPATH . 'wp-admin/includes/file.php';

/**
 * Install-or-replace a plugin via zip upload. Passes overwrite_package=true to
 * Plugin_Upgrader so an existing plugin at the same slug is replaced in place,
 * mirroring wp-admin's "Replace current with uploaded" confirmation flow.
 *
 * POST /sites/%s/plugins/replace
 *
 * ## Authentication trust model
 *
 * Two auth modes are supported:
 *
 * 1. User auth — the request is mapped to a WordPress user who must hold
 *    `install_plugins` AND `update_plugins`. The ownership check verifies the
 *    referenced attachment was authored by that same user, preventing the
 *    endpoint from being used to touch another user's attachments.
 *
 * 2. Site-based auth (`allow_jetpack_site_auth => true`) — no user is
 *    identified; capability and ownership checks are skipped. The wpcom
 *    upload forwarder is expected to (a) vouch for the caller, (b) create the
 *    attachment as part of the same request's upload-intercept pipeline, and
 *    (c) pass the resulting ID through unchanged. If that contract is broken
 *    on the wpcom side, any trusted site credential becomes install-anything
 *    on the site.
 *
 * ## Cross-user attachment-deletion guard
 *
 * `Jetpack_JSON_API_Plugins_New_Endpoint::validate_call` deletes the referenced
 * attachment on capability-check failure without verifying the caller owns it.
 * This Replace endpoint overrides `validate_call` to run the ownership check
 * first, so a low-privilege caller cannot use it to hard-delete another user's
 * attachment as a side-effect of the cap check failing. The parent's behavior
 * is unchanged for the legitimate case (caller's own attachment is cleaned up
 * when their cap check fails).
 *
 * @phan-constructor-used-for-side-effects
 */
class Jetpack_JSON_API_Plugins_Replace_Endpoint extends Jetpack_JSON_API_Plugins_New_Endpoint {
	use Jetpack_JSON_API_Attachment_Ownership_Trait;

	/**
	 * Replace is destructive, so require both install and update caps.
	 *
	 * @var array
	 */
	protected $needed_capabilities = array( 'install_plugins', 'update_plugins' );

	/**
	 * Error codes we are willing to surface to the caller. Anything outside
	 * this list is collapsed to 'install_failed' with a generic message to
	 * avoid leaking filesystem paths from Plugin_Upgrader internals.
	 *
	 * Kept aligned with codes actually emitted by `WP_Upgrader` /
	 * `Plugin_Upgrader` — $this->strings[] message keys are NOT error codes
	 * and do not belong here.
	 *
	 * @var array
	 */
	protected static $allowed_error_codes = array(
		'no_package',
		'bad_request',
		'files_not_writable',
		'copy_dir_failed',
		'remove_old_failed',
		'source_read_failed',
		'new_source_read_failed',
		'mkdir_failed_destination',
		'folder_exists',
		'incompatible_archive',
		'incompatible_archive_no_plugins',
		'incompatible_archive_empty',
		'incompatible_php_required_version',
		'incompatible_wp_required_version',
		'unable_to_connect_to_filesystem',
		'fs_unavailable',
		'fs_error',
		'fs_no_plugins_dir',
		'fs_no_folder',
		'fs_no_root_dir',
		'fs_no_content_dir',
		'fs_no_temp_backup_dir',
		'fs_temp_backup_mkdir',
		'fs_temp_backup_move',
	);

	/**
	 * Install, replacing any existing plugin at the same slug.
	 *
	 * @return bool|WP_Error
	 */
	public function install() {
		$args = $this->input();

		if ( ! isset( $args['zip'][0]['id'] ) || ! is_scalar( $args['zip'][0]['id'] ) ) {
			return new WP_Error( 'no_plugin_installed', __( 'No plugin zip file was provided.', 'jetpack' ), 400 );
		}

		$expected_slug = isset( $args['slug'] ) && is_scalar( $args['slug'] )
			? strtolower( (string) $args['slug'] )
			: '';
		if ( ! preg_match( '/^[a-z0-9][a-z0-9_-]*$/', $expected_slug ) ) {
			return new WP_Error( 'missing_slug', __( 'A valid plugin slug is required; the replace endpoint refuses to overwrite a plugin whose slug the caller has not declared.', 'jetpack' ), 400 );
		}

		$plugin_attachment_id = (int) $args['zip'][0]['id'];

		// Re-checked here so direct invocations of install() (notably the test stubs)
		// can't accidentally bypass the ownership guard that validate_call() runs on
		// the live request path.
		$ownership = $this->validate_attachment_ownership( $plugin_attachment_id );
		if ( is_wp_error( $ownership ) ) {
			return $ownership;
		}

		$zip_check = $this->validate_attachment_is_zip( $plugin_attachment_id );
		if ( is_wp_error( $zip_check ) ) {
			wp_delete_attachment( $plugin_attachment_id, true );
			return $zip_check;
		}

		$local_file = get_attached_file( $plugin_attachment_id );
		if ( ! $local_file ) {
			wp_delete_attachment( $plugin_attachment_id, true );
			return new WP_Error( 'local-file-does-not-exist', __( 'Uploaded plugin zip could not be found on disk.', 'jetpack' ), 400 );
		}

		$skin     = new Automatic_Install_Skin();
		$upgrader = new Plugin_Upgrader( $skin );

		$result = $upgrader->install(
			$local_file,
			array( 'overwrite_package' => true )
		);

		wp_delete_attachment( $plugin_attachment_id, true );

		if ( is_wp_error( $result ) ) {
			return $this->sanitize_upgrader_error( $result );
		}

		if ( ! $result ) {
			$error_code = $skin->get_main_error_code();
			if ( 'download_failed' === $error_code ) {
				$error_code = 'no_package';
			}
			if ( empty( $error_code ) || ! in_array( $error_code, self::$allowed_error_codes, true ) ) {
				$error_code = 'install_failed';
			}
			return new WP_Error( $error_code, __( 'Plugin installation failed.', 'jetpack' ), 400 );
		}

		$plugin_file = $upgrader->plugin_info();
		if ( empty( $plugin_file ) ) {
			return new WP_Error( 'plugin_replace_info_missing', __( 'Plugin was installed but its identifier could not be determined.', 'jetpack' ), 500 );
		}

		// `overwrite_package=true` trusts the zip's own folder name, so a zip whose
		// top-level folder differs from the declared slug would clobber an unrelated
		// plugin. Verify the post-install identifier matches the caller's contract.
		$installed_slug = dirname( $plugin_file );
		if ( '.' === $installed_slug || strtolower( $installed_slug ) !== $expected_slug ) {
			return new WP_Error( 'slug_mismatch', __( 'The installed plugin does not match the declared slug.', 'jetpack' ), 400 );
		}

		$this->plugins             = array( $plugin_file );
		$this->log[ $plugin_file ] = $upgrader->skin->get_upgrade_messages();

		return true;
	}

	/**
	 * See class docblock — runs the attachment-ownership check before delegating
	 * to the parent's validate_call(), which deletes the referenced attachment
	 * on capability-check failure without verifying ownership.
	 *
	 * @param int    $_blog_id            Blog ID.
	 * @param string $capability          Capability.
	 * @param bool   $check_manage_active Whether to check manage-is-active.
	 * @return bool|WP_Error
	 */
	protected function validate_call( $_blog_id, $capability, $check_manage_active = true ) {
		$args = $this->input();
		if ( isset( $args['zip'][0]['id'] ) && is_scalar( $args['zip'][0]['id'] ) ) {
			$ownership = $this->validate_attachment_ownership( (int) $args['zip'][0]['id'] );
			if ( is_wp_error( $ownership ) ) {
				return $ownership;
			}
		}
		return parent::validate_call( $_blog_id, $capability, $check_manage_active );
	}

	/**
	 * Collapse unknown error codes and strip potentially path-leaking messages
	 * from WP_Error instances returned by Plugin_Upgrader.
	 *
	 * @param WP_Error $error Raw upgrader error.
	 * @return WP_Error
	 */
	protected function sanitize_upgrader_error( WP_Error $error ) {
		$code = $error->get_error_code();
		if ( empty( $code ) || ! in_array( $code, self::$allowed_error_codes, true ) ) {
			return new WP_Error( 'install_failed', __( 'Plugin installation failed.', 'jetpack' ), 400 );
		}
		return new WP_Error( $code, __( 'Plugin installation failed.', 'jetpack' ), 400 );
	}
}

// POST /sites/%s/plugins/replace
new Jetpack_JSON_API_Plugins_Replace_Endpoint(
	array(
		'description'             => 'Install or replace a plugin on a Jetpack site by uploading a zip file. If a plugin with the same slug is already installed, its destination folder is replaced in place, mirroring wp-admin\'s "Replace current with uploaded" upload flow.',
		'group'                   => '__do_not_document',
		'stat'                    => 'plugins:replace',
		'min_version'             => '1',
		'max_version'             => '1.1',
		'method'                  => 'POST',
		'path'                    => '/sites/%s/plugins/replace',
		'path_labels'             => array(
			'$site' => '(int|string) Site ID or domain',
		),
		'request_format'          => array(
			'zip'  => '(array) Reference to an uploaded plugin package zip file.',
			'slug' => '(string) The plugin slug the uploaded zip must resolve to. Required; the endpoint rejects zips whose top-level folder does not match.',
		),
		'response_format'         => Jetpack_JSON_API_Plugins_Endpoint::$_response_format,
		'allow_jetpack_site_auth' => true,
		'example_request_data'    => array(
			'headers' => array(
				'authorization' => 'Bearer YOUR_API_TOKEN',
			),
		),
		'example_request'         => 'https://public-api.wordpress.com/rest/v1/sites/example.wordpress.org/plugins/replace',
	)
);

new Jetpack_JSON_API_Plugins_Replace_Endpoint(
	array(
		'description'             => 'Install or replace a plugin on a Jetpack site by uploading a zip file. If a plugin with the same slug is already installed, its destination folder is replaced in place, mirroring wp-admin\'s "Replace current with uploaded" upload flow.',
		'group'                   => '__do_not_document',
		'stat'                    => 'plugins:replace',
		'min_version'             => '1.2',
		'method'                  => 'POST',
		'path'                    => '/sites/%s/plugins/replace',
		'path_labels'             => array(
			'$site' => '(int|string) Site ID or domain',
		),
		'request_format'          => array(
			'zip'  => '(array) Reference to an uploaded plugin package zip file.',
			'slug' => '(string) The plugin slug the uploaded zip must resolve to. Required; the endpoint rejects zips whose top-level folder does not match.',
		),
		'response_format'         => Jetpack_JSON_API_Plugins_Endpoint::$_response_format_v1_2,
		'allow_jetpack_site_auth' => true,
		'example_request_data'    => array(
			'headers' => array(
				'authorization' => 'Bearer YOUR_API_TOKEN',
			),
		),
		'example_request'         => 'https://public-api.wordpress.com/rest/v1.2/sites/example.wordpress.org/plugins/replace',
	)
);
