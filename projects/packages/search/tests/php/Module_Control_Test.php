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
	 * Legacy fallback path: when the experience option has never been written
	 * (pre-existing sites), `is_instant_search_enabled()` reads the legacy
	 * boolean.
	 */
	public function test_is_instant_search_enabled_legacy_fallback() {
		add_filter( 'jetpack_options', array( $this, 'return_search_active_array' ), 10, 2 );

		update_option( Module_Control::SEARCH_MODULE_INSTANT_SEARCH_OPTION_KEY, false );
		$this->assertFalse( static::$search_module->is_instant_search_enabled() );
		delete_option( Module_Control::SEARCH_MODULE_INSTANT_SEARCH_OPTION_KEY );

		update_option( Module_Control::SEARCH_MODULE_INSTANT_SEARCH_OPTION_KEY, true );
		$this->assertTrue( static::$search_module->is_instant_search_enabled() );
		delete_option( Module_Control::SEARCH_MODULE_INSTANT_SEARCH_OPTION_KEY );

		remove_filter( 'jetpack_options', array( $this, 'return_search_active_array' ) );
	}

	/**
	 * `is_instant_search_enabled()` returns false when the module is inactive,
	 * even if a stale `'overlay'` is preserved in the experience option (the
	 * preserve-on-OFF behavior shouldn't make the boolean read true while
	 * Search isn't loaded).
	 */
	public function test_is_instant_search_enabled_false_when_module_inactive() {
		// No active-modules filter → is_active() is false.
		update_option( Module_Control::SEARCH_MODULE_EXPERIENCE_OPTION_KEY, Module_Control::EXPERIENCE_OVERLAY );
		update_option( Module_Control::SEARCH_MODULE_INSTANT_SEARCH_OPTION_KEY, true );

		$this->assertFalse( static::$search_module->is_instant_search_enabled() );

		delete_option( Module_Control::SEARCH_MODULE_EXPERIENCE_OPTION_KEY );
		delete_option( Module_Control::SEARCH_MODULE_INSTANT_SEARCH_OPTION_KEY );
	}

	/**
	 * Experience option takes precedence over the legacy boolean: an explicit
	 * `'inline'` / `'embedded'` value reads as Instant Search off even if the
	 * legacy boolean has drifted true (e.g. a caller bypassing
	 * `update_experience()`).
	 *
	 * @param string $experience Stored value of `jetpack_search_experience`.
	 * @param bool   $expected   Expected return of `is_instant_search_enabled()`.
	 * @testWith
	 *  ["overlay",true]
	 *  ["embedded",false]
	 *  ["inline",false]
	 */
	#[\PHPUnit\Framework\Attributes\TestWith( array( 'overlay', true ) )]
	#[\PHPUnit\Framework\Attributes\TestWith( array( 'embedded', false ) )]
	#[\PHPUnit\Framework\Attributes\TestWith( array( 'inline', false ) )]
	public function test_is_instant_search_enabled_experience_precedes_legacy_boolean( $experience, $expected ) {
		add_filter( 'jetpack_options', array( $this, 'return_search_active_array' ), 10, 2 );

		update_option( Module_Control::SEARCH_MODULE_EXPERIENCE_OPTION_KEY, $experience );
		// Set the legacy boolean to the *opposite* of the expected outcome to
		// prove the experience option is what's being read, not the boolean.
		update_option( Module_Control::SEARCH_MODULE_INSTANT_SEARCH_OPTION_KEY, ! $expected );

		$this->assertSame( $expected, static::$search_module->is_instant_search_enabled() );

		remove_filter( 'jetpack_options', array( $this, 'return_search_active_array' ) );
		delete_option( Module_Control::SEARCH_MODULE_EXPERIENCE_OPTION_KEY );
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
	 * Enabling Instant Search must also write 'overlay' to the canonical
	 * experience option so is_instant_search_enabled() agrees. Without this
	 * sync, a stale 'embedded' / 'inline' in the experience option keeps
	 * the canonical read at false even after the legacy boolean flips true.
	 */
	public function test_enable_instant_search_syncs_experience_overlay() {
		add_filter( 'jetpack_options', array( $this, 'return_search_active_array' ), 10, 2 );
		update_option( Module_Control::SEARCH_MODULE_EXPERIENCE_OPTION_KEY, Module_Control::EXPERIENCE_EMBEDDED );

		static::$search_module->enable_instant_search();

		$this->assertEquals(
			Module_Control::EXPERIENCE_OVERLAY,
			get_option( Module_Control::SEARCH_MODULE_EXPERIENCE_OPTION_KEY )
		);
		$this->assertTrue( static::$search_module->is_instant_search_enabled() );

		remove_filter( 'jetpack_options', array( $this, 'return_search_active_array' ) );
		delete_option( Module_Control::SEARCH_MODULE_EXPERIENCE_OPTION_KEY );
	}

	/**
	 * The legacy ModuleControl toggle, when turning Instant Search off,
	 * clears the canonical experience option so a stale 'overlay' doesn't
	 * keep is_instant_search_enabled() returning true.
	 */
	public function test_update_instant_search_status_false_clears_experience() {
		add_filter( 'jetpack_options', array( $this, 'return_search_active_array' ), 10, 2 );
		update_option( Module_Control::SEARCH_MODULE_EXPERIENCE_OPTION_KEY, Module_Control::EXPERIENCE_OVERLAY );
		update_option( Module_Control::SEARCH_MODULE_INSTANT_SEARCH_OPTION_KEY, true );

		static::$search_module->update_instant_search_status( false );

		$this->assertSame( '', get_option( Module_Control::SEARCH_MODULE_EXPERIENCE_OPTION_KEY ) );
		$this->assertFalse( static::$search_module->is_instant_search_enabled() );

		remove_filter( 'jetpack_options', array( $this, 'return_search_active_array' ) );
		delete_option( Module_Control::SEARCH_MODULE_EXPERIENCE_OPTION_KEY );
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
	 * Saved 'embedded' / 'overlay' values are returned verbatim when the module
	 * is active — Embedded renders on every theme (block themes through
	 * `search_template_hierarchy`, classic themes through `template_include`).
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
		// is_active() needs to return true during enable_instant_search() *and*
		// during the is_instant_search_enabled() assertion below (the rewrite
		// gates on is_active to avoid a stale 'overlay' reading as on after
		// OFF). Filter stays on across both calls.
		add_filter( 'jetpack_options', array( $this, 'return_search_active_array' ), 10, 2 );
		static::$search_module->update_experience( Module_Control::EXPERIENCE_OVERLAY );

		$this->assertTrue( static::$search_module->is_instant_search_enabled() );
		$this->assertEquals( Module_Control::EXPERIENCE_OVERLAY, get_option( Module_Control::SEARCH_MODULE_EXPERIENCE_OPTION_KEY ) );

		remove_filter( 'jetpack_options', array( $this, 'return_search_active_array' ) );
		delete_option( Module_Control::SEARCH_MODULE_EXPERIENCE_OPTION_KEY );
	}

	/**
	 * Embedded activates the module, disables instant search, and writes
	 * 'embedded' to the experience option.
	 */
	public function test_update_experience_embedded() {
		delete_option( Module_Control::SEARCH_MODULE_EXPERIENCE_OPTION_KEY );
		// Pre-set instant_search_enabled = true (simulates a prior overlay
		// state) so the assertion below proves embedded *actively disables* it,
		// rather than passing vacuously on the default false.
		update_option( Module_Control::SEARCH_MODULE_INSTANT_SEARCH_OPTION_KEY, true );
		add_filter( 'jetpack_options', array( $this, 'return_active_modules_array_without_search' ), 10, 2 );
		static::$search_module->update_experience( Module_Control::EXPERIENCE_EMBEDDED );
		$active_modules = get_option( 'jetpack_' . Module_Control::JETPACK_ACTIVE_MODULES_OPTION_KEY, array() );
		remove_filter( 'jetpack_options', array( $this, 'return_active_modules_array_without_search' ) );

		$this->assertContains( Module_Control::JETPACK_SEARCH_MODULE_SLUG, $active_modules );
		$this->assertFalse( (bool) get_option( Module_Control::SEARCH_MODULE_INSTANT_SEARCH_OPTION_KEY ) );
		$this->assertEquals( Module_Control::EXPERIENCE_EMBEDDED, get_option( Module_Control::SEARCH_MODULE_EXPERIENCE_OPTION_KEY ) );
		delete_option( Module_Control::SEARCH_MODULE_EXPERIENCE_OPTION_KEY );
		delete_option( Module_Control::SEARCH_MODULE_INSTANT_SEARCH_OPTION_KEY );
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
		// Pre-set instant_search_enabled = true so the assertion below proves
		// inline *actively disables* it, rather than passing vacuously on the
		// default false.
		update_option( Module_Control::SEARCH_MODULE_INSTANT_SEARCH_OPTION_KEY, true );
		add_filter( 'jetpack_options', array( $this, 'return_active_modules_array_without_search' ), 10, 2 );
		static::$search_module->update_experience( Module_Control::EXPERIENCE_INLINE );
		$active_modules = get_option( 'jetpack_' . Module_Control::JETPACK_ACTIVE_MODULES_OPTION_KEY, array() );
		remove_filter( 'jetpack_options', array( $this, 'return_active_modules_array_without_search' ) );

		$this->assertContains( Module_Control::JETPACK_SEARCH_MODULE_SLUG, $active_modules );
		$this->assertFalse( (bool) get_option( Module_Control::SEARCH_MODULE_INSTANT_SEARCH_OPTION_KEY ) );
		$this->assertSame( '', get_option( Module_Control::SEARCH_MODULE_EXPERIENCE_OPTION_KEY ) );
		delete_option( Module_Control::SEARCH_MODULE_INSTANT_SEARCH_OPTION_KEY );
	}

	/**
	 * Switching to inline must fire an option-write action even when the
	 * experience option doesn't yet exist on the site — otherwise the WPcom
	 * cache site can be stuck with a stale `'overlay'` / `'embedded'` after a
	 * site that has never written the option toggles to inline. Writing `''`
	 * (instead of delete_option, which would no-op on a missing option) is
	 * what makes the action fire.
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
	 * Off deactivates the module and disables `instant_search_enabled`, so the
	 * legacy boolean doesn't drift from a re-enabled, non-overlay experience.
	 * The experience option itself is left untouched so re-enabling later
	 * restores the user's prior preference.
	 */
	public function test_update_experience_off_disables_instant_search_and_preserves_experience() {
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
		// instant_search_enabled disabled.
		$this->assertFalse( (bool) get_option( Module_Control::SEARCH_MODULE_INSTANT_SEARCH_OPTION_KEY ) );
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
	 * The blocks-powered overlay experience is gated at the REST boundary by
	 * the `jetpack_search_overlay_block_template_enabled` filter. Without
	 * this gate a scripted POST could pre-stage `overlay_blocks` on a site
	 * where operators haven't opted in, and the value would silently
	 * activate the moment the filter flipped on. With the filter off the
	 * write must be rejected and the option left untouched.
	 */
	public function test_update_experience_overlay_blocks_rejected_when_flag_off() {
		delete_option( Module_Control::SEARCH_MODULE_EXPERIENCE_OPTION_KEY );
		// Filter defaults true since the Beta release; pin it back to false
		// so the REST boundary still rejects the value as this test asserts.
		add_filter( 'jetpack_search_overlay_block_template_enabled', '__return_false' );

		$result = static::$search_module->update_experience( Module_Control::EXPERIENCE_OVERLAY_BLOCKS );

		remove_filter( 'jetpack_search_overlay_block_template_enabled', '__return_false' );

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertEquals( 'experience_not_available', $result->get_error_code() );
		$this->assertFalse( get_option( Module_Control::SEARCH_MODULE_EXPERIENCE_OPTION_KEY ) );
	}

	/**
	 * With both gates on, the blocks-powered overlay activates the module,
	 * keeps `instant_search_enabled` off (the new path doesn't boot the
	 * legacy preact `SearchApp`), and writes `overlay_blocks` to the
	 * experience option.
	 */
	public function test_update_experience_overlay_blocks_persists_when_flag_on() {
		delete_option( Module_Control::SEARCH_MODULE_EXPERIENCE_OPTION_KEY );
		update_option( Module_Control::SEARCH_MODULE_INSTANT_SEARCH_OPTION_KEY, true );
		add_filter( 'jetpack_search_overlay_block_template_enabled', '__return_true' );
		add_filter( 'jetpack_options', array( $this, 'return_active_modules_array_without_search' ), 10, 2 );

		static::$search_module->update_experience( Module_Control::EXPERIENCE_OVERLAY_BLOCKS );
		$active_modules = get_option( 'jetpack_' . Module_Control::JETPACK_ACTIVE_MODULES_OPTION_KEY, array() );

		remove_filter( 'jetpack_options', array( $this, 'return_active_modules_array_without_search' ) );
		remove_filter( 'jetpack_search_overlay_block_template_enabled', '__return_true' );

		$this->assertContains( Module_Control::JETPACK_SEARCH_MODULE_SLUG, $active_modules );
		$this->assertFalse( (bool) get_option( Module_Control::SEARCH_MODULE_INSTANT_SEARCH_OPTION_KEY ) );
		$this->assertEquals( Module_Control::EXPERIENCE_OVERLAY_BLOCKS, get_option( Module_Control::SEARCH_MODULE_EXPERIENCE_OPTION_KEY ) );

		delete_option( Module_Control::SEARCH_MODULE_EXPERIENCE_OPTION_KEY );
		delete_option( Module_Control::SEARCH_MODULE_INSTANT_SEARCH_OPTION_KEY );
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
