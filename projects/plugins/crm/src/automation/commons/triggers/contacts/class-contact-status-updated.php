<?php
/**
 * Jetpack CRM Automation Contact_Status_Updated trigger.
 *
 * @package automattic/jetpack-crm
 * @since $$next-version$$
 */

namespace Automattic\Jetpack\CRM\Automation\Triggers;

use Automattic\Jetpack\CRM\Automation\Automation_Workflow;
use Automattic\Jetpack\CRM\Automation\Base_Trigger;
use Automattic\Jetpack\CRM\Automation\Data_Types\Data_Type_Contact;

/**
 * Adds the Contact_Status_Updated class.
 *
 * @since $$next-version$$
 */
class Contact_Status_Updated extends Base_Trigger {

	/**
	 * The Automation workflow object.
	 *
	 * @since $$next-version$$
	 * @var Automation_Workflow
	 */
	protected $workflow;

	/**
	 * Get the slug name of the trigger.
	 *
	 * @since $$next-version$$
	 *
	 * @return string The slug name of the trigger.
	 */
	public static function get_slug(): string {
		return 'jpcrm/contact_status_updated';
	}

	/**
	 * Get the title of the trigger.
	 *
	 * @since $$next-version$$
	 *
	 * @return string|null The title of the trigger.
	 */
	public static function get_title(): ?string {
		return __( 'Contact Status Updated', 'zero-bs-crm' );
	}

	/**
	 * Get the description of the trigger.
	 *
	 * @since $$next-version$$
	 *
	 * @return string|null The description of the trigger.
	 */
	public static function get_description(): ?string {
		return __( 'Triggered when a CRM contact status is updated', 'zero-bs-crm' );
	}

	/**
	 * Get the category of the trigger.
	 *
	 * @since $$next-version$$
	 *
	 * @return string|null The category of the trigger.
	 */
	public static function get_category(): ?string {
		return __( 'contact', 'zero-bs-crm' );
	}

	/**
	 * Get the date type.
	 *
	 * @return string The type of the step
	 */
	public static function get_data_type(): string {
		return Data_Type_Contact::get_slug();
	}

	/**
	 * Called when the contact status updated event we are listening to is triggered.
	 *
	 * @since $$next-version$$
	 *
	 * @param array  $contact The array representing the contact that triggered this action.
	 * @param string $old_status_value The value this contact's status had before being updated.
	 * @return void
	 *
	 * @throws Automation_Exception If an invalid operator is encountered.
	 */
	public function on_jpcrm_contact_status_updated( $contact, $old_status_value ) {
		$data = array(
			'contact'          => $contact,
			'old_status_value' => $old_status_value,
		);
		$this->execute_workflow( $data );
	}

	/**
	 * Listen to the desired event.
	 *
	 * @since $$next-version$$
	 */
	protected function listen_to_event() {
		add_action(
			'jpcrm_contact_status_updated',
			array( $this, 'on_jpcrm_contact_status_updated' ),
			10,
			2
		);
	}

}
