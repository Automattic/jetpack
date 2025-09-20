<?php
/**
 * Unit Tests for Automattic\Jetpack\Forms\Service\Integrations.
 *
 * @package automattic/jetpack-forms
 */

namespace Automattic\Jetpack\Forms\Service;

use PHPUnit\Framework\Attributes\CoversClass;
use WorDBless\BaseTestCase;

/**
 * Test class for Integrations
 *
 * @covers Automattic\Jetpack\Forms\Service\Integrations
 */
#[CoversClass( Integrations::class )]
class Integrations_Test extends BaseTestCase {

	protected function setUp(): void {
		parent::setUp();

		// Reset the static state before each test
		$reflection            = new \ReflectionClass( Integrations::class );
		$integrations_property = $reflection->getProperty( 'integrations' );
		$integrations_property->setAccessible( true );
		$integrations_property->setValue( null, array() );

		$initialized_property = $reflection->getProperty( 'initialized' );
		$initialized_property->setAccessible( true );
		$initialized_property->setValue( null, false );

		// Remove any existing filters
		remove_all_filters( 'jetpack_forms_supported_integrations' );
	}

	protected function tearDown(): void {
		parent::tearDown();

		// Clean up filters
		remove_all_filters( 'jetpack_forms_supported_integrations' );
	}

	/**
	 * Test that init() adds the filter and sets initialized flag.
	 */
	public function test_init_adds_filter_and_sets_initialized() {
		// Verify filter is not added initially
		$this->assertFalse( has_filter( 'jetpack_forms_supported_integrations', array( Integrations::class, 'add_registered_integrations' ) ) );

		// Initialize
		Integrations::init();

		// Verify filter is added
		$this->assertNotFalse( has_filter( 'jetpack_forms_supported_integrations', array( Integrations::class, 'add_registered_integrations' ) ) );

		// Verify calling init again doesn't add duplicate filters
		Integrations::init();
		$this->assertEquals( 10, has_filter( 'jetpack_forms_supported_integrations', array( Integrations::class, 'add_registered_integrations' ) ) );
	}

	/**
	 * Test registering a single integration.
	 */
	public function test_register_single_integration() {
		$test_integration = array(
			'type'                    => 'plugin',
			'file'                    => 'test-plugin/test-plugin.php',
			'settings_url'            => 'admin.php?page=test-plugin',
			'marketing_redirect_slug' => 'test-plugin',
			'title'                   => 'Test Plugin',
			'subtitle'                => 'A test plugin for forms',
			'enabled_by_default'      => false,
		);

		Integrations::register( 'test-plugin', $test_integration );

		$registered = Integrations::get_registered_integrations();
		$this->assertArrayHasKey( 'test-plugin', $registered );
		$this->assertEquals( $test_integration, $registered['test-plugin'] );
	}

	/**
	 * Test registering multiple integrations.
	 */
	public function test_register_multiple_integrations() {
		$integration1 = array(
			'type'  => 'plugin',
			'title' => 'Integration 1',
		);

		$integration2 = array(
			'type'  => 'service',
			'title' => 'Integration 2',
		);

		Integrations::register( 'integration-1', $integration1 );
		Integrations::register( 'integration-2', $integration2 );

		$registered = Integrations::get_registered_integrations();
		$this->assertCount( 2, $registered );
		$this->assertArrayHasKey( 'integration-1', $registered );
		$this->assertArrayHasKey( 'integration-2', $registered );
		$this->assertEquals( $integration1, $registered['integration-1'] );
		$this->assertEquals( $integration2, $registered['integration-2'] );
	}

	/**
	 * Test that registering an integration with same slug overwrites previous one.
	 */
	public function test_register_overwrites_existing_integration() {
		$original_integration = array(
			'type'  => 'plugin',
			'title' => 'Original Title',
		);

		$updated_integration = array(
			'type'  => 'service',
			'title' => 'Updated Title',
		);

		Integrations::register( 'test-integration', $original_integration );
		Integrations::register( 'test-integration', $updated_integration );

		$registered = Integrations::get_registered_integrations();
		$this->assertCount( 1, $registered );
		$this->assertEquals( $updated_integration, $registered['test-integration'] );
	}

	/**
	 * Test get_registered_integrations returns empty array initially.
	 */
	public function test_get_registered_integrations_empty_initially() {
		$registered = Integrations::get_registered_integrations();
		$this->assertIsArray( $registered );
		$this->assertEmpty( $registered );
	}

	/**
	 * Test add_registered_integrations merges with existing integrations.
	 */
	public function test_add_registered_integrations_merges_arrays() {
		$existing_integrations = array(
			'existing-1' => array(
				'type'  => 'plugin',
				'title' => 'Existing Plugin 1',
			),
			'existing-2' => array(
				'type'  => 'service',
				'title' => 'Existing Service 2',
			),
		);

		$registered_integration = array(
			'type'  => 'plugin',
			'title' => 'Registered Plugin',
		);

		Integrations::register( 'registered-plugin', $registered_integration );

		$result = Integrations::add_registered_integrations( $existing_integrations );

		$this->assertCount( 3, $result );
		$this->assertArrayHasKey( 'existing-1', $result );
		$this->assertArrayHasKey( 'existing-2', $result );
		$this->assertArrayHasKey( 'registered-plugin', $result );
		$this->assertEquals( $registered_integration, $result['registered-plugin'] );
	}

