<?php
/**
 * Jetpack CRM Automation Add_Remove_Contact_Tag action.
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
 * Adds the Add_Remove_Contact_Tag class.
 *
 * @since 6.2.0
 */
class Add_Remove_Contact_Tag extends Base_Action {

	/**
	 * Get the slug name of the step.
	 *
	 * @since 6.2.0
	 *
	 * @return string The slug name of the step.
	 */
	public static function get_slug(): string {
		return 'jpcrm/add_remove_contact_tag';
	}

	/**
	 * Get the title of the step.
	 *
	 * @since 6.2.0
	 *
	 * @return string The title of the step.
	 */
	public static function get_title(): ?string {
		return __( 'Add / Remove Contact Tag', 'zero-bs-crm' );
	}

	/**
	 * Get the description of the step.
	 *
	 * @since 6.2.0
	 *
	 * @return string|null The description of the step.
	 */
	public static function get_description(): ?string {
		return __( 'This action will add or remove a tag from a contact.', 'zero-bs-crm' );
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

		$this->set_attribute_definitions(
			array(
				new Attribute_Definition(
					'tag_input',
					__( 'Tag', 'zero-bs-crm' ),
					__( 'Please write the tag you wish to add/remove/replace.', 'zero-bs-crm' ),
					Attribute_Definition::TEXT
				),
				new Attribute_Definition(
					'type',
					__( 'Mode', 'zero-bs-crm' ),
					__( 'The mode determines what will happen with the defined tag.', 'zero-bs-crm' ),
					Attribute_Definition::SELECT,
					array(
						'append'  => __( 'Add tag', 'zero-bs-crm' ),
						'remove'  => __( 'Remove tag', 'zero-bs-crm' ),
						'replace' => __( 'Replace all other tags', 'zero-bs-crm' ),
					)
				),
			)
		);
	}

	/**
	 * Add / remove the tag to / from the contact via the DAL.
	 *
	 * @since 6.2.0
	 *
	 * @param Data_Type $data Data passed from the trigger.
	 */
	protected function execute( Data_Type $data ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		$mode      = $this->get_attribute( 'mode' );
		$tag_input = $this->get_attribute( 'tag_input' );

		if ( empty( $mode ) || empty( $tag_input ) ) {
			return;
		}

		/** @var Contact $contact */
		$contact = $data->get_data();

		global $zbs;
		$zbs->DAL->contacts->addUpdateContactTags( // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
			array(
				'id'        => $contact->id,
				'mode'      => $mode,
				'tag_input' => $tag_input,
			)
		);
	}
}
