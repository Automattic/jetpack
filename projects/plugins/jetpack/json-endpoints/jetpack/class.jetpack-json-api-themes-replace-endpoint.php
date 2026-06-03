<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName

use Automattic\Jetpack\Automatic_Install_Skin;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

require_once ABSPATH . 'wp-admin/includes/class-wp-upgrader.php';
require_once ABSPATH . 'wp-admin/includes/file.php';

/**
 * Install-or-replace a theme via zip upload. Passes overwrite_package=true to
 * Theme_Upgrader so an existing theme at the same slug is replaced in place,
 * mirroring wp-admin's "Replace current with uploaded" confirmation flow.
 *
 * POST /sites/%s/themes/replace
 *
 * ## Authentication trust model
 *
 * Two auth modes are supported:
 *
 * 1. User auth — the request is mapped to a WordPress user who must hold
 *    `install_themes` AND `update_themes`. The ownership check verifies the
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
 * `Jetpack_JSON_API_Themes_New_Endpoint::validate_call` deletes the referenced
 * attachment on capability-check failure without verifying the caller owns it.
 * This Replace endpoint overrides `validate_call` to run the ownership check
 * first, so a low-privilege caller cannot use it to hard-delete another user's
 * attachment as a side-effect of the cap check failing. The parent's behavior
 * is unchanged for the legitimate case (caller's own attachment is cleaned up
 * when their cap check fails).
 *
 * @phan-constructor-used-for-side-effects
 */
class Jetpack_JSON_API_Themes_Replace_Endpoint extends Jetpack_JSON_API_Themes_New_Endpoint {
	use Jetpack_JSON_API_Attachment_Ownership_Trait;

	/**
	 * Replace is destructive, so require both install and update caps.
	 *
	 * @var array
	 */
	protected $needed_capabilities = array( 'install_themes', 'update_themes' );

	/**
	 * Error codes we are willing to surface to the caller. Anything outside
	 * this list is collapsed to 'install_failed' with a generic message to
	 * avoid leaking filesystem paths from Theme_Upgrader internals.
	 *
	 * Kept aligned with codes actually emitted by `WP_Upgrader` /
	 * `Theme_Upgrader` — $this->strings[] message keys are NOT error codes
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
		'incompatible_archive_empty',
		'incompatible_archive_theme_no_style',
		'incompatible_archive_theme_no_name',
		'incompatible_archive_theme_no_index',
		'incompatible_php_required_version',
		'incompatible_wp_required_version',
		'unable_to_connect_to_filesystem',
		'fs_unavailable',
		'fs_error',
		'fs_no_themes_dir',
		'fs_no_folder',
		'fs_no_root_dir',
		'fs_no_content_dir',
		'fs_no_temp_backup_dir',
		'fs_temp_backup_mkdir',
		'fs_temp_backup_move',
	);

	/**
	 * Install, replacing any existing theme at the same slug.
	 *
	 * @return bool|WP_Error
	 */
	public function install() {
		$args = $this->input();

		if ( ! isset( $args['zip'][0]['id'] ) || ! is_scalar( $args['zip'][0]['id'] ) ) {
			return new WP_Error( 'no_theme_installed', __( 'No theme zip file was provided.', 'jetpack' ), 400 );
		}

		$expected_slug = isset( $args['slug'] ) && is_scalar( $args['slug'] )
			? strtolower( (string) $args['slug'] )
			: '';
		if ( ! preg_match( '/^[a-z0-9][a-z0-9_-]*$/', $expected_slug ) ) {
			return new WP_Error( 'missing_slug', __( 'A valid theme slug is required; the replace endpoint refuses to overwrite a theme whose slug the caller has not declared.', 'jetpack' ), 400 );
		}

		$attachment_id = (int) $args['zip'][0]['id'];

		// Re-checked here so direct invocations of install() (notably the test stubs)
		// can't accidentally bypass the ownership guard that validate_call() runs on
		// the live request path.
		$ownership = $this->validate_attachment_ownership( $attachment_id );
		if ( is_wp_error( $ownership ) ) {
			return $ownership;
		}

		$zip_check = $this->validate_attachment_is_zip( $attachment_id );
		if ( is_wp_error( $zip_check ) ) {
			wp_delete_attachment( $attachment_id, true );
			return $zip_check;
		}

		$local_file = get_attached_file( $attachment_id );
		if ( ! $local_file ) {
			wp_delete_attachment( $attachment_id, true );
			return new WP_Error( 'local-file-does-not-exist', __( 'Uploaded theme zip could not be found on disk.', 'jetpack' ), 400 );
		}

		$skin     = new Automatic_Install_Skin();
		$upgrader = new Theme_Upgrader( $skin );

		$result = $upgrader->install(
			$local_file,
			array( 'overwrite_package' => true )
		);

		wp_delete_attachment( $attachment_id, true );

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
			return new WP_Error( $error_code, __( 'Theme installation failed.', 'jetpack' ), 400 );
		}

		$theme_info = $upgrader->theme_info();
		$theme_slug = $theme_info ? $theme_info->get_stylesheet() : '';
		if ( empty( $theme_slug ) ) {
			return new WP_Error( 'theme_replace_info_missing', __( 'Theme was installed but its identifier could not be determined.', 'jetpack' ), 500 );
		}

		// `overwrite_package=true` trusts the zip's own folder name, so a zip whose
		// top-level folder differs from the declared slug would clobber an unrelated
		// theme. Verify the post-install identifier matches the caller's contract.
		if ( strtolower( $theme_slug ) !== $expected_slug ) {
			return new WP_Error( 'slug_mismatch', __( 'The installed theme does not match the declared slug.', 'jetpack' ), 400 );
		}

		$this->themes             = array( $theme_slug );
		$this->log[ $theme_slug ] = $upgrader->skin->get_upgrade_messages();

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
	 * from WP_Error instances returned by Theme_Upgrader.
	 *
	 * @param WP_Error $error Raw upgrader error.
	 * @return WP_Error
	 */
	protected function sanitize_upgrader_error( WP_Error $error ) {
		$code = $error->get_error_code();
		if ( empty( $code ) || ! in_array( $code, self::$allowed_error_codes, true ) ) {
			return new WP_Error( 'install_failed', __( 'Theme installation failed.', 'jetpack' ), 400 );
		}
		return new WP_Error( $code, __( 'Theme installation failed.', 'jetpack' ), 400 );
	}
}

// POST /sites/%s/themes/replace
new Jetpack_JSON_API_Themes_Replace_Endpoint(
	array(
		'description'             => 'Install or replace a theme on a Jetpack site by uploading a zip file. If a theme with the same slug is already installed, its destination folder is replaced in place, mirroring wp-admin\'s "Replace current with uploaded" upload flow.',
		'group'                   => '__do_not_document',
		'stat'                    => 'themes:replace',
		'method'                  => 'POST',
		'path'                    => '/sites/%s/themes/replace',
		'path_labels'             => array(
			'$site' => '(int|string) Site ID or domain',
		),
		'request_format'          => array(
			'zip'  => '(array) Reference to an uploaded theme package zip file.',
			'slug' => '(string) The theme slug the uploaded zip must resolve to. Required; the endpoint rejects zips whose top-level folder does not match.',
		),
		'response_format'         => Jetpack_JSON_API_Themes_Endpoint::$_response_format,
		'allow_jetpack_site_auth' => true,
		'example_request_data'    => array(
			'headers' => array(
				'authorization' => 'Bearer YOUR_API_TOKEN',
			),
		),
		'example_request'         => 'https://public-api.wordpress.com/rest/v1/sites/example.wordpress.org/themes/replace',
	)
);
