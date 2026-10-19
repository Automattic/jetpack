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
	 * @since $$next-version$$
	 * @param string $filename Static filename relative to the site's root.
	 * @return bool Whether the file exists.
	 */
	public static function exists( $filename ) {
		$root = rtrim( Constants::get_constant( 'ABSPATH' ), '/\\' );

		// Atomic serves the parent directory while keeping managed WordPress core in __wp__.
		if ( '__wp__' === basename( $root ) && ( new Host() )->is_atomic_platform() ) {
			$root = dirname( $root );
		}

		return file_exists( $root . '/' . $filename );
	}
}
