<?php
/**
 * Events_Manager class.
 *
 * @package automattic/jetpack-crm
 */

namespace Automattic\Jetpack\CRM\Event_Manager;

/**
 * Events_Manager class.
 *
 * @since 6.2.0
 */
class Events_Manager {

	/**
	 * The Events_Manager instance.
	 *
	 * @since 6.2.0
	 * @var Events_Manager
	 */
	private static $instance = null;

	/**
	 * Get the singleton instance of this class.
	 *
	 * @since 6.2.0
	 *
	 * @return Events_Manager The Events_Manager instance.
	 */
	public static function get_instance(): Events_Manager {
		if ( ! self::$instance ) {
			self::$instance = new Events_Manager();
		}

		return self::$instance;
	}

	/**
	 * Return the Contact_Event instance.
	 *
	 * @since 6.2.0
	 *
	 * @return Contact_Event A Contact_Event instance.
	 */
	public function contact(): Contact_Event {
		return new Contact_Event();
	}

	/**
	 * Return the Invoice_Event instance.
	 *
	 * @since 6.2.0
	 *
	 * @return Invoice_Event A Invoice_Event instance.
	 */
	public function invoice(): Invoice_Event {
		return new Invoice_Event();
	}

	/**
	 * Return the Transaction_Event instance.
	 *
	 * @since 6.2.0
	 *
	 * @return Transaction_Event A Transaction_Event instance.
	 */
	public function transaction(): Transaction_Event {
		return new Transaction_Event();
	}
}
