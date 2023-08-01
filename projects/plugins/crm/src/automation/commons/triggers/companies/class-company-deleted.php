<?php
/**
 * Jetpack CRM Automation Company_Deleted trigger.
 *
 * @package automattic/jetpack-crm
 */

namespace Automattic\Jetpack\CRM\Automation\Triggers;

use Automattic\Jetpack\CRM\Automation\Base_Trigger;

/**
 * Adds the Company_Deleted class.
 *
 * @since $$next-version$$
 */
class Company_Deleted extends Base_Trigger {

	/**
	 * Get the slug name of the trigger.
	 *
	 * @return string
	 */
	public static function get_slug(): string {
		return 'jpcrm/company_delete';
	}

	/**
	 * Get the title of the trigger.
	 *
	 * @return string
	 */
	public static function get_title(): ?string {
		return __( 'Company Deleted', 'zero-bs-crm' );
	}

	/**
	 * Get the description of the trigger.
	 *
	 * @return string
	 */
	public static function get_description(): ?string {
		return __( 'Triggered when a CRM company is deleted', 'zero-bs-crm' );
	}

	/**
	 * Get the category of the trigger.
	 *
	 * @return string
	 */
	public static function get_category(): ?string {
		return __( 'company', 'zero-bs-crm' );
	}

	/**
	 * Listen to the desired event.
	 */
	protected function listen_to_event() {
		add_action(
			'jpcrm_automation_company_delete',
			array( $this, 'execute_workflow' )
		);
	}
}
