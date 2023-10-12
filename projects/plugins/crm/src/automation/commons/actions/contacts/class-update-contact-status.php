<?php
/**
 * Jetpack CRM Automation Update_Contact_Status action.
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
use Automattic\Jetpack\CRM\Entities\Factories\Contact_Factory;

/**
 * Adds the Update_Contact_Status class.
 *
 * @since 6.2.0
 */
class Update_Contact_Status extends Base_Action {

	/**
	 * Get the slug name of the step.
	 *
	 * @since 6.2.0
	 *
	 * @return string The slug name of the step.
	 */
	public static function get_slug(): string {
		return 'jpcrm/update_contact_status';
	}

	/**
	 * Get the title of the step.
	 *
	 * @since 6.2.0
	 *
	 * @return string|null The title of the step.
	 */
	public static function get_title(): ?string {
		return __( 'Update Contact Status Action', 'zero-bs-crm' );
	}

	/**
	 * Get the description of the step.
	 *
	 * @since 6.2.0
	 *
	 * @return string|null The description of the step.
	 */
	public static function get_description(): ?string {
		return __( 'Action to update the contact status', 'zero-bs-crm' );
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
	 * @return string|null The category of the step.
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

		global $zbsCustomerFields; // // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase

		$statuses = array();
		if ( is_array( $zbsCustomerFields ) && ! empty( $zbsCustomerFields['status'][3] ) ) { // // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
			foreach ( $zbsCustomerFields['status'][3] as $status ) { // // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
				$statuses[ $status ] = $status;
			}
		}

		$this->set_attribute_definitions(
			array(
				new Attribute_Definition(
					'new_status',
					__( 'New status', 'zero-bs-crm' ),
					__( 'The status that will be used for the contact.', 'zero-bs-crm' ),
					Attribute_Definition::SELECT,
					$statuses
				),
			)
		);
	}

	/**
	 * Update the DAL with the new contact status.
	 *
	 * @since 6.2.0
	 *
	 * @param Data_Type $data Data passed from the trigger.
	 */
	protected function execute( Data_Type $data ) {
		global $zbs;

		if ( empty( $this->get_attribute( 'new_status' ) ) ) {
			return;
		}

		/** @var Contact $contact */
		$contact         = $data->get_data();
		$contact->status = $this->get_attribute( 'new_status' );

		// phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
		$zbs->DAL->contacts->addUpdateContact(
			Contact_Factory::data_for_dal( $contact )
		);
	}
}
