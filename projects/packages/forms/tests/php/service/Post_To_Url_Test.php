<?php
/**
 * Unit Tests for Post_To_Url.
 *
 * @package automattic/jetpack-forms
 */

namespace Automattic\Jetpack\Forms\Service;

use Automattic\Jetpack\Forms\ContactForm\Contact_Form;
use PHPUnit\Framework\Attributes\CoversClass;
use WorDBless\BaseTestCase;

/**
 * Test class for Post_To_Url
 *
 * @covers Automattic\Jetpack\Forms\Service\Post_To_Url
 */
#[CoversClass( Post_To_Url::class )]
class Post_To_Url_Test extends BaseTestCase {

	/**
	 * Invoke the private get_form_data method on the singleton.
	 *
	 * @param Contact_Form $form         The form instance.
	 * @param array        $entry_values The feedback entry values.
	 * @return array The gathered form data.
	 */
	private function invoke_get_form_data( $form, $entry_values = array() ) {
		$instance = Post_To_Url::init();
		$method   = new \ReflectionMethod( Post_To_Url::class, 'get_form_data' );
		if ( PHP_VERSION_ID < 80100 ) {
			$method->setAccessible( true );
		}
		return $method->invoke( $instance, $form, $entry_values );
	}

	/**
	 * The hiddenFields attribute as an array of `{ name, value }` objects (the original design shape).
	 */
	public function test_get_form_data_hidden_fields_object_shape() {
		$form = $this->create_mock_form(
			array(
				'hiddenFields' => array(
					array(
						'name'  => 'campaign',
						'value' => 'summer',
					),
					array(
						'name'  => 'ref',
						'value' => 'newsletter',
					),
				),
			)
		);

		$data = $this->invoke_get_form_data( $form );

		$this->assertSame( 'summer', $data['campaign'] );
		$this->assertSame( 'newsletter', $data['ref'] );
	}

	/**
	 * Regression test for FORMS-692: hiddenFields stored as an associative
	 * `name => value` map must not fatal with "Cannot access offset of type
	 * string on string" on PHP 8.
	 */
	public function test_get_form_data_hidden_fields_associative_shape() {
		$form = $this->create_mock_form(
			array(
				'hiddenFields' => array(
					'campaign' => 'summer',
					'ref'      => 'newsletter',
				),
			)
		);

		$data = $this->invoke_get_form_data( $form );

		$this->assertSame( 'summer', $data['campaign'] );
		$this->assertSame( 'newsletter', $data['ref'] );
	}

	/**
	 * The hiddenFields attribute stored as a JSON-encoded string should be decoded, not fatal.
	 */
	public function test_get_form_data_hidden_fields_json_string_shape() {
		$form = $this->create_mock_form(
			array(
				'hiddenFields' => '{"campaign":"summer","ref":"newsletter"}',
			)
		);

		$data = $this->invoke_get_form_data( $form );

		$this->assertSame( 'summer', $data['campaign'] );
		$this->assertSame( 'newsletter', $data['ref'] );
	}

	/**
	 * Empty / missing / malformed hiddenFields should be ignored without fatal.
	 */
	public function test_get_form_data_hidden_fields_empty_or_malformed() {
		foreach ( array( null, '', 'not json', array() ) as $value ) {
			$form = $this->create_mock_form( array( 'hiddenFields' => $value ) );
			$data = $this->invoke_get_form_data( $form );
			$this->assertSame( array(), $data, 'Malformed hiddenFields should yield no fields.' );
		}
	}

	/**
	 * Salesforce organizationId is mapped to the `oid` field and lead_source is set.
	 */
	public function test_get_form_data_salesforce_oid_mapping() {
		$form = $this->create_mock_form(
			array(
				'salesforceData' => array( 'organizationId' => '00D000000000001' ),
			)
		);

		$data = $this->invoke_get_form_data( $form, array( 'entry_permalink' => 'https://example.com/entry' ) );

		$this->assertSame( '00D000000000001', $data['oid'] );
		$this->assertSame( 'https://example.com/entry', $data['lead_source'] );
	}

	/**
	 * Create a mock Contact_Form with the given attributes (no parent constructor).
	 *
	 * @param array $attributes Form attributes.
	 * @return Contact_Form
	 */
	private function create_mock_form( $attributes ) {
		return new class( $attributes ) extends Contact_Form {
			/**
			 * Constructor.
			 *
			 * @param array $attributes Form attributes.
			 */
			public function __construct( $attributes ) {
				// Don't call parent constructor - just set properties directly.
				$this->attributes = $attributes;
				$this->fields     = array();
			}
		};
	}
}
