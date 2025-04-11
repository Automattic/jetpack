<?php
/**
 * Tests for the bin.
 *
 * @package automattic/phpunit-select-config
 */

use PHPUnit\Framework\TestCase;

require_once __DIR__ . '/ExitException.php';

/**
 * Tests for the bin file.
 */
class BinTest extends TestCase {

	public function setUp(): void {
		// @phan-suppress-previous-line PhanCompatibleAnyReturnTypePHP56, PhanCompatibleVoidTypePHP70 -- While the package claims earlier versions, we only run tests with 7.2+.
		parent::setUp();
		unset( $_SERVER['argv'] );
		foreach ( array( 'exit', 'die', 'pcntl_exec', 'ini_get_all', 'fprintf' ) as $func ) {
			\Patchwork\redefine(
				$func,
				/** @return never */
				function () use ( $func ) {
					throw new RuntimeException( "Unexpected call to $func" );
				}
			);
		}
		\Patchwork\redefine( 'extension_loaded', \Patchwork\always( false ) );
	}

	public function tearDown(): void {
		// @phan-suppress-previous-line PhanCompatibleAnyReturnTypePHP56, PhanCompatibleVoidTypePHP70 -- While the package claims earlier versions, we only run tests with 7.2+.
		parent::tearDown();
		\Patchwork\restoreAll();
	}

	public function testBadSapi() {
		$this->expectException( RuntimeException::class );
		$this->expectExceptionMessage( 'This file must be run from the command line.' );

		\Patchwork\redefine( 'php_sapi_name', \Patchwork\always( 'fpm-fcgi' ) );
		require __DIR__ . '/../bin/phpunit-select-config.php';
	}

	public function testNoArgvNoServer() {
		$this->expectException( RuntimeException::class );
		$this->expectExceptionMessage( 'Neither $argv nor $_SERVER[\'argv\'] is an array.' );
		require __DIR__ . '/../bin/phpunit-select-config.php';
	}

	public function testNoArgvBadServer() {
		$_SERVER['argv'] = 'bad';
		$this->expectException( RuntimeException::class );
		$this->expectExceptionMessage( 'Neither $argv nor $_SERVER[\'argv\'] is an array.' );
		require __DIR__ . '/../bin/phpunit-select-config.php';
	}

	public function testBadArgvNoServer() {
		$argv = 'bad';
		$this->expectException( RuntimeException::class );
		$this->expectExceptionMessage( 'Neither $argv nor $_SERVER[\'argv\'] is an array.' );
		require __DIR__ . '/../bin/phpunit-select-config.php';
	}

	private function do_testNoArgs( $do_argv ) {
		if ( $do_argv ) {
			$argv = array( 'xxx' );
		}

		$stderr = '';
		\Patchwork\redefine(
			'fprintf',
			function ( $stream, $fmt, ...$args ) use ( &$stderr ) {
				$this->assertSame( STDERR, $stream );
				$stderr .= sprintf( $fmt, ...$args );
			}
		);
		\Patchwork\redefine(
			'exit',
			/** @return never */
			function ( $arg = null ) {
				throw new ExitException( 'exit', $arg );
			}
		);

		$expect =
			"USAGE: xxx pattern [args...]\n" .
			"\n" .
			"The `pattern` argument should contain a `#` character, which will be replaced\n" .
			"by the major version of PHPUnit in use.\n";

		try {
			require __DIR__ . '/../bin/phpunit-select-config.php';
			$this->fail( 'Expected exception not thrown' );
		} catch ( ExitException $e ) {
			$this->assertSame( 'exit', $e->getFunction() );
			$this->assertSame( 1, $e->getArg() );
		}
		$this->assertSame( $expect, $stderr );
	}

	public function testNoArgs() {
		$this->do_testNoArgs( true );
	}

	public function testNoArgs2() {
		$_SERVER['argv'] = array( 'xxx' );
		$this->do_testNoArgs( false );
	}

	private function doSuccessfulRun( $callArgs, $expectArgs ) {
		$GLOBALS['_composer_autoload_path'] = __DIR__ . '/../vendor/autoload.php';
		$GLOBALS['_composer_bin_dir']       = __DIR__ . '/../vendor/bin';
		\Patchwork\redefine(
			'pcntl_exec',
			/** @return never */
			function ( $func, $args ) use ( $expectArgs ) {
				$this->assertSame( PHP_BINARY, $func );
				$this->assertSame( $expectArgs, $args );
				throw new ExitException( 'pcntl_exec', 0 );
			}
		);

		$argv = $callArgs;
		try {
			require __DIR__ . '/../bin/phpunit-select-config.php';
			$this->fail( 'Expected exception not thrown' );
		} catch ( ExitException $e ) {
			$this->assertSame( 'pcntl_exec', $e->getFunction() );
			$this->assertSame( 0, $e->getArg() );
		}
	}

