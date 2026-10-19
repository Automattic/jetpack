<?php
/**
 * Self-check integration tests.
 *
 * @package automattic/jetpack-waf
 */

use Automattic\Jetpack\Waf\Waf_Constants;
use Automattic\Jetpack\Waf\Waf_Rules_Manager;
use Automattic\Jetpack\Waf\Waf_Runtime;
use Automattic\Jetpack\Waf\Waf_Self_Check;
use PHPUnit\Framework\Attributes\DataProvider;

/**
 * Integration tests for the self-check against the rules the firewall generates.
 */
final class WafSelfCheckIntegrationTest extends WorDBless\BaseTestCase {

	/**
	 * Remove the token from the request.
	 */
	protected function tear_down() {
		unset( $_GET[ Waf_Self_Check::QUERY_PARAM ] );
		parent::tear_down();
	}

	/**
	 * The self-check reads the generated entrypoint to tell whether the allow list is on, so it must recognise it.
	 *
	 * @dataProvider provideAllowListStates
	 *
	 * @param bool $allow_list_enabled Whether the IP allow list is turned on.
	 * @param bool $should_block       Whether the test request from an allowed address is blocked.
	 */
	#[DataProvider( 'provideAllowListStates' )]
	public function testTheGeneratedRulesDecideWhetherTheAllowListApplies( $allow_list_enabled, $should_block ) {
		Waf_Constants::initialize_constants();
		update_option( Waf_Rules_Manager::IP_ALLOW_LIST_OPTION_NAME, '203.0.113.7' );
		update_option( Waf_Rules_Manager::IP_ALLOW_LIST_ENABLED_OPTION_NAME, $allow_list_enabled );
		Waf_Rules_Manager::generate_ip_rules();
		Waf_Rules_Manager::generate_rules();
		$_GET[ Waf_Self_Check::QUERY_PARAM ] = Waf_Self_Check::create_token();

		$waf = $this->createMock( Waf_Runtime::class );
		$waf->method( 'is_ip_in_array' )->willReturn( true );
		$waf->expects( $should_block ? $this->once() : $this->never() )->method( 'block' );

		Waf_Self_Check::maybe_block( $waf );
	}

	/**
	 * Data provider for testTheGeneratedRulesDecideWhetherTheAllowListApplies.
	 *
	 * @return array
	 */
	public static function provideAllowListStates() {
		return array(
			'allow list on'  => array( true, false ),
			'allow list off' => array( false, true ),
		);
	}
}
