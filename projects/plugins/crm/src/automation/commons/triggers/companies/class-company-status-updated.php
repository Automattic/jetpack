<?php
/**
 * Jetpack CRM Automation Company_Status_Updated trigger.
 *
 * @package automattic/jetpack-crm
 */

namespace Automattic\Jetpack\CRM\Automation\Triggers;

use Automattic\Jetpack\CRM\Automation\Automation_Exception;
use Automattic\Jetpack\CRM\Automation\Automation_Workflow;
use Automattic\Jetpack\CRM\Automation\Base_Trigger;

/**
 * Adds the Company_Status_Updated class.
 */
class Company_Status_Updated extends Base_Trigger {

	/**
	 * Contructs the Company_Status_Updated instance.
	 */
	public function __construct() {
		$trigger_data = array(
			'name'        => 'company_status_update',
			'title'       => 'Company Status Updated',
			'description' => 'Triggered when a new company status is updated',
			'category'    => 'company',
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
			'jpcrm_automation_company_status_update',
			function ( $contact_data ) use ( $workflow ) {
				$workflow->execute( $this, $contact_data );
			},
			10,
			2
		);
	}
}
