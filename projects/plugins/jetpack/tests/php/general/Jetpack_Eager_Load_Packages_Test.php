<?php
/**
 * Tests for Jetpack::should_eager_load_packages(), the request-type gate that
 * decides whether the admin/REST-only packages (the Import package and My
 * Jetpack) are initialized eagerly at plugins_loaded or deferred off the
 * front-end GET path.
 *
 * @package automattic/jetpack
 */

use PHPUnit\Framework\Attributes\CoversClass;

/**
 * @covers Jetpack
 */
#[CoversClass( Jetpack::class )]
class Jetpack_Eager_Load_Packages_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * The original REQUEST_METHOD, restored after each test.
	 *
	 * @var string|null
	 */
	private $original_request_method;

	/**
	 * Stash request state that the gate reads from $_SERVER.
	 */
	public function set_up() {
		parent::set_up();
		$this->original_request_method = isset( $_SERVER['REQUEST_METHOD'] ) ? $_SERVER['REQUEST_METHOD'] : null;
	}

	/**
	 * Restore request state and the admin screen so tests do not leak into each other.
	 */
	public function tear_down() {
		if ( null === $this->original_request_method ) {
			unset( $_SERVER['REQUEST_METHOD'] );
		} else {
			$_SERVER['REQUEST_METHOD'] = $this->original_request_method;
		}
		set_current_screen( 'front' );
		parent::tear_down();
	}

	/**
	 * Invoke the private static gate via reflection.
	 *
	 * @return bool
	 */
	private function invoke_gate() {
		$method = new ReflectionMethod( Jetpack::class, 'should_eager_load_packages' );
		$method->setAccessible( true );
		return $method->invoke( null );
	}

	/**
	 * A plain front-end GET must NOT eagerly load the packages — this is the
	 * whole point of the gate (the front-end hot path stays clear).
	 */
	public function test_plain_front_end_get_does_not_eager_load() {
		set_current_screen( 'front' );
		$_SERVER['REQUEST_METHOD'] = 'GET';

		$this->assertFalse( $this->invoke_gate() );
	}

	/**
	 * An admin request must eagerly load the packages.
	 */
	public function test_admin_request_eager_loads() {
		set_current_screen( 'dashboard' );
		$_SERVER['REQUEST_METHOD'] = 'GET';

		$this->assertTrue( $this->invoke_gate() );
	}

	/**
	 * A POST request must eagerly load the packages, even on the front end.
	 */
	public function test_post_request_eager_loads() {
		set_current_screen( 'front' );
		$_SERVER['REQUEST_METHOD'] = 'POST';

		$this->assertTrue( $this->invoke_gate() );
	}

	/**
	 * A lower-case POST method still eager-loads (the gate upper-cases the value).
	 */
	public function test_lowercase_post_method_eager_loads() {
		set_current_screen( 'front' );
		$_SERVER['REQUEST_METHOD'] = 'post';

		$this->assertTrue( $this->invoke_gate() );
	}

	/**
	 * A cron request must eagerly load the packages.
	 */
	public function test_cron_request_eager_loads() {
		set_current_screen( 'front' );
		$_SERVER['REQUEST_METHOD'] = 'GET';
		add_filter( 'wp_doing_cron', '__return_true' );

		$this->assertTrue( $this->invoke_gate() );
	}
}
