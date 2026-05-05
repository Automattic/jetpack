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
	 * Test get_experience() derivation from legacy booleans when no experience option is saved.
	 */
	public function test_get_experience_derived_off() {
		delete_option( Module_Control::SEARCH_MODULE_EXPERIENCE_OPTION_KEY );
		// Module is inactive → 'off'.
		$this->assertEquals( Module_Control::EXPERIENCE_OFF, static::$search_module->get_experience() );
	}

	/**
	 * Test get_experience() derivation: module active + instant search enabled → 'overlay'.
	 */
	public function test_get_experience_derived_overlay() {
		delete_option( Module_Control::SEARCH_MODULE_EXPERIENCE_OPTION_KEY );
		add_filter( 'jetpack_options', array( $this, 'return_search_active_array' ), 10, 2 );
		update_option( Module_Control::SEARCH_MODULE_INSTANT_SEARCH_OPTION_KEY, true );
		$this->assertEquals( Module_Control::EXPERIENCE_OVERLAY, static::$search_module->get_experience() );
		remove_filter( 'jetpack_options', array( $this, 'return_search_active_array' ) );
		delete_option( Module_Control::SEARCH_MODULE_INSTANT_SEARCH_OPTION_KEY );
	}

	/**
	 * Test get_experience() derivation: module active + instant search disabled → 'classic'.
	 */
	public function test_get_experience_derived_classic() {
		delete_option( Module_Control::SEARCH_MODULE_EXPERIENCE_OPTION_KEY );
		add_filter( 'jetpack_options', array( $this, 'return_search_active_array' ), 10, 2 );
		update_option( Module_Control::SEARCH_MODULE_INSTANT_SEARCH_OPTION_KEY, false );
		$this->assertEquals( Module_Control::EXPERIENCE_CLASSIC, static::$search_module->get_experience() );
		remove_filter( 'jetpack_options', array( $this, 'return_search_active_array' ) );
		delete_option( Module_Control::SEARCH_MODULE_INSTANT_SEARCH_OPTION_KEY );
	}

	/**
	 * Test get_experience() returns persisted value over derived.
	 */
	public function test_get_experience_returns_persisted() {
		update_option( Module_Control::SEARCH_MODULE_EXPERIENCE_OPTION_KEY, Module_Control::EXPERIENCE_EMBEDDED );
		$this->assertEquals( Module_Control::EXPERIENCE_EMBEDDED, static::$search_module->get_experience() );
		delete_option( Module_Control::SEARCH_MODULE_EXPERIENCE_OPTION_KEY );
	}

	/**
	 * Test update_experience() with 'overlay'.
	 */
	public function test_update_experience_overlay() {
		delete_option( Module_Control::SEARCH_MODULE_EXPERIENCE_OPTION_KEY );
		// Use the filter that includes search so that is_active() returns true during
		// enable_instant_search(), which requires the module to be active.
		add_filter( 'jetpack_options', array( $this, 'return_search_active_array' ), 10, 2 );
		static::$search_module->update_experience( Module_Control::EXPERIENCE_OVERLAY );
		remove_filter( 'jetpack_options', array( $this, 'return_search_active_array' ) );

		$this->assertTrue( static::$search_module->is_instant_search_enabled() );
		$this->assertEquals( Module_Control::EXPERIENCE_OVERLAY, get_option( Module_Control::SEARCH_MODULE_EXPERIENCE_OPTION_KEY ) );
		delete_option( Module_Control::SEARCH_MODULE_EXPERIENCE_OPTION_KEY );
	}

	/**
	 * Test update_experience() with 'embedded'.
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
	 * Test update_experience() with 'classic'.
	 */
	public function test_update_experience_classic() {
		delete_option( Module_Control::SEARCH_MODULE_EXPERIENCE_OPTION_KEY );
		add_filter( 'jetpack_options', array( $this, 'return_active_modules_array_without_search' ), 10, 2 );
		static::$search_module->update_experience( Module_Control::EXPERIENCE_CLASSIC );
		$active_modules = get_option( 'jetpack_' . Module_Control::JETPACK_ACTIVE_MODULES_OPTION_KEY, array() );
		remove_filter( 'jetpack_options', array( $this, 'return_active_modules_array_without_search' ) );

		$this->assertContains( Module_Control::JETPACK_SEARCH_MODULE_SLUG, $active_modules );
		$this->assertFalse( static::$search_module->is_instant_search_enabled() );
		$this->assertEquals( Module_Control::EXPERIENCE_CLASSIC, get_option( Module_Control::SEARCH_MODULE_EXPERIENCE_OPTION_KEY ) );
		delete_option( Module_Control::SEARCH_MODULE_EXPERIENCE_OPTION_KEY );
	}

	/**
	 * Test update_experience() with 'off' deactivates module but preserves instant_search_enabled.
	 */
	public function test_update_experience_off_preserves_instant_search() {
		delete_option( Module_Control::SEARCH_MODULE_EXPERIENCE_OPTION_KEY );
		// Start with module active and instant search enabled.
		add_filter( 'jetpack_options', array( $this, 'return_search_active_array' ), 10, 2 );
		update_option( Module_Control::SEARCH_MODULE_INSTANT_SEARCH_OPTION_KEY, true );
		remove_filter( 'jetpack_options', array( $this, 'return_search_active_array' ) );

		static::$search_module->update_experience( Module_Control::EXPERIENCE_OFF );

		$this->assertFalse( static::$search_module->is_active() );
		// instant_search_enabled should remain true (preserved for later re-enable).
		$this->assertTrue( (bool) get_option( Module_Control::SEARCH_MODULE_INSTANT_SEARCH_OPTION_KEY ) );
		$this->assertEquals( Module_Control::EXPERIENCE_OFF, get_option( Module_Control::SEARCH_MODULE_EXPERIENCE_OPTION_KEY ) );
		delete_option( Module_Control::SEARCH_MODULE_EXPERIENCE_OPTION_KEY );
		delete_option( Module_Control::SEARCH_MODULE_INSTANT_SEARCH_OPTION_KEY );
	}

	/**
	 * Test update_experience() with an invalid value returns WP_Error.
	 */
	public function test_update_experience_invalid_value() {
		$result = static::$search_module->update_experience( 'invalid_value' );
		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertEquals( 'invalid_experience', $result->get_error_code() );
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
