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
	 * @var Automation_Workflow The Automation workflow object.
	 */
	private $workflow;

	/**
	 * Contructs the Company_Delete instance.
	 */
	public function __construct() {
		self::$name        = 'company_delete';
		self::$title       = __( 'Company Deleted', 'zero-bs-crm' );
		self::$description = __( 'Triggered when a CRM company is deleted', 'zero-bs-crm' );
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
			'jpcrm_automation_company_delete',
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
