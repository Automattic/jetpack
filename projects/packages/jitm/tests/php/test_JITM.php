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

		// mock the static method and return a dummy value
		$mockAssets
			->shouldReceive( 'get_file_url_for_environment' )
			->andReturn( 'the_file_url' );

		$jitm = new JITM();
		$screen = (object) array( 'id' => 'jetpack_foo' ); // fake screen object
		$jitm->prepare_jitms( $screen );

		// Assert the action was added
		$this->assertNotFalse( has_action( 'admin_enqueue_scripts', array( $jitm, 'jitm_enqueue_files' ) ) );

		// Set up mocks for a bunch of methods called by the hook.
		Functions\expect( 'plugins_url' )->once()->andReturn( 'the_plugin_url' );
		Functions\when( 'esc_url_raw' )->justReturn( '' );
		Functions\when( 'esc_html__' )->justReturn( '' );
		Functions\when( 'wp_create_nonce' )->justReturn( '' );
		Functions\when( 'rest_url' )->justReturn( '' );
		Functions\expect( 'wp_register_style' )->once()->with(
			'jetpack-jitm-css',
			'the_plugin_url',
			false,
			\Mockery::type( 'string' )
		);
		Functions\expect( 'wp_style_add_data' )->with(
			'jetpack-jitm-css',
			\Mockery::type( 'string' ),
			\Mockery::type( 'string' )
		);
		Functions\expect( 'wp_enqueue_style' )->once()->with( 'jetpack-jitm-css' );
		Functions\expect( 'wp_enqueue_script' )->once()->with(
			'jetpack-jitm-new',
			'the_file_url',
			array( 'jquery' ),
			JITM::PACKAGE_VERSION,
			true
		);
		Functions\expect( 'wp_localize_script' )->once()->with(
			'jetpack-jitm-new',
			'jitm_config',
			\Mockery::type( 'array' )
		);

		// Do the action that we asserted was added.
		$jitm->jitm_enqueue_files();
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

}
