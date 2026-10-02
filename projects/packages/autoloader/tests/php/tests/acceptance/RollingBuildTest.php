<?php
/**
 * Acceptance test suite covering plugin directories that are replaced by a new build.
 *
 * @package automattic/jetpack-autoloader
 */

use Automattic\Jetpack\Autoloader\jpCurrent\Path_Processor;
use Automattic\Jetpack\Autoloader\jpCurrent\Plugins_Handler;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunTestsInSeparateProcesses;

/**
 * Hosts that deploy a plugin into a versioned directory (`.../wpcomsh/<version>/`) give the
 * same plugin a new absolute path on every release. Manifest paths are built from `__DIR__`,
 * so they pin to whichever directory was live when the manifest was read.
 *
 * @runTestsInSeparateProcesses Ensure each test has a fresh process as if it was a real request.
 * @preserveGlobalState disabled
 */
#[RunTestsInSeparateProcesses]
#[PreserveGlobalState( false )]
class RollingBuildTest extends Acceptance_TestCase {

	/**
	 * The directory of the build that was retired by the rollout, if one was made.
	 *
	 * @var string|null
	 */
	private $retired_build;

	/**
	 * Teardown runs after each test.
	 */
	public function tearDown(): void {
		if ( isset( $this->retired_build ) ) {
			$this->remove_directory( $this->retired_build );
			$this->retired_build = null;
		}

		parent::tearDown();
	}

	/**
	 * Tests that a retired build still on disk does not win the version tie against the live build.
	 */
	public function test_retired_build_does_not_win_version_tie() {
		$live    = $this->get_autoloader_path( self::CURRENT_MU );
		$retired = $this->retire_build( $live );

		// The previous request cached the build that was live at the time.
		$this->cache_path( $retired );

		$this->load_plugin_autoloader( self::CURRENT_MU );

		$this->assertResolvesWithin( $live, 'Classmap_Test_Class' );
	}

	/**
	 * Tests that a class is still loadable when the retired build is deleted after the manifests
	 * were read, which is what a host does once the rollout has finished.
	 */
	public function test_class_loads_after_retired_build_is_deleted() {
		$live    = $this->get_autoloader_path( self::CURRENT_MU );
		$retired = $this->retire_build( $live );

		$this->cache_path( $retired );

		$this->load_plugin_autoloader( self::CURRENT_MU );

		// The rollout finishes and the retired directory is garbage collected.
		$this->remove_directory( $retired );
		$this->retired_build = null;

		$this->assertTrue( class_exists( 'Classmap_Test_Class' ), 'The class could not be autoloaded.' );
	}

	/**
	 * Asserts that the autoloader resolves a class to a file inside the given directory.
	 *
	 * @param string $directory  The directory the class file is expected to live in.
	 * @param string $class_name The class to resolve.
	 */
	private function assertResolvesWithin( $directory, $class_name ) {
		global $jetpack_autoloader_loader;
		if ( ! isset( $jetpack_autoloader_loader ) ) {
			$this->fail( 'There is no autoloader loaded to check.' );
		}

		$file = $jetpack_autoloader_loader->find_class_file( $class_name );
		$this->assertNotNull( $file, "The autoloader did not provide the '$class_name' class." );
		$this->assertStringStartsWith(
			$directory . DIRECTORY_SEPARATOR,
			$file,
			'The autoloader resolved the class to a build other than the live one.'
		);
	}

	/**
	 * Copies a build to a sibling directory to stand in for the build a rollout just retired.
	 *
	 * A copy is what the host leaves behind: the same package versions at a different absolute
	 * path, so every class in it ties with the live build.
	 *
	 * @param string $build_dir The build to copy.
	 * @return string The directory of the retired build.
	 */
	private function retire_build( $build_dir ) {
		$retired = $build_dir . '-retired';

		$this->remove_directory( $retired );
		$this->copy_directory( $build_dir, $retired );

		$this->retired_build = $retired;

		return $retired;
	}

	/**
	 * Adds an absolute path to the autoloader cache.
	 *
	 * @param string $path The plugin directory to cache.
	 */
	private function cache_path( $path ) {
		$processor = new Path_Processor();

		set_transient( Plugins_Handler::TRANSIENT_KEY, array( $processor->tokenize_path_constants( $path ) ) );
	}

	/**
	 * Recursively copies a directory, preserving symlinks rather than following them.
	 *
	 * @param string $source      The directory to copy.
	 * @param string $destination The directory to copy it to.
	 */
	private function copy_directory( $source, $destination ) {
		mkdir( $destination, 0777, true );

		foreach ( scandir( $source ) as $path ) {
			if ( '.' === $path || '..' === $path ) {
				continue;
			}

			$from = $source . DIRECTORY_SEPARATOR . $path;
			$to   = $destination . DIRECTORY_SEPARATOR . $path;

			if ( is_link( $from ) ) {
				symlink( readlink( $from ), $to );
			} elseif ( is_dir( $from ) ) {
				$this->copy_directory( $from, $to );
			} else {
				copy( $from, $to );
			}
		}
	}

	/**
	 * Recursively removes a directory, taking care not to follow symlinks out of it.
	 *
	 * @param string $dir The directory to remove.
	 */
	private function remove_directory( $dir ) {
		if ( ! is_dir( $dir ) ) {
			return;
		}

		foreach ( scandir( $dir ) as $path ) {
			if ( '.' === $path || '..' === $path ) {
				continue;
			}

			$path = $dir . DIRECTORY_SEPARATOR . $path;

			if ( is_dir( $path ) && ! is_link( $path ) ) {
				$this->remove_directory( $path );
			} else {
				unlink( $path );
			}
		}

		rmdir( $dir );
	}
}
