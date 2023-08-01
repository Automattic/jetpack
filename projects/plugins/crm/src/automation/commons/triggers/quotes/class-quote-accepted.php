<?php
/**
 * Jetpack CRM Automation Quote_Accepted trigger.
 *
 * @package automattic/jetpack-crm
 */

namespace Automattic\Jetpack\CRM\Automation\Triggers;

use Automattic\Jetpack\CRM\Automation\Base_Trigger;

/**
 * Adds the Quote_Accepted class.
 */
class Quote_Accepted extends Base_Trigger {

	/**
	 * Get the slug name of the trigger.
	 * @return string
	 */
	public static function get_slug(): string {
		return 'jpcrm/quote_accepted';
	}

	/**
	 * Get the title of the trigger.
	 * @return string
	 */
	public static function get_title(): ?string {
		return __( 'Accepted Quote', 'zero-bs-crm' );
	}

	/**
	 * Get the description of the trigger.
	 * @return string
	 */
	public static function get_description(): ?string {
		return __( 'Triggered when a quote is accepted', 'zero-bs-crm' );
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
			'jpcrm_quote_accepted',
			array( $this, 'execute_workflow' )
		);
	}
}
