<?php

class FunctionsTest extends WP_UnitTestCase {

	/**
	 * Tests that wpcomsh_get_atomic_client_id returns a default value of 0
	 * when the constant has not been defined and a filter hook is not set.
	 */
	function test_wpcomsh_get_atomic_client_id_default() {
		$this->assertSame( 0, wpcomsh_get_atomic_client_id() );
	}

	/**
	 * Tests that wpcomsh_get_atomic_client_id returns the constant when it's been
	 * defined.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	function test_wpcomsh_get_atomic_client_id_defined() {
		define( 'ATOMIC_CLIENT_ID', '2' );
		add_filter(
			'wpcomsh_get_atomic_client_id',
			function() {
				return '3';
			}
		);
		$this->assertSame( 2, wpcomsh_get_atomic_client_id() );
	}

	/**
	 * Tests that wpcomsh_get_atomic_client_id returns the integer value of the
	 * value provided by filter hook.
	 */
	function test_wpcomsh_get_atomic_client_id_filter() {
		add_filter(
			'wpcomsh_get_atomic_client_id',
			function() {
				return '1';
			}
		);
		$this->assertSame( 1, wpcomsh_get_atomic_client_id() );
	}
}
