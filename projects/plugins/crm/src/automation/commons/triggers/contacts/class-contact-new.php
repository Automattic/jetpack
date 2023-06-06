<?php
/**
 * Jetpack CRM Automation Contact_New trigger.
 *
 * @package automattic/jetpack-crm
 */

namespace Automattic\Jetpack\CRM\Automation\Triggers;

use Automattic\Jetpack\CRM\Automation\Automation_Exception;
use Automattic\Jetpack\CRM\Automation\Automation_Workflow;
use Automattic\Jetpack\CRM\Automation\Base_Trigger;

/**
 * Adds the Contact_New class.
 */
class Contact_New extends Base_Trigger {

	/**
	 * Contructs the Contact_New instance.
	 */
	public function __construct() {
		$trigger_data = array(
			'name'        => 'contact_new',
			'title'       => 'New Contact',
			'description' => 'Triggered when a new CRM contact is added',
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
			'jpcrm_automation_contact_update',
			function ( $contact_data ) use ( $workflow ) {
				$workflow->execute( $this, $contact_data );
			},
			10,
			2
		);
	}
}
