<?php

namespace Automattic\Jetpack\Search;

use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Search\TestCase as Search_TestCase;
use Automattic\Jetpack\Status\Cache;
/**
 * Unit tests for the REST_Controller class.
 *
 * @package automattic/jetpack-search
 */
class Module_Control_Test extends Search_TestCase {
	/**
	 * Module_Control object
	 *
	 * @var Module_Control
	 */
	protected static $search_module;

	/**
	 * Module_Control object which doesn't support instant search
	 *
	 * @var Module_Control
	 */
	protected static $search_module_no_instant;

	/**
	 * Setting up the test.
	 */
	public function setUp(): void {
		parent::setUp();

		$plan = $this->createStub( Plan::class );
		$plan->method( 'supports_search' )->willReturn( true );
		$plan->method( 'supports_instant_search' )->willReturn( true );

		static::$search_module = new Module_Control( $plan );

		$plan = $this->createStub( Plan::class );
		$plan->method( 'supports_search' )->willReturn( true );
		$plan->method( 'supports_instant_search' )->willReturn( false );

		static::$search_module_no_instant = new Module_Control( $plan );
	}

	/**
	 * Test static::$search_module->is_active()
	 */
	public function test_is_module_active() {
		add_filter( 'jetpack_options', '__return_false' );
		$this->assertFalse( static::$search_module->is_active() );
		remove_filter( 'jetpack_options', '__return_false' );

		add_filter( 'jetpack_options', array( $this, 'return_empty_array' ), 10, 2 );
		$this->assertFalse( static::$search_module->is_active() );
		remove_filter( 'jetpack_options', array( $this, 'return_empty_array' ) );

		add_filter( 'jetpack_options', array( $this, 'return_search_active_array' ), 10, 2 );
		$this->assertTrue( static::$search_module->is_active() );
		remove_filter( 'jetpack_options', array( $this, 'return_search_active_array' ) );
	}

	/**
	 * Test static::$search_module->activate()
	 */
	public function test_activate_module_success() {
		add_filter( 'jetpack_options', array( $this, 'return_active_modules_array_without_search' ), 10, 2 );
		static::$search_module->activate();
		$this->assertEquals( array( 'some-module-1', 'some-module-2', 'some-module-3', Module_Control::JETPACK_SEARCH_MODULE_SLUG ), get_option( 'jetpack_' . Module_Control::JETPACK_ACTIVE_MODULES_OPTION_KEY, array() ) );
		remove_filter( 'jetpack_options', array( $this, 'return_active_modules_array_without_search' ) );
	}

	/**
	 * Test static::$search_module->activate() when search is not supported
	 */
	public function test_activate_module_failed_not_supported() {
		$plan = $this->createStub( Plan::class );
		$plan->method( 'supports_search' )->willReturn( false );

		$search_module = new Module_Control( $plan );
		$err           = $search_module->activate();
		// Cannot activate search if not supported.
		$this->assertEquals( 'not_supported', $err->get_error_code() );
		$this->assertEquals( array(), get_option( 'jetpack_' . Module_Control::JETPACK_ACTIVE_MODULES_OPTION_KEY, array() ) );
	}

	/**
	 * Test static::$search_module->activate() when site is not connected
	 */
	public function test_activate_module_failed_connection_required() {
		$connection_manager = $this->createStub( Connection_Manager::class );
		$connection_manager->method( 'is_connected' )->willReturn( false );
		$search_module = new Module_Control( null, $connection_manager );
		$err           = $search_module->activate();
		// Cannot activate search if site is not connected.
		$this->assertEquals( 'connection_required', $err->get_error_code() );
		$this->assertEquals( array(), get_option( 'jetpack_' . Module_Control::JETPACK_ACTIVE_MODULES_OPTION_KEY, array() ) );
	}

	/**
	 * Test static::$search_module->activate() when site is in offline mode
	 */
	public function test_activate_module_failed_site_offline() {
		Cache::set( 'is_offline_mode', true );
		$err = static::$search_module->activate();
		Cache::set( 'is_offline_mode', null );
		// Cannot activate search if site is in offline mode.
		$this->assertEquals( 'site_offline', $err->get_error_code() );
		$this->assertEquals( array(), get_option( 'jetpack_' . Module_Control::JETPACK_ACTIVE_MODULES_OPTION_KEY, array() ) );
	}