	public function testSimpleRun() {
		$this->doSuccessfulRun(
			array( 'xxx', 'test#.xml' ),
			array(
				__DIR__ . '/../vendor/bin/phpunit',
				'--configuration',
				'test' . explode( '.', \PHPUnit\Runner\Version::id() )[0] . '.xml',
			)
		);
	}

	public function testRunWithArgs() {
		$this->doSuccessfulRun(
			array( 'xxx', 'test-#.xml', '--foo', 'bar', '--', 'baz.php' ),
			array(
				__DIR__ . '/../vendor/bin/phpunit',
				'--configuration',
				'test-' . explode( '.', \PHPUnit\Runner\Version::id() )[0] . '.xml',
				'--foo',
				'bar',
				'--',
				'baz.php',
			)
		);
	}

	public function testPcovRun() {
		\Patchwork\redefine(
			'extension_loaded',
			function ( $ext ) {
				$this->assertThat( $ext, $this->logicalOr( 'pcov', 'xdebug' ) );
				return $ext === 'pcov';
			}
		);
		\Patchwork\redefine(
			'ini_get_all',
			function ( $ext, $details ) {
				$this->assertSame( 'pcov', $ext );
				$this->assertFalse( $details );
				return array(
					'pcov.a' => 'AAA',
					'pcov.b' => 42,
				);
			}
		);

		$this->doSuccessfulRun(
			array( 'xxx', 'test#.xml' ),
			array(
				'-dpcov.b=42',
				'-dpcov.a=AAA',
				__DIR__ . '/../vendor/bin/phpunit',
				'--configuration',
				'test' . explode( '.', \PHPUnit\Runner\Version::id() )[0] . '.xml',
			)
		);
	}

	public function testXdebugRun() {
		\Patchwork\redefine(
			'extension_loaded',
			function ( $ext ) {
				$this->assertThat( $ext, $this->logicalOr( 'pcov', 'xdebug' ) );
				return $ext === 'xdebug';
			}
		);
		\Patchwork\redefine(
			'ini_get_all',
			function ( $ext, $details ) {
				$this->assertSame( 'xdebug', $ext );
				$this->assertFalse( $details );
				return array(
					'xdebug.enable' => 'NO!',
					'xdebug.arg'    => '#23',
				);
			}
		);

		$this->doSuccessfulRun(
			array( 'xxx', 'test#.xml' ),
			array(
				'-dxdebug.arg=#23',
				'-dxdebug.enable=NO!',
				__DIR__ . '/../vendor/bin/phpunit',
				'--configuration',
				'test' . explode( '.', \PHPUnit\Runner\Version::id() )[0] . '.xml',
			)
		);
	}

	public function testPhpdbgRun() {
		\Patchwork\redefine(
			'extension_loaded',
			function ( $ext ) {
				$this->assertThat( $ext, $this->logicalOr( 'pcov', 'xdebug' ) );
				return false;
			}
		);
		\Patchwork\redefine( 'php_sapi_name', \Patchwork\always( 'phpdbg' ) );

		$this->doSuccessfulRun(
			array( 'xxx', 'test.xml' ),
			array(
				'-qrr',
				__DIR__ . '/../vendor/bin/phpunit',
				'--configuration',
				'test.xml',
			)
		);
	}

	public function testFailedExec() {
		$GLOBALS['_composer_autoload_path'] = __DIR__ . '/../vendor/autoload.php';
		$GLOBALS['_composer_bin_dir']       = __DIR__ . '/../vendor/bin';
		\Patchwork\redefine( 'pcntl_exec', \Patchwork\always( false ) );

		$stderr = '';
		\Patchwork\redefine(
			'fprintf',
			function ( $stream, $fmt, ...$args ) use ( &$stderr ) {
				$this->assertSame( STDERR, $stream );
				$stderr .= sprintf( $fmt, ...$args );
			}
		);
		\Patchwork\redefine(
			'exit',
			/** @return never */
			function ( $arg = null ) {
				throw new ExitException( 'exit', $arg );
			}
		);

		$argv = array( 'xxx', 'test.xml' );
		try {
			require __DIR__ . '/../bin/phpunit-select-config.php';
			$this->fail( 'Expected exception not thrown' );
		} catch ( ExitException $e ) {
			$this->assertSame( 'exit', $e->getFunction() );
			$this->assertSame( 1, $e->getArg() );
		}
		$this->assertSame( 'Failed to execute ' . __DIR__ . "/../vendor/bin/phpunit\n", $stderr );
	}
}
