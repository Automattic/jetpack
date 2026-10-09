<?php
/**
 * Jetpack AI module seed tests.
 *
 * @package wpcomsh
 */

use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunInSeparateProcess;

/**
 * Class JetpackAiModuleSeedTest.
 */
class JetpackAiModuleSeedTest extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * What the Jetpack stub reports for is_connection_ready().
	 *
	 * @var bool
	 */
	public static $connection_ready = true;

	/**
	 * Modules the Jetpack stub reports active.
	 *
	 * @var string[]
	 */
	public static $active_modules = array();

	/**
	 * What the Jetpack stub's activate_module() returns.
	 *
	 * @var bool
	 */
	public static $activate_result = true;

	/**
	 * Arguments of every activate_module() call on the stub.
	 *
	 * @var array[]
	 */
	public static $activate_calls = array();

	/**
	 * Whether a successful activate_module() call leaves the module active.
	 *
	 * @var bool
	 */
	public static $activation_sticks = true;

	/**
	 * Set up.
	 */
	public function set_up() {
		parent::set_up();
		self::$connection_ready  = true;
		self::$active_modules    = array();
		self::$activate_result   = true;
		self::$activate_calls    = array();
		self::$activation_sticks = true;
		delete_option( 'wpcomsh_jetpack_ai_module_seeded' );
	}

	/**
	 * Run the seed as a WoA site inside the window, unless told otherwise.
	 *
	 * @param int|null $client_id Atomic client ID.
	 * @param int|null $site_id   Atomic site ID.
	 */
	private function seed( $client_id = WPCOMSH_WPCOM_ATOMIC_CLIENT_ID, $site_id = null ) {
		if ( null === $site_id ) {
			$site_id = wpcomsh_jetpack_ai_module_seed_max_site_id();
		}
		wpcomsh_seed_jetpack_ai_module( $client_id, $site_id );
	}

	/**
	 * Only for tests that run in their own process.
	 */
	private function load_jetpack_stub() {
		require_once __DIR__ . '/stubs/class-jetpack.php';
	}

	/**
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_activates_the_module_once_and_records_it() {
		$this->load_jetpack_stub();
		// Twice: the second run must find the marker and do nothing.
		for ( $i = 0; $i < 2; $i++ ) {
			$this->seed();
		}

		$this->assertSame( array( array( 'ai', false, false ) ), self::$activate_calls );
		$this->assertTrue( (bool) get_option( 'wpcomsh_jetpack_ai_module_seeded' ) );
	}

	/**
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_activates_the_module_at_the_lower_bound() {
		$this->load_jetpack_stub();
		$this->seed( WPCOMSH_WPCOM_ATOMIC_CLIENT_ID, wpcomsh_jetpack_ai_module_seed_min_site_id() );

		$this->assertSame( array( array( 'ai', false, false ) ), self::$activate_calls );
		$this->assertTrue( (bool) get_option( 'wpcomsh_jetpack_ai_module_seeded' ) );
	}

	/**
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_records_an_already_active_module_without_activating() {
		$this->load_jetpack_stub();
		self::$active_modules = array( 'ai' );

		$this->seed();

		$this->assertSame( array(), self::$activate_calls );
		$this->assertTrue( (bool) get_option( 'wpcomsh_jetpack_ai_module_seeded' ) );
	}

	/**
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_leaves_a_later_deactivation_alone() {
		$this->load_jetpack_stub();
		update_option( 'wpcomsh_jetpack_ai_module_seeded', true );

		$this->seed();

		$this->assertSame( array(), self::$activate_calls );
	}

	/**
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_skips_sites_transferred_after_the_cutoff() {
		$this->load_jetpack_stub();
		$this->seed( WPCOMSH_WPCOM_ATOMIC_CLIENT_ID, wpcomsh_jetpack_ai_module_seed_max_site_id() + 1 );

		$this->assertSame( array(), self::$activate_calls );
		$this->assertFalse( get_option( 'wpcomsh_jetpack_ai_module_seeded' ) );
	}

	/**
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_skips_sites_transferred_before_the_module_existed() {
		$this->load_jetpack_stub();
		$this->seed( WPCOMSH_WPCOM_ATOMIC_CLIENT_ID, wpcomsh_jetpack_ai_module_seed_min_site_id() - 1 );

		$this->assertSame( array(), self::$activate_calls );
		$this->assertFalse( get_option( 'wpcomsh_jetpack_ai_module_seeded' ) );
	}

	/**
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_skips_sites_without_an_atomic_site_id() {
		$this->load_jetpack_stub();
		$this->seed( WPCOMSH_WPCOM_ATOMIC_CLIENT_ID, 0 );

		$this->assertSame( array(), self::$activate_calls );
		$this->assertFalse( get_option( 'wpcomsh_jetpack_ai_module_seeded' ) );
	}

	/**
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_skips_other_wp_cloud_clients() {
		$this->load_jetpack_stub();
		$this->seed( 32 );

		$this->assertSame( array(), self::$activate_calls );
		$this->assertFalse( get_option( 'wpcomsh_jetpack_ai_module_seeded' ) );
	}

	/**
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_retries_later_while_disconnected() {
		$this->load_jetpack_stub();
		self::$connection_ready = false;

		$this->seed();

		$this->assertSame( array(), self::$activate_calls );
		$this->assertFalse( get_option( 'wpcomsh_jetpack_ai_module_seeded' ) );
	}

	/**
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_records_a_reported_activation_that_a_filter_hides() {
		$this->load_jetpack_stub();
		self::$activation_sticks = false;

		// Twice: the hidden module must not be retried.
		for ( $i = 0; $i < 2; $i++ ) {
			$this->seed();
		}

		$this->assertCount( 1, self::$activate_calls );
		$this->assertTrue( (bool) get_option( 'wpcomsh_jetpack_ai_module_seeded' ) );
	}

	/**
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_retries_later_when_activation_fails() {
		$this->load_jetpack_stub();
		self::$activate_result = false;

		$this->seed();

		$this->assertCount( 1, self::$activate_calls );
		$this->assertFalse( get_option( 'wpcomsh_jetpack_ai_module_seeded' ) );
	}

	/**
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_retries_later_while_jetpack_is_not_loaded() {
		$this->seed();

		$this->assertFalse( class_exists( 'Jetpack', false ) );
		$this->assertFalse( get_option( 'wpcomsh_jetpack_ai_module_seeded' ) );
	}

	public function test_is_hooked_early_on_init() {
		$this->assertSame( 0, has_action( 'init', 'wpcomsh_seed_jetpack_ai_module' ) );
	}
}
