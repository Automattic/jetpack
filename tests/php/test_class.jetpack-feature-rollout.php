<?php

require_once dirname( __FILE__ ) . '/../../class.jetpack-feature-rollout.php';

// Extend with a public constructor so we can test
class MockJetpackFeatureRollout extends Jetpack_Feature_Rollout  {
	public function __construct() {
	}
}

class WP_Test_Jetpack_Feature_Rollout extends WP_UnitTestCase {
	function setUp() {
		delete_transient( Jetpack_Feature_Rollout::JETPACK_FEATURES_TRANSIENT_NAME );
		delete_option( 'jetpack_' . Jetpack_Feature_Rollout::JETPACK_FEATURES_OPTION_NAME );
	}

	function get_stub( $return_value ) {
		// Create a stub for the SomeClass class.
		$stub = $this->getMockBuilder( 'MockJetpackFeatureRollout' )
			->setMethods( array( 'fetch_features_from_wpcom', 'should_load' ) )
			->disableOriginalConstructor()
			->getMock();

		$stub->expects( $this->any() )
			->method( 'fetch_features_from_wpcom' )
			->will( $this->returnValue( $return_value ) );

		$stub->expects( $this->any() )
			->method( 'should_load' )
			->will( $this->returnValue( true ) );

		return $stub;
	}

	function test_features_initializes_to_false_if_errored_and_never_fetched() {
		$stub = $this->get_stub( $this->__get_features_wp_errored() );

		$this->assertNull( $stub->get_features() );
		$stub->wordpress_init();
		$this->assertFalse( $stub->get_features() );
	}

	function test_features_doesnt_change_if_404() {
		$initial = array(
			'idc' => true,
			'sync_via_shutdown' => true
		);
		update_option( 'jetpack_' . Jetpack_Feature_Rollout::JETPACK_FEATURES_OPTION_NAME, $initial );

		$stub = $this->get_stub( $this->__get_features_wp_errored() );

		$this->assertNull( $stub->get_features() );
		$stub->wordpress_init();
		$this->assertSame( $initial, $stub->get_features() );
	}

	function test_features_updates_when_successful() {
		$initial = array(
			'idc' => false,
			'sync_via_shutdown' => true
		);
		update_option( 'jetpack_' . Jetpack_Feature_Rollout::JETPACK_FEATURES_OPTION_NAME, $initial );

		$stub = $this->get_stub( $this->__get_features_successful() );
		$stub->wordpress_init();

		$this->assertSame(
			array( 'idc'=> true, 'sync_via_shutdown' => true ),
			$stub->get_features()
		);
	}

	function test_features_doesnt_fetch_if_transient_not_timed_out() {
		$initial = array(
			'idc' => true,
			'sync_via_shutdown' => true
		);
		update_option( 'jetpack_' . Jetpack_Feature_Rollout::JETPACK_FEATURES_OPTION_NAME, $initial );
		set_transient( Jetpack_Feature_Rollout::JETPACK_FEATURES_TRANSIENT_NAME, '1', HOUR_IN_SECONDS );

		$stub = $this->get_stub( $this->__get_features_only_sync_via_shutdown() );

		$stub->wordpress_init();
		$this->assertSame( $initial, $stub->get_features() );
	}

	function test_features_is_enabled_returns_false_if_feature_not_set() {
		$stub = $this->get_stub( $this->__get_features_successful() );
		$stub->update_features_option_and_transient();
		$this->assertFalse( $stub->is_enabled( 'foo' ) );

		$this->setUp();

		$stub->expects( $this->any() )
			->method( 'fetch_features_from_wpcom' )
			->will( $this->returnValue( $this->__get_features_wp_errored() ) );

		$stub->update_features_option_and_transient();
		$this->assertTrue( $stub->is_enabled( 'idc' ) );
	}

	function test_features_is_enabled_returns_false_if_features_set_and_disabled() {
		$stub = $this->get_stub( $this->__get_features_only_sync_via_shutdown() );

		$stub->update_features_option_and_transient();
		$this->assertFalse( $stub->is_enabled( 'idc' ) );
	}

	function test_features_is_enabled_returns_true_if_features_set_and_enabled() {
		$stub = $this->get_stub( $this->__get_features_only_sync_via_shutdown() );

		$stub->update_features_option_and_transient();
		$this->assertTrue( $stub->is_enabled( 'sync_via_shutdown' ) );
	}

	function __get_features_successful() {
		return array(
			'idc'               => true,
			'sync_via_shutdown' => true
		);
	}

	function __get_features_only_sync_via_shutdown() {
		return array(
			'idc'               => false,
			'sync_via_shutdown' => true
		);
	}

	function __get_features_wp_errored() {
		return new WP_Error( 'get_features_failed' );
	}
}
