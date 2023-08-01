<?php
/**
 * Jetpack CRM Automation Company_New trigger.
 *
 * @package automattic/jetpack-crm
 */

namespace Automattic\Jetpack\CRM\Automation\Triggers;

use Automattic\Jetpack\CRM\Automation\Base_Trigger;

/**
 * Adds the Company_New class.
 */
class Company_New extends Base_Trigger {

	/** Get the slug name of the trigger
	 * @return string
	 */
	public static function get_slug(): string {
		return 'jpcrm/company_new';
	}

	/** Get the title of the trigger
	 * @return string
	 */
	public static function get_title(): ?string {
		return __( 'New Company', 'zero-bs-crm' );
	}

	/** Get the description of the trigger
	 * @return string
	 */
	public static function get_description(): ?string {
		return __( 'Triggered when a CRM company is added', 'zero-bs-crm' );
	}

	/** Get the category of the trigger
	 * @return string
	 */
	public static function get_category(): ?string {
		return __( 'company', 'zero-bs-crm' );
	}

	/**
	 * Get the date type
	 *
	 * @return string
	 */
	public static function get_data_type(): string {
		return 'company';
	}

	/**
	 * Listen to the desired event
	 */
	protected function listen_to_event() {
		add_action(
			'jpcrm_automation_company_new',
			array( $this, 'execute_workflow' )
		);
	}
}
