<?php

namespace Automattic\Jetpack\Packages\Async_Option;

use PHPUnit\Framework\Attributes\CoversClass;
use WorDBless\BaseTestCase;

/**
 * @covers \Automattic\Jetpack\Packages\Async_Option\Async_Options
 */
#[CoversClass( Async_Options::class )]
class Async_Options_Test extends BaseTestCase {

	const PAGE_HOOK = 'admin_page_jetpack-inspect';

	public function set_up() {
		require_once ABSPATH . 'wp-admin/includes/plugin.php';
		remove_all_actions( self::PAGE_HOOK );
		unset( $GLOBALS['wp_filter'][''] );
	}

	private function make_instance() {
		return new Async_Options( 'jetpack-inspect-main', Registry::get_instance( 'jetpack_inspect' ) );
	}

	public function test_registers_callback_on_the_resolved_page_hook() {
		// A registered menu page is what makes get_plugin_page_hook() resolve.
		add_action( self::PAGE_HOOK, '__return_null' );
		$instance = $this->make_instance();

		$instance->add_to_plugin_page( 'jetpack-inspect', 'admin' );

		$this->assertSame( 10, has_action( self::PAGE_HOOK, array( $instance, '_print_options_script_tag' ) ) );
	}

	public function test_registers_nothing_when_the_page_hook_is_unresolved() {
		$instance = $this->make_instance();

		$instance->add_to_plugin_page( 'jetpack-inspect', 'admin' );

		$this->assertFalse( has_action( self::PAGE_HOOK, array( $instance, '_print_options_script_tag' ) ) );
		$this->assertArrayNotHasKey( '', $GLOBALS['wp_filter'], 'add_action() was called with an empty hook name' );
	}
}
