<?php  // phpcs:disable

namespace Automattic\Jetpack;

use Automattic\Jetpack\JITMS\JITM;
use Automattic\Jetpack\JITMS\Pre_Connection_JITM;
use Brain\Monkey;
use Brain\Monkey\Actions;
use Brain\Monkey\Filters;
use Brain\Monkey\Functions;
use Mockery\Adapter\Phpunit\MockeryPHPUnitIntegration;
use PHPUnit\Framework\TestCase;

class Test_Jetpack_JITM extends TestCase {
	use MockeryPHPUnitIntegration;

	/**
	 * Set up.
	 *
	 * @before
	 */
	public function set_up() {
		Monkey\setUp();

		Functions\when( 'get_current_blog_id' )->justReturn( 1 );
		Functions\when( 'get_current_screen' )->justReturn( new \stdClass() );
		Functions\when( 'site_url' )->justReturn( 'unit-test' );
		Functions\when( 'wp_get_environment_type' )->justReturn( '' );
		Functions\when( 'current_user_can' )->justReturn( true );
	}

	/**
	 * Tear down.
	 *
	 * @after
	 */
	public function tear_down() {
		Monkey\tearDown();
	}

	public function test_jitm_enabled_by_default() {
		Functions\expect( 'apply_filters' )
			->once()
			->with(	'jetpack_just_in_time_msgs', true )
			->andReturn( true );

		$jitm = new JITM();
		$this->assertTrue( $jitm->jitms_enabled() );
	}

	public function test_jitm_disabled_by_filter() {
		Functions\expect( 'apply_filters' )
			->once()
			->with( 'jetpack_just_in_time_msgs', true )
			->andReturn( false );

		$jitm = new JITM();
		$this->assertFalse( $jitm->jitms_enabled() );
	}

	/**
	 * This is an example of a test which uses Mockery to tests a class static method.
	 *
	 * It requires the runInSeparateProcess tag so that the class isn't already autoloaded.
	 *
	 * @runInSeparateProcess
	 */
	public function test_prepare_jitms_enqueues_assets() {
		$mockAssets = \Mockery::mock( 'alias:Automattic\Jetpack\Assets' );

		// Assume we're on a Jetpack page.
		$screen_id = 'jetpack_foo';
		get_current_screen()->id = $screen_id;

		// mock the static method and return a dummy value
		$mockAssets
			->shouldReceive( 'register_script' )
			->withSomeOfArgs( 'jetpack-jitm', '../build/index.js' )
			->once();

		$jitm = new JITM();
		$screen = (object) array( 'id' => $screen_id ); // fake screen object
		$jitm->prepare_jitms( $screen );

		// Set up mocks for a bunch of methods called by the hook.
		Functions\when( 'esc_url_raw' )->justReturn( '' );
		Functions\when( 'esc_html__' )->justReturn( '' );
		Functions\when( 'wp_create_nonce' )->justReturn( '' );
		Functions\when( 'rest_url' )->justReturn( '' );

		Functions\expect( 'wp_localize_script' )->once()->with(
			'jetpack-jitm',
			'jitm_config',
			\Mockery::type( 'array' )
		);

		// Do the action that we asserted was added.
		$jitm->jitm_enqueue_files();
	}

	/**
	 * Test to ensure that the JITM is not enqueued on non-A8C admin pages.
	 *
	 * @dataProvider data_test_is_a8c_admin_page
	 *
	 * @param string $screen_id The screen ID to test.
	 * @param bool   $expected  Whether the JITM should be enqueued.
	 */
	public function test_is_a8c_admin_page( $screen_id, $expected ) {
		$jitm = new JITM();

		get_current_screen()->id = $screen_id;
		$this->assertSame( $expected, $jitm->is_a8c_admin_page() );
	}

	/**
	 * Test that the jetpack_registered_jitms action in JITM::register
	 * is fired only once, regardless of how many times the JITM::register
	 * method is called.
	 */
	public function test_register_jitm_action_fires_once() {
		Functions\expect( 'get_option' )
			->with( 'id' )
			->andReturn( 123 );

		Filters\expectApplied( 'jetpack_is_local_site' )
			->andReturn( false);

		Actions\expectAdded( 'current_screen' );
		JITM::configure();
		$this->assertSame( 1, did_action( 'jetpack_registered_jitms' ) );

		// The current_screen action callback should be added only once.
		Actions\expectAdded( 'current_screen' )->never();
		JITM::configure();
		// The jetpack_registered_jitms action should fire only once.
		$this->assertSame( 1, did_action( 'jetpack_registered_jitms' ) );
	}

	/**
	 * Test data to ensure we enqueue the JITM scripts only on specific screens.
	 *
	 * @return array
	 */
	public function data_test_is_a8c_admin_page() {
		return array(
			'Jetpack main dashboard'         => array( 'toplevel_page_jetpack', true ),
			'Jetpack about page'             => array( 'admin_page_jetpack_about', true ),
			'My Jetpack'                     => array( 'jetpack_page_my-jetpack', true ),
			'Posts List'                     => array( 'edit-post', false ),
			'Main dashboard'                 => array( 'dashboard', false ),
			'WooCommerce admin page'         => array( 'woocommerce_page_wc-admin', true ),
			'WooCommerce order management'   => array( 'edit-shop_order', true ),
			'WooCommerce product management' => array( 'edit-product', true ),
		);
	}
}