	/**
	 * Test add_registered_integrations with registered integration overriding existing one.
	 */
	public function test_add_registered_integrations_overwrites_existing() {
		$existing_integrations = array(
			'common-integration' => array(
				'type'  => 'plugin',
				'title' => 'Original Title',
			),
		);

		$registered_integration = array(
			'type'  => 'service',
			'title' => 'Overridden Title',
		);

		Integrations::register( 'common-integration', $registered_integration );

		$result = Integrations::add_registered_integrations( $existing_integrations );

		$this->assertCount( 1, $result );
		$this->assertEquals( $registered_integration, $result['common-integration'] );
		$this->assertEquals( 'service', $result['common-integration']['type'] );
		$this->assertEquals( 'Overridden Title', $result['common-integration']['title'] );
	}

	/**
	 * Test that the filter integration works end-to-end.
	 */
	public function test_filter_integration_end_to_end() {
		// Initialize the integrations system
		Integrations::init();

		// Register a test integration
		$test_integration = array(
			'type'                    => 'plugin',
			'file'                    => 'my-newsletter/my-newsletter.php',
			'settings_url'            => 'admin.php?page=my-newsletter',
			'marketing_redirect_slug' => 'my-newsletter',
			'title'                   => 'My Newsletter Service',
			'subtitle'                => 'Send newsletters to subscribers.',
			'enabled_by_default'      => false,
		);

		Integrations::register( 'my-newsletter', $test_integration );

		// Simulate existing integrations (like from the hardcoded list)
		$existing_integrations = array(
			'akismet' => array(
				'type'  => 'plugin',
				'title' => 'Akismet Spam Protection',
			),
		);

		// Apply the filter as WordPress would
		$result = apply_filters( 'jetpack_forms_supported_integrations', $existing_integrations );

		// Verify that our registered integration is included
		$this->assertCount( 2, $result );
		$this->assertArrayHasKey( 'akismet', $result );
		$this->assertArrayHasKey( 'my-newsletter', $result );
		$this->assertEquals( $test_integration, $result['my-newsletter'] );
	}

	/**
	 * Test integration configuration validation (basic structure).
	 */
	public function test_integration_configuration_structure() {
		$valid_plugin_integration = array(
			'type'                    => 'plugin',
			'file'                    => 'plugin/plugin.php',
			'settings_url'            => 'admin.php?page=plugin',
			'marketing_redirect_slug' => 'plugin',
			'title'                   => 'Plugin Title',
			'subtitle'                => 'Plugin subtitle',
			'enabled_by_default'      => false,
		);

		$valid_service_integration = array(
			'type'                    => 'service',
			'file'                    => null,
			'settings_url'            => null,
			'marketing_redirect_slug' => null,
			'title'                   => 'Service Title',
			'subtitle'                => 'Service subtitle',
			'enabled_by_default'      => true,
		);

		Integrations::register( 'valid-plugin', $valid_plugin_integration );
		Integrations::register( 'valid-service', $valid_service_integration );

		$registered = Integrations::get_registered_integrations();

		$this->assertEquals( $valid_plugin_integration, $registered['valid-plugin'] );
		$this->assertEquals( $valid_service_integration, $registered['valid-service'] );
	}

	/**
	 * Test that empty or null configurations can be registered.
	 */
	public function test_register_empty_configuration() {
		Integrations::register( 'empty-config', array() );
		Integrations::register( 'minimal-config', array( 'type' => 'plugin' ) );

		$registered = Integrations::get_registered_integrations();

		$this->assertArrayHasKey( 'empty-config', $registered );
		$this->assertArrayHasKey( 'minimal-config', $registered );
		$this->assertEquals( array(), $registered['empty-config'] );
		$this->assertEquals( array( 'type' => 'plugin' ), $registered['minimal-config'] );
	}

	/**
	 * Test registering Integration objects.
	 */
	public function test_register_integration_object() {
		$integration_config = array(
			'type'  => 'service',
			'title' => 'Object Integration',
		);

		$integration = new Integration( 'object-integration', $integration_config );
		Integrations::register( $integration );

		$registered = Integrations::get_registered_integrations();

		$this->assertArrayHasKey( 'object-integration', $registered );
		$this->assertEquals( $integration_config, $registered['object-integration'] );
	}

	/**
	 * Test mixing Integration objects and array registrations.
	 */
	public function test_mixed_registration_types() {
		// Register with array
		Integrations::register( 'array-integration', array( 'type' => 'plugin' ) );

		// Register with Integration object
		$integration = new Integration( 'object-integration', array( 'type' => 'service' ) );
		Integrations::register( $integration );

		$registered = Integrations::get_registered_integrations();

		$this->assertCount( 2, $registered );
		$this->assertArrayHasKey( 'array-integration', $registered );
		$this->assertArrayHasKey( 'object-integration', $registered );
		$this->assertEquals( array( 'type' => 'plugin' ), $registered['array-integration'] );
		$this->assertEquals( array( 'type' => 'service' ), $registered['object-integration'] );
	}

	/**
	 * Test that Integration object overwrites existing integration with same name.
	 */
	public function test_integration_object_overwrites() {
		// Register with array first
		Integrations::register(
			'same-name',
			array(
				'type'    => 'plugin',
				'version' => 1,
			)
		);

		// Register with Integration object with same name
		$integration = new Integration(
			'same-name',
			array(
				'type'    => 'service',
				'version' => 2,
			)
		);
		Integrations::register( $integration );

		$registered = Integrations::get_registered_integrations();

		$this->assertCount( 1, $registered );
		$this->assertEquals(
			array(
				'type'    => 'service',
				'version' => 2,
			),
			$registered['same-name']
		);
	}
}
