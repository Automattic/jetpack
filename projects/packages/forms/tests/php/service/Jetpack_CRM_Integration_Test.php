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
						'job-title'    => array( 'text', 'Role', '', 'job-title' ),
					);
				}
			},
		);
	}

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
	 * Reduces fields to their ids and values.
	 *
	 * @param Contact_Form_Field[] $fields Fields.
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
	 * Each form field reaches Jetpack CRM under the contact key it fills, without renaming the original.
	 *
	 * @dataProvider mapping_provider
	 *
	 * @param array $attributes Field attributes.
	 * @param mixed $value      Submitted value.
	 * @param array $expected   Ids and values handed to Jetpack CRM.
	 */
	#[DataProvider( 'mapping_provider' )]
	public function test_map_fields( array $attributes, $value, array $expected ) {
		$field  = $this->field( $attributes, $value );
		$mapped = Jetpack_CRM_Integration::map_fields( array( $field ) );

		$this->assertSame( $expected, self::ids_and_values( $mapped ) );
		$this->assertSame( $attributes['id'], $field->get_attribute( 'id' ) );
		// CRM's type fallback runs too, and must not see a mapped copy as another name field.
		foreach ( $mapped as $copy ) {
			if ( str_starts_with( $copy->get_attribute( 'id' ), Jetpack_CRM_Integration::CRM_FIELD_PREFIX ) ) {
				$this->assertNotSame( 'name', $copy->get_attribute( 'type' ) );
			}
		}
	}

	/**
	 * Form fields and what Jetpack CRM should receive for them.
	 *
	 * @return array
	 */
	public static function mapping_provider() {
		return array(
			'first name variation'          => array(
				array(
					'id'    => 'first-name',
					'type'  => 'name',
					'label' => 'First name',
				),
				'Ada',
				array( 'jetpackcrm-fname' => 'Ada' ),
			),
			'suffixed last name variation'  => array(
				array(
					'id'    => 'last-name-2',
					'type'  => 'name',
					'label' => 'Last name',
				),
				' Lovelace ',
				array( 'jetpackcrm-lname' => 'Lovelace' ),
			),
			'single name is left to CRM'    => array(
				array(
					'id'    => 'name',
					'type'  => 'name',
					'label' => 'Name',
				),
				'Ada Lovelace',
				array( 'name' => 'Ada Lovelace' ),
			),
			'email is left to CRM'          => array(
				array(
					'id'    => 'g1-email',
					'type'  => 'email',
					'label' => 'Email',
				),
				'ada@example.com',
				array( 'g1-email' => 'ada@example.com' ),
			),
			'custom field by label'         => array(
				array(
					'id'    => 'g1-organization',
					'type'  => 'text',
					'label' => 'Organization',
				),
				'Engines Ltd',
				array( 'jetpackcrm-organization' => 'Engines Ltd' ),
			),
			'custom field by key'           => array(
				array(
					'id'    => 'g1-job',
					'type'  => 'text',
					'label' => 'Job Title',
				),
				'Mathematician',
				array( 'jetpackcrm-job-title' => 'Mathematician' ),
			),
			'whitespace answer is not sent' => array(
				array(
					'id'    => 'g1-organization',
					'type'  => 'text',
					'label' => 'Organization',
				),
				'   ',
				array( 'g1-organization' => '   ' ),
			),
			'no matching contact field'     => array(
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
	 * A field the form author already pointed at a contact key keeps it.
	 */
	public function test_explicit_crm_id_wins_over_inferred_mapping() {
		$explicit = $this->field(
			array(
				'id'    => 'jetpackcrm-lname',
				'type'  => 'text',
				'label' => 'Surname',
			),
			'Byron'
		);
		$inferred = $this->field(
			array(
				'id'    => 'last-name',
				'type'  => 'name',
				'label' => 'Last name',
			),
			'Lovelace'
		);

		$mapped = Jetpack_CRM_Integration::map_fields( array( $inferred, $explicit ) );

		$this->assertSame(
			array(
				'last-name'        => 'Lovelace',
				'jetpackcrm-lname' => 'Byron',
			),
			self::ids_and_values( $mapped )
		);
	}

	/**
	 * Registering takes over Jetpack CRM's slot, so its handler runs once, with mapped fields.
	 *
	 * @dataProvider submission_provider
	 *
	 * @param bool  $crm_hooked Whether Jetpack CRM's handler is hooked.
	 * @param bool  $is_spam    Whether the submission is spam.
	 * @param array $expected   Ids and values of each call Jetpack CRM's handler receives.
	 */
	#[DataProvider( 'submission_provider' )]
	public function test_register_for_submission( $crm_hooked, $is_spam, array $expected ) {
		if ( $crm_hooked ) {
			add_action( 'grunion_after_feedback_post_inserted', 'zero_bs_crm_capture_jetpack_form', 10, 4 );
		}

		Jetpack_CRM_Integration::register_for_submission();

		$field = $this->field(
			array(
				'id'    => 'last-name',
				'type'  => 'name',
				'label' => 'Last name',
			),
			'Lovelace'
		);
		do_action( 'grunion_after_feedback_post_inserted', 1, array( $field ), $is_spam, array() );

		$this->assertSame( $expected, array_map( array( self::class, 'ids_and_values' ), $GLOBALS['jetpack_crm_stub_calls'] ) );
	}

	/**
	 * Submission states and the calls Jetpack CRM's handler should receive.
	 *
	 * @return array
	 */
	public static function submission_provider() {
		return array(
			'CRM hooked'     => array( true, false, array( array( 'jetpackcrm-lname' => 'Lovelace' ) ) ),
			'spam'           => array( true, true, array() ),
			'CRM not hooked' => array( false, false, array() ),
		);
	}
}
