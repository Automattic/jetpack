<?php
/**
 * Covers the 'scan_error' fallback reason: a \Throwable raised by the structural
 * scanner (as opposed to the minifier) must degrade to the original bytes and be
 * reported under its own reason, never conflated with the minifier-level 'error'.
 *
 * This lives in its own separate-process test case. Forcing
 * Js_Structure_Scanner::looks_broken() to throw needs a Mockery alias mock, which
 * only works while the real class has not yet been autoloaded in the process.
 * Minify_Test exercises the real scanner, so the mock cannot coexist there -- a
 * fresh process per test is what keeps the alias safe.
 *
 * @package automattic/jetpack-boost
 */

namespace Automattic\Jetpack_Boost\Tests\Lib;

use Automattic\Jetpack_Boost\Lib\Minify;
use Brain\Monkey;
use Brain\Monkey\Actions;
use Mockery;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunTestsInSeparateProcesses;
use PHPUnit\Framework\TestCase;

/**
 * @runTestsInSeparateProcesses
 * @preserveGlobalState disabled
 */
#[RunTestsInSeparateProcesses]
#[PreserveGlobalState( false )]
class Minify_Scan_Error_Test extends TestCase {

	public function setUp(): void {
		parent::setUp();
		Monkey\setUp();
	}

	public function tearDown(): void {
		Mockery::close();
		Monkey\tearDown();
		parent::tearDown();
	}

	/**
	 * When the structural scanner itself throws, js() falls back to the original
	 * bytes and fires the hook with the dedicated 'scan_error' reason -- distinct
	 * from the minifier-level 'error' arm, so a scanner fault and a library/PHP
	 * minifier bug stay tell-apart in the public observability contract.
	 */
	public function test_js_reports_scan_error_when_scanner_throws() {
		// Minifies cleanly to non-empty output, so execution reaches the scan step.
		$source = 'var x=1;';

		// Alias-mock the scanner so looks_broken() throws. The separate process
		// guarantees this is defined before Minify::js() first references the class
		// (nothing here autoloads the real scanner first).
		$scanner = Mockery::mock( 'alias:Automattic\Jetpack_Boost\Lib\Js_Structure_Scanner' );
		$scanner->shouldReceive( 'looks_broken' )
			->once()
			->andThrow( new \RuntimeException( 'scanner blew up' ) );

		Actions\expectDone( 'jetpack_boost_js_minify_fallback' )
			->once()
			->with( Minify::FALLBACK_SCAN_ERROR, strlen( $source ), Mockery::type( \Throwable::class ) );

		$this->assertSame( $source, Minify::js( $source ) );
	}
}
