<?php
/**
 * Open_State_Store Tests File
 *
 * @package automattic/jetpack-agents-manager
 */

namespace Automattic\Jetpack\Agents_Manager;

use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Status\Cache;
use Brain\Monkey\Functions;
use PHPUnit\Framework\Attributes\CoversClass;

require_once __DIR__ . '/../../src/class-open-state-store.php';

/**
 * Class Open_State_Store_Test
 *
 * @covers \Automattic\Jetpack\Agents_Manager\Open_State_Store
 */
#[CoversClass( Open_State_Store::class )]
class Open_State_Store_Test extends \WorDBless\BaseTestCase {

	/**
	 * The current test user ID.
	 *
	 * @var int
	 */
	private $user_id;

	/**
	 * Set up test fixtures.
	 */
	public function set_up() {
		parent::set_up();

		$this->user_id = wp_insert_user(
			array(
				'user_login' => 'open_state_tester',
				'user_pass'  => 'password',
				'role'       => 'administrator',
			)
		);
	}

	/**
	 * Tear down test fixtures.
	 */
	public function tear_down() {
		delete_transient( 'agents_manager_open_state_' . $this->user_id );
		wp_set_current_user( 0 );
		Cache::clear();
		Constants::clear_constants();
		parent::tear_down();
	}

	/**
	 * Invoke the private cache() method.
	 *
	 * @param array $state State to cache.
	 */
	private function cache( array $state ) {
		$method = new \ReflectionMethod( Open_State_Store::class, 'cache' );
		if ( PHP_VERSION_ID < 80500 ) {
			$method->setAccessible( true );
		}
		$method->invoke( null, $state );
	}

	/**
	 * Tests that get_cached() returns null when no user is logged in.
	 */
	public function test_get_cached_returns_null_without_user() {
		wp_set_current_user( 0 );
		$this->assertNull( Open_State_Store::get_cached() );
	}

	/**
	 * Tests that get_cached() returns null when nothing is cached.
	 */
	public function test_get_cached_returns_null_when_uncached() {
		wp_set_current_user( $this->user_id );
		$this->assertNull( Open_State_Store::get_cached() );
	}

	/**
	 * Tests that caching stores only the open/docked bits and get_cached() reads them.
	 */
	public function test_cache_round_trip_stores_open_and_docked_only() {
		wp_set_current_user( $this->user_id );

		$this->cache(
			array(
				'agents_manager_open'              => true,
				'agents_manager_docked'            => true,
				'agents_manager_floating_position' => 'left',
				'agents_manager_router_history'    => array( 'entries' => array() ),
			)
		);

		$cached = Open_State_Store::get_cached();

		$this->assertSame(
			array(
				'agents_manager_open'   => true,
				'agents_manager_docked' => true,
			),
			$cached,
			'Only the open/docked bits the pre-render needs should be cached.'
		);
	}

	/**
	 * Tests that caching coerces truthy/falsy values to booleans.
	 */
	public function test_cache_coerces_booleans() {
		wp_set_current_user( $this->user_id );

		$this->cache(
			array(
				'agents_manager_open'   => 1,
				'agents_manager_docked' => 0,
			)
		);

		$this->assertSame(
			array(
				'agents_manager_open'   => true,
				'agents_manager_docked' => false,
			),
			Open_State_Store::get_cached()
		);
	}

	/**
	 * Tests that caching is a no-op when no user is logged in.
	 */
	public function test_cache_noop_without_user() {
		wp_set_current_user( 0 );

		$this->cache(
			array(
				'agents_manager_open'   => true,
				'agents_manager_docked' => true,
			)
		);

		wp_set_current_user( $this->user_id );
		$this->assertNull( Open_State_Store::get_cached() );
	}

	/**
	 * Tests that the cache TTL is filterable.
	 */
	public function test_cache_ttl_is_filterable() {
		wp_set_current_user( $this->user_id );

		$captured = null;
		add_filter(
			'agents_manager_open_state_cache_ttl',
			function ( $ttl ) use ( &$captured ) {
				$captured = $ttl;
				return 123;
			}
		);

		$this->cache( array( 'agents_manager_open' => true ) );

		$this->assertSame( WEEK_IN_SECONDS, $captured, 'Filter should receive the default TTL.' );

		remove_all_filters( 'agents_manager_open_state_cache_ttl' );
	}

	/**
	 * Tests that on Simple sites get_cached() reads calypso_preferences directly,
	 * not the transient (which is never primed there).
	 */
	public function test_get_cached_reads_calypso_preferences_on_simple_site() {
		Constants::set_constant( 'IS_WPCOM', true );
		Functions\when( 'get_user_attribute' )->justReturn(
			array(
				'agents_manager_open'   => true,
				'agents_manager_docked' => true,
			)
		);
		wp_set_current_user( $this->user_id );

		$this->assertSame(
			array(
				'agents_manager_open'   => true,
				'agents_manager_docked' => true,
			),
			Open_State_Store::get_cached(),
			'Simple sites should read the open/docked bits straight from calypso_preferences.'
		);
	}

	/**
	 * Tests that on Simple sites get_cached() coerces values to booleans and
	 * defaults missing keys to false.
	 */
	public function test_get_cached_on_simple_site_coerces_and_defaults() {
		Constants::set_constant( 'IS_WPCOM', true );
		Functions\when( 'get_user_attribute' )->justReturn(
			array(
				'agents_manager_open' => 1,
			)
		);
		wp_set_current_user( $this->user_id );

		$this->assertSame(
			array(
				'agents_manager_open'   => true,
				'agents_manager_docked' => false,
			),
			Open_State_Store::get_cached()
		);
	}

	/**
	 * Tests that on Simple sites get_cached() returns null when the user has no
	 * preferences yet.
	 */
	public function test_get_cached_on_simple_site_returns_null_without_prefs() {
		Constants::set_constant( 'IS_WPCOM', true );
		Functions\when( 'get_user_attribute' )->justReturn( false );
		wp_set_current_user( $this->user_id );

		$this->assertNull( Open_State_Store::get_cached() );
	}

	/**
	 * Tests that on Simple sites get_cached() reads calypso_preferences and
	 * short-circuits the transient, even when one is set.
	 */
	public function test_get_cached_on_simple_site_ignores_transient() {
		wp_set_current_user( $this->user_id );

		// Seed a transient that disagrees with calypso_preferences.
		$this->cache(
			array(
				'agents_manager_open'   => false,
				'agents_manager_docked' => false,
			)
		);

		Constants::set_constant( 'IS_WPCOM', true );
		Functions\when( 'get_user_attribute' )->justReturn(
			array(
				'agents_manager_open'   => true,
				'agents_manager_docked' => true,
			)
		);

		$this->assertSame(
			array(
				'agents_manager_open'   => true,
				'agents_manager_docked' => true,
			),
			Open_State_Store::get_cached(),
			'Simple sites should read calypso_preferences, not the transient.'
		);
	}
}
