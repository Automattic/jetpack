<?php
/**
 * Jetpack CRM Automation Invoice_New trigger.
 *
 * @package automattic/jetpack-crm
 */

namespace Automattic\Jetpack\CRM\Automation\Triggers;

use Automattic\Jetpack\CRM\Automation\Automation_Exception;
use Automattic\Jetpack\CRM\Automation\Automation_Workflow;
use Automattic\Jetpack\CRM\Automation\Base_Trigger;

/**
 * Adds the Invoice_New class.
 */
class Invoice_New extends Base_Trigger {

	/**
	 * @var Automation_Workflow The Automation workflow object.
	 */
	private $workflow;

	/**
	 * Contructs the Invoice_New instance.
	 */
	public function __construct() {
		self::$name        = 'invoice_new';
		self::$title       = __( 'New Invoice', 'zero-bs-crm' );
		self::$description = __( 'Triggered when a new invoice is added', 'zero-bs-crm' );
		self::$category    = 'invoice';
	}

	/**
	 * Init the trigger.
	 *
	 * @param Automation_Workflow $workflow The workflow to which the trigger belongs.
	 * @throws Automation_Exception Throws a 'class not found' or general error.
	 */
	public function init( Automation_Workflow $workflow ) {
		$this->workflow = $workflow;
		add_action(
			'jpcrm_automation_invoice_new',
			array( $this, 'execute_workflow' )
		);
	}

	/**
	 * Execute the workflow. Listen to the desired event
	 *
	 * @param array $invoice_data The invoice data to be included in the workflow.
	 * @throws Automation_Exception Throws a 'class not found' or general error.
	 */
	public function execute_workflow( $invoice_data ) {
		if ( $this->workflow ) {
			$this->workflow->execute( $this, $invoice_data );
		}
	}
}
