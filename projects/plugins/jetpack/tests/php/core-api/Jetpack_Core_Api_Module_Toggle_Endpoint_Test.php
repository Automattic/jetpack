<?php

use Automattic\Jetpack\Status\Cache as StatusCache;
use PHPUnit\Framework\Attributes\CoversClass;

require_once JETPACK__PLUGIN_DIR . '/_inc/lib/core-api/class.jetpack-core-api-xmlrpc-consumer-endpoint.php';
require_once JETPACK__PLUGIN_DIR . '/_inc/lib/core-api/class.jetpack-core-api-module-endpoints.php';

/**
 * @covers \Jetpack_Core_API_Module_Toggle_Endpoint
 * @covers \Jetpack_Core_API_Module_List_Endpoint
 */
#[CoversClass( Jetpack_Core_API_Module_Toggle_Endpoint::class )]
#[CoversClass( Jetpack_Core_API_Module_List_Endpoint::class )]
class Jetpack_Core_Api_Module_Toggle_Endpoint_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	const MODULE = 'shortcodes';

	/**
	 * Modules a host forces on or off through `jetpack_active_modules`.
	 *
	 * @var array
	 */
	private $forced_on = array();

	/**
	 * @var array
	 */
	private $forced_off = array();

	public function set_up() {
		parent::set_up();

		add_filter( 'jetpack_offline_mode', '__return_true' );
		StatusCache::clear();
		add_filter( 'jetpack_active_modules', array( $this, 'force_modules' ) );
		Jetpack_Options::update_option( 'active_modules', array() );
	}

	public function tear_down() {
		remove_filter( 'jetpack_offline_mode', '__return_true' );
		StatusCache::clear();
		remove_filter( 'jetpack_active_modules', array( $this, 'force_modules' ) );
		Jetpack_Options::delete_option( 'active_modules' );

		parent::tear_down();
	}

	/**
	 * @param array $modules Active modules.
	 * @return array
	 */
	public function force_modules( $modules ) {
		return array_values( array_diff( array_merge( $modules, $this->forced_on ), $this->forced_off ) );
	}

	private function endpoint() {
		return new Jetpack_Core_API_Module_Toggle_Endpoint( new Jetpack_IXR_Client() );
	}

	public function test_activating_a_module_a_host_forced_off_reports_it_stays_off() {
		$this->forced_off = array( self::MODULE );

		$result = $this->endpoint()->activate_module( self::MODULE );

		$this->assertWPError( $result );
		$this->assertSame( 'module_forced', $result->get_error_code() );
		$this->assertSame( 409, $result->get_error_data()['status'] );
		$this->assertFalse( Jetpack::is_module_active( self::MODULE ) );
	}

	public function test_deactivating_a_module_a_host_forced_on_reports_it_stays_on() {
		$this->forced_on = array( self::MODULE );

		$result = $this->endpoint()->deactivate_module( self::MODULE );

		$this->assertWPError( $result );
		$this->assertSame( 'module_forced', $result->get_error_code() );
		$this->assertSame( 409, $result->get_error_data()['status'] );
		$this->assertTrue( Jetpack::is_module_active( self::MODULE ) );
	}

	public function test_switching_a_module_nobody_forced_still_succeeds() {
		$this->assertNotWPError( $this->endpoint()->activate_module( self::MODULE ) );
		$this->assertTrue( Jetpack::is_module_active( self::MODULE ) );

		$this->assertNotWPError( $this->endpoint()->deactivate_module( self::MODULE ) );
		$this->assertFalse( Jetpack::is_module_active( self::MODULE ) );
	}

	public function test_bulk_activation_counts_a_module_a_host_forced_off_as_failed() {
		$this->forced_off = array( self::MODULE );

		$result = Jetpack_Core_API_Module_List_Endpoint::activate_modules( array( 'modules' => array( self::MODULE ) ) );

		$this->assertWPError( $result );
	}
}
