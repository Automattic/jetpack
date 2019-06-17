<?php
use Automattic\Jetpack\Sync;
use PHPUnit\Framework\TestCase;

class WP_Test_Actions extends TestCase {
	function test_something() {
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
}
