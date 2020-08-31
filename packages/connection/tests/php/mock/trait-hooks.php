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

trait Hooks {

	/**
	 * Mock for the `do_action()` function.
	 *
	 * @var Mock
	 */
	private $do_action;

	/**
	 * Build mocks for the "options" functionality.
	 */
	private function build_mock_actions() {
		$builder = new MockBuilder();
		$builder->setNamespace( Connection::class )
			->setName( 'do_action' )
			->setFunction(
				// phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
				function ( $tag ) {
					// Left blank intentionally.
				}
			);
		$this->do_action = $builder->build();
	}

}
