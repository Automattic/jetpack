<?php
/**
 * Jetpack CRM Automation Quote_New trigger.
 *
 * @package automattic/jetpack-crm
 */

namespace Automattic\Jetpack\CRM\Automation\Triggers;

use Automattic\Jetpack\CRM\Automation\Base_Trigger;

/**
 * Adds the Quote_New class.
 */
class Quote_New extends Base_Trigger {

	/**
	 * Get the slug name of the trigger.
	 * @return string
	 */
	public static function get_slug(): string {
		return 'jpcrm/quote_new';
	}

	/**
	 * Get the title of the trigger.
	 * @return string
	 */
	public static function get_title(): ?string {
		return __( 'New Quote', 'zero-bs-crm' );
	}

	/**
	 * Get the description of the trigger.
	 * @return string
	 */
	public static function get_description(): ?string {
		return __( 'Triggered when a new quote status is added', 'zero-bs-crm' );
	}

	/**
	 * Get the category of the trigger.
	 * @return string
	 */
	public static function get_category(): ?string {
		return __( 'quote', 'zero-bs-crm' );
	}

	/**
	 * Get the date type
	 *
	 * @return string
	 */
	public static function get_data_type(): string {
		return 'quote';
	}

	/**
	 * Listen to this trigger's target event.
	 */
	protected function listen_to_event() {
		add_action(
			'jpcrm_quote_new',
			array( $this, 'execute_workflow' )
		);
	}
}
