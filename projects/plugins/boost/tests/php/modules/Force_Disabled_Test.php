<?php

namespace Automattic\Jetpack_Boost\Tests\Modules;

use Automattic\Jetpack_Boost\Modules\Module;
use Automattic\Jetpack_Boost\Modules\Optimizations\Minify\Minify_JS;
use Automattic\Jetpack_Boost\Tests\Base_TestCase;

class Force_Disabled_Test extends Base_TestCase {

	public function test_module_should_disable_when_query_var_is_set_specifically() {
		$module = new Module( new Minify_JS() );

		// Add a query var to force the module to be disabled.
		$_GET[ Module::DISABLE_MODULE_QUERY_VAR ] = 'minify_js';
		// Actual check to see if the module is disabled.
		$this->assertFalse( $module->is_available() );
	}

	public function test_module_should_not_disable_when_query_var_is_set_to_a_different_module() {
		$module                                   = new Module( new Minify_JS() );
		$_GET[ Module::DISABLE_MODULE_QUERY_VAR ] = 'minify_css';
		$this->assertTrue( $module->is_available() );
	}

	public function test_module_should_be_disabled_when_all_modules_are_disabled() {
		$module                                   = new Module( new Minify_JS() );
		$_GET[ Module::DISABLE_MODULE_QUERY_VAR ] = 'all';
		$this->assertFalse( $module->is_available() );
	}

	public function test_module_should_be_disabled_if_query_var_includes_slug_among_other_modules() {
		$module                                   = new Module( new Minify_JS() );
		$_GET[ Module::DISABLE_MODULE_QUERY_VAR ] = 'minify_js,minify_css';
		$this->assertFalse( $module->is_available() );
	}
}
