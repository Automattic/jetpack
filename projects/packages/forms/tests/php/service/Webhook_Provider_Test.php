<?php
/**
 * Unit Tests for Webhook Providers.
 *
 * @package automattic/jetpack-forms
 */

namespace Automattic\Jetpack\Forms\Service;

use Automattic\Jetpack\Forms\ContactForm\Contact_Form;
use PHPUnit\Framework\Attributes\CoversClass;
use WorDBless\BaseTestCase;

/**
 * Test class for Webhook Providers
 *
 * @covers Automattic\Jetpack\Forms\Service\Generic_Webhook_Provider
 * @covers Automattic\Jetpack\Forms\Service\Salesforce_Webhook_Provider
 */
#[CoversClass( Generic_Webhook_Provider::class )]
#[CoversClass( Salesforce_Webhook_Provider::class )]
class Webhook_Provider_Test extends BaseTestCase {

	/**
	 * Test Generic_Webhook_Provider::get_setup with valid configuration.
	 */
	public function test_generic_provider_get_setup_with_valid_config() {
		$attributes = array(
			'postToUrl' => array(
				'enabled' => true,
				'url'     => 'https://example.com/webhook',
				'format'  => 'json',
			),
		);

		$provider = new Generic_Webhook_Provider( $attributes );
		$setup    = $provider->get_setup();

		$this->assertIsArray( $setup );
		$this->assertTrue( $setup['enabled'] );
		$this->assertTrue( $provider->is_enabled() );
		$this->assertEquals( 'https://example.com/webhook', $setup['url'] );
		$this->assertEquals( 'json', $setup['format'] );
		$this->assertFalse( $setup['verified'] );
	}

	/**
	 * Test Generic_Webhook_Provider::get_setup with disabled configuration.
	 */
	public function test_generic_provider_get_setup_with_disabled_config() {
		$attributes = array(
			'postToUrl' => array(
				'enabled' => false,
				'url'     => 'https://example.com/webhook',
			),
		);

		$provider = new Generic_Webhook_Provider( $attributes );
		$setup    = $provider->get_setup();

		$this->assertFalse( $setup );
		$this->assertFalse( $provider->is_enabled() );
	}

	/**
	 * Test Generic_Webhook_Provider::get_setup with missing URL.
	 */
	public function test_generic_provider_get_setup_with_missing_url() {
		$attributes = array(
			'postToUrl' => array(
				'enabled' => true,
				'format'  => 'json',
			),
		);

		$provider = new Generic_Webhook_Provider( $attributes );
		$setup    = $provider->get_setup();

		$this->assertFalse( $setup );
		$this->assertFalse( $provider->is_enabled() );
	}

	/**
	 * Test Generic_Webhook_Provider::get_setup with invalid format.
	 */
	public function test_generic_provider_get_setup_with_invalid_format() {
		$attributes = array(
			'postToUrl' => array(
				'enabled' => true,
				'url'     => 'https://example.com/webhook',
				'format'  => 'xml', // Invalid format
			),
		);

		$provider = new Generic_Webhook_Provider( $attributes );
		$setup    = $provider->get_setup();

		$this->assertFalse( $setup );
		$this->assertFalse( $provider->is_enabled() );
	}

	/**
	 * Test Generic_Webhook_Provider::get_setup defaults to urlencoded.
	 */
	public function test_generic_provider_get_setup_defaults_to_urlencoded() {
		$attributes = array(
			'postToUrl' => array(
				'enabled' => true,
				'url'     => 'https://example.com/webhook',
			),
		);

		$provider = new Generic_Webhook_Provider( $attributes );
		$setup    = $provider->get_setup();

		$this->assertIsArray( $setup );
		$this->assertTrue( $provider->is_enabled() );
		$this->assertEquals( 'urlencoded', $setup['format'] );
	}

	/**
	 * Test Generic_Webhook_Provider::transform_data doesn't modify data.
	 */
	public function test_generic_provider_transform_data_unchanged() {
		$attributes = array(
			'postToUrl' => array(
				'enabled' => true,
				'url'     => 'https://example.com/webhook',
			),
		);

		$provider = new Generic_Webhook_Provider( $attributes );

		$form_data = array(
			'name'  => 'John Doe',
			'email' => 'john@example.com',
		);

		$form         = $this->getMockBuilder( Contact_Form::class )
			->disableOriginalConstructor()
			->getMock();
		$entry_values = array( 'entry_permalink' => 'https://example.com/post/123' );

		$result = $provider->transform_data( $form_data, $form, $entry_values );

		$this->assertEquals( $form_data, $result );
	}

