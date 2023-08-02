<?php
/**
 * Jetpack CRM Automation Quote_Created trigger.
 *
 * @package automattic/jetpack-crm
 */

namespace Automattic\Jetpack\CRM\Automation\Triggers;

use Automattic\Jetpack\CRM\Automation\Base_Trigger;

/**
 * Adds the Quote_Created class.
 */
class Quote_Created extends Base_Trigger {

	/**
	 * Get the slug name of the trigger.
	 * @return string
	 */
	public static function get_slug(): string {
		return 'jpcrm/quote_created';
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
	 * Listen to this trigger's target event.
	 */
	protected function listen_to_event() {
		add_action(
			'jpcrm_quote_created',
			array( $this, 'execute_workflow' )
		);
	}
}
