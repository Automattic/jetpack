<?php
/**
 * Rollback a failed plugin update by reinstalling the previous version from
 * the WordPress.org downloads server.
 *
 * @package automattic/jetpack-mu-wpcom
 */

/**
 * Fetches the versioned .org ZIP for a plugin and re-installs it over the
 * current (broken) copy.
 */
class PCG_Rollback {

	/**
	 * Restore the plugin to its pre-update version.
	 *
	 * @param array{plugin_file:string,slug:string,version:string,was_active:bool,timestamp:float} $snapshot Snapshot from PCG_Snapshot::capture().
	 * @return array{status:string,reason?:string,restored_to?:string}
	 *         status is one of "restored", "reactivated", "rollback_unavailable", "rollback_failed".
	 */
	public static function to_snapshot( $snapshot ) {
		if ( empty( $snapshot['plugin_file'] ) || empty( $snapshot['version'] ) ) {
			return array(
				'status' => 'rollback_unavailable',
				'reason' => 'Snapshot missing plugin_file or version.',
			);
		}

		$plugin_file = (string) $snapshot['plugin_file'];
		$slug        = (string) ( $snapshot['slug'] ?? '' );
		$version     = (string) $snapshot['version'];

		// Deactivate first so the broken version stops fataling on every request.
		if ( function_exists( 'deactivate_plugins' ) ) {
			deactivate_plugins( array( $plugin_file ), true );
		}

		$zip_url = self::build_download_url( $slug, $version );
		if ( '' === $zip_url ) {
			return array(
				'status' => 'rollback_unavailable',
				'reason' => 'No WordPress.org download URL could be built for this plugin.',
			);
		}

		$install = self::install_from_url( $zip_url );
		if ( is_wp_error( $install ) ) {
			return array(
				'status' => 'rollback_failed',
				'reason' => (string) $install->get_error_message(),
			);
		}

		$result = array(
			'status'      => 'restored',
			'restored_to' => $version,
		);

		if ( ! empty( $snapshot['was_active'] ) && function_exists( 'activate_plugin' ) ) {
			$activated = activate_plugin( $plugin_file, '', false, true );
			if ( ! is_wp_error( $activated ) ) {
				$result['status'] = 'reactivated';
			}
		}

		return $result;
	}

	/**
	 * Build the canonical WordPress.org versioned ZIP URL for a plugin.
	 *
	 * @param string $slug    Plugin slug (directory name).
	 * @param string $version Previous version string (e.g. "7.9.1").
	 * @return string URL, or '' when inputs are invalid.
	 */
	public static function build_download_url( $slug, $version ) {
		$slug    = trim( (string) $slug );
		$version = trim( (string) $version );
		if ( '' === $slug || '' === $version ) {
			return '';
		}
		if ( ! preg_match( '/^[a-z0-9\-]+$/i', $slug ) ) {
			return '';
		}
		if ( ! preg_match( '/^[0-9][0-9A-Za-z\.\-]*$/', $version ) ) {
			return '';
		}
		return sprintf( 'https://downloads.wordpress.org/plugin/%s.%s.zip', rawurlencode( $slug ), rawurlencode( $version ) );
	}

	/**
	 * Download $url and re-install it via Plugin_Upgrader with clear_destination.
	 *
	 * @param string $url Versioned plugin ZIP URL.
	 * @return true|WP_Error
	 */
	protected static function install_from_url( $url ) {
		if ( ! class_exists( 'Plugin_Upgrader' ) ) {
			require_once ABSPATH . 'wp-admin/includes/class-wp-upgrader.php';
		}
		if ( ! class_exists( 'Automatic_Upgrader_Skin' ) ) {
			require_once ABSPATH . 'wp-admin/includes/class-automatic-upgrader-skin.php';
		}

		$skin     = new Automatic_Upgrader_Skin();
		$upgrader = new Plugin_Upgrader( $skin );
		$result   = $upgrader->install(
			$url,
			array(
				'overwrite_package' => true,
				'clear_destination' => true,
			)
		);

		if ( is_wp_error( $result ) ) {
			return $result;
		}
		if ( false === $result || null === $result ) {
			// @phan-suppress-next-line PhanUndeclaredMethod -- get_errors() is defined on WP_Upgrader_Skin; Phan's stubs omit it.
			$errors = $skin->get_errors();
			if ( $errors instanceof WP_Error && $errors->has_errors() ) {
				return $errors;
			}
			return new WP_Error( 'pcg_rollback_install_failed', 'Plugin_Upgrader::install() returned false.' );
		}
		return true;
	}
}
