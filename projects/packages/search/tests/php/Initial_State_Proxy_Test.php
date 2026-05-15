<?php
/**
 * Tests for the dashboard Initial_State proxy rollout checks.
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

use Automattic\Jetpack\Constants;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;

/**
 * @covers \Automattic\Jetpack\Search\Initial_State
 */
#[CoversClass( Initial_State::class )]
class Initial_State_Proxy_Test extends TestCase {

	/**
	 * Set up the test.
	 */
	public function setUp(): void {
		parent::setUp();
		require_once __DIR__ . '/proxy-test-functions.php';
	}

	/**
	 * Returning the environment into its initial state.
	 */
	public function tearDown(): void {
		unset( $GLOBALS['jetpack_test_is_automattician'], $GLOBALS['jetpack_test_wpcom_is_proxied_request'] );
		Constants::clear_single_constant( 'A8C_PROXIED_REQUEST' );
		Constants::clear_single_constant( 'AT_PROXIED_REQUEST' );
		Constants::clear_single_constant( 'ATOMIC_CLIENT_ID' );

		parent::tearDown();
	}

	/**
	 * Test that the AI Agent Access toggle is unavailable to non-proxied Automatticians.
	 */
	public function test_ai_agent_access_available_ignores_non_proxied_automattician() {
		if ( empty( $GLOBALS['jetpack_test_controls_is_automattician'] ) ) {
			$this->markTestSkipped( 'The is_automattician() helper is already defined.' );
		}

		$GLOBALS['jetpack_test_is_automattician'] = true;
		wp_set_current_user( $this->admin_id );

		$state = ( new Initial_State() )->get_initial_state();

		$this->assertFalse( $state['siteData']['aiAgentAccessAvailable'] );
	}

	/**
	 * Test that the AI Agent Access toggle is available on WPCOM proxied requests.
	 */
	public function test_ai_agent_access_available_reflects_wpcom_proxy_helper() {
		if ( empty( $GLOBALS['jetpack_test_controls_wpcom_is_proxied_request'] ) ) {
			$this->markTestSkipped( 'The wpcom_is_proxied_request() helper is already defined.' );
		}

		$GLOBALS['jetpack_test_wpcom_is_proxied_request'] = true;

		$state = ( new Initial_State() )->get_initial_state();

		$this->assertTrue( $state['siteData']['aiAgentAccessAvailable'] );
	}

	/**
	 * Test that the AI Agent Access toggle is available on allowed Atomic proxy clients.
	 *
	 * @dataProvider allowed_atomic_client_id_provider
	 *
	 * @param int $client_id Atomic client ID.
	 */
	#[DataProvider( 'allowed_atomic_client_id_provider' )]
	public function test_ai_agent_access_available_reflects_allowed_atomic_proxy_client( $client_id ) {
		Constants::set_constant( 'AT_PROXIED_REQUEST', true );
		Constants::set_constant( 'ATOMIC_CLIENT_ID', $client_id );

		$state = ( new Initial_State() )->get_initial_state();

		$this->assertTrue( $state['siteData']['aiAgentAccessAvailable'] );
	}

	/**
	 * Allowed Atomic client IDs.
	 *
	 * @return array<string,array<int,int>>
	 */
	public static function allowed_atomic_client_id_provider() {
		return array(
			'wpcom'     => array( 1 ),
			'atomic'    => array( 2 ),
			'pressable' => array( 3 ),
			'commerce'  => array( 32 ),
			'ciab'      => array( 118 ),
		);
	}
}
