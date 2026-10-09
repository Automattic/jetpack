<?php
/**
 * Self-check test suite.
 *
 * @package automattic/jetpack-waf
 */

use Automattic\Jetpack\Waf\Waf_Runtime;
use Automattic\Jetpack\Waf\Waf_Self_Check;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunTestsInSeparateProcesses;

/**
 * Self-check test suite.
 *
 * @runTestsInSeparateProcesses
 * @preserveGlobalState disabled
 */
#[RunTestsInSeparateProcesses]
#[PreserveGlobalState( false )]
final class WafSelfCheckTest extends PHPUnit\Framework\TestCase {

	/**
	 * Start like a site with the firewall off, whose WAF constants aren't defined yet.
	 */
	protected function setUp(): void {
		$dir = sys_get_temp_dir() . '/jetpack-waf-self-check-' . uniqid();
		mkdir( $dir );
		define( 'WP_CONTENT_DIR', $dir );
	}

	/**
	 * Remove the token file and directories.
	 */
	protected function tearDown(): void {
		foreach ( glob( WP_CONTENT_DIR . '/jetpack-waf/*' ) as $file ) {
			unlink( $file );
		}
		foreach ( glob( WP_CONTENT_DIR . '/*' ) as $dir ) {
			rmdir( $dir );
		}
		rmdir( WP_CONTENT_DIR );
		unset( $_GET[ Waf_Self_Check::QUERY_PARAM ] );
	}

	public function testTokenIsAcceptedOnlyOnce() {
		$token = Waf_Self_Check::create_token();

		$this->assertTrue( Waf_Self_Check::consume_token( $token ) );
		$this->assertFalse( Waf_Self_Check::consume_token( $token ) );
	}

	public function testWrongTokenIsRejectedWithoutSpendingTheRealOne() {
		$token = Waf_Self_Check::create_token();

		$this->assertFalse( Waf_Self_Check::consume_token( 'not-the-token' ) );
		$this->assertTrue( Waf_Self_Check::consume_token( $token ) );
	}

	public function testExpiredTokenIsRejected() {
		$token = Waf_Self_Check::create_token( -1 );

		$this->assertFalse( Waf_Self_Check::consume_token( $token ) );
	}

	public function testTokenIsRejectedWhenNoneWasCreated() {
		$this->assertFalse( Waf_Self_Check::consume_token( 'anything' ) );
	}

	public function testRequestWithTheTokenIsBlocked() {
		$_GET[ Waf_Self_Check::QUERY_PARAM ] = Waf_Self_Check::create_token();

		$waf = $this->createMock( Waf_Runtime::class );
		$waf->expects( $this->once() )
			->method( 'block' )
			->with( 'block', (string) Waf_Self_Check::RULE_ID, Waf_Self_Check::REASON );

		Waf_Self_Check::maybe_block( $waf );
	}

	public function testRequestWithoutAValidTokenIsNotBlocked() {
		Waf_Self_Check::create_token();
		$_GET[ Waf_Self_Check::QUERY_PARAM ] = 'guess';

		$waf = $this->createMock( Waf_Runtime::class );
		$waf->expects( $this->never() )->method( 'block' );

		Waf_Self_Check::maybe_block( $waf );
	}
}
