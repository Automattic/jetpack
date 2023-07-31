<?php
/**
 * Quote Event.
 *
 * @package Automattic\Jetpack\CRM\Event_Manager
 */

namespace Automattic\Jetpack\CRM\Event_Manager;

/**
 * Quote Event class.
 */
class Quote_Event implements Event {

	/** @var null The Quote_Event instance */
	private static $instance = null;

	/**
	 * Get the singleton instance of this class.
	 *
	 * @return Quote_Event
	 */
	public static function getInstance(): Quote_Event {
		if ( ! self::$instance ) {
			self::$instance = new Quote_Event();
		}

		return self::$instance;
	}

	/**
	 * A new quote was created.
	 *
	 * @param array $quote_data Quote data.
	 * @return void
	 */
	public function created( array $quote_data ) {
		do_action( 'jpcrm_quote_created', $quote_data );
	}

	/**
	 * The quote was updated.
	 *
	 * @param array $quote_data Quote data.
	 * @param array $old_quote_data Old quote data.
	 * @return void
	 */
	public function updated( array $quote_data, array $old_quote_data ) {

		// General update
		do_action( 'jpcrm_quote_updated', $quote_data );

		// Check for field changes for specific updates
		$changed_fields = array();
		foreach ( $quote_data as $key => $value ) {
			if ( $value !== $old_quote_data[ $key ] ) {
				$changed_fields[ $key ] = $value;

				do_action( 'jpcrm_quote_field_updated_' . $key, $value, $old_quote_data[ $key ] );
			}
		}
	}

	/**
	 * A quote was accepted.
	 *
	 * @param array $quote_data Quote data.
	 * @return void
	 */
	public function accepted( array $quote_data ) {
		do_action( 'jpcrm_quote_accepted', $quote_data );
	}

	/**
	 * A quote was deleted.
	 *
	 * @param array $quote_data Quote data.
	 * @return void
	 */
	public function deleted( array $quote_data ) {
		do_action( 'jpcrm_quote_deleted', $quote_data );
	}
}
