<?php
/**
 * Tests for the Writing_Prompt_Widget class.
 *
 * @package automattic/jetpack-newsletter
 */

namespace Automattic\Jetpack\Newsletter\Tests;

use Automattic\Jetpack\Newsletter\Writing_Prompt_Widget;
use PHPUnit\Framework\Attributes\CoversClass;
use WorDBless\BaseTestCase;

/**
 * Test class for Writing_Prompt_Widget.
 *
 * @covers \Automattic\Jetpack\Newsletter\Writing_Prompt_Widget
 */
#[CoversClass( Writing_Prompt_Widget::class )]
class Writing_Prompt_Widget_Test extends BaseTestCase {
	/**
	 * Set up before each test.
	 */
	public function set_up() {
		parent::set_up();

		// Reset the static initialized flag between tests.
		$reflection = new \ReflectionClass( Writing_Prompt_Widget::class );
		$property   = $reflection->getProperty( 'initialized' );
		// @todo Remove this call once we no longer need to support PHP <8.1.
		if ( PHP_VERSION_ID < 80100 ) {
			$property->setAccessible( true );
		}
		$property->setValue( null, false );

		remove_all_actions( 'wp_dashboard_setup' );

		$GLOBALS['wp_meta_boxes'] = array();
	}

	/**
	 * Tear down after each test.
	 */
	public function tear_down() {
		wp_set_current_user( 0 );
		unset( $GLOBALS['wp_meta_boxes'] );

		parent::tear_down();
	}

	/**
	 * Create an administrator and set them as the current user.
	 */
	private function set_current_user_admin() {
		$user_id = wp_insert_user(
			array(
				'user_login' => 'writing_prompt_admin_' . wp_rand(),
				'user_pass'  => 'password',
				'user_email' => 'writing-prompt-admin-' . wp_rand() . '@example.com',
				'role'       => 'administrator',
			)
		);
		if ( is_wp_error( $user_id ) ) {
			$this->fail( $user_id->get_error_message() );
		}
		wp_set_current_user( $user_id );
	}

	/**
	 * Test that init() registers the wp_dashboard_setup hook.
	 */
	public function test_init_registers_hooks() {
		Writing_Prompt_Widget::init();

		$this->assertNotFalse(
			has_action( 'wp_dashboard_setup', array( Writing_Prompt_Widget::class, 'register_widget' ) )
		);
	}

	/**
	 * Test that init() only registers the hook once (singleton pattern).
	 */
	public function test_init_only_runs_once() {
		Writing_Prompt_Widget::init();
		Writing_Prompt_Widget::init();

		$count = 0;
		global $wp_filter;
		if ( isset( $wp_filter['wp_dashboard_setup'] ) ) {
			foreach ( $wp_filter['wp_dashboard_setup']->callbacks as $callbacks ) {
				foreach ( $callbacks as $callback ) {
					if (
						is_array( $callback['function'] )
						&& $callback['function'][0] === Writing_Prompt_Widget::class
						&& $callback['function'][1] === 'register_widget'
					) {
						++$count;
					}
				}
			}
		}

		$this->assertSame( 1, $count, 'register_widget should only be hooked once.' );
	}

	/**
	 * Test that register_widget adds the dashboard widget for an administrator.
	 */
	public function test_register_widget_adds_widget_for_admin() {
		require_once ABSPATH . 'wp-admin/includes/dashboard.php';
		$this->set_current_user_admin();

		Writing_Prompt_Widget::register_widget();

		$this->assertArrayHasKey(
			'wpcom_daily_writing_prompt',
			$GLOBALS['wp_meta_boxes']['dashboard']['side']['high']
		);
	}

	/**
	 * Test that register_widget does nothing for users without manage_options.
	 */
	public function test_register_widget_skips_without_capability() {
		wp_set_current_user( 0 );

		Writing_Prompt_Widget::register_widget();

		$this->assertArrayNotHasKey( 'dashboard', $GLOBALS['wp_meta_boxes'] );
	}

	/**
	 * Test that render_widget outputs the hydration container.
	 */
	public function test_render_widget_outputs_container() {
		ob_start();
		Writing_Prompt_Widget::render_widget();
		$output = ob_get_clean();

		$this->assertStringContainsString( 'id="wpcom_daily_writing_prompt_main"', $output );
		$this->assertStringContainsString( 'hide-if-no-js', $output );
		$this->assertStringContainsString( 'hide-if-js', $output );
	}
}
