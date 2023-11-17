<?php
/**
 * Jetpack CRM Automation Add_Contact_Log action.
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
 * Adds the Add_Contact_Log class.
 *
 * @since 6.2.0
 */
class Add_Contact_Log extends Base_Action {

	/**
	 * Get the slug name of the step.
	 *
	 * @since 6.2.0
	 *
	 * @return string The slug name of the step.
	 */
	public static function get_slug(): string {
		return 'jpcrm/add_contact_log';
	}

	/**
	 * Get the title of the step.
	 *
	 * @since 6.2.0
	 *
	 * @return string The title of the step.
	 */
	public static function get_title(): ?string {
		return __( 'Add log to contact', 'zero-bs-crm' );
	}

	/**
	 * Get the description of the step.
	 *
	 * @since 6.2.0
	 *
	 * @return string The description of the step.
	 */
	public static function get_description(): ?string {
		return __( 'This action will add a log entry to a contact.', 'zero-bs-crm' );
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
					'type',
					__( 'Type', 'zero-bs-crm' ),
					__( 'The status that will be used for the contact.', 'zero-bs-crm' ),
					Attribute_Definition::SELECT,
					$statuses
				),
				new Attribute_Definition(
					'short-description',
					__( 'Title', 'zero-bs-crm' ),
					__( 'The title provides a high-level explanation about what the log is about.', 'zero-bs-crm' ),
					Attribute_Definition::TEXT
				),
				new Attribute_Definition(
					'long-description',
					__( 'Long Description', 'zero-bs-crm' ),
					__( 'The long description is meant to provide a more in-depth explanation about what happened.', 'zero-bs-crm' ),
					Attribute_Definition::TEXT
				),
			)
		);
	}

	/**
	 * Add the log to the contact via the DAL.
	 *
	 * @since 6.2.0
	 *
	 * @param Data_Type $data Data passed from the trigger.
	 */
	protected function execute( Data_Type $data ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		global $zbs;

		/** @var Contact $contact */
		$contact = $data->get_data();

		$zbs->DAL->logs->addUpdateLog( // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
			array(
				'data' => array(
					'objtype'   => ZBS_TYPE_CONTACT,
					'objid'     => $contact->id,
					'type'      => $this->get_attribute( 'type', '' ),
					'shortdesc' => $this->get_attribute( 'short-description', '' ),
					'longdesc'  => $this->get_attribute( 'long-description', '' ),
				),
			)
		);
	}
}
