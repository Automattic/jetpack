<?php
/**
 * Self-check test suite.
 *
 * @package automattic/jetpack-waf
 */

use Automattic\Jetpack\Waf\Waf_Constants;
use Automattic\Jetpack\Waf\Waf_Runtime;
use Automattic\Jetpack\Waf\Waf_Self_Check;
use PHPUnit\Framework\Attributes\DataProvider;
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
		foreach ( glob( WP_CONTENT_DIR . '/jetpack-waf/rules/*' ) as $file ) {
			unlink( $file );
		}
		foreach ( glob( WP_CONTENT_DIR . '/jetpack-waf/*' ) as $file ) {
			is_dir( $file ) ? rmdir( $file ) : unlink( $file );
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

	public function testNewTokenReplacesTheOld() {
		$old = Waf_Self_Check::create_token();
		$new = Waf_Self_Check::create_token();

		$this->assertFalse( Waf_Self_Check::consume_token( $old ) );
		$this->assertTrue( Waf_Self_Check::consume_token( $new ) );
	}

	public function testTokenThatIsNotAStringIsRejectedWithoutSpendingTheRealOne() {
		$token = Waf_Self_Check::create_token();

		$this->assertFalse( Waf_Self_Check::consume_token( array( $token ) ) );
		$this->assertTrue( Waf_Self_Check::consume_token( $token ) );
	}

	public function testTokenFileStillBeingWrittenIsLeftInPlace() {
		Waf_Self_Check::create_token();
		file_put_contents( JETPACK_WAF_DIR . Waf_Self_Check::TOKEN_FILE, '{"hash":"ab' );

		$this->assertFalse( Waf_Self_Check::consume_token( 'anything' ) );
		$this->assertFileExists( JETPACK_WAF_DIR . Waf_Self_Check::TOKEN_FILE );
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

	/**
	 * The firewall's rules stop at the allow list, so a test from an allowed address isn't blocked either.
	 *
	 * @dataProvider provideAllowListStates
	 *
	 * @param string $entrypoint  The rules entrypoint's contents.
	 * @param bool   $ip_matches  Whether the request's IP is on the list.
	 * @param bool   $should_block Whether the test request is blocked.
	 */
	#[DataProvider( 'provideAllowListStates' )]
	public function testAllowListedRequestIsLetThrough( $entrypoint, $ip_matches, $should_block ) {
		$_GET[ Waf_Self_Check::QUERY_PARAM ] = Waf_Self_Check::create_token();
		Waf_Constants::define_entrypoint();
		mkdir( JETPACK_WAF_DIR . '/rules' );
		file_put_contents( JETPACK_WAF_DIR . '/rules/rules.php', $entrypoint );
		file_put_contents( JETPACK_WAF_DIR . '/rules/allow-ip.php', "<?php\nreturn \$waf->is_ip_in_array( array( '203.0.113.7' ) );\n" );

		$waf = $this->createMock( Waf_Runtime::class );
		$waf->method( 'is_ip_in_array' )->willReturn( $ip_matches );
		$waf->expects( $should_block ? $this->once() : $this->never() )->method( 'block' );

		Waf_Self_Check::maybe_block( $waf );
	}

	/**
	 * The dashboard tells "allowed" from "not running" by this header alone.
	 */
	public function testAllowListedRequestSaysWhyItWasLetThrough() {
		require_once __DIR__ . '/functions-headers.php';
		$_GET[ Waf_Self_Check::QUERY_PARAM ] = Waf_Self_Check::create_token();
		Waf_Constants::define_entrypoint();
		mkdir( JETPACK_WAF_DIR . '/rules' );
		file_put_contents( JETPACK_WAF_DIR . '/rules/rules.php', "<?php\nrequire( '/x/rules/allow-ip.php' );\n" );
		file_put_contents( JETPACK_WAF_DIR . '/rules/allow-ip.php', "<?php\nreturn true;\n" );

		Waf_Self_Check::maybe_block( $this->createStub( Waf_Runtime::class ) );

		$this->assertSame( array( 'X-JetpackWAF-Test-Allowed: ip allow list' ), $GLOBALS['jetpack_waf_test_headers'] );
	}

	/**
	 * Data provider for testAllowListedRequestIsLetThrough.
	 *
	 * @return array
	 */
	public static function provideAllowListStates() {
		$with_allow_list = "<?php\nif ( file_exists( '/x/rules/allow-ip.php' ) ) { if ( require( '/x/rules/allow-ip.php' ) ) { return; } }\n";

		return array(
			'allowed address'       => array( $with_allow_list, true, false ),
			'other address'         => array( $with_allow_list, false, true ),
			'allow list turned off' => array( "<?php\n", true, true ),
		);
	}
}
