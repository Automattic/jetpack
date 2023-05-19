<?php
/**
 * Jetpack CRM Automation Company_Deleted trigger.
 *
 * @package automattic/jetpack-crm
 */

namespace Automattic\Jetpack\CRM\Automation\Triggers;

use Automattic\Jetpack\CRM\Automation\Automation_Exception;
use Automattic\Jetpack\CRM\Automation\Automation_Workflow;
use Automattic\Jetpack\CRM\Automation\Base_Trigger;

/**
 * Adds the Company_Deleted class.
 */
class Company_Deleted extends Base_Trigger {

	/**
	 * Contructs the Company_Delete instance.
	 */
	public function __construct() {
		$trigger_data = array(
			'name'        => 'company_delete',
			'title'       => 'Company Deleted',
			'description' => 'Triggered when a CRM company is deleted',
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
			'jpcrm_automation_company_delete',
			function ( $contact_data ) use ( $workflow ) {
				$workflow->execute( $this, $contact_data );
			},
			10,
			2
		);
	}
}
