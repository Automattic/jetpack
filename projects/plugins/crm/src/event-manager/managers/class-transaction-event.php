<?php
/**
 * Transaction Event.
 *
 * @package automattic/jetpack-crm
 */

namespace Automattic\Jetpack\CRM\Event_Manager;

use Automattic\Jetpack\CRM\Entities\Factories\Transaction_Factory;
use Automattic\Jetpack\CRM\Entities\Transaction;

/**
 * Transaction Event class.
 *
 * @since 6.2.0
 */
class Transaction_Event implements Event {

	/**
	 * The Transaction_Event instance.
	 *
	 * @since 6.2.0
	 * @var Transaction_Event
	 */
	private static $instance = null;

	/**
	 * Get the singleton instance of this class.
	 *
	 * @since 6.2.0
	 *
	 * @return Transaction_Event The Transaction_Event instance.
	 */
	public static function get_instance(): Transaction_Event {
		if ( ! self::$instance ) {
			self::$instance = new self();
		}

		return self::$instance;
	}

	/**
	 * A new transaction was created.
	 *
	 * @since 6.2.0
	 *
	 * @param array $transaction_data The created transaction data.
	 * @return void
	 */
	public function created( array $transaction_data ): void {
		/** @var Transaction $transaction */
		$transaction = Transaction_Factory::create( $transaction_data );

		do_action( 'jpcrm_transaction_created', $transaction );
	}

	/**
	 * The transaction was updated.
	 *
	 * @since 6.2.0
	 *
	 * @param array $transaction_data The updated transaction data.
	 * @return void
	 */
	public function updated( array $transaction_data ): void {
		$transaction = Transaction_Factory::create( $transaction_data );

		do_action( 'jpcrm_transaction_updated', $transaction );
	}

	/**
	 * The transaction was deleted.
	 *
	 * @since 6.2.0
	 *
	 * @param int $transaction_id The deleted transaction id.
	 * @return void
	 */
	public function deleted( int $transaction_id ): void {
		do_action( 'jpcrm_transaction_deleted', $transaction_id );
	}
}
