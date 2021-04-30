<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Tests for the changelogger Application class.
 *
 * @package automattic/jetpack-changelogger
 */

// phpcs:disable WordPress.WP.AlternativeFunctions, WordPress.PHP.DiscouragedPHPFunctions.runtime_configuration_putenv

namespace Automattic\Jetpack\Changelogger\Tests;

use Automattic\Jetpack\Changelogger\Application;
use Automattic\Jetpack\Changelogger\Config;
use Automattic\Jetpack\Changelogger\ConfigException;
use RuntimeException;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Tester\ApplicationTester;
use Wikimedia\TestingAccessWrapper;

/**
 * Tests for the changelogger Application class.
 *
 * @covers \Automattic\Jetpack\Changelogger\Application
 */
class ApplicationTest extends TestCase {
	use \Yoast\PHPUnitPolyfills\Polyfills\AssertionRenames;
	use \Yoast\PHPUnitPolyfills\Polyfills\AssertIsType;

	/**
	 * Set up.
	 *
	 * @before
	 */
	public function set_up() {
		$this->useTempDir();
		file_put_contents( 'composer.json', "{}\n" );
	}

	/**
	 * Test the application.
	 */
	public function testBasics() {
		$app = new Application();

		$this->assertSame( 'Jetpack Changelogger', $app->getName() );
		$this->assertSame( Application::VERSION, $app->getVersion() );

		$app->setAutoExit( false );
		$tester = new ApplicationTester( $app );
		$tester->run( array( 'command' => 'list' ) );
		$output = $tester->getDisplay();
		$this->assertMatchesRegularExpression( '/Available commands:/', $output );
		$this->assertMatchesRegularExpression( '/add\s*Adds a change file/', $output );
	}

	/**
	 * Run the application.
	 *
	 * @param callable $callback Command callback.
	 * @param array    $options Options:
	 *     - catch-exceptions: (bool) Whether the application should catch exceptions. Default false.
	 *     - inputs: (array) Value to pass to $tester->setInputs().
	 * @return ApplicationTester
	 */
	private function runApplication( $callback, array $options = array( 'interactive' => false ) ) {
		$app = new Application();
		$app->setAutoExit( false );
		$app->setCatchExceptions( false );

		if ( isset( $options['catch-exceptions'] ) ) {
			$app->setCatchExceptions( $options['catch-exceptions'] );
			unset( $options['catch-exceptions'] );
		}

		$command = new Command( 'testDoRun' );
		$command->setCode( $callback );
		$app->add( $command );

		$tester = new ApplicationTester( $app );

		$options['interactive'] = isset( $options['inputs'] );
		if ( $options['interactive'] ) {
			if ( ! is_callable( array( $tester, 'setInputs' ) ) ) {
				$this->markTestSkipped( 'This test requires a newer version of symfony/console' );
			}
			$tester->setInputs( $options['inputs'] );
			unset( $options['inputs'] );
		}

		$options[] = 'decorated';
		$tester->run( array( 'command' => 'testDoRun' ), $options );
		return $tester;
	}

	/**
	 * Basic test of doRun().
	 */
	public function testDoRun() {
		$tester = $this->runApplication(
			function ( $input, $output ) {
				$this->assertSame(
					getcwd() . DIRECTORY_SEPARATOR . 'composer.json',
					TestingAccessWrapper::newFromClass( Config::class )->composerJsonPath
				);
				$this->assertTrue( $output->getFormatter()->hasStyle( 'warning' ) );
				return 42;
			}
		);
		$this->assertSame( 42, $tester->getStatusCode() );
		$this->assertSame( '', $tester->getDisplay() );
	}

	/**
	 * Test doRun(), command threw ConfigException.
	 */
	public function testDoRun_ConfigException() {
		$tester = $this->runApplication(
			function () {
				throw new ConfigException( 'Test config exception' );
			}
		);
		$this->assertSame( -1, $tester->getStatusCode() );
		$this->assertSame( "Test config exception\n", $tester->getDisplay() );
	}

