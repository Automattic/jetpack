<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName

namespace Automattic\Jetpack\Search;

use PHPUnit\Framework\TestCase;
use WorDBless\Options as WorDBless_Options;

/**
 * Unit tests for the REST_Controller class.
 *
 * @package automattic/jetpack-search
 */
class Test_Module_Control extends TestCase {
	/**
	 * Module_Control object
	 *
	 * @var Module_Control
	 */
	protected static $search_module;

	/**
	 * Setting up the test.
	 *
	 * @before
	 */
	public function set_up() {
		WorDBless_Options::init()->clear_options();

		$plan = $this->createMock( Plan::class );
		$plan->method( 'supports_search' )->willReturn( true );

		static::$search_module = new Module_Control( $plan );
	}

	/**
	 * Returning the environment into its initial state.
	 *
	 * @after
	 */
	public function tear_down() {
		WorDBless_Options::init()->clear_options();
	}

	/**
	 * Test static::$search_module->is_active()
	 */
	public function test_is_module_active() {
		add_filter( 'jetpack_options', '__return_false' );
		$this->assertFalse( static::$search_module->is_active() );
		remove_filter( 'jetpack_options', '__return_false' );

		add_filter( 'jetpack_options', array( $this, 'return_empty_array' ) );
		$this->assertFalse( static::$search_module->is_active() );
		remove_filter( 'jetpack_options', array( $this, 'return_empty_array' ) );

		add_filter( 'jetpack_options', array( $this, 'return_search_active_array' ) );
		$this->assertTrue( static::$search_module->is_active() );
		remove_filter( 'jetpack_options', array( $this, 'return_search_active_array' ) );
	}

	/**
	 * Test static::$search_module->activate()
	 */
	public function test_activate_module() {
		add_filter( 'jetpack_options', array( $this, 'return_active_modules_array_without_search' ) );
		static::$search_module->activate();
		$this->assertEquals( array( 'some-module-1', 'some-module-2', 'some-module-3', Module_Control::JETPACK_SEARCH_MODULE_SLUG ), get_option( 'jetpack_' . Module_Control::JETPACK_ACTIVE_MODULES_OPTION_KEY, array() ) );
		remove_filter( 'jetpack_options', array( $this, 'return_active_modules_array_without_search' ) );
	}

	/**
	 * Test static::$search_module->activate()
	 */
	public function test_deactivate_module() {
		add_filter( 'jetpack_options', array( $this, 'return_search_active_array' ) );
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
		$this->assertTrue( get_option( Module_Control::SEARCH_MODULE_INSTANT_SEARCH_OPTION_KEY ) );
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
	 * Returns an empty array
	 */
	public function return_empty_array() {
		return array();
	}

	/**
	 * Returns an array with 'search' in it
	 */
	public function return_search_active_array() {
		return array( 'some-module-1', Module_Control::JETPACK_SEARCH_MODULE_SLUG, 'some-module-2', 'some-module-3' );
	}

	/**
	 * Returns an array with 'search' in it
	 */
	public function return_active_modules_array_without_search() {
		return array( 'some-module-1', 'some-module-2', 'some-module-3' );
	}

}
