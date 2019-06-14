<?php

namespace Automattic\Jetpack;

use Automattic\Jetpack\Status;
use PHPUnit\Framework\TestCase;
use phpmock\Mock;
use phpmock\MockBuilder;

class Test_Status extends TestCase {
	private $site_url = 'https://yourjetpack.blog';

	public function tearDown() {
		Mock::disableAll();
	}

	/**
	 * @covers Automattic\Jetpack::is_development_mode
	 */
	public function test_is_development_mode_default() {
		$this->mock_function( 'site_url', $this->site_url );
		$filters_mock = $this->mock_filters( array(
			array( 'jetpack_development_mode', false, false ),
			array( 'jetpack_development_mode', true, true ),
		) );

		$this->assertFalse( Status::is_development_mode() );

		$filters_mock->disable();
	}

	/**
	 * @covers Automattic\Jetpack::is_development_mode
	 */
	public function test_is_development_mode_filter_true() {
		$this->mock_function( 'site_url', $this->site_url );
		$filters_mock = $this->mock_filters( array(
			array( 'jetpack_development_mode', false, true ),
		) );

		$this->assertTrue( Status::is_development_mode() );

		$filters_mock->disable();
	}

	/**
	 * @covers Automattic\Jetpack::is_development_mode
	 */
	public function test_is_development_mode_filter_bool() {
		$this->mock_function( 'site_url', $this->site_url );
		$filters_mock = $this->mock_filters( array(
			array( 'jetpack_development_mode', false, 0 ),
		) );

		$this->assertFalse( Status::is_development_mode() );
		
		$filters_mock->disable();
	}

	/**
	 * @covers Automattic\Jetpack::is_development_mode
	 */
	public function test_is_development_mode_localhost() {
		$this->mock_function( 'site_url', 'localhost' );
		
		$filters_mock = $this->mock_filters( array(
			array( 'jetpack_development_mode', false, false ),
			array( 'jetpack_development_mode', true, true ),
		) );

		$this->assertTrue( Status::is_development_mode() );

		$filters_mock->disable();
	}

    /**
     * @covers Automattic\Jetpack::is_development_mode
     *
     * @runInSeparateProcess
     */	
	public function test_is_development_mode_constant() {
		$this->mock_function( 'site_url', $this->site_url );
		$filters_mock = $this->mock_filters( array(
			array( 'jetpack_development_mode', false, false ),
			array( 'jetpack_development_mode', true, true ),
		) );
		$constants_mocks = $this->mock_constants( array(
			array( '\\JETPACK_DEV_DEBUG', true ),
		) );

		$this->assertTrue( Status::is_development_mode() );

		array_map( function( $mock ) {
			$mock->disable();
		}, $constants_mocks );
		$filters_mock->disable();
	}

	protected function mock_function_with_args( $function_name, $args = array() ) {
		$builder = new MockBuilder();
		$builder->setNamespace( __NAMESPACE__ )
			->setName( $function_name )
			->setFunction(
				function() use ( &$args ) {
					$current_args = func_get_args();

					foreach ( $args as $arg ) {
						if ( array_slice( $arg, 0, -1 ) === $current_args ) {
							return array_pop( $arg );
						}
					}
				}
			);

		$mock = $builder->build();
		$mock->enable();

		return $mock;
	}

	protected function mock_filters( $filters = array() ) {
		return $this->mock_function_with_args( 'apply_filters', $filters );
	}

	protected function mock_constants( $constants = array() ) {
		$prepare_constant = function( $constant ) {
			return array( $constant[0], true );
		};

		return [
			$this->mock_function_with_args( 'defined', array_map( $prepare_constant, $constants ) ),
			$this->mock_function_with_args( 'constant', $constants )
		];
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
