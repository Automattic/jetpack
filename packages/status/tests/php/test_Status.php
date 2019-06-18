<?php

namespace Automattic\Jetpack;

use Automattic\Jetpack\Status;
use PHPUnit\Framework\TestCase;
use phpmock\Mock;
use phpmock\MockBuilder;

class Test_Status extends TestCase {
	/**
	 * Default site URL.
	 *
	 * @var string
	 */
	private $site_url = 'https://yourjetpack.blog';

	/**
	 * Test setup.
	 */
	public function setUp() {
		$this->status = new Status();
	}

	/**
	 * Test teardown.
	 */
	public function tearDown() {
		Mock::disableAll();
	}

	/**
	 * @covers Automattic\Jetpack\Status::is_development_mode
	 */
	public function test_is_development_mode_default() {
		$this->mock_function( 'site_url', $this->site_url );
		$filters_mock = $this->mock_filters( array(
			array( 'jetpack_development_mode', false, false ),
			array( 'jetpack_development_mode', true, true ),
		) );

		$this->assertFalse( $this->status->is_development_mode() );

		$filters_mock->disable();
	}

	/**
	 * @covers Automattic\Jetpack\Status::is_development_mode
	 */
	public function test_is_development_mode_filter_true() {
		$this->mock_function( 'site_url', $this->site_url );
		$filters_mock = $this->mock_filters( array(
			array( 'jetpack_development_mode', false, true ),
		) );

		$this->assertTrue( $this->status->is_development_mode() );

		$filters_mock->disable();
	}

	/**
	 * @covers Automattic\Jetpack\Status::is_development_mode
	 */
	public function test_is_development_mode_filter_bool() {
		$this->mock_function( 'site_url', $this->site_url );
		$filters_mock = $this->mock_filters( array(
			array( 'jetpack_development_mode', false, 0 ),
		) );

		$this->assertFalse( $this->status->is_development_mode() );
		
		$filters_mock->disable();
	}

	/**
	 * @covers Automattic\Jetpack\Status::is_development_mode
	 */
	public function test_is_development_mode_localhost() {
		$this->mock_function( 'site_url', 'localhost' );
		
		$filters_mock = $this->mock_filters( array(
			array( 'jetpack_development_mode', false, false ),
			array( 'jetpack_development_mode', true, true ),
		) );

		$this->assertTrue( $this->status->is_development_mode() );

		$filters_mock->disable();
	}

    /**
     * @covers Automattic\Jetpack\Status::is_development_mode
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

		$this->assertTrue( $this->status->is_development_mode() );

		array_map( function( $mock ) {
			$mock->disable();
		}, $constants_mocks );
		$filters_mock->disable();
	}

	/**
	 * Mock a global function with particular arguments and make it return a certain value.
	 *
	 * @param string $function_name Name of the function.
	 * @param array  $args          Array of argument sets, last value of each set is used as a return value.
	 * @return phpmock\Mock The mock object.
	 */
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

	/**
	 * Mock a set of filters.
	 *
	 * @param array $args Array of filters with their arguments.
	 * @return phpmock\Mock The mock object.
	 */
	protected function mock_filters( $filters = array() ) {
		return $this->mock_function_with_args( 'apply_filters', $filters );
	}

	/**
	 * Mock a set of constants.
	 *
	 * @param array $args Array of sets with constants and their respective values.
	 * @return phpmock\Mock The mock object.
	 */
	protected function mock_constants( $constants = array() ) {
		$prepare_constant = function( $constant ) {
			return array( $constant[0], true );
		};

		return [
			$this->mock_function_with_args( 'defined', array_map( $prepare_constant, $constants ) ),
			$this->mock_function_with_args( 'constant', $constants )
		];
	}

	/**
	 * Mock a global function and make it return a certain value.
	 *
	 * @param string $function_name Name of the function.
	 * @param mixed  $return_value  Return value of the function.
	 * @return phpmock\Mock The mock object.
	 */
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
