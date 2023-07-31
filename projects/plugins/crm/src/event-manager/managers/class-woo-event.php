<?php
/**
 * WooCommerce Events.
 *
 * @package Automattic\Jetpack\CRM\Event_Manager
 */

namespace Automattic\Jetpack\CRM\Event_Manager;

/**
 * WooCommerce Events class.
 */
class Woo_Event implements Event {

	/** @var null The Woo_Event instance. */
	private static $instance = null;

	/**
	 * Get the singleton instance of this class.
	 *
	 * @return Events_Manager
	 */
	public static function getInstance(): Woo_Event {
		if ( ! self::$instance ) {
			self::$instance = new Events_Manager();
		}

		return self::$instance;
	}

	/**
	 * A new Woo order was created.
	 *
	 * @param array $woo_order_data The created Woo order data.
	 * @return void
	 */
	public function order_created( array $woo_order_data ) {
		do_action( 'jpcrm_woo_order_created', $woo_order_data );
	}

	/**
	 * The Woo order was updated.
	 *
	 * @param array $woo_order_data The updated Woo order data.
	 * @param array $old_woo_order_data The old Woo order data.
	 * @return void
	 */
	public function order_updated( array $woo_order_data, array $old_woo_order_data ) {

		// General update
		do_action( 'jpcrm_woo_order_updated', $woo_order_data );

		// Check for field changes for specific updates
		$changed_fields = array();
		foreach ( $woo_order_data as $key => $value ) {
			if ( $value !== $old_woo_order_data[ $key ] ) {
				$changed_fields[ $key ] = $value;

				do_action( 'jpcrm_woo_order_field_updated_' . $key, $value, $old_woo_order_data[ $key ] );
			}
		}
	}

	/**
	 * A Woo order was deleted.
	 *
	 * @param array $woo_order_data The deleted Woo order data.
	 * @return void
	 */
	public function order_deleted( array $woo_order_data ) {
		do_action( 'jpcrm_woo_order_deleted', $woo_order_data );
	}
}
