<?php
/**
 * Jetpack CRM Automation Contact_Status_Updated trigger.
 *
 * @package automattic/jetpack-crm
 */

namespace Automattic\Jetpack\CRM\Automation\Triggers;

use Automattic\Jetpack\CRM\Automation\Automation_Exception;
use Automattic\Jetpack\CRM\Automation\Automation_Workflow;
use Automattic\Jetpack\CRM\Automation\Base_Trigger;

/**
 * Adds the Contact_Status_Updated class.
 */
class Contact_Status_Updated extends Base_Trigger {

	/**
	 * @var Automation_Workflow The Automation workflow object.
	 */
	private $workflow;

	/**
	 * Contructs the Contact_Status_Updated instance.
	 */
	public function __construct() {
		self::$name        = 'contact_status_updated';
		self::$title       = __( 'Contact Status Updated', 'zero-bs-crm' );
		self::$description = __( 'Triggered when a CRM contact status is updated', 'zero-bs-crm' );
		self::$category    = 'contact';
	}

	/**
	 * Init the trigger.
	 *
	 * @param Automation_Workflow $workflow The workflow to which the trigger belongs.
	 * @throws Automation_Exception Throws a 'class not found' or general error.
	 */
	public function init( Automation_Workflow $workflow ) {
		add_action(
			'jpcrm_automation_contact_status_update',
			array( $this, 'execute_workflow' )
		);
	}

	/**
	 * Execute the workflow. Listen to the desired event
	 *
	 * @param array $contact_data The contact data to be included in the workflow.
	 * @throws Automation_Exception Throws a 'class not found' or general error.
	 */
	public function execute_workflow( $contact_data ) {
		if ( $this->workflow ) {
			$this->workflow->execute( $this, $contact_data );
		}
	}
}
