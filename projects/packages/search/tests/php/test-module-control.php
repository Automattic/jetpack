<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName

namespace Automattic\Jetpack\Search;

use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Search\Test_Case as Search_Test_Case;
use Automattic\Jetpack\Status\Cache;
/**
 * Unit tests for the REST_Controller class.
 *
 * @package automattic/jetpack-search
 */
class Test_Module_Control extends Search_Test_Case {
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
	 *
	 * @before
	 */
	public function set_up() {
		parent::set_up();

		$plan = $this->createMock( Plan::class );
		$plan->method( 'supports_search' )->willReturn( true );
		$plan->method( 'supports_instant_search' )->willReturn( true );

		static::$search_module = new Module_Control( $plan );

		$plan = $this->createMock( Plan::class );
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
		$plan = $this->createMock( Plan::class );
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
		$connection_manager = $this->createMock( Connection_Manager::class );
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
