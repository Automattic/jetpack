<?php
/**
 * Events_Manager class.
 *
 * @package Automattic\Jetpack\CRM\Event_Manager
 */

namespace Automattic\Jetpack\CRM\Event_Manager;

/**
 * Events_Manager class.
 *
 * @since $$next-version$$
 */
class Events_Manager {

	/**
	 * @var null The Events_Manager instance.
	 */
	private static $instance = null;

	/**
	 * Get the singleton instance of this class.
	 *
	 * @return Events_Manager
	 */
	public static function get_instance(): Events_Manager {
		if ( ! self::$instance ) {
			self::$instance = new Events_Manager();
		}

		return self::$instance;
	}

	/**
	 * Set the Events_Manager instance for testing purposes.
	 *
	 * @param Events_Manager $instance The Events_Manager instance.
	 * @return void
	 */
	public static function set_instance( Events_Manager $instance ) {
		self::$instance = $instance;
	}

	/**
	 * Return the Contact_Event instance.
	 *
	 * @return Contact_Event
	 */
	public function contact(): Contact_Event {
		return Contact_Event::get_instance();
	}
}
