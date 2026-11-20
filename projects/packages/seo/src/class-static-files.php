<?php
/**
 * Detect static files that shadow the SEO package's generated output.
 *
 * @package automattic/jetpack-seo
 */

namespace Automattic\Jetpack\SEO;

use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Status\Host;

/**
 * Resolve the public root on hosts that keep WordPress core in a separate directory.
 */
class Static_Files {

	/**
	 * Check whether a static file takes precedence over WordPress-generated output.
	 *
	 * @since 0.10.0
	 * @param string $filename Static filename relative to the site's root.
	 * @return bool Whether the file exists.
	 */
	public static function exists( $filename ) {
		$root = rtrim( wp_normalize_path( Constants::get_constant( 'ABSPATH' ) ), '/' );

		// Atomic serves the parent directory while keeping managed WordPress core in __wp__.
		if ( '__wp__' === basename( $root ) && ( new Host() )->is_atomic_platform() ) {
			$root = dirname( $root );
		}

		$home = wp_parse_url( home_url( '/' ) );
		$site = wp_parse_url( site_url( '/' ) );
		if ( isset( $home['host'] ) && isset( $site['host'] ) && 0 === strcasecmp( $home['host'], $site['host'] ) && ( $home['port'] ?? null ) === ( $site['port'] ?? null ) ) {
			$home_path = $home['path'] ?? '/';
			$site_path = $site['path'] ?? '/';
			if ( 0 === strpos( $site_path, $home_path ) && $site_path !== $home_path ) {
				$relative = '/' . trim( rawurldecode( substr( $site_path, strlen( $home_path ) ) ), '/' );
				// URL paths alone cannot establish the filesystem layout on mapped hosts.
				if ( substr( $root, -strlen( $relative ) ) === $relative ) {
					$root = substr( $root, 0, -strlen( $relative ) );
				}
			}
		}

		return file_exists( $root . '/' . $filename );
	}
}