	/**
	 * Test Salesforce_Webhook_Provider::get_setup with valid salesforceData.
	 */
	public function test_salesforce_provider_get_setup_with_valid_config() {
		$attributes = array(
			'salesforceData' => array(
				'organizationId' => '00D123456789ABC',
			),
		);

		$provider = new Salesforce_Webhook_Provider( $attributes );
		$setup    = $provider->get_setup();

		$this->assertIsArray( $setup );
		$this->assertTrue( $setup['enabled'] );
		$this->assertTrue( $provider->is_enabled() );
		$this->assertTrue( $setup['verified'] );
		$this->assertEquals( 'https://webto.salesforce.com/servlet/servlet.WebToLead?encoding=UTF-8', $setup['url'] );
		$this->assertEquals( 'urlencoded', $setup['format'] );
	}

	/**
	 * Test Salesforce_Webhook_Provider::get_setup without salesforceData.
	 */
	public function test_salesforce_provider_get_setup_without_salesforce_data() {
		$attributes = array();

		$provider = new Salesforce_Webhook_Provider( $attributes );
		$setup    = $provider->get_setup();

		$this->assertFalse( $setup );
		$this->assertFalse( $provider->is_enabled() );
	}

	/**
	 * Test Salesforce_Webhook_Provider::get_setup without organizationId.
	 */
	public function test_salesforce_provider_get_setup_without_organization_id() {
		$attributes = array(
			'salesforceData' => array(),
		);

		$provider = new Salesforce_Webhook_Provider( $attributes );
		$setup    = $provider->get_setup();

		$this->assertFalse( $setup );
		$this->assertFalse( $provider->is_enabled() );
	}

	/**
	 * Test Salesforce_Webhook_Provider::transform_data adds Salesforce fields.
	 */
	public function test_salesforce_provider_transform_data_adds_fields() {
		$attributes = array(
			'salesforceData' => array(
				'organizationId' => '00D123456789ABC',
			),
		);

		$provider = new Salesforce_Webhook_Provider( $attributes );

		$form_data = array(
			'first_name' => 'John',
			'last_name'  => 'Doe',
			'email'      => 'john@example.com',
		);

		$form             = $this->getMockBuilder( Contact_Form::class )
			->disableOriginalConstructor()
			->getMock();
		$form->attributes = array(
			'salesforceData' => array(
				'organizationId' => '00D123456789ABC',
			),
		);
		$entry_values     = array( 'entry_permalink' => 'https://example.com/post/123' );

		$result = $provider->transform_data( $form_data, $form, $entry_values );

		$this->assertArrayHasKey( 'oid', $result );
		$this->assertArrayHasKey( 'lead_source', $result );
		$this->assertSame( '00D123456789ABC', $result['oid'] );
		$this->assertEquals( 'https://example.com/post/123', $result['lead_source'] );
		// Original data should still be present
		$this->assertEquals( 'John', $result['first_name'] );
		$this->assertEquals( 'Doe', $result['last_name'] );
		$this->assertEquals( 'john@example.com', $result['email'] );
	}

	/**
	 * Test Salesforce_Webhook_Provider::transform_data sanitizes organizationId.
	 */
	public function test_salesforce_provider_transform_data_sanitizes_org_id() {
		$attributes = array(
			'salesforceData' => array(
				'organizationId' => '<script>alert("xss")</script>00D123',
			),
		);

		$provider = new Salesforce_Webhook_Provider( $attributes );

		$form_data = array(
			'email' => 'john@example.com',
		);

		$form             = $this->getMockBuilder( Contact_Form::class )
			->disableOriginalConstructor()
			->getMock();
		$form->attributes = array(
			'salesforceData' => array(
				'organizationId' => '<script>alert("xss")</script>00D123',
			),
		);
		$entry_values     = array( 'entry_permalink' => 'https://example.com/post/123' );

		$result = $provider->transform_data( $form_data, $form, $entry_values );

		$this->assertStringNotContainsString( '<script>', $result['oid'] );
		$this->assertStringNotContainsString( 'alert', $result['oid'] );
	}

	/**
	 * Test Salesforce_Webhook_Provider::transform_data without salesforceData.
	 */
	public function test_salesforce_provider_transform_data_without_salesforce_data() {
		$attributes = array();

		$provider = new Salesforce_Webhook_Provider( $attributes );

		$form_data = array(
			'email' => 'john@example.com',
		);

		$form             = $this->getMockBuilder( Contact_Form::class )
			->disableOriginalConstructor()
			->getMock();
		$form->attributes = array();
		$entry_values     = array( 'entry_permalink' => 'https://example.com/post/123' );

		$result = $provider->transform_data( $form_data, $form, $entry_values );

		// Should not add Salesforce fields
		$this->assertArrayNotHasKey( 'oid', $result );
		$this->assertArrayNotHasKey( 'lead_source', $result );
		// Original data should be unchanged
		$this->assertEquals( $form_data, $result );
	}
}
