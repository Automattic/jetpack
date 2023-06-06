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
	 * @var Automation_Workflow The Automation workflow object.
	 */
	protected $workflow;

	/** Get the slug name of the trigger
	 * @return string
	 */
	public static function get_slug(): string {
		return 'jpcrm/invoice_updated';
	}

	/** Get the title of the trigger
	 * @return string
	 */
	public static function get_title(): ?string {
		return __( 'Invoice Updated', 'zero-bs-crm' );
	}

	/** Get the description of the trigger
	 * @return string
	 */
	public static function get_description(): ?string {
		return __( 'Triggered when an invoice is updated', 'zero-bs-crm' );
	}

	/** Get the category of the trigger
	 * @return string
	 */
	public static function get_category(): ?string {
		return __( 'invoice', 'zero-bs-crm' );
	}

	/**
	 * Initialize the trigger to listen to the desired event.
	 *
	 * @param Automation_Workflow $workflow The workflow to which the trigger belongs.
	 * @throws Automation_Exception Throws a 'class not found' or general error.
	 */
	public function init( Automation_Workflow $workflow ) {
		$this->workflow = $workflow;
		$this->listen_to_event();
	}

	/**
	 * Execute the workflow.
	 *
	 * @param array $invoice_data The invoice data to be included in the workflow.
	 * @throws Automation_Exception Throws a 'class not found' or general error.
	 */
	public function execute_workflow( $invoice_data = null ) {
		if ( $this->workflow ) {
			$this->workflow->execute( $this, $invoice_data );
		}
	}

	/**
	 * Listen to the desired event
	 */
	protected function listen_to_event() {
		add_action(
			'jpcrm_automation_invoice_update',
			array( $this, 'execute_workflow' )
		);
	}
}