	/**
	 * Test static::$search_module->deactivate()
	 */
	public function test_deactivate_module() {
		add_filter( 'jetpack_options', array( $this, 'return_search_active_array' ), 10, 2 );
		static::$search_module->deactivate();
		$this->assertNotContains( 'search', get_option( 'jetpack_' . Module_Control::JETPACK_ACTIVE_MODULES_OPTION_KEY, array() ) );
		$this->assertEquals( array( 'some-module-1', 'some-module-2', 'some-module-3' ), get_option( 'jetpack_' . Module_Control::JETPACK_ACTIVE_MODULES_OPTION_KEY, array() ) );
		remove_filter( 'jetpack_options', array( $this, 'return_search_active_array' ) );
	}

	/**
	 * Test static::$search_module->is_instant_search_enabled()
	 */
	public function test_is_instant_search_enabled() {
		update_option( Module_Control::SEARCH_MODULE_INSTANT_SEARCH_OPTION_KEY, false );
		$this->assertFalse( static::$search_module->is_instant_search_enabled() );
		delete_option( Module_Control::SEARCH_MODULE_INSTANT_SEARCH_OPTION_KEY );

		update_option( Module_Control::SEARCH_MODULE_INSTANT_SEARCH_OPTION_KEY, true );
		$this->assertTrue( static::$search_module->is_instant_search_enabled() );
		delete_option( Module_Control::SEARCH_MODULE_INSTANT_SEARCH_OPTION_KEY );
	}

	/**
	 * Test static::$search_module->enable_instant_search()
	 */
	public function test_enable_instant_search() {
		delete_option( Module_Control::SEARCH_MODULE_INSTANT_SEARCH_OPTION_KEY );
		static::$search_module->enable_instant_search();
		// plan doesn't support search.
		$this->assertFalse( get_option( Module_Control::SEARCH_MODULE_INSTANT_SEARCH_OPTION_KEY ) );
		add_filter( 'jetpack_options', array( $this, 'return_search_active_array' ), 10, 2 );
		static::$search_module->enable_instant_search();
		$this->assertTrue( get_option( Module_Control::SEARCH_MODULE_INSTANT_SEARCH_OPTION_KEY ) );
		remove_filter( 'jetpack_options', array( $this, 'return_search_active_array' ) );
	}

	/**
	 * Test static::$search_module->enable_instant_search()
	 */
	public function test_enable_instant_search_not_supported() {
		delete_option( Module_Control::SEARCH_MODULE_INSTANT_SEARCH_OPTION_KEY );
		static::$search_module_no_instant->enable_instant_search();
		// plan doesn't support instant search.
		$this->assertFalse( get_option( Module_Control::SEARCH_MODULE_INSTANT_SEARCH_OPTION_KEY ) );
	}

	/**
	 * Test static::$search_module->disable_instant_search()
	 */
	public function test_disable_instant_search() {
		update_option( Module_Control::SEARCH_MODULE_INSTANT_SEARCH_OPTION_KEY, true );
		static::$search_module->disable_instant_search();
		$this->assertFalse( get_option( Module_Control::SEARCH_MODULE_INSTANT_SEARCH_OPTION_KEY ) );
	}

	/**
	 * Inactive module always reads as 'off' regardless of any saved experience
	 * option — off lives in jetpack_active_modules, not in the package's option.
	 */
	public function test_get_experience_off_when_module_inactive() {
		delete_option( Module_Control::SEARCH_MODULE_EXPERIENCE_OPTION_KEY );
		$this->assertEquals( Module_Control::EXPERIENCE_OFF, static::$search_module->get_experience() );

		// Even with a stale 'embedded' value in the option, an inactive module is off.
		update_option( Module_Control::SEARCH_MODULE_EXPERIENCE_OPTION_KEY, Module_Control::EXPERIENCE_EMBEDDED );
		$this->assertEquals( Module_Control::EXPERIENCE_OFF, static::$search_module->get_experience() );
		delete_option( Module_Control::SEARCH_MODULE_EXPERIENCE_OPTION_KEY );
	}

