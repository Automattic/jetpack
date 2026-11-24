<?php
/**
 * Tests for the Jetpack CRM integration.
 *
 * @package automattic/jetpack-forms
 */

namespace Automattic\Jetpack\Forms\Service;

use Automattic\Jetpack\Forms\ContactForm\Contact_Form;
use Automattic\Jetpack\Forms\ContactForm\Contact_Form_Field;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use WorDBless\BaseTestCase;

require_once __DIR__ . '/../fixtures/jetpack-crm-stub.php';

/**
 * @covers Automattic\Jetpack\Forms\Service\Jetpack_CRM_Integration
 */
#[CoversClass( Jetpack_CRM_Integration::class )]
class Jetpack_CRM_Integration_Test extends BaseTestCase {

	/**
	 * Stands in for Jetpack CRM's custom field store.
	 */
	public function set_up() {
		parent::set_up();

		$GLOBALS['jetpack_crm_stub_calls'] = array();
		$GLOBALS['zbs']                    = (object) array(
			'DAL' => new class() {
				// phpcs:ignore WordPress.NamingConventions.ValidFunctionName.MethodNameInvalid -- Jetpack CRM's name.
				public function getActiveCustomFields() {
					return array(
						'organization' => array( 'text', 'Organization', '', 'organization' ),
						'job-title'    => array( 'text', 'Job title', '', 'job-title' ),
					);
				}
			},
		);  }

	/**
	 * Removes the hooks and globals the tests add.
	 */
	public function tear_down() {
		remove_all_actions( 'grunion_after_feedback_post_inserted' );
		unset( $GLOBALS['zbs'], $GLOBALS['jetpack_crm_stub_calls'] );
		parent::tear_down();
	}

	/**
	 * Makes a submitted form field.
	 *
	 * @param array $attributes Field attributes.
	 * @param mixed $value      Submitted value.
	 * @return Contact_Form_Field
	 */
	private function field( array $attributes, $value ) {
		$field        = new Contact_Form_Field( $attributes, '', new Contact_Form( array() ) );
		$field->value = $value;
		return $field;
	}

	/**
	 * Reduces mapped fields to their ids and values.
	 *
	 * @param Contact_Form_Field[] $fields Mapped fields.
	 * @return array
	 */
	private static function ids_and_values( array $fields ) {
		$out = array();
		foreach ( $fields as $field ) {
			$out[ $field->get_attribute( 'id' ) ] = $field->value;
		}
		return $out;
	}

	/**
	 * Each form field reaches Jetpack CRM under the contact key it fills.
	 *
	 * @dataProvider mapping_provider
	 *
	 * @param array $attributes Field attributes.
	 * @param mixed $value      Submitted value.
	 * @param array $expected   Ids and values handed to Jetpack CRM.
	 */
	#[DataProvider( 'mapping_provider' )]
	public function test_map_fields( array $attributes, $value, array $expected ) {
		$mapped = Jetpack_CRM_Integration::map_fields( array( $this->field( $attributes, $value ) ) );

		$this->assertSame( $expected, self::ids_and_values( $mapped ) );
	}

	/**
	 * Form fields and what Jetpack CRM should receive for them.
	 *
	 * @return array
	 */
	public static function mapping_provider() {
		return array(
			'first name variation'      => array(
				array(
					'id'    => 'first-name',
					'type'  => 'name',
					'label' => 'First name',
				),
				'Ada',
				array( 'jetpackcrm-fname' => 'Ada' ),
			),
			'last name variation'       => array(
				array(
					'id'    => 'last-name-2',
					'type'  => 'name',
					'label' => 'Last name',
				),
				'Lovelace',
				array( 'jetpackcrm-lname' => 'Lovelace' ),
			),
			'full name is split'        => array(
				array(
					'id'    => 'name',
					'type'  => 'name',
					'label' => 'Name',
				),
				'Ada King Lovelace',
				array(
					'jetpackcrm-fname' => 'Ada',
					'jetpackcrm-lname' => 'King Lovelace',
				),
			),
			'email'                     => array(
				array(
					'id'    => 'g1-email',
					'type'  => 'email',
					'label' => 'Email',
				),
				'ada@example.com',
				array( 'jetpackcrm-email' => 'ada@example.com' ),
			),
			'phone'                     => array(
				array(
					'id'    => 'g1-phone',
					'type'  => 'phone',
					'label' => 'Phone',
				),
				'555 0100',
				array( 'jetpackcrm-hometel' => '555 0100' ),
			),
			'custom field by label'     => array(
				array(
					'id'    => 'g1-organization',
					'type'  => 'text',
					'label' => 'Organization',
				),
				'Engines Ltd',
				array( 'jetpackcrm-organization' => 'Engines Ltd' ),
			),
			'custom field by key'       => array(
				array(
					'id'    => 'g1-job',
					'type'  => 'text',
					'label' => 'Job Title',
				),
				'Mathematician',
				array( 'jetpackcrm-job-title' => 'Mathematician' ),
			),
			'no matching contact field' => array(
				array(
					'id'    => 'g1-message',
					'type'  => 'textarea',
					'label' => 'Message',
				),
				'Hello',
				array( 'g1-message' => 'Hello' ),
			),
		);
	}