	/**
	 * Test doRun(), command threw RuntimeException.
	 */
	public function testDoRun_RuntimeException() {
		$tester = $this->runApplication(
			function () {
				throw new RuntimeException( 'Test runtime exception' );
			},
			array( 'catch-exceptions' => true )
		);
		$this->assertSame( 1, $tester->getStatusCode() );
		$this->assertMatchesRegularExpression( '/In ApplicationTest.php line \d+:\n *\n  Test runtime exception *\n/', $tester->getDisplay() );
	}

	/**
	 * Test of doRun() with COMPOSER set
	 */
	public function testDoRun_env() {
		putenv( 'COMPOSER=composer.json' );
		$tester = $this->runApplication(
			function () {
				$this->assertNull( TestingAccessWrapper::newFromClass( Config::class )->composerJsonPath );
				return 42;
			}
		);
		$this->assertSame( 42, $tester->getStatusCode() );
		$this->assertSame( '', $tester->getDisplay() );
	}

	/**
	 * Test of doRun() with no composer.json
	 */
	public function testDoRun_noComposerJson() {
		unlink( 'composer.json' );

		// Sanity check.
		$dir = getcwd();
		do {
			if ( file_exists( "$dir/composer.json" ) ) {
				$this->fail( 'Precondition failed: This test requires that no composer.json exist above the temporary directory ' . getcwd() . ", but $dir/composer.json exists." );
			}
			$prev = $dir;
			$dir  = dirname( $dir );
		} while ( $prev !== $dir );

		$tester = $this->runApplication(
			function () {
				$this->fail( 'Command should not be called' );
			}
		);
		$this->assertSame( -1, $tester->getStatusCode() );
		$this->assertSame( 'File composer.json is not found in ' . getcwd() . ".\nRun changelogger from the appropriate directory, or set the environment variable COMPOSER to point to composer.json.\n", $tester->getDisplay() );
	}

	/**
	 * Test doRun() in a subdirectory, non-interactive.
	 */
	public function testDoRun_subdir_noninteractive() {
		$cwd = getcwd();
		mkdir( 'foo' );
		mkdir( 'foo/bar' );
		chdir( 'foo/bar' );

		$tester = $this->runApplication(
			function () {
				$this->fail( 'Command should not be called' );
			}
		);
		$this->assertSame( -1, $tester->getStatusCode() );
		$this->assertSame( "File composer.json is not found in $cwd/foo/bar.\nRun changelogger from the appropriate directory, or set the environment variable COMPOSER to point to composer.json.\n", $tester->getDisplay() );
	}

	/**
	 * Test doRun() in a subdirectory, interactive, answer N.
	 */
	public function testDoRun_subdir_interactive_N() {
		$cwd = getcwd();
		mkdir( 'foo' );
		mkdir( 'foo/bar' );
		chdir( 'foo/bar' );

		$tester = $this->runApplication(
			function () {
				$this->fail( 'Command should not be called' );
			},
			array( 'inputs' => array( 'N' ) )
		);
		$this->assertSame( -1, $tester->getStatusCode() );
		$this->assertSame( "No composer.json in current directory, do you want to use the one at $cwd/composer.json? [Y/n] ", $tester->getDisplay() );
	}

	/**
	 * Test doRun() in a subdirectory, interactive, answer Y.
	 */
	public function testDoRun_subdir_interactive_Y() {
		$cwd = getcwd();
		mkdir( 'foo' );
		mkdir( 'foo/bar' );
		chdir( 'foo/bar' );

		$tester = $this->runApplication(
			function () use ( $cwd ) {
				$this->assertSame(
					$cwd . DIRECTORY_SEPARATOR . 'composer.json',
					TestingAccessWrapper::newFromClass( Config::class )->composerJsonPath
				);
				return 42;
			},
			array( 'inputs' => array( 'Y' ) )
		);
		$this->assertSame( 42, $tester->getStatusCode() );
		$this->assertSame( "No composer.json in current directory, do you want to use the one at $cwd/composer.json? [Y/n] ", $tester->getDisplay() );
	}

}
