<?php
/**
 * Unit tests for Integration_Assets.
 *
 * @package automattic/jetpack-forms
 */

namespace Automattic\Jetpack\Forms\Integrations;

use PHPUnit\Framework\Attributes\CoversClass;
use WorDBless\BaseTestCase;

/**
 * Test class for Integration_Assets.
 *
 * @covers Automattic\Jetpack\Forms\Integrations\Integration_Assets
 */
#[CoversClass( Integration_Assets::class )]
class Integration_Assets_Test extends BaseTestCase {

	/**
	 * Leave the registry and the script queue empty for the next test.
	 */
	protected function tear_down() {
		Integration_Registry::reset();
		Built_In_Integrations::reset();
		remove_all_filters( 'doing_it_wrong_trigger_error' );
		remove_all_actions( 'doing_it_wrong_run' );

		foreach ( array( 'acme-slack-editor', 'acme-slack-dashboard', 'jp-forms-blocks' ) as $handle ) {
			wp_deregister_script( $handle );
			wp_dequeue_script( $handle );
		}
	}

	/**
	 * A registered editor_script is enqueued, so a plugin does not have to know which screens
	 * the integrations modal appears on.
	 */
	public function test_enqueues_a_registered_editor_script() {
		wp_register_script( 'acme-slack-editor', 'https://example.com/slack.js', array(), '1.0', true );
		Integration_Registry::register(
			'acme/slack',
			array(
				'title'         => 'Slack',
				'editor_script' => 'acme-slack-editor',
			)
		);

		Integration_Assets::enqueue_editor_scripts();

		$this->assertTrue( wp_script_is( 'acme-slack-editor', 'enqueued' ) );
	}

	/**
	 * The Forms editor bundle is added as a dependency, so the plugin does not have to name it
	 * and cannot get the ordering wrong.
	 */
	public function test_adds_the_forms_editor_bundle_as_a_dependency() {
		wp_register_script( 'jp-forms-blocks', 'https://example.com/forms.js', array(), '1.0', true );
		wp_register_script( 'acme-slack-editor', 'https://example.com/slack.js', array(), '1.0', true );
		Integration_Registry::register(
			'acme/slack',
			array(
				'title'         => 'Slack',
				'editor_script' => 'acme-slack-editor',
			)
		);

		Integration_Assets::enqueue_editor_scripts();

		$this->assertContains( 'jp-forms-blocks', wp_scripts()->registered['acme-slack-editor']->deps );
	}

	/**
	 * An integration whose is_available callback says no gets nothing on the page — a flagged
	 * off integration should not be shipping script to every editor load.
	 */
	public function test_does_not_enqueue_for_an_unavailable_integration() {
		wp_register_script( 'acme-slack-editor', 'https://example.com/slack.js', array(), '1.0', true );
		Integration_Registry::register(
			'acme/slack',
			array(
				'title'         => 'Slack',
				'editor_script' => 'acme-slack-editor',
				'is_available'  => '__return_false',
			)
		);

		Integration_Assets::enqueue_editor_scripts();

		$this->assertFalse( wp_script_is( 'acme-slack-editor', 'enqueued' ) );
	}

	/**
	 * Declaring a handle that was never registered is a mistake worth surfacing, not a silent
	 * no-op that leaves the author wondering why their card never appears.
	 */
	public function test_warns_when_the_declared_handle_is_not_registered() {
		add_filter( 'doing_it_wrong_trigger_error', '__return_false' );

		Integration_Registry::register(
			'acme/slack',
			array(
				'title'         => 'Slack',
				'editor_script' => 'never-registered',
			)
		);

		$warned = array();
		add_action(
			'doing_it_wrong_run',
			function ( $function_name, $message ) use ( &$warned ) {
				$warned[] = $message;
			},
			10,
			2
		);

		Integration_Assets::enqueue_editor_scripts();

		$this->assertFalse( wp_script_is( 'never-registered', 'enqueued' ) );
		$this->assertNotEmpty( $warned, 'An unregistered handle should trigger _doing_it_wrong.' );
		$this->assertStringContainsString( 'never-registered', $warned[0] );
		$this->assertStringContainsString( 'acme/slack', $warned[0] );
	}

	/**
	 * An integration that declares no script is simply skipped.
	 */
	public function test_ignores_an_integration_with_no_script() {
		Integration_Registry::register( 'acme/slack', array( 'title' => 'Slack' ) );

		$before = wp_scripts()->queue;

		Integration_Assets::enqueue_editor_scripts();

		$this->assertSame( $before, wp_scripts()->queue );
	}
}