	/**
	 * Saved 'embedded' / 'overlay' values are returned when the module is active.
	 */
	public function test_get_experience_returns_saved_value() {
		add_filter( 'jetpack_options', array( $this, 'return_search_active_array' ), 10, 2 );

		update_option( Module_Control::SEARCH_MODULE_EXPERIENCE_OPTION_KEY, Module_Control::EXPERIENCE_EMBEDDED );
		$this->assertEquals( Module_Control::EXPERIENCE_EMBEDDED, static::$search_module->get_experience() );

		update_option( Module_Control::SEARCH_MODULE_EXPERIENCE_OPTION_KEY, Module_Control::EXPERIENCE_OVERLAY );
		$this->assertEquals( Module_Control::EXPERIENCE_OVERLAY, static::$search_module->get_experience() );

		remove_filter( 'jetpack_options', array( $this, 'return_search_active_array' ) );
		delete_option( Module_Control::SEARCH_MODULE_EXPERIENCE_OPTION_KEY );
	}

	/**
	 * Legacy fallback: active module + instant_search_enabled=true with no saved
	 * value resolves to 'overlay'.
	 */
	public function test_get_experience_legacy_fallback_overlay() {
		delete_option( Module_Control::SEARCH_MODULE_EXPERIENCE_OPTION_KEY );
		add_filter( 'jetpack_options', array( $this, 'return_search_active_array' ), 10, 2 );
		update_option( Module_Control::SEARCH_MODULE_INSTANT_SEARCH_OPTION_KEY, true );
		$this->assertEquals( Module_Control::EXPERIENCE_OVERLAY, static::$search_module->get_experience() );
		remove_filter( 'jetpack_options', array( $this, 'return_search_active_array' ) );
		delete_option( Module_Control::SEARCH_MODULE_INSTANT_SEARCH_OPTION_KEY );
	}

	/**
	 * Active module + instant_search_enabled=false with no saved value resolves to
	 * 'inline' — inline is the absence of an opt-in.
	 */
	public function test_get_experience_inline_when_no_opt_in() {
		delete_option( Module_Control::SEARCH_MODULE_EXPERIENCE_OPTION_KEY );
		add_filter( 'jetpack_options', array( $this, 'return_search_active_array' ), 10, 2 );
		update_option( Module_Control::SEARCH_MODULE_INSTANT_SEARCH_OPTION_KEY, false );
		$this->assertEquals( Module_Control::EXPERIENCE_INLINE, static::$search_module->get_experience() );
		remove_filter( 'jetpack_options', array( $this, 'return_search_active_array' ) );
		delete_option( Module_Control::SEARCH_MODULE_INSTANT_SEARCH_OPTION_KEY );
	}

	/**
	 * Overlay activates the module, enables instant search, and writes 'overlay'
	 * to the experience option.
	 */
	public function test_update_experience_overlay() {
		delete_option( Module_Control::SEARCH_MODULE_EXPERIENCE_OPTION_KEY );
		// is_active() needs to return true during enable_instant_search().
		add_filter( 'jetpack_options', array( $this, 'return_search_active_array' ), 10, 2 );
		static::$search_module->update_experience( Module_Control::EXPERIENCE_OVERLAY );
		remove_filter( 'jetpack_options', array( $this, 'return_search_active_array' ) );

		$this->assertTrue( static::$search_module->is_instant_search_enabled() );
		$this->assertEquals( Module_Control::EXPERIENCE_OVERLAY, get_option( Module_Control::SEARCH_MODULE_EXPERIENCE_OPTION_KEY ) );
		delete_option( Module_Control::SEARCH_MODULE_EXPERIENCE_OPTION_KEY );
	}

