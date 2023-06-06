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
	protected $workflow;

	/** Get the slug name of the trigger
	 * @return string
	 */
	public static function get_slug(): string {
		return 'jpcrm/company_status_update';
	}

	/** Get the title of the trigger
	 * @return string
	 */
	public static function get_title(): ?string {
		return __( 'Company Status Updated', 'zero-bs-crm' );
	}

	/** Get the description of the trigger
	 * @return string
	 */
	public static function get_description(): ?string {
		return __( 'Triggered when a new company status is updated', 'zero-bs-crm' );
	}

	/** Get the category of the trigger
	 * @return string
	 */
	public static function get_category(): ?string {
		return __( 'company', 'zero-bs-crm' );
	}

	/**
	 * Init the trigger.
	 *
	 * @param Automation_Workflow $workflow The workflow to which the trigger belongs.
	 * @throws Automation_Exception Throws a 'class not found' or general error.
	 */
	public function init( Automation_Workflow $workflow ) {
		$this->workflow = $workflow;
		$this->listen_to_event();
	}

	/**
	 * Execute the workflow. Listen to the desired event
	 *
	 * @param array $company_data The company data to be included in the workflow.
	 * @throws Automation_Exception Throws a 'class not found' or general error.
	 */
	public function execute_workflow( $company_data = null ) {
		if ( $this->workflow ) {
			$this->workflow->execute( $this, $company_data );
		}
	}

	/**
	 * Listen to the desired event
	 */
	protected function listen_to_event() {
		add_action(
			'jpcrm_automation_company_status_update',
			array( $this, 'execute_workflow' )
		);
	}
}
