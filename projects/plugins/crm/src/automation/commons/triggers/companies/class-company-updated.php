<?php
/**
 * Jetpack CRM Automation Company_Updated trigger.
 *
 * @package automattic/jetpack-crm
 * @since 6.2.0
 */

namespace Automattic\Jetpack\CRM\Automation\Triggers;

use Automattic\Jetpack\CRM\Automation\Base_Trigger;
use Automattic\Jetpack\CRM\Automation\Data_Types\Company_Data;

/**
 * Adds the Company_Updated class.
 *
 * @since 6.2.0
 */
class Company_Updated extends Base_Trigger {

	/**
	 * Get the slug name of the trigger.
	 *
	 * @since 6.2.0
	 *
	 * @return string The slug name of the trigger.
	 */
	public static function get_slug(): string {
		return 'jpcrm/company_updated';
	}

	/**
	 * Get the title of the trigger.
	 *
	 * @since 6.2.0
	 *
	 * @return string|nul The title of the trigger.
	 */
	public static function get_title(): ?string {
		return __( 'Company Updated', 'zero-bs-crm' );
	}

	/**
	 * Get the description of the trigger.
	 *
	 * @since 6.2.0
	 *
	 * @return string|null The description of the trigger.
	 */
	public static function get_description(): ?string {
		return __( 'Triggered when a CRM company is updated', 'zero-bs-crm' );
	}

	/**
	 * Get the category of the trigger.
	 *
	 * @since 6.2.0
	 *
	 * @return string|null The category of the trigger.
	 */
	public static function get_category(): ?string {
		return __( 'Company', 'zero-bs-crm' );
	}

	/**
	 * Get the date type.
	 *
	 * @return string The type of the step
	 */
	public static function get_data_type(): string {
		return Company_Data::class;
	}

	/**
	 * Listen to the desired event.
	 *
	 * @since 6.2.0
	 *
	 * @return void
	 */
	protected function listen_to_event(): void {
		$this->listen_to_wp_action( 'jpcrm_company_updated' );
	}
}