	/**
	 * Embedded activates the module, disables instant search, and writes
	 * 'embedded' to the experience option.
	 */
	public function test_update_experience_embedded() {
		delete_option( Module_Control::SEARCH_MODULE_EXPERIENCE_OPTION_KEY );
		add_filter( 'jetpack_options', array( $this, 'return_active_modules_array_without_search' ), 10, 2 );
		static::$search_module->update_experience( Module_Control::EXPERIENCE_EMBEDDED );
		$active_modules = get_option( 'jetpack_' . Module_Control::JETPACK_ACTIVE_MODULES_OPTION_KEY, array() );
		remove_filter( 'jetpack_options', array( $this, 'return_active_modules_array_without_search' ) );

		$this->assertContains( Module_Control::JETPACK_SEARCH_MODULE_SLUG, $active_modules );
		$this->assertFalse( static::$search_module->is_instant_search_enabled() );
		$this->assertEquals( Module_Control::EXPERIENCE_EMBEDDED, get_option( Module_Control::SEARCH_MODULE_EXPERIENCE_OPTION_KEY ) );
		delete_option( Module_Control::SEARCH_MODULE_EXPERIENCE_OPTION_KEY );
	}

	/**
	 * Inline activates the module, disables instant search, and writes the empty
	 * string to the experience option (inline is the absence of an affirmative
	 * opt-in). Writing `''` rather than deleting ensures the change always fires
	 * `updated_option` / `added_option`, so Sync replicates it to the cache site.
	 */
	public function test_update_experience_inline_writes_empty_string() {
		// Seed an existing 'embedded' to prove the switch to inline clears it.
		update_option( Module_Control::SEARCH_MODULE_EXPERIENCE_OPTION_KEY, Module_Control::EXPERIENCE_EMBEDDED );
		add_filter( 'jetpack_options', array( $this, 'return_active_modules_array_without_search' ), 10, 2 );
		static::$search_module->update_experience( Module_Control::EXPERIENCE_INLINE );
		$active_modules = get_option( 'jetpack_' . Module_Control::JETPACK_ACTIVE_MODULES_OPTION_KEY, array() );
		remove_filter( 'jetpack_options', array( $this, 'return_active_modules_array_without_search' ) );

		$this->assertContains( Module_Control::JETPACK_SEARCH_MODULE_SLUG, $active_modules );
		$this->assertFalse( static::$search_module->is_instant_search_enabled() );
		$this->assertSame( '', get_option( Module_Control::SEARCH_MODULE_EXPERIENCE_OPTION_KEY ) );
		$this->assertSame( Module_Control::EXPERIENCE_INLINE, static::$search_module->get_experience() );
	}

	/**
	 * Switching to inline must fire an option-write action even when the
	 * experience option doesn't yet exist on the site — otherwise the WPcom
	 * cache site can be stuck with a stale `'overlay'` / `'embedded'` after a
	 * site that has never written the option toggles to inline.
	 */
	public function test_update_experience_inline_fires_action_when_option_missing() {
		delete_option( Module_Control::SEARCH_MODULE_EXPERIENCE_OPTION_KEY );
		add_filter( 'jetpack_options', array( $this, 'return_active_modules_array_without_search' ), 10, 2 );

		$fired = 0;
		$cb    = function ( $name ) use ( &$fired ) {
			if ( Module_Control::SEARCH_MODULE_EXPERIENCE_OPTION_KEY === $name ) {
				++$fired;
			}
		};
		add_action( 'added_option', $cb );
		add_action( 'updated_option', $cb );

		static::$search_module->update_experience( Module_Control::EXPERIENCE_INLINE );

		remove_action( 'added_option', $cb );
		remove_action( 'updated_option', $cb );
		remove_filter( 'jetpack_options', array( $this, 'return_active_modules_array_without_search' ) );

		$this->assertSame( 1, $fired, 'Switching a fresh site to inline must fire an option-write so Sync queues the change.' );
	}

