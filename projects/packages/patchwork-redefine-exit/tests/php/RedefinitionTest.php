<?php
/**
 * Test the redefinition functionality.
 *
 * @package automattic/patchwork-redefine-exit
 */

namespace Automattic\RedefineExit\Tests;

use Automattic\RedefineExit\ExitException;
use PHPUnit\Framework\TestCase;

/**
 * Test the redefinition functionality.
 */
class RedefinitionTest extends TestCase {
	use \Yoast\PHPUnitPolyfills\Polyfills\AssertStringContains;

	/**
	 * @dataProvider provideRedefinition
	 * @param string          $func 'exit' or 'die'.
	 * @param string|int|null $arg Argument to pass.
	 * @param string          $expectMessage Expected exception message.
	 * @param int             $expectCode Expected exception code.
	 */
	public function testRedefinition( $func, $arg, $expectMessage, $expectCode ) {
		try {
			$this->assertThat( $func, $this->logicalOr( 'exit', 'die' ) );
			require __DIR__ . "/fixtures/$func.php";
			$this->expectException( ExitException::class );
		} catch ( ExitException $ex ) {
			$this->assertSame( $expectMessage, $ex->getMessage() );
			$this->assertSame( $expectCode, $ex->getCode() );
			$this->assertSame( $func, $ex->getFunction() );
			$this->assertSame( $arg, $ex->getArg() );
		}
	}

	public static function provideRedefinition() {
		return array(
			'exit()'                       => array( 'exit', null, 'Exit called with no argument', 0 ),
			'exit( 1 )'                    => array( 'exit', 1, 'Exit called with code 1', 1 ),
			'exit( "" )'                   => array( 'exit', '', 'Exit called with an empty string', 0 ),
			'exit( "some text" )'          => array( 'exit', 'some text', 'Exit called: some text', 0 ),
			'exit( array( "some text" ) )' => array( 'exit', array( 'some text' ), "Exit called with argument array (\n  0 => 'some text',\n)", 0 ),

			'die()'                        => array( 'die', null, 'Die called with no argument', 0 ),
			'die( 1 )'                     => array( 'die', 1, 'Die called with code 1', 1 ),
			'die( "" )'                    => array( 'die', '', 'Die called with an empty string', 0 ),
			'die( "some text" )'           => array( 'die', 'some text', 'Die called: some text', 0 ),
			'die( array( "some text" ) )'  => array( 'die', array( 'some text' ), "Die called with argument array (\n  0 => 'some text',\n)", 0 ),
		);
	}

	public function testRemoval() {
		if ( PHP_VERSION_ID >= 70400 ) {
			$cmd = array( __DIR__ . '/../../vendor/bin/phpunit', __DIR__ . '/fixtures/RedefinitionTestChild.php' );
		} else {
			$cmd = __DIR__ . '/../../vendor/bin/phpunit ' . escapeshellarg( __DIR__ . '/fixtures/RedefinitionTestChild.php' );
		}

		$p = proc_open(
			$cmd,
			array(
				array( 'pipe', 'r' ),
				array( 'pipe', 'w' ),
				array( 'pipe', 'w' ),
			),
			$pipes,
			getcwd()
		);
		if ( ! is_resource( $p ) ) {
			throw new \RuntimeException( 'proc_open failed' );
		}
		fclose( $pipes[0] );
		$stdout = stream_get_contents( $pipes[1] ); // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		$stderr = stream_get_contents( $pipes[2] );
		fclose( $pipes[1] );
		fclose( $pipes[2] );
		$code = proc_close( $p );

		$this->assertSame( 1, $code );
		$this->assertStringContainsString(
			'The Patchwork handler for exit was removed. This breaks tests, don\'t do it.',
			$stderr
		);
	}

	public function testOkRemoval() {
		require __DIR__ . '/fixtures/some_function_to_redefine.php';
		\Patchwork\redefine(
			'some_function_to_redefine',
			function () {
				return 42;
			}
		);

		// First, verify the function really is redefined.
		$this->assertSame( 42, some_function_to_redefine() );

		// Now check that the restoreAll call restores it.
		\Automattic\RedefineExit::restoreAll();
		$this->assertSame( 23, some_function_to_redefine() );

		// Check that exit is still redefined despite the restore.
		$this->expectException( ExitException::class );
		$this->expectExceptionMessage( 'Exit called with no argument' );
		require __DIR__ . '/fixtures/exit.php';
	}
}
