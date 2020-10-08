<?php
/**
 * Test suite to lint composer.lock
 *
 * @package Jetpack
 */

use PHPUnit\Framework\TestCase;

/**
 * Test suite to lint composer.lock
 */
class WP_Test_Jetpack_Composer_Lint extends TestCase {

	/**
	 * Test that monorepo packages are correctly referred to from composer.lock.
	 */
	public function test_monorepo_package_locks() {
		$basedir = dirname( dirname( __DIR__ ) );

		// First, find the available packages.
		$monorepo_packages = array();
		foreach ( scandir( "$basedir/packages/" ) as $dir ) {
			$file = "$basedir/packages/$dir/composer.json";
			if ( file_exists( $file ) ) {
				$obj                               = json_decode( file_get_contents( $file ), true ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents
				$monorepo_packages[ $obj['name'] ] = "./packages/$dir";
			}
		}

		$obj      = json_decode( file_get_contents( "$basedir/composer.lock" ), true ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents
		$packages = array_merge( $obj['packages'], $obj['packages-dev'] );

		foreach ( $packages as $p ) {
			$name = $p['name'];
			if ( ! isset( $monorepo_packages[ $name ] ) ) {
				continue;
			}

			$this->assertNotSame( 'dev-master', $p['version'], "$name: Monorepo packages must not be version \"dev-master\"" );
			$this->assertSame( 'path', $p['dist']['type'], "$name: Monorepo packages must have dist.type = 'path'" );
			$this->assertSame(
				$monorepo_packages[ $name ],
				$p['dist']['url'],
				"$name: Monorepo packages must have dist.url pointing to the monorepo"
			);
		}
	}
}
