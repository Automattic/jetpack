<?php
/**
 * Local plugin-metadata parser for the Plugin Conflicts Guardian.
 *
 * @package automattic/jetpack-mu-wpcom
 */

/**
 * Reads the same `Name`, `Version`, `Requires at least`, `Requires PHP`
 * and `Tested up to` headers we fetch from WordPress.org, but from a
 * local directory (typically the extracted output of an uploaded zip).
 *
 * The returned shape matches `PCG_Wporg_Source::fetch()` so the
 * compat checker's rule engine can consume either source.
 */
class PCG_Local_Source {

	/**
	 * Parse plugin headers from a directory. Scans top-level PHP files
	 * for the first one that carries a `Plugin Name` header.
	 *
	 * @param string $plugin_dir Absolute path to the extracted plugin directory.
	 * @return array{name:string,version:string,requires:string,requires_php:string,tested:string,main_file:string}|null
	 */
	public function parse( $plugin_dir ) {
		if ( '' === (string) $plugin_dir || ! is_dir( $plugin_dir ) ) {
			return null;
		}

		if ( ! function_exists( 'get_plugin_data' ) ) {
			require_once ABSPATH . 'wp-admin/includes/plugin.php';
		}

		$main = $this->find_main_file( $plugin_dir );
		if ( '' === $main ) {
			return null;
		}

		$data = get_plugin_data( $main, false, false );
		if ( empty( $data['Name'] ) ) {
			return null;
		}

		return array(
			'name'         => (string) $data['Name'],
			'version'      => (string) ( $data['Version'] ?? '' ),
			'requires'     => (string) ( $data['RequiresWP'] ?? $data['Requires at least'] ?? '' ),
			'requires_php' => (string) ( $data['RequiresPHP'] ?? $data['Requires PHP'] ?? '' ),
			'tested'       => (string) ( $data['Tested up to'] ?? '' ),
			'main_file'    => $main,
		);
	}

	/**
	 * Locate the plugin's main file — the first top-level `.php` file
	 * whose header block contains `Plugin Name:`.
	 *
	 * @param string $plugin_dir Absolute path.
	 * @return string Absolute path of the main file, or '' when none found.
	 */
	private function find_main_file( $plugin_dir ) {
		$candidates = glob( rtrim( $plugin_dir, '/' ) . '/*.php' );
		if ( ! is_array( $candidates ) ) {
			return '';
		}
		foreach ( $candidates as $candidate ) {
			$header = @file_get_contents( $candidate, false, null, 0, 8192 ); // phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged,WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents -- small local read, errors are benign here.
			if ( is_string( $header ) && preg_match( '/^[ \t\/*#@]*Plugin Name:/mi', $header ) ) {
				return $candidate;
			}
		}
		return '';
	}
}
