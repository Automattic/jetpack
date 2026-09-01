<?php
/**
 * Payment state for a form response.
 *
 * Owns the `_feedback_payment` meta shape and the transitions between its
 * states, plus the notification that is held back until a response is paid.
 *
 * PROTOTYPE NOTE: the design doc puts awaiting-payment responses behind a
 * dedicated `jp-awaiting-payment` post status. The prototype keeps them on
 * `publish` and tracks state purely in meta, so unpaid responses stay visible
 * in the dashboard (which is the more useful thing to demo) without auditing
 * every `post_status` query in the package.
 *
 * @package automattic/jetpack-forms
 */

namespace Automattic\Jetpack\Forms\Payments;

/**
 * Reads and writes the payment state of a feedback entry.
 */
class Payment_Status {

	/**
	 * Meta key holding the payment record.
	 *
	 * @var string
	 */
	const META_KEY = '_feedback_payment';

	/**
	 * Meta key holding a notification deferred until payment completes.
	 *
	 * @var string
	 */
	const PENDING_EMAIL_META_KEY = '_feedback_payment_pending_email';

	/**
	 * Record an awaiting-payment order against an entry.
	 *
	 * @param int    $entry_id    Feedback post ID.
	 * @param int    $amount      Amount in minor units.
	 * @param string $currency    Currency code.
	 * @param string $order_token Signed order token.
	 * @return void
	 */
	public static function start( $entry_id, $amount, $currency, $order_token ) {
		update_post_meta(
			$entry_id,
			self::META_KEY,
			array(
				'order_token' => $order_token,
				'amount'      => (int) $amount,
				'currency'    => (string) $currency,
				'status'      => 'awaiting',
				'order_id'    => null,
				'paid_at'     => null,
				// Always false in the prototype: nothing has been confirmed with a
				// payment processor, because there isn't one. See the design doc's
				// `verified` axis — phase 2 is what makes this true.
				'verified'    => false,
			)
		);
	}

	/**
	 * Get the payment record for an entry.
	 *
	 * @param int $entry_id Feedback post ID.
	 * @return array|null
	 */
	public static function get( $entry_id ) {
		$record = get_post_meta( $entry_id, self::META_KEY, true );

		return is_array( $record ) ? $record : null;
	}

	/**
	 * Whether an entry is waiting on payment.
	 *
	 * @param int $entry_id Feedback post ID.
	 * @return bool
	 */
	public static function is_awaiting( $entry_id ) {
		$record = self::get( $entry_id );

		return $record && 'awaiting' === $record['status'];
	}

	/**
	 * Mark an entry paid.
	 *
	 * Refuses to act on an entry that is not awaiting payment, which is what
	 * makes the order token effectively single-use: a replayed token finds an
	 * entry that has already moved on.
	 *
	 * @param int    $entry_id Feedback post ID.
	 * @param string $order_id Identifier from the processor.
	 * @return bool True when the entry moved to paid.
	 */
	public static function mark_paid( $entry_id, $order_id ) {
		$record = self::get( $entry_id );

		if ( ! $record || 'awaiting' !== $record['status'] ) {
			return false;
		}

		$record['status']   = 'paid';
		$record['order_id'] = (string) $order_id;
		$record['paid_at']  = time();

		update_post_meta( $entry_id, self::META_KEY, $record );

		self::send_deferred_notification( $entry_id );

		return true;
	}

	/**
	 * Mark an entry's payment as failed.
	 *
	 * @param int $entry_id Feedback post ID.
	 * @return bool
	 */
	public static function mark_failed( $entry_id ) {
		$record = self::get( $entry_id );

		if ( ! $record || 'awaiting' !== $record['status'] ) {
			return false;
		}

		$record['status'] = 'failed';

		update_post_meta( $entry_id, self::META_KEY, $record );

		return true;
	}

	/**
	 * Hold a response notification back until the response is paid.
	 *
	 * @param int          $entry_id Feedback post ID.
	 * @param string|array $to       Recipient(s).
	 * @param string       $subject  Email subject.
	 * @param string       $message  Email body.
	 * @param string|array $headers  Email headers.
	 * @return void
	 */
	public static function defer_notification( $entry_id, $to, $subject, $message, $headers ) {
		update_post_meta(
			$entry_id,
			self::PENDING_EMAIL_META_KEY,
			array(
				'to'      => $to,
				'subject' => $subject,
				'message' => $message,
				'headers' => $headers,
			)
		);
	}

	/**
	 * Send a notification that was held back, if there is one.
	 *
	 * @param int $entry_id Feedback post ID.
	 * @return void
	 */
	private static function send_deferred_notification( $entry_id ) {
		$email = get_post_meta( $entry_id, self::PENDING_EMAIL_META_KEY, true );

		if ( ! is_array( $email ) || empty( $email['to'] ) ) {
			return;
		}

		delete_post_meta( $entry_id, self::PENDING_EMAIL_META_KEY );

		\Automattic\Jetpack\Forms\ContactForm\Contact_Form::wp_mail(
			$email['to'],
			$email['subject'],
			$email['message'],
			$email['headers']
		);
	}
}
