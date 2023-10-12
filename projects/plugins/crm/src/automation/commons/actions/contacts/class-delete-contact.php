<?php
/**
 * Jetpack CRM Automation Delete_Contact action.
 *
 * @package automattic/jetpack-crm
 * @since 6.2.0
 */

namespace Automattic\Jetpack\CRM\Automation\Actions;

use Automattic\Jetpack\CRM\Automation\Attribute_Definition;
use Automattic\Jetpack\CRM\Automation\Base_Action;
use Automattic\Jetpack\CRM\Automation\Data_Types\Contact_Data;
use Automattic\Jetpack\CRM\Automation\Data_Types\Data_Type;
use Automattic\Jetpack\CRM\Entities\Contact;

/**
 * Adds the Delete_Contact class.
 *
 * @since 6.2.0
 */
class Delete_Contact extends Base_Action {

	/**
	 * Get the slug name of the step.
	 *
	 * @since 6.2.0
	 *
	 * @return string The slug name of the step.
	 */
	public static function get_slug(): string {
		return 'jpcrm/delete_contact';
	}

	/**
	 * Get the title of the step.
	 *
	 * @since 6.2.0
	 *
	 * @return string|null The title of the step.
	 */
	public static function get_title(): ?string {
		return __( 'Delete Contact', 'zero-bs-crm' );
	}

	/**
	 * Get the description of the step.
	 *
	 * @since 6.2.0
	 *
	 * @return string|null The description of the step.
	 */
	public static function get_description(): ?string {
		return __( 'This action will delete a contact.', 'zero-bs-crm' );
	}

	/**
	 * Get the data type.
	 *
	 * @since 6.2.0
	 *
	 * @return string The type of the step.
	 */
	public static function get_data_type(): string {
		return Contact_Data::class;
	}

	/**
	 * Get the category of the step.
	 *
	 * @since 6.2.0
	 *
	 * @return string The category of the step.
	 */
	public static function get_category(): ?string {
		return __( 'Contact', 'zero-bs-crm' );
	}

	/**
	 * Constructor.
	 *
	 * @since 6.2.0
	 *
	 * @param array $step_data The step data.
	 */
	public function __construct( array $step_data ) {
		parent::__construct( $step_data );

		$this->set_attribute_definitions(
			array(
				new Attribute_Definition(
					'keep_orphans',
					__( 'Keep orphans', 'zero-bs-crm' ),
					__( 'Orphans are all the things that relate to the contact. E.g.: Invoices, quotes, and transactions.', 'zero-bs-crm' ),
					Attribute_Definition::SELECT,
					array(
						1 => __( 'Yes', 'zero-bs-crm' ),
						0 => __( 'No', 'zero-bs-crm' ),
					)
				),
			)
		);
	}

	/**
	 * Update the DAL - deleting the given contact.
	 *
	 * @since 6.2.0
	 *
	 * @param Data_Type $data Data passed from the trigger.
	 */
	protected function execute( Data_Type $data ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		global $zbs;

		/** @var Contact $contact */
		$contact = $data->get_data();

		$zbs->DAL->contacts->deleteContact( // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
			array(
				'id'          => $contact->id,
				'saveOrphans' => (bool) $this->get_attribute( 'keep_orphans', 1 ),
			)
		);
	}
}