	/**
	 * Off deactivates the module and leaves the experience option and
	 * instant_search_enabled untouched, so re-enabling later restores the user's
	 * prior preference.
	 */
	public function test_update_experience_off_preserves_other_state() {
		// Start with module active, overlay saved, instant search on. The filter
		// has to stay active across update_experience() so deactivate() has a
		// real active-modules option to remove 'search' from — see test_deactivate_module
		// for the same pattern.
		add_filter( 'jetpack_options', array( $this, 'return_search_active_array' ), 10, 2 );
		update_option( Module_Control::SEARCH_MODULE_EXPERIENCE_OPTION_KEY, Module_Control::EXPERIENCE_OVERLAY );
		update_option( Module_Control::SEARCH_MODULE_INSTANT_SEARCH_OPTION_KEY, true );

		$result = static::$search_module->update_experience( Module_Control::EXPERIENCE_OFF );

		// Read the actual option (not via the filter) to prove deactivate() ran.
		$active_modules = get_option( 'jetpack_' . Module_Control::JETPACK_ACTIVE_MODULES_OPTION_KEY, array() );
		remove_filter( 'jetpack_options', array( $this, 'return_search_active_array' ) );

		// Propagated from Modules::deactivate(): true when the module was actually removed.
		$this->assertTrue( $result );
		$this->assertNotContains( Module_Control::JETPACK_SEARCH_MODULE_SLUG, $active_modules );
		// experience option preserved (still 'overlay' for later re-enable).
		$this->assertEquals( Module_Control::EXPERIENCE_OVERLAY, get_option( Module_Control::SEARCH_MODULE_EXPERIENCE_OPTION_KEY ) );
		// instant_search_enabled preserved.
		$this->assertTrue( (bool) get_option( Module_Control::SEARCH_MODULE_INSTANT_SEARCH_OPTION_KEY ) );
		delete_option( Module_Control::SEARCH_MODULE_EXPERIENCE_OPTION_KEY );
		delete_option( Module_Control::SEARCH_MODULE_INSTANT_SEARCH_OPTION_KEY );
	}

	/**
	 * When the module is already inactive, Modules::deactivate() is a no-op and
	 * returns false. update_experience('off') propagates that bool — it's not an
	 * error, just a signal that nothing changed. The REST controller (which only
	 * branches on is_wp_error()) still treats it as success.
	 */
	public function test_update_experience_off_when_module_already_inactive_returns_false() {
		// Earlier tests in this class activate the search module via update_experience()
		// and persist 'search' into the real jetpack_active_modules option. Set it to an
		// empty array so deactivate() really is a no-op (`update_option` with the same
		// value returns false).
		update_option( 'jetpack_' . Module_Control::JETPACK_ACTIVE_MODULES_OPTION_KEY, array() );

		$result = static::$search_module->update_experience( Module_Control::EXPERIENCE_OFF );

		$this->assertFalse( $result );
		$this->assertNotInstanceOf( \WP_Error::class, $result );
	}

	/**
	 * Invalid input returns WP_Error.
	 */
	public function test_update_experience_invalid_value() {
		$result = static::$search_module->update_experience( 'invalid_value' );
		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertEquals( 'invalid_experience', $result->get_error_code() );
	}

	/**
	 * Each experience that calls activate() must propagate its WP_Error rather than
	 * fall through and write the experience option in an inconsistent state.
	 *
	 * @param string $experience One of 'inline', 'embedded', 'overlay'.
	 * @dataProvider experiences_requiring_activation
	 */
	#[\PHPUnit\Framework\Attributes\DataProvider( 'experiences_requiring_activation' )]
	public function test_update_experience_propagates_activate_error( $experience ) {
		$plan = $this->createStub( Plan::class );
		$plan->method( 'supports_search' )->willReturn( false );
		$plan->method( 'supports_instant_search' )->willReturn( false );
		$module = new Module_Control( $plan );

		$result = $module->update_experience( $experience );

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertEquals( 'not_supported', $result->get_error_code() );
		// On failure, the experience option must not be written.
		$this->assertFalse( get_option( Module_Control::SEARCH_MODULE_EXPERIENCE_OPTION_KEY, false ) );
	}

	/**
	 * @return array<array<string>>
	 */
	public static function experiences_requiring_activation() {
		return array(
			'inline'   => array( Module_Control::EXPERIENCE_INLINE ),
			'embedded' => array( Module_Control::EXPERIENCE_EMBEDDED ),
			'overlay'  => array( Module_Control::EXPERIENCE_OVERLAY ),
		);
	}

