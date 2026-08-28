<?php
/**
 * Unit tests for Integration_Registry.
 *
 * @package automattic/jetpack-forms
 */

namespace Automattic\Jetpack\Forms\Integrations;

use PHPUnit\Framework\Attributes\CoversClass;
use WorDBless\BaseTestCase;

/**
 * Test class for Integration_Registry.
 *
 * @covers Automattic\Jetpack\Forms\Integrations\Integration_Registry
 */
#[CoversClass( Integration_Registry::class )]
class Integration_Registry_Test extends BaseTestCase {

	/**
	 * Leave the registry empty for the next test.
	 */
	protected function tear_down() {
		Integration_Registry::reset();
		Built_In_Integrations::reset();
		remove_all_filters( 'doing_it_wrong_trigger_error' );
	}

	/**
	 * A registration only has to name the keys it cares about; the rest are filled in.
	 */
	public function test_register_fills_in_defaults() {
		Integration_Registry::register( 'slack', array( 'title' => 'Slack' ) );

		$args = Integration_Registry::get( 'slack' );

		$this->assertSame( 'Slack', $args['title'] );
		$this->assertSame( 'service', $args['type'] );
		$this->assertFalse( $args['enabled_by_default'] );
		$this->assertNull( $args['status_callback'] );
		$this->assertNull( $args['on_submission'] );
		$this->assertNull( $args['settings_attribute'] );
		$this->assertArrayHasKey( 'editor_script', $args );
	}

	/**
	 * Nothing is registered for an unknown slug.
	 */
	public function test_get_returns_null_when_not_registered() {
		$this->assertNull( Integration_Registry::get( 'nope' ) );
	}

	/**
	 * Slugs are used as REST identifiers and as block attribute keys, so they are constrained.
	 */
	public function test_register_rejects_invalid_slug() {
		add_filter( 'doing_it_wrong_trigger_error', '__return_false' );

		$this->assertFalse( Integration_Registry::register( '', array() ) );
		$this->assertFalse( Integration_Registry::register( 'has spaces', array() ) );
		$this->assertFalse( Integration_Registry::register( 'has/slash', array() ) );
		$this->assertSame( array(), Integration_Registry::all() );
	}

	/**
	 * Re-registering a slug replaces it, so a plugin can override a bundled integration.
	 */
	public function test_register_overwrites_an_existing_slug() {
		Integration_Registry::register( 'slack', array( 'title' => 'First' ) );
		Integration_Registry::register( 'slack', array( 'title' => 'Second' ) );

		$this->assertCount( 1, Integration_Registry::all() );
		$this->assertSame( 'Second', Integration_Registry::get( 'slack' )['title'] );
	}

	/**
	 * Unregistering removes the entry.
	 */
	public function test_unregister_removes_the_integration() {
		Integration_Registry::register( 'slack', array( 'title' => 'Slack' ) );
		Integration_Registry::unregister( 'slack' );

		$this->assertNull( Integration_Registry::get( 'slack' ) );
	}

	/**
	 * Registration order carries no meaning, but every registration is kept.
	 */
	public function test_all_returns_every_registration() {
		Integration_Registry::register( 'zulip', array( 'title' => 'Zulip' ) );
		Integration_Registry::register( 'akismet', array( 'title' => 'Akismet' ) );

		$this->assertSame( array( 'zulip', 'akismet' ), array_keys( Integration_Registry::all() ) );
	}

	/**
	 * An integration with no is_available callback is always available.
	 */
	public function test_available_includes_integrations_without_a_callback() {
		Integration_Registry::register( 'slack', array( 'title' => 'Slack' ) );

		$this->assertArrayHasKey( 'slack', Integration_Registry::available() );
	}

	/**
	 * The is_available callback is the seam a feature flag uses: a flagged-off integration is absent, not
	 * merely disabled.
	 */
	public function test_available_excludes_integrations_whose_callback_returns_false() {
		Integration_Registry::register(
			'slack',
			array(
				'title'        => 'Slack',
				'is_available' => '__return_false',
			)
		);
		Integration_Registry::register(
			'akismet',
			array(
				'title'        => 'Akismet',
				'is_available' => '__return_true',
			)
		);

		$available = Integration_Registry::available();

		$this->assertArrayNotHasKey( 'slack', $available );
		$this->assertArrayHasKey( 'akismet', $available );
		// all() still knows about it, so the UI can tell "not registered" from "not available".
		$this->assertArrayHasKey( 'slack', Integration_Registry::all() );
	}

	/**
	 * A non-callable is_available is treated as unavailable rather than fatal.
	 */
	public function test_available_excludes_integrations_with_an_uncallable_callback() {
		Integration_Registry::register(
			'slack',
			array(
				'title'        => 'Slack',
				'is_available' => 'this_function_does_not_exist',
			)
		);

		$this->assertArrayNotHasKey( 'slack', Integration_Registry::available() );
	}

	/**
	 * New integrations get namespaced storage; legacy ones name their own attribute.
	 */
	public function test_get_settings_attribute() {
		Integration_Registry::register( 'slack', array( 'title' => 'Slack' ) );
		Integration_Registry::register(
			'salesforce',
			array(
				'title'              => 'Salesforce',
				'settings_attribute' => 'salesforceData',
			)
		);

		$this->assertNull( Integration_Registry::get_settings_attribute( 'slack' ) );
		$this->assertSame(
			array(
				'name'    => 'salesforceData',
				'maps_to' => null,
			),
			Integration_Registry::get_settings_attribute( 'salesforce' )
		);
		$this->assertNull( Integration_Registry::get_settings_attribute( 'not-registered' ) );
	}

	/**
	 * A malformed settings_attribute is ignored rather than corrupting the lookup.
	 */
	public function test_register_ignores_a_malformed_settings_attribute() {
		Integration_Registry::register(
			'slack',
			array(
				'title'              => 'Slack',
				'settings_attribute' => array( 'nope' ),
			)
		);
		Integration_Registry::register(
			'zulip',
			array(
				'title'              => 'Zulip',
				'settings_attribute' => 42,
			)
		);

		$this->assertNull( Integration_Registry::get_settings_attribute( 'slack' ) );
		$this->assertNull( Integration_Registry::get_settings_attribute( 'zulip' ) );
	}

	/**
	 * A scalar legacy attribute declares the single setting its value stands for.
	 */
	public function test_register_normalizes_a_mapped_settings_attribute() {
		Integration_Registry::register(
			'zero-bs-crm',
			array(
				'title'              => 'Jetpack CRM',
				'settings_attribute' => array(
					'name'    => 'jetpackCRM',
					'maps_to' => 'enabled',
				),
			)
		);

		$this->assertSame(
			array(
				'name'    => 'jetpackCRM',
				'maps_to' => 'enabled',
			),
			Integration_Registry::get_settings_attribute( 'zero-bs-crm' )
		);
	}
}
