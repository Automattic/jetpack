<?php
/**
 * The trait allows the "options" mock functions to be reused.
 *
 * @package automattic/jetpack-connection
 */

namespace Automattic\Jetpack\Connection\Test\Mock;

use Automattic\Jetpack\Connection;
use phpmock\Mock;
use phpmock\MockBuilder;

trait Options {

	/**
	 * Mock for the `update_option()` function.
	 *
	 * @var Mock
	 */
	private $update_option;

	/**
	 * Mock for the `get_option()` function.
	 *
	 * @var Mock
	 */
	private $get_option;

	/**
	 * Storage for the mock options.
	 *
	 * @var array
	 */
	private $mock_options = array();

	/**
	 * Build mocks for the "options" functionality.
	 */
	private function build_mock_options() {
		$this->mock_options = array();

		$builder = new MockBuilder();
		$builder->setNamespace( Connection::class )
			->setName( 'update_option' )
			->setFunction(
				// phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
				function ( $option, $value, $autoload = null ) {
					$this->mock_options[ $option ] = $value;

					return true;
				}
			);
		$this->update_option = $builder->build();

		$builder = new MockBuilder();
		$builder->setNamespace( Connection::class )
			->setName( 'get_option' )
			->setFunction(
				function ( $option, $default = false ) {
					return array_key_exists( $option, $this->mock_options ) ? $this->mock_options[ $option ] : $default;
				}
			);
		$this->get_option = $builder->build();
	}

}
