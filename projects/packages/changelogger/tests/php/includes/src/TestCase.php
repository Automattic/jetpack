<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Base test case for the changelogger tool.
 *
 * @package automattic/jetpack-changelogger
 */

// phpcs:disable WordPress.WP.AlternativeFunctions, WordPress.PHP.DiscouragedPHPFunctions.runtime_configuration_putenv, WordPress.NamingConventions.ValidVariableName

namespace Automattic\Jetpack\Changelogger\Tests;

use Automattic\Jetpack\Changelogger\Config;
use PHPUnit\Framework\TestCase as PHPUnit_TestCase;
use Wikimedia\TestingAccessWrapper;
use function Wikimedia\quietCall;

/**
 * Base test case for the changelogger tool.
 */
class TestCase extends PHPUnit_TestCase {

	/**
	 * Value of COMPOSER environment variable to restore in tear_down.
	 *
	 * @var string|false
	 */
	private $oldenv = false;

	/**
	 * Temporary directory to remove in tear_down.
	 *
	 * @var string|false
	 */
	private $tmpdir = false;

	/**
	 * Working directory to restore in tear_down.
	 *
	 * @var string|false
	 */
	private $oldcwd = false;

	/**
	 * Setup test.
	 *
	 * @before
	 */
	public function set_up() {
		$this->oldenv = getenv( 'COMPOSER' );
		$this->resetConfigCache();
	}

	/**
	 * Teardown test.
	 *
	 * @after
	 */
	public function tear_down() {
		$this->cleanupTempDir();
		$this->resetConfigCache();
		putenv( false === $this->oldenv ? 'COMPOSER' : "COMPOSER=$this->oldenv" );
	}

	/**
	 * Create (and chdir to) a temporary directory to test commands.
	 *
	 * @return string
	 * @throws \LogicException If called when already in effect.
	 * @throws \RuntimeException If a runtime exception occurs. Which isn't normally noted, but some sniff insists.
	 */
	protected function useTempDir() {
		if ( false !== $this->tmpdir ) {
			throw new \LogicException( 'useTempDir() called while a temp dir already exists' );
		}

		$base = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'phpunit-changelogger-';
		$mask = rand( 0, 0xffffff );
		for ( $i = 0; $i < 0xffffff; $i++ ) {
			$tmpdir = $base . sprintf( '%06x', $i ^ $mask );
			if ( quietCall( 'mkdir', $tmpdir, 0700 ) ) {
				// Success!
				file_put_contents( "$tmpdir/composer.json", "{}\n" );
				$this->oldcwd = getcwd();
				$this->tmpdir = $tmpdir;
				chdir( $tmpdir );
				return $tmpdir;
			}
		}

		throw new \RuntimeException( 'Failed to create temporary directory' );
	}

	/**
	 * Cleanup after a call to `useTempDir()`.
	 *
	 * This is called automatically during teardown, but may be called manually
	 * as well.
	 */
	protected function cleanupTempDir() {
		if ( false === $this->tmpdir ) {
			return;
		}

		chdir( $this->oldcwd );

		$iter = new \RecursiveIteratorIterator(
			new \RecursiveDirectoryIterator( $this->tmpdir, \FilesystemIterator::CURRENT_AS_PATHNAME | \FilesystemIterator::SKIP_DOTS ),
			\RecursiveIteratorIterator::CHILD_FIRST
		);
		foreach ( $iter as $path ) {
			if ( is_dir( $path ) ) {
				rmdir( $path );
			} else {
				unlink( $path );
			}
		}
		rmdir( $this->tmpdir );

		$this->oldcwd = false;
		$this->tmpdir = false;
	}

	/**
	 * Reset the internal caches in Config.
	 */
	protected function resetConfigCache() {
		$w         = TestingAccessWrapper::newFromClass( Config::class );
		$w->config = array();
		$w->cache  = array();
		$w->loaded = false;
		Config::setComposerJsonPath( null );
	}

}
