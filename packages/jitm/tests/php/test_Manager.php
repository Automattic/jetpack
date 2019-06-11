<?php

namespace Automattic\Jetpack;

use Automattic\Jetpack\JITM;
use phpmock\functions\FunctionProvider;
use phpmock\Mock;
use phpmock\MockBuilder;
use PHPUnit\Framework\TestCase;

class Test_Jetpack_JITM extends TestCase {
	public function setUp() {
		$builder = new MockBuilder();
		$builder->setNamespace( __NAMESPACE__ )
			->setName( 'add_action' )
			->setFunction( function() {} );
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
