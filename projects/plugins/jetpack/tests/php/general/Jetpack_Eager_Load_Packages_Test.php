<?php
/**
 * Tests for Jetpack::should_eager_load_packages(), the request-type gate that
 * decides whether the admin/REST-only packages (the Import package and My
 * Jetpack) are initialized eagerly at plugins_loaded or deferred off the
 * front-end GET path.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Constants;
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
	 * Original priority for the deferred Import REST callback, or false if absent.
	 *
	 * @var int|false
	 */
	private $original_import_rest_priority;

	/**
	 * Original priority for the deferred My Jetpack REST callback, or false if absent.
	 *
	 * @var int|false
	 */
	private $original_my_jetpack_rest_priority;

	/**
	 * Stash request state that the gate reads from $_SERVER.
	 */
	public function set_up() {
		parent::set_up();
		$this->original_request_method = isset( $_SERVER['REQUEST_METHOD'] ) ? $_SERVER['REQUEST_METHOD'] : null;

		$this->original_import_rest_priority     = has_action( 'rest_api_init', array( Jetpack::class, 'configure_import_package' ) );
		$this->original_my_jetpack_rest_priority = has_action( 'rest_api_init', array( \Automattic\Jetpack\My_Jetpack\Initializer::class, 'init' ) );

		remove_action( 'rest_api_init', array( Jetpack::class, 'configure_import_package' ), 0 );
		remove_action( 'rest_api_init', array( \Automattic\Jetpack\My_Jetpack\Initializer::class, 'init' ), 0 );
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
		remove_filter( 'wp_doing_cron', '__return_true' );
		Constants::clear_single_constant( 'WP_CLI' );
		remove_action( 'rest_api_init', array( Jetpack::class, 'configure_import_package' ), 0 );
		remove_action( 'rest_api_init', array( \Automattic\Jetpack\My_Jetpack\Initializer::class, 'init' ), 0 );
		if ( false !== $this->original_import_rest_priority ) {
			add_action( 'rest_api_init', array( Jetpack::class, 'configure_import_package' ), $this->original_import_rest_priority );
		}
		if ( false !== $this->original_my_jetpack_rest_priority ) {
			add_action( 'rest_api_init', array( \Automattic\Jetpack\My_Jetpack\Initializer::class, 'init' ), $this->original_my_jetpack_rest_priority );
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
		// setAccessible() is a no-op as of PHP 8.1 and deprecated in 8.5; only
		// needed (and only called) on the older PHP versions Jetpack still supports.
		if ( PHP_VERSION_ID < 80100 ) {
			$method->setAccessible( true );
		}
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

	/**
	 * A WP-CLI request must eagerly load the packages.
	 */
	public function test_wp_cli_request_eager_loads() {
		set_current_screen( 'front' );
		$_SERVER['REQUEST_METHOD'] = 'GET';
		Constants::set_constant( 'WP_CLI', true );

		$this->assertTrue( $this->invoke_gate() );
	}

	/**
	 * A plain front-end GET defers the Import package to REST requests instead of
	 * eagerly loading it at plugins_loaded.
	 */
	public function test_front_end_get_defers_import_to_rest_api_init() {
		set_current_screen( 'front' );
		$_SERVER['REQUEST_METHOD'] = 'GET';

		$jetpack = Jetpack::init();
		$jetpack->configure();

		$this->assertSame(
			0,
			has_action( 'rest_api_init', array( Jetpack::class, 'configure_import_package' ) )
		);
	}

	/**
	 * The deferred Import callback still initializes the package and fires the
	 * Config feature-enabled action.
	 */
	public function test_deferred_import_callback_initializes_import_package() {
		$import_initialized_count = did_action( 'jetpack_import_initialized' );
		$feature_enabled_count    = did_action( 'jetpack_feature_import_enabled' );

		Jetpack::configure_import_package();

		$this->assertSame(
			0 === $import_initialized_count ? 1 : $import_initialized_count,
			did_action( 'jetpack_import_initialized' )
		);
		$this->assertSame(
			0 === $feature_enabled_count ? 1 : $feature_enabled_count,
			did_action( 'jetpack_feature_import_enabled' )
		);
	}

	/**
	 * An admin request keeps Import eager, so it does not register the deferred
	 * REST bootstrap callback.
	 */
	public function test_admin_request_does_not_defer_import_to_rest_api_init() {
		set_current_screen( 'dashboard' );
		$_SERVER['REQUEST_METHOD'] = 'GET';
		$import_initialized_count = did_action( 'jetpack_import_initialized' );
		$feature_enabled_count    = did_action( 'jetpack_feature_import_enabled' );

		$jetpack = Jetpack::init();
		$jetpack->configure();

		$this->assertFalse(
			has_action( 'rest_api_init', array( Jetpack::class, 'configure_import_package' ) )
		);
		$this->assertSame(
			0 === $import_initialized_count ? 1 : $import_initialized_count,
			did_action( 'jetpack_import_initialized' )
		);
		$this->assertSame(
			0 === $feature_enabled_count ? 1 : $feature_enabled_count,
			did_action( 'jetpack_feature_import_enabled' )
		);
	}

	/**
	 * A plain front-end GET defers My Jetpack initialization to REST requests.
	 */
	public function test_front_end_get_defers_my_jetpack_to_rest_api_init() {
		set_current_screen( 'front' );
		$_SERVER['REQUEST_METHOD'] = 'GET';

		$jetpack = Jetpack::init();
		$jetpack->late_initialization();

		$this->assertSame(
			0,
			has_action( 'rest_api_init', array( \Automattic\Jetpack\My_Jetpack\Initializer::class, 'init' ) )
		);
	}

	/**
	 * An admin request initializes My Jetpack eagerly, so it does not register the
	 * deferred REST callback.
	 */
	public function test_admin_request_does_not_defer_my_jetpack_to_rest_api_init() {
		set_current_screen( 'dashboard' );
		$_SERVER['REQUEST_METHOD'] = 'GET';
		$my_jetpack_init_count = did_action( 'my_jetpack_init' );

		$jetpack = Jetpack::init();
		$jetpack->late_initialization();

		$this->assertFalse(
			has_action( 'rest_api_init', array( \Automattic\Jetpack\My_Jetpack\Initializer::class, 'init' ) )
		);
		$this->assertSame(
			0 === $my_jetpack_init_count ? 1 : $my_jetpack_init_count,
			did_action( 'my_jetpack_init' )
		);
	}
}
