<?php

$jetpack_dir = dirname( __FILE__ ) . '/../../';

require_once $jetpack_dir . 'class.jetpack-modules-registry.php';
require_once $jetpack_dir . 'class.jetpack-module.php';
require_once $jetpack_dir . 'modules/module-registration.php';

class WP_Test_Jetpack_Module_Registration extends WP_UnitTestCase {

	private $registry = null;

	public function setUp() {
		$this->registry = Jetpack_Modules_Registry::get_instance();
	}

	function test_jetpack_get_available_modules_same_as_get_all() {
		$jetpack_modules = Jetpack::get_available_modules();
		$this->assertEquals( $jetpack_modules, $this->registry->get_available_slugs() );
	}

	function test_jetpack_get_module__same_as_get_module() {
		foreach( $this->registry->get_available_slugs() as $module_slug ) {
			$this->assertEquals( Jetpack::get_module( $module_slug ), $this->registry->get_module( $module_slug ) );
		}
	}
}