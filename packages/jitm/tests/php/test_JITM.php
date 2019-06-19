<?php

namespace Automattic\Jetpack;

use Automattic\Jetpack\JITM;
use phpmock\functions\FunctionProvider;
use phpmock\Mock;
use phpmock\MockBuilder;
use PHPUnit\Framework\TestCase;

class Test_Jetpack_JITM extends TestCase {
	public function setUp() {
		$this->mock_add_action();
		$this->mock_do_action();
		$this->mock_wp_register_style();
		$this->mock_plugins_url();
		$this->mock_empty_function( 'wp_style_add_data' );
		$this->mock_empty_function( 'wp_enqueue_style' );
		$this->mock_empty_function( 'wp_enqueue_script' );
		$this->mock_empty_function( 'wp_localize_script' );
		$this->mock_empty_function( 'esc_url_raw' );
		$this->mock_empty_function( 'rest_url' );
		$this->mock_empty_function( 'esc_html__' );
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
			->setFunction( function() {
				global $actions;
				$args = func_get_args();
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

	protected function mock_wp_register_style() {
		$this->mock_empty_function( 'wp_register_style' );
	}

	protected function mock_plugins_url() {
		$this->mock_empty_function( 'plugins_url' );
	}

	protected function mock_empty_function( $name ) {
		$builder = new MockBuilder();
		$builder->setNamespace( __NAMESPACE__ )
			->setName( $name )
			->setFunction( function() {
				// noop
			} );
		$builder->build()->enable();
	}

	public function tearDown() {
		Mock::disableAll();
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

	public function test_prepare_jitms_enqueues_assets() {
		echo "preparing!!\n";
		$jitm = new JITM();
		$screen = new \stdClass();
		$screen->id = 'jetpack_foo';
		$jitm->prepare_jitms( $screen );

		do_action( 'admin_enqueue_scripts' );
	}

	public function test_prepare_jitms_does_not_show_on_some_screens() {
		$jitm = new JITM();
		$screen = new \stdClass();
		$screen->id = 'jetpack_page_stats';
		$jitm->prepare_jitms( $screen );
	}

	protected function mock_filters( $filters ) {
		$this->mocked_filters = $filters;
		$builder = new MockBuilder();
		$builder->setNamespace( __NAMESPACE__ )
			->setName( 'apply_filters' )
			->setFunction(
				function() {
					$current_args = func_get_args();
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
}
