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
	 * Setting up the test.
	 *
	 * @before
	 */
	public function set_up() {
		WorDBless_Options::init()->clear_options();
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
	 * Test Module_Control::is_active()
	 */
	public function test_is_module_active() {
		add_filter( 'jetpack_options', '__return_false' );
		$this->assertFalse( Module_Control::get_instance()->is_active() );
		remove_filter( 'jetpack_options', '__return_false' );

		add_filter( 'jetpack_options', array( $this, 'return_empty_array' ) );
		$this->assertFalse( Module_Control::get_instance()->is_active() );
		remove_filter( 'jetpack_options', array( $this, 'return_empty_array' ) );

		add_filter( 'jetpack_options', array( $this, 'return_search_active_array' ) );
		$this->assertTrue( Module_Control::get_instance()->is_active() );
		remove_filter( 'jetpack_options', array( $this, 'return_search_active_array' ) );
	}

	/**
	 * Test Module_Control::activate()
	 */
	public function test_activate_module() {
		Module_Control::get_instance()->activate();
		$this->assertContains( 'search', get_option( 'jetpack_' . Module_Control::JETPACK_ACTIVE_MODULES_OPTION_KEY, array() ) );
	}

	/**
	 * Test Module_Control::activate()
	 */
	public function test_deactivate_module() {
		add_filter( 'jetpack_options', array( $this, 'return_search_active_array' ) );
		Module_Control::get_instance()->deactivate();
		$this->assertNotContains( 'search', get_option( 'jetpack_' . Module_Control::JETPACK_ACTIVE_MODULES_OPTION_KEY, array() ) );
		remove_filter( 'jetpack_options', array( $this, 'return_search_active_array' ) );
	}

	/**
	 * Test Module_Control::is_instant_search_enabled()
	 */
	public function test_is_instant_search_enabled() {
		update_option( Module_Control::SEARCH_MODULE_INSTANT_SEARCH_OPTION_KEY, false );
		$this->assertFalse( Module_Control::get_instance()->is_instant_search_enabled() );
		delete_option( Module_Control::SEARCH_MODULE_INSTANT_SEARCH_OPTION_KEY );

		update_option( Module_Control::SEARCH_MODULE_INSTANT_SEARCH_OPTION_KEY, true );
		$this->assertTrue( Module_Control::get_instance()->is_instant_search_enabled() );
		delete_option( Module_Control::SEARCH_MODULE_INSTANT_SEARCH_OPTION_KEY );
	}

	/**
	 * Test Module_Control::enable_instant_search()
	 */
	public function test_enable_instant_search() {
		delete_option( Module_Control::SEARCH_MODULE_INSTANT_SEARCH_OPTION_KEY );
		Module_Control::get_instance()->enable_instant_search();
		$this->assertTrue( get_option( Module_Control::SEARCH_MODULE_INSTANT_SEARCH_OPTION_KEY ) );
	}

	/**
	 * Test Module_Control::disable_instant_search()
	 */
	public function test_disable_instant_search() {
		update_option( Module_Control::SEARCH_MODULE_INSTANT_SEARCH_OPTION_KEY, true );
		Module_Control::get_instance()->disable_instant_search();
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
		return array( Module_Control::JETPACK_SEARCH_MODULE_SLUG );
	}

}
