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
	 * Point the WAF at an empty directory.
	 */
	protected function setUp(): void {
		$dir = sys_get_temp_dir() . '/jetpack-waf-self-check-' . uniqid();
		mkdir( $dir );
		define( 'JETPACK_WAF_DIR', $dir );
	}

	/**
	 * Remove the token file and directory.
	 */
	protected function tearDown(): void {
		array_map( 'unlink', glob( JETPACK_WAF_DIR . '/*' ) );
		rmdir( JETPACK_WAF_DIR );
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
			->with( 'block', Waf_Self_Check::RULE_ID, Waf_Self_Check::REASON );

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
