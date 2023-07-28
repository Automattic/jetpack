<?php

namespace Automattic\Jetpack\CRM\Event_Manager; 

class Transaction_Event implements Event {
	
	/** @var null The Transaction_Event instance */
	private static $instance = null;
	
	/**
	 * Get the singleton instance of this class.
	 * 
	 * @return Transaction_Event
	 */
	public static function getInstance(): Transaction_Event {
		if ( ! self::$instance ) {
			self::$instance = new Transaction_Event();
		}
		
		return self::$instance;
	}

	/**
	 * A new transaction was created.
	 * 
	 * @param array $transaction_data
	 * @return void
	 */
	public function created( array $transaction_data ) {
		do_action( 'jpcrm_transaction_created', $transaction_data );
	}

	/**
	 * The transaction was updated.
	 * 
	 * @param array $transaction_data
	 * @param array $old_transaction_data
	 * @return void
	 */
	public function updated( array $transaction_data, array $old_transaction_data ) {
		
		// General update
		do_action( 'jpcrm_transaction_updated', $transaction_data );
		
		// Check for field changes for specific updates
		$changed_fields = array();
		foreach ( $transaction_data as $key => $value ) {
			if ( $value != $old_transaction_data[ $key ] ) {
				$changed_fields[ $key ] = $value;
				
				do_action( 'jpcrm_transaction_field_updated_' . $key, $value, $old_transaction_data[ $key ] );
			}
		}
	}
	
	/**
	 * A transaction was deleted.
	 * 
	 * @param array $transaction_data
	 * @return void
	 */
	public function deleted( array $transaction_data ) {
		do_action( 'jpcrm_transaction_deleted', $transaction_data );
	}
	
}