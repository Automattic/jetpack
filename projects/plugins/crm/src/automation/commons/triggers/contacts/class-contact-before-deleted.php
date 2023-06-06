<?php
/**
 * Jetpack CRM Automation Contact_Before_Deleted trigger.
 *
 * @package automattic/jetpack-crm
 */

namespace Automattic\Jetpack\CRM\Automation\Triggers;

use Automattic\Jetpack\CRM\Automation\Automation_Exception;
use Automattic\Jetpack\CRM\Automation\Automation_Workflow;
use Automattic\Jetpack\CRM\Automation\Base_Trigger;

/**
 * Adds the Contact_Before_Deleted class.
 */
class Contact_Before_Deleted extends Base_Trigger {

	/**
	 * Contructs the Contact_Before_Deleted instance.
	 */
	public function __construct() {
		$trigger_data = array(
			'name'        => 'contact_before_delete',
			'title'       => 'Contact Before Deleted',
			'description' => 'Triggered just before a contact is deleted.',
			'category'    => 'contact',
		);

		parent::__construct( $trigger_data );
	}

	/**
	 * Init the trigger. Listen to the desired event
	 *
	 * @param Automation_Workflow $workflow The workflow to which the trigger belongs.
	 * @throws Automation_Exception Throws a 'class not found' or general error.
	 */
	public function init( Automation_Workflow $workflow ) {
		add_action(
			'jpcrm_automation_contact_before_delete',
			function ( $contact_data ) use ( $workflow ) {
				$workflow->execute( $this, $contact_data );
			},
			10,
			2
		);
	}
}
