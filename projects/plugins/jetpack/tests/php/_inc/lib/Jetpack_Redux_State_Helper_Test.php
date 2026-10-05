<?php
/**
 * Redux State Helper unit tests.
 *
 * @package automattic/jetpack
 */

use PHPUnit\Framework\Attributes\CoversClass;

require_once JETPACK__PLUGIN_DIR . '_inc/lib/admin-pages/class-jetpack-redux-state-helper.php';

/**
 * Class for testing the Jetpack_Redux_State_Helper class.
 *
 * @covers \Jetpack_Redux_State_Helper
 */
#[CoversClass( Jetpack_Redux_State_Helper::class )]
class Jetpack_Redux_State_Helper_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Theme features.
	 *
	 * @var array
	 */
	private $theme_features;

	/**
	 * Saving the original theme features.
	 */
	public function set_up() {
		parent::set_up();

		global $_wp_theme_features;
		$this->theme_features = $_wp_theme_features;
	}

	/**
	 * Restoring the original theme features.
	 */
	public function tear_down() {
		global $_wp_theme_features;

		$_wp_theme_features = $this->theme_features;
		unset( $_SERVER['A8C_PROXIED_REQUEST'] );
		Jetpack_Options::delete_option( array( 'id', 'user_tokens' ) );
		parent::tear_down();
	}

	/**
	 * Tests whether get_initial_state() signals that the theme supports widgets.
	 */
	public function test_theme_support_widgets() {
		add_theme_support( 'widgets' );

		$redux_state = Jetpack_Redux_State_Helper::get_initial_state();
		$this->assertSame( true, $redux_state['themeData']['support']['widgets'] );
	}

	/**
	 * Tests whether get_initial_state() signals that the theme does not support widgets.
	 */
	public function test_theme_do_not_support_widgets() {
		_remove_theme_support( 'widgets' );

		$redux_state = Jetpack_Redux_State_Helper::get_initial_state();
		$this->assertSame( false, $redux_state['themeData']['support']['widgets'] );
	}

	/**
	 * The initial state reports the effective AI state through the same gate
	 * chain the editor enforces on self-hosted sites.
	 */
	public function test_ai_effectively_enabled_reflects_the_ai_gates() {
		$redux_state = Jetpack_Redux_State_Helper::get_initial_state();

		$this->assertFalse( $redux_state['isAiEnabled'], 'The inactive ai module reads as master off.' );
	}

	/**
	 * The removed dashboard's keys are no longer built.
	 */
	public function test_initial_state_omits_the_removed_dashboard_keys() {
		$state = Jetpack_Redux_State_Helper::get_initial_state();

		foreach ( array( 'products', 'recommendationsStep', 'jetpackManage', 'hasSeenWCConnectionModal', 'newRecommendations', 'isWooCommerceActive', 'partnerCoupon' ) as $key ) {
			$this->assertArrayNotHasKey( $key, $state );
		}
		$this->assertArrayNotHasKey( 'showRecommendations', $state['siteData'] );
		$this->assertArrayNotHasKey( 'latestBoostSpeedScores', $state['siteData'] );
	}

	/**
	 * A registered site with no connected user reports its blog ID and no user.
	 */
	public function test_plugins_page_state_for_a_site_without_a_connected_user() {
		Jetpack_Options::update_option( 'id', 1234 );

		$state = Jetpack_Redux_State_Helper::get_plugins_page_state();

		$this->assertArrayHasKey( 'WP_API_nonce', $state );
		$this->assertSame(
			array(
				'siteId'                 => 1234,
				'hasConnectedUser'       => false,
				'isCurrentUserConnected' => false,
			),
			$state['pluginDeactivation']
		);
	}

	/**
	 * A site with a connected user says so, and whether the current user is that user.
	 */
	public function test_plugins_page_state_for_a_site_with_a_connected_user() {
		$user_id = wp_insert_user(
			array(
				'user_login' => 'connected_admin',
				'user_pass'  => 'password',
				'role'       => 'administrator',
			)
		);
		Jetpack_Options::update_option( 'id', 1234 );
		Jetpack_Options::update_option( 'user_tokens', array( $user_id => "dummy.usertoken.$user_id" ) );

		$state = Jetpack_Redux_State_Helper::get_plugins_page_state();
		$this->assertTrue( $state['pluginDeactivation']['hasConnectedUser'] );
		$this->assertFalse( $state['pluginDeactivation']['isCurrentUserConnected'] );

		wp_set_current_user( $user_id );
		$state = Jetpack_Redux_State_Helper::get_plugins_page_state();
		$this->assertTrue( $state['pluginDeactivation']['isCurrentUserConnected'] );
	}

	/**
	 * A site that never registered has no blog ID to send.
	 */
	public function test_plugins_page_state_for_an_unregistered_site() {
		$state = Jetpack_Redux_State_Helper::get_plugins_page_state();

		$this->assertSame( 0, $state['pluginDeactivation']['siteId'] );
	}
}