	/**
	 * Overlay propagates the WP_Error from enable_instant_search() (e.g. plan
	 * doesn't support instant search) and does not write the experience option.
	 */
	public function test_update_experience_overlay_propagates_enable_instant_search_error() {
		// $search_module_no_instant has supports_search=true but supports_instant_search=false,
		// so activate() succeeds and enable_instant_search() returns 'not_supported'.
		// Filter is on so is_active() returns true inside enable_instant_search().
		add_filter( 'jetpack_options', array( $this, 'return_search_active_array' ), 10, 2 );

		$result = static::$search_module_no_instant->update_experience( Module_Control::EXPERIENCE_OVERLAY );

		remove_filter( 'jetpack_options', array( $this, 'return_search_active_array' ) );

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertEquals( 'not_supported', $result->get_error_code() );
		$this->assertFalse( get_option( Module_Control::SEARCH_MODULE_EXPERIENCE_OPTION_KEY, false ) );
	}

	/**
	 * Direct writes to `jetpack_search_experience` keep `instant_search_enabled`
	 * in lockstep, so legacy readers (and code paths that bypass
	 * `Module_Control::update_experience()`) still see the right state.
	 *
	 * @param string $experience       Value written to `jetpack_search_experience`.
	 * @param bool   $expected_instant Expected `instant_search_enabled` after the write.
	 * @testWith
	 *  ["overlay",true]
	 *  ["embedded",false]
	 *  ["",false]
	 */
	#[\PHPUnit\Framework\Attributes\TestWith( array( 'overlay', true ) )]
	#[\PHPUnit\Framework\Attributes\TestWith( array( 'embedded', false ) )]
	#[\PHPUnit\Framework\Attributes\TestWith( array( '', false ) )]
	public function test_direct_write_to_experience_keeps_instant_search_in_lockstep( $experience, $expected_instant ) {
		add_action( 'add_option_' . Module_Control::SEARCH_MODULE_EXPERIENCE_OPTION_KEY, array( Module_Control::class, 'on_search_experience_added' ), 10, 2 );
		add_action( 'update_option_' . Module_Control::SEARCH_MODULE_EXPERIENCE_OPTION_KEY, array( Module_Control::class, 'on_search_experience_updated' ), 10, 3 );

		delete_option( Module_Control::SEARCH_MODULE_EXPERIENCE_OPTION_KEY );
		update_option( Module_Control::SEARCH_MODULE_INSTANT_SEARCH_OPTION_KEY, ! $expected_instant );

		update_option( Module_Control::SEARCH_MODULE_EXPERIENCE_OPTION_KEY, $experience );

		$this->assertSame( $expected_instant, (bool) get_option( Module_Control::SEARCH_MODULE_INSTANT_SEARCH_OPTION_KEY, false ) );

		remove_action( 'add_option_' . Module_Control::SEARCH_MODULE_EXPERIENCE_OPTION_KEY, array( Module_Control::class, 'on_search_experience_added' ), 10 );
		remove_action( 'update_option_' . Module_Control::SEARCH_MODULE_EXPERIENCE_OPTION_KEY, array( Module_Control::class, 'on_search_experience_updated' ), 10 );
		delete_option( Module_Control::SEARCH_MODULE_EXPERIENCE_OPTION_KEY );
		delete_option( Module_Control::SEARCH_MODULE_INSTANT_SEARCH_OPTION_KEY );
	}

	/**
	 * Returns an empty array
	 */
	public function return_empty_array() {
		return array();
	}

	/**
	 * Returns an array with 'search' in it
	 *
	 * @param array  $value The value of the option.
	 * @param string $name The name of the option being retrieved.
	 */
	public function return_search_active_array( $value, $name ) {
		if ( 'active_modules' !== $name ) {
			return $value;
		}
		return array( 'some-module-1', Module_Control::JETPACK_SEARCH_MODULE_SLUG, 'some-module-2', 'some-module-3' );
	}

	/**
	 * Returns an array with 'search' in it
	 *
	 * @param array  $value The value of the option.
	 * @param string $name The name of the option being retrieved.
	 */
	public function return_active_modules_array_without_search( $value, $name ) {
		if ( 'active_modules' !== $name ) {
			return $value;
		}
		return array( 'some-module-1', 'some-module-2', 'some-module-3' );
	}
}
