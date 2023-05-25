<?php
/**
 * Jetpack CRM Automation Invoice_Updated trigger.
 *
 * @package automattic/jetpack-crm
 */

namespace Automattic\Jetpack\CRM\Automation\Triggers;

use Automattic\Jetpack\CRM\Automation\Automation_Exception;
use Automattic\Jetpack\CRM\Automation\Automation_Workflow;
use Automattic\Jetpack\CRM\Automation\Base_Trigger;

/**
 * Adds the Invoice_Updated class.
 */
class Invoice_Updated extends Base_Trigger {
	/**
	 * @var array The invoice object before update.
	 */
	private $invoice_before_update = array();

	/**
	 * @var Automation_Workflow The Automation workflow object.
	 */
	private $workflow;

	/**
	 * Contructs the Invoice_Updated instance.
	 */
	public function __construct() {
		self::$name        = 'invoice_updated';
		self::$title       = __( 'Invoice Updated', 'zero-bs-crm' );
		self::$description = __( 'Triggered when an invoice is updated', 'zero-bs-crm' );
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
			'jpcrm_automation_invoice_update',
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
