<?php

namespace Automattic\Jetpack;

use Automattic\Jetpack\JITM;
use phpmock\Mock;
use phpmock\MockBuilder;
use PHPUnit\Framework\TestCase;

class Test_Jetpack_JITM extends TestCase {
	public function setUp() {
		$this->mock_add_action();
		$this->mock_do_action();
		$this->mock_wp_enqueue_script();

		// input/output of these functions doesn't matter right now, they just need to exist
		$this->mock_empty_function( 'wp_register_style' );
		$this->mock_empty_function( 'plugins_url' );
		$this->mock_empty_function( 'wp_style_add_data' );
		$this->mock_empty_function( 'wp_enqueue_style' );
		$this->mock_empty_function( 'wp_localize_script' );
		$this->mock_empty_function( 'esc_url_raw' );
		$this->mock_empty_function( 'rest_url' );
		$this->mock_empty_function( 'esc_html__' );
	}

	public function tearDown() {
		Mock::disableAll();
		\Mockery::close();
		$this->clear_added_actions();
		$this->clear_enqueued_scripts();
	}

	public function test_jitm_disabled_by_filter() {
		$this->mock_filters( array(
			array( 'jetpack_just_in_time_msgs', false, false ),
		) );

		$jitm = new JITM();
		$this->assertFalse( $jitm->register() );

		$this->clear_mock_filters();
	}

	public function test_jitm_enabled_by_default() {
		$this->mock_filters( array(
			array( 'jetpack_just_in_time_msgs', false, true ),
		) );

		$jitm = new JITM();
		$this->assertTrue( $jitm->register() );

		$this->clear_mock_filters();
	}

	/**
	 * This is an example of a test which uses Mockery to tests a class static method.
	 *
	 * It requires the runInSeparateProcess tag so that the class isn't already autoloaded.
	 *
	 * @runInSeparateProcess
	 */
	public function test_prepare_jitms_enqueues_assets() {
		$mockAssets = \Mockery::mock('alias:Automattic\Jetpack\Assets');

		// mock the static method and return a dummy value
		$mockAssets
			->shouldReceive('get_file_url_for_environment')
			->andReturn('the_file_url');

		$jitm = new JITM();
		$screen = (object) array( 'id' => 'jetpack_foo' ); // fake screen object
		$jitm->prepare_jitms( $screen );

		// this should enqueue a jetpack-jitm-new script
		do_action( 'admin_enqueue_scripts' );

		// assert our script was enqueued with the right value
		$script = $this->get_enqueued_script( 'jetpack-jitm-new' );

		$this->assertEquals( 'the_file_url', $script['src'] );
	}

	/*
	public function test_prepare_jitms_does_not_show_on_some_screens() {
		$jitm = new JITM();
		$screen = new \stdClass();
		$screen->id = 'jetpack_page_stats';
		$jitm->prepare_jitms( $screen );
	}
	*/

	protected function mock_filters( $filters ) {
		$this->mocked_filters = $filters;
		$builder = new MockBuilder();
		$builder->setNamespace( __NAMESPACE__ )
			->setName( 'apply_filters' )
			->setFunction(
				function( ...$current_args ) {
					foreach ( $this->mocked_filters as $filter ) {
						if ( array_slice( $filter, 0, -1 ) === $current_args ) {
							return array_pop( $filter );
						}
					}
				}
			);
		$this->apply_filters_mock = $builder->build();
		$this->apply_filters_mock->enable();
	}

	protected function clear_mock_filters() {
		$this->apply_filters_mock->disable();
		unset( $this->mocked_filters );
	}

	protected function mock_add_action() {
		$builder = new MockBuilder();
		$builder->setNamespace( __NAMESPACE__ )
			->setName( 'add_action' )
			->setFunction( function( $name, $callable ) {
				global $actions;

				if ( is_null( $actions ) ) {
					$actions = array();
				}

				// don't worry about precedence for now
				if ( ! isset( $actions[$name] ) ) {
					$actions[$name] = array();
				}

				$actions[$name][] = $callable;
			} );
		$builder->build()->enable();
	}

	protected function mock_do_action() {
		$builder = new MockBuilder();
		$builder->setNamespace( __NAMESPACE__ )
			->setName( 'do_action' )
			->setFunction( function( ...$args ) {
				global $actions;
				$name = array_shift( $args );

				if ( is_null( $actions ) ) {
					$actions = array();
				}

				// don't worry about precedence for now
				if ( ! isset( $actions[$name] ) ) {
					$actions[$name] = array();
				}

				foreach( $actions[$name] as $callable ) {
					call_user_func_array( $callable, $args );
				}
			} );
		$builder->build()->enable();
	}

	protected function mock_wp_enqueue_script() {
		$builder = new MockBuilder();
		$builder->setNamespace( __NAMESPACE__ )
			->setName( 'wp_enqueue_script' )
			->setFunction( function( $handle, $src = '', $deps = array(), $ver = false, $in_footer = false ) {
				global $wp_scripts;

				if ( is_null( $wp_scripts ) ) {
					$wp_scripts = array();
				}

				$wp_scripts[$handle] = compact( 'src', 'deps', 'ver', 'in_footer' );
			} );
		$builder->build()->enable();
	}

	protected function get_enqueued_script( $handle ) {
		global $wp_scripts;
		return isset( $wp_scripts[$handle] ) ? $wp_scripts[$handle] : null;
	}

	protected function clear_added_actions() {
		global $actions;
		$actions = array();
	}

	protected function clear_enqueued_scripts() {
		global $wp_scripts;
		$wp_scripts = array();
	}

	protected function mock_empty_function( $name ) {
		$builder = new MockBuilder();
		$builder->setNamespace( __NAMESPACE__ )
			->setName( $name )
			->setFunction( function() use ( $name ) {
				// echo "Called $name with " . print_r( func_get_args(),1 ) . "\n";
			} );
		$builder->build()->enable();
	}
}
