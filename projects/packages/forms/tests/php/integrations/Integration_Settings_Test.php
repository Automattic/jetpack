<?php
/**
 * Unit tests for Integration_Settings.
 *
 * @package automattic/jetpack-forms
 */

namespace Automattic\Jetpack\Forms\Integrations;

use PHPUnit\Framework\Attributes\CoversClass;
use WorDBless\BaseTestCase;

/**
 * Test class for Integration_Settings.
 *
 * @covers Automattic\Jetpack\Forms\Integrations\Integration_Settings
 */
#[CoversClass( Integration_Settings::class )]
class Integration_Settings_Test extends BaseTestCase {

	/**
	 * Leave the registry empty for the next test.
	 */
	protected function tear_down() {
		Integration_Registry::reset();
		Built_In_Integrations::reset();
	}

	/**
	 * An integration that declares no storage reads the shared container under its slug.
	 */
	public function test_reads_the_shared_container_by_slug() {
		Integration_Registry::register( 'slack', array( 'title' => 'Slack' ) );

		$attributes = array(
			'integrations' => array(
				'slack' => array( 'webhookUrl' => 'https://hooks.slack.com/services/A/B/C' ),
				'other' => array( 'webhookUrl' => 'nope' ),
			),
		);

		$this->assertSame(
			array( 'webhookUrl' => 'https://hooks.slack.com/services/A/B/C' ),
			Integration_Settings::get( 'slack', $attributes )
		);
	}

	/**
	 * An integration that predates the container keeps reading its own top-level attribute,
	 * so forms saved before the container existed keep working.
	 */
	public function test_reads_a_legacy_attribute_when_one_is_declared() {
		Integration_Registry::register(
			'salesforce',
			array(
				'title'              => 'Salesforce',
				'settings_attribute' => 'salesforceData',
			)
		);

		$attributes = array(
			'salesforceData' => array( 'organizationId' => '00D000000000001' ),
		);

		$this->assertSame(
			array( 'organizationId' => '00D000000000001' ),
			Integration_Settings::get( 'salesforce', $attributes )
		);
	}

	/**
	 * A legacy integration reads only its own attribute. If it also read the container, a form
	 * carrying both would silently pick a winner.
	 */
	public function test_a_legacy_integration_ignores_the_shared_container() {
		Integration_Registry::register(
			'salesforce',
			array(
				'title'              => 'Salesforce',
				'settings_attribute' => 'salesforceData',
			)
		);

		$attributes = array(
			'salesforceData' => array( 'organizationId' => 'legacy' ),
			'integrations'   => array(
				'salesforce' => array( 'organizationId' => 'container' ),
			),
		);

		$this->assertSame(
			array( 'organizationId' => 'legacy' ),
			Integration_Settings::get( 'salesforce', $attributes )
		);
	}

	/**
	 * A form with nothing stored yields an empty array, never a notice.
	 */
	public function test_returns_an_empty_array_when_the_form_has_no_settings() {
		Integration_Registry::register( 'slack', array( 'title' => 'Slack' ) );

		$this->assertSame( array(), Integration_Settings::get( 'slack', array() ) );
		$this->assertSame( array(), Integration_Settings::get( 'slack', array( 'integrations' => array() ) ) );
		$this->assertSame( array(), Integration_Settings::get( 'slack', null ) );
	}

	/**
	 * An unregistered slug has no legacy attribute, so it falls back to the container.
	 */
	public function test_an_unregistered_slug_reads_the_container() {
		$attributes = array(
			'integrations' => array( 'slack' => array( 'webhookUrl' => 'x' ) ),
		);

		$this->assertSame( array( 'webhookUrl' => 'x' ), Integration_Settings::get( 'slack', $attributes ) );
	}

	/**
	 * Attributes that have round-tripped through JSON arrive as objects.
	 */
	public function test_casts_an_object_to_an_array() {
		Integration_Registry::register( 'slack', array( 'title' => 'Slack' ) );

		$attributes = array(
			'integrations' => array( 'slack' => (object) array( 'webhookUrl' => 'x' ) ),
		);

		$this->assertSame( array( 'webhookUrl' => 'x' ), Integration_Settings::get( 'slack', $attributes ) );
	}

	/**
	 * A namespaced slug is used verbatim as the container key, so two plugins storing a
	 * "slack" integration on the same form do not overwrite each other.
	 */
	public function test_a_namespaced_slug_keys_the_container_verbatim() {
		Integration_Registry::register( 'jetpack/slack', array( 'title' => 'Slack' ) );
		Integration_Registry::register( 'acme/slack', array( 'title' => 'Acme Slack' ) );

		$attributes = array(
			'integrations' => array(
				'jetpack/slack' => array( 'webhookUrl' => 'ours' ),
				'acme/slack'    => array( 'webhookUrl' => 'theirs' ),
			),
		);

		$this->assertSame( array( 'webhookUrl' => 'ours' ), Integration_Settings::get( 'jetpack/slack', $attributes ) );
		$this->assertSame( array( 'webhookUrl' => 'theirs' ), Integration_Settings::get( 'acme/slack', $attributes ) );
	}

	/**
	 * The jetpackCRM attribute is a bare boolean rather than a settings object, so it declares the setting
	 * its value stands for and callers still get a settings array.
	 */
	public function test_maps_a_scalar_legacy_attribute_onto_a_named_setting() {
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
			array( 'enabled' => true ),
			Integration_Settings::get( 'zero-bs-crm', array( 'jetpackCRM' => true ) )
		);
		$this->assertSame(
			array( 'enabled' => false ),
			Integration_Settings::get( 'zero-bs-crm', array( 'jetpackCRM' => false ) )
		);
	}

	/**
	 * A form that never set the scalar attribute has no settings, which is distinct from
	 * having set it to false.
	 */
	public function test_an_unset_scalar_legacy_attribute_yields_no_settings() {
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

		$this->assertSame( array(), Integration_Settings::get( 'zero-bs-crm', array() ) );
	}

	/**
	 * A scalar where settings are expected yields an empty array rather than a type error.
	 */
	public function test_returns_an_empty_array_for_a_scalar_value() {
		Integration_Registry::register( 'slack', array( 'title' => 'Slack' ) );

		$attributes = array( 'integrations' => array( 'slack' => 'not-an-array' ) );

		$this->assertSame( array(), Integration_Settings::get( 'slack', $attributes ) );
	}
}
