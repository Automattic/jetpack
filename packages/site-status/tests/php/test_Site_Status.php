<?php

namespace Automattic\Jetpack;

use Automattic\Jetpack\Site_Status;
use PHPUnit\Framework\TestCase;
use phpmock\Mock;
use phpmock\MockBuilder;

class Test_Manager extends TestCase {
	private $site_url = 'https://yourjetpack.blog';

	public function tearDown() {
		Mock::disableAll();
	}

	public function test_is_development_mode_default() {
		$this->mock_function( 'site_url', $this->site_url );
		$this->mock_filters();

		$this->assertFalse( Site_Status::is_development_mode() );

		$this->clear_mock_filters();
	}

	public function test_is_development_mode_filter() {
		$this->mock_function( 'site_url', $this->site_url );
		$this->mock_filters( array(
			array( 'jetpack_development_mode', false, true ),
		) );

		$this->assertTrue( Site_Status::is_development_mode() );

		$this->clear_mock_filters();
	}

	public function test_is_development_mode_bool() {
		$this->mock_function( 'site_url', $this->site_url );
		$this->mock_filters( array(
			array( 'jetpack_development_mode', false, 0 ),
		) );

		$this->assertFalse( Site_Status::is_development_mode() );
		
		$this->clear_mock_filters();
	}

	protected function mock_filters( $filters = array() ) {
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

	protected function mock_function( $function_name, $return_value = null ) {
		$builder = new MockBuilder();
		$builder->setNamespace( __NAMESPACE__ )
			->setName( $function_name )
			->setFunction( function() use ( &$return_value ) {
				return $return_value;
			} );
		return $builder->build()->enable();
	}
}
