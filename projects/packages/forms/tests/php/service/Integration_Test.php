<?php
/**
 * Unit Tests for Automattic\Jetpack\Forms\Service\Integration.
 *
 * @package automattic/jetpack-forms
 */

namespace Automattic\Jetpack\Forms\Service;

use PHPUnit\Framework\Attributes\CoversClass;
use WorDBless\BaseTestCase;

/**
 * Test class for Integration
 *
 * @covers Automattic\Jetpack\Forms\Service\Integration
 */
#[CoversClass( Integration::class )]
class Integration_Test extends BaseTestCase {

	/**
	 * Test basic constructor and getters.
	 */
	public function test_constructor_and_getters() {
		$name = 'test-integration';
		$args = array(
			'type'  => 'plugin',
			'title' => 'Test Integration',
		);

		$integration = new Integration( $name, $args );

		$this->assertEquals( $name, $integration->get_name() );
		$this->assertEquals( $args, $integration->get_args() );
	}

	/**
	 * Test constructor with name only.
	 */
	public function test_constructor_with_name_only() {
		$name = 'simple-integration';

		$integration = new Integration( $name );

		$this->assertEquals( $name, $integration->get_name() );
		$this->assertEquals( array(), $integration->get_args() );
	}

	/**
	 * Test to_array method.
	 */
	public function test_to_array() {
		$name = 'array-test';
		$args = array(
			'type'                    => 'service',
			'title'                   => 'Array Test Service',
			'subtitle'                => 'Testing array conversion',
			'enabled_by_default'      => true,
			'marketing_redirect_slug' => 'array-test',
		);

		$integration = new Integration( $name, $args );

		$this->assertEquals( $args, $integration->to_array() );
	}

	/**
	 * Test with complex configuration.
	 */
	public function test_complex_configuration() {
		$name = 'complex-integration';
		$args = array(
			'type'                    => 'plugin',
			'file'                    => 'complex-plugin/complex-plugin.php',
			'settings_url'            => 'admin.php?page=complex-settings',
			'marketing_redirect_slug' => 'complex-marketing',
			'title'                   => 'Complex Integration',
			'subtitle'                => 'A complex integration for testing',
			'enabled_by_default'      => false,
			'custom_field'            => 'custom_value',
			'nested_config'           => array(
				'option1' => 'value1',
				'option2' => 'value2',
			),
		);

		$integration = new Integration( $name, $args );

		$this->assertEquals( $name, $integration->get_name() );
		$this->assertEquals( $args, $integration->get_args() );
		$this->assertEquals( $args, $integration->to_array() );

		// Test specific nested values
		$returned_args = $integration->get_args();
		$this->assertEquals( 'custom_value', $returned_args['custom_field'] );
		$this->assertEquals( 'value1', $returned_args['nested_config']['option1'] );
	}

	/**
	 * Test with empty configuration.
	 */
	public function test_empty_configuration() {
		$name = 'empty-config';
		$args = array();

		$integration = new Integration( $name, $args );

		$this->assertEquals( $name, $integration->get_name() );
		$this->assertEquals( array(), $integration->get_args() );
		$this->assertEquals( array(), $integration->to_array() );
	}

	/**
	 * Test integration with real-world MailPoet-like configuration.
	 */
	public function test_mailpoet_like_configuration() {
		$name = 'mailpoet';
		$args = array(
			'type'                    => 'plugin',
			'file'                    => 'mailpoet/mailpoet.php',
			'settings_url'            => 'admin.php?page=mailpoet-homepage',
			'marketing_redirect_slug' => 'org-mailpoet',
			'title'                   => 'MailPoet email marketing',
			'subtitle'                => 'Send newsletters and marketing emails directly from your site.',
			'enabled_by_default'      => false,
		);

		$integration = new Integration( $name, $args );

		$this->assertEquals( 'mailpoet', $integration->get_name() );
		$this->assertEquals( 'plugin', $integration->get_args()['type'] );
		$this->assertEquals( 'MailPoet email marketing', $integration->get_args()['title'] );
		$this->assertFalse( $integration->get_args()['enabled_by_default'] );

		// Verify to_array returns the exact same structure
		$array_format = $integration->to_array();
		$this->assertEquals( $args, $array_format );
	}
}
