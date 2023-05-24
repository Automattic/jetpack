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
	 * @var Automation_Workflow The Automation workflow object.
	 */
	private $workflow;

	/**
	 * Contructs the Company_Status_Updated instance.
	 */
	public function __construct() {
		self::$name        = 'company_status_update';
		self::$title       = __( 'Company Status Updated', 'zero-bs-crm' );
		self::$description = __( 'Triggered when a new company status is updated', 'zero-bs-crm' );
		self::$category    = 'company';
	}

	/**
	 * Init the trigger.
	 *
	 * @param Automation_Workflow $workflow The workflow to which the trigger belongs.
	 * @throws Automation_Exception Throws a 'class not found' or general error.
	 */
	public function init( Automation_Workflow $workflow ) {
		add_action(
			'jpcrm_automation_company_status_update',
			array( $this, 'execute_workflow' )
		);
	}

	/**
	 * Execute the workflow. Listen to the desired event
	 *
	 * @param array $company_data The company data to be included in the workflow.
	 * @throws Automation_Exception Throws a 'class not found' or general error.
	 */
	public function execute_workflow( $company_data ) {
		if ( $this->workflow ) {
			$this->workflow->execute( $this, $company_data );
		}
	}
}
