<?php
/**
 * Stand-in for the gitignored `build/build.php`, whose presence picks the menu label.
 *
 * @package automattic/jetpack-backup-plugin
 */

namespace Automattic\Jetpack\Backup\V0005;

/**
 * Creates the wp-build entry file when a checkout has none. Consumers must call
 * `remove_wp_build_entry()` from their own `tearDown()`.
 */
trait Wp_Build_Entry_Fixture {

	/** @var string[] Paths this fixture created, deepest first. */
	private $created_wp_build_paths = array();

	/** Make `build/build.php` exist, leaving a real build untouched. */
	private function ensure_wp_build_entry() {
		$dir  = dirname( __DIR__, 2 ) . '/build';
		$file = $dir . '/build.php';

		if ( file_exists( $file ) ) {
			return;
		}
		if ( ! is_dir( $dir ) ) {
			mkdir( $dir ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_mkdir
			$this->created_wp_build_paths[] = $dir;
		}
		file_put_contents( $file, "<?php\n" ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_file_put_contents
		array_unshift( $this->created_wp_build_paths, $file );
	}

	/** Remove only what `ensure_wp_build_entry()` created. */
	private function remove_wp_build_entry() {
		foreach ( $this->created_wp_build_paths as $path ) {
			if ( is_dir( $path ) ) {
				rmdir( $path ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_rmdir
			} else {
				unlink( $path ); // phpcs:ignore WordPress.WP.AlternativeFunctions.unlink_unlink
			}
		}
		$this->created_wp_build_paths = array();
	}

	/** @return bool Whether this checkout has a real wp-build entry file. */
	private function has_real_wp_build_entry() {
		return empty( $this->created_wp_build_paths ) && file_exists( dirname( __DIR__, 2 ) . '/build/build.php' );
	}
}
