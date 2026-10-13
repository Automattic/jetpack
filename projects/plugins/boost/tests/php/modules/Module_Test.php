<?php

namespace Automattic\Jetpack_Boost\Tests\Modules;

use Automattic\Jetpack_Boost\Contracts\Feature;
use Automattic\Jetpack_Boost\Contracts\Is_Always_On;
use Automattic\Jetpack_Boost\Lib\Status;
use Automattic\Jetpack_Boost\Modules\Module;
use Automattic\Jetpack_Boost\Modules\Optimizations\Minify\Minify_Common;
use Automattic\Jetpack_Boost\Modules\Optimizations\Minify\Minify_CSS;
use Automattic\Jetpack_Boost\Modules\Optimizations\Minify\Minify_JS;
use Automattic\Jetpack_Boost\Modules\Optimizations\Page_Cache\Cache_Preload;
use Automattic\Jetpack_Boost\Modules\Optimizations\Page_Cache\Page_Cache;
use Automattic\Jetpack_Boost\Tests\Base_TestCase;

class Module_Test extends Base_TestCase {
	public function test_module_should_be_enabled_if_always_on() {
		$module = new Module(
			new class() implements Is_Always_On, Feature {
				public static function get_slug() {
					return 'always_on';
				}

				public static function is_available() {
					return true;
				}

				public function setup() {
					// no-op
				}
			}
		);

		$this->assertTrue( $module->is_enabled() );
	}

	public function test_get_active_parent_modules_return_empty_array_if_not_sub_feature() {
		$this->mock_module_status(
			array(
				Minify_JS::get_slug()  => false,
				Minify_CSS::get_slug() => false,
			)
		);
		$submodule = new Module( new Minify_Common() );
		$this->assertCount( 0, $submodule->get_active_parent_modules() );
	}

	public function test_get_active_parent_modules_return_single_parent_module() {
		$this->mock_module_status( array( Page_Cache::get_slug() => true ) );

		$submodule = new Module( new Cache_Preload() );
		$this->assertCount( 1, $submodule->get_active_parent_modules() );

		$this->assertArrayHasKey( Page_Cache::get_slug(), $submodule->get_active_parent_modules() );
	}

	public function test_get_active_parent_modules_return_multiple_parent_modules() {
		$this->mock_module_status(
			array(
				Minify_JS::get_slug()  => true,
				Minify_CSS::get_slug() => true,
			)
		);

		$submodule = new Module( new Minify_Common() );
		$this->assertCount( 2, $submodule->get_active_parent_modules() );

		$this->assertArrayHasKey( Minify_JS::get_slug(), $submodule->get_active_parent_modules() );
		$this->assertArrayHasKey( Minify_CSS::get_slug(), $submodule->get_active_parent_modules() );
	}

	public function test_status_option_name_replaces_underscores_with_hyphens() {
		// Slugs use underscores; the stored option name uses hyphens.
		$this->assertSame( 'jetpack_boost_status_minify-js', Status::get_option_name( 'minify_js' ) );
		$this->assertSame( 'jetpack_boost_status_page-cache', Status::get_option_name( 'page_cache' ) );
	}

	public function test_module_exposes_its_status_option_name() {
		$module = new Module(
			new class() implements Feature {
				public static function get_slug() {
					return 'my_module';
				}

				public static function is_available() {
					return true;
				}

				public function setup() {
					// no-op
				}
			}
		);

		$this->assertSame( 'jetpack_boost_status_my-module', $module->get_status_option_name() );
	}
}
