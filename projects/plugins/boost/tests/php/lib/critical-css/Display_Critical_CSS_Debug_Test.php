<?php
/**
 * Critical CSS byte-boundary coverage with debug output enabled.
 *
 * @package automattic/jetpack-boost
 */

namespace Automattic\Jetpack_Boost\Tests\Lib\Critical_CSS;

use Automattic\Jetpack_Boost\Lib\Critical_CSS\Display_Critical_CSS;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunInSeparateProcess;
use PHPUnit\Framework\TestCase;

class Display_Critical_CSS_Debug_Test extends TestCase {

	/**
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_debug_comment_does_not_reject_an_accepted_payload() {
		define( 'WP_DEBUG', true );
		define( 'KB_IN_BYTES', 1024 );
		$css     = str_repeat( ' ', 512 * KB_IN_BYTES );
		$display = new Display_Critical_CSS( $css, 'fixture_key' );
		ob_start();
		$display->display_critical_css();
		$output = ob_get_clean();
		$this->assertSame(
			'<style id="jetpack-boost-critical-css">' . "/* Critical CSS Key: fixture_key */\n" . $css . '</style>',
			$output
		);
	}
}