	/**
	 * A field the form author already pointed at a contact key keeps it, and the inferred
	 * field doesn't overwrite it.
	 */
	public function test_explicit_crm_id_wins_over_inferred_mapping() {
		$explicit = $this->field(
			array(
				'id'    => 'jetpackcrm-email',
				'type'  => 'text',
				'label' => 'Work email',
			),
			'work@example.com'
		);
		$inferred = $this->field(
			array(
				'id'    => 'g1-email',
				'type'  => 'email',
				'label' => 'Email',
			),
			'home@example.com'
		);

		$mapped = Jetpack_CRM_Integration::map_fields( array( $inferred, $explicit ) );

		$this->assertSame(
			array(
				'g1-email'         => 'home@example.com',
				'jetpackcrm-email' => 'work@example.com',
			),
			self::ids_and_values( $mapped )
		);
	}

	/**
	 * Other integrations read the same field objects, so mapping must not rename them.
	 */
	public function test_map_fields_leaves_original_fields_untouched() {
		$field = $this->field(
			array(
				'id'    => 'last-name',
				'type'  => 'name',
				'label' => 'Last name',
			),
			'Lovelace'
		);

		Jetpack_CRM_Integration::map_fields( array( $field ) );

		$this->assertSame( 'last-name', $field->get_attribute( 'id' ) );
	}

	/**
	 * Jetpack CRM's handler gets the mapped fields once, in place of its own run.
	 */
	public function test_hands_mapped_fields_to_crm_handler_once() {
		add_action( 'grunion_after_feedback_post_inserted', array( Jetpack_CRM_Integration::class, 'handle_jetpack_crm_integration' ), 5, 4 );
		add_action( 'grunion_after_feedback_post_inserted', 'zero_bs_crm_capture_jetpack_form', 10, 4 );

		$fields = array(
			$this->field(
				array(
					'id'    => 'last-name',
					'type'  => 'name',
					'label' => 'Last name',
				),
				'Lovelace'
			),
		);
		do_action( 'grunion_after_feedback_post_inserted', 1, $fields, false, array() );

		$this->assertCount( 1, $GLOBALS['jetpack_crm_stub_calls'] );
		$this->assertSame( array( 'jetpackcrm-lname' => 'Lovelace' ), self::ids_and_values( $GLOBALS['jetpack_crm_stub_calls'][0] ) );
	}

	/**
	 * When Jetpack CRM's handler runs first, it has already saved the contact.
	 */
	public function test_does_nothing_when_crm_handler_runs_first() {
		add_action( 'grunion_after_feedback_post_inserted', 'zero_bs_crm_capture_jetpack_form', 1, 4 );
		add_action( 'grunion_after_feedback_post_inserted', array( Jetpack_CRM_Integration::class, 'handle_jetpack_crm_integration' ), 5, 4 );

		do_action(
			'grunion_after_feedback_post_inserted',
			1,
			array(
				$this->field(
					array(
						'id'    => 'g1-email',
						'type'  => 'email',
						'label' => 'Email',
					),
					'a@example.com'
				),
			),
			false,
			array()
		);

		$this->assertCount( 1, $GLOBALS['jetpack_crm_stub_calls'] );
		$this->assertSame( array( 'g1-email' => 'a@example.com' ), self::ids_and_values( $GLOBALS['jetpack_crm_stub_calls'][0] ) );
	}
}
