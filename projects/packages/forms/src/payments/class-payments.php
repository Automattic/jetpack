<?php
/**
 * Jetpack Forms payments — PROTOTYPE.
 *
 * Implements the site-side half of the "Stripe Payments for Jetpack Forms"
 * design: a response is always saved, an order is minted against it, the buyer
 * is sent to checkout, and the response flips to paid once checkout confirms.
 *
 * What is real here: the order token, the amount resolution, the awaiting/paid
 * state machine, the deferred owner notification, and the front-end handoff.
 *
 * What is simulated: checkout itself. Production opens WPCOM's checkout iframe
 * at subscribe.wordpress.com and confirms the result against WPCOM. The
 * prototype renders its own checkout dialog and confirms against this site, so
 * no WPCOM changes and no Stripe account are needed to demo the flow. Every
 * simulated response carries `verified: false` for exactly that reason.
 *
 * @package automattic/jetpack-forms
 */

namespace Automattic\Jetpack\Forms\Payments;

use Automattic\Jetpack\Forms\ContactForm\Contact_Form;

/**
 * Payments bootstrap, settings and amount resolution.
 */
class Payments {

	/**
	 * Currencies the prototype offers, with their minor-unit exponent and symbol.
	 *
	 * Mirrors a subset of Jetpack_Memberships::SUPPORTED_CURRENCIES so the
	 * prototype's minimums behave like the real thing.
	 *
	 * @var array
	 */
	const CURRENCIES = array(
		'USD' => array( 'symbol' => '$', 'minimum' => 50 ),
		'EUR' => array( 'symbol' => '€', 'minimum' => 50 ),
		'GBP' => array( 'symbol' => '£', 'minimum' => 30 ),
		'CAD' => array( 'symbol' => 'C$', 'minimum' => 50 ),
		'AUD' => array( 'symbol' => 'A$', 'minimum' => 50 ),
	);

	/**
	 * Wire up the payments feature.
	 *
	 * @return void
	 */
	public static function init() {
		add_action( 'rest_api_init', array( Payment_Endpoint::class, 'register_routes' ) );
	}

	/**
	 * Read the payment settings off a form.
	 *
	 * @param Contact_Form $form Form being submitted.
	 * @return array|null Settings when payments are enabled, null otherwise.
	 */
	public static function get_settings( Contact_Form $form ) {
		$settings = $form->get_attribute( 'payments' );

		if ( is_string( $settings ) ) {
			$settings = json_decode( $settings, true );
		}

		if ( ! is_array( $settings ) || empty( $settings['enabled'] ) ) {
			return null;
		}

		$currency = strtoupper( (string) ( $settings['currency'] ?? 'USD' ) );

		if ( ! isset( self::CURRENCIES[ $currency ] ) ) {
			$currency = 'USD';
		}

		return array(
			'enabled'     => true,
			'currency'    => $currency,
			'amountMode'  => in_array( $settings['amountMode'] ?? 'fixed', array( 'fixed', 'buyer' ), true )
				? $settings['amountMode']
				: 'fixed',
			'amount'      => (float) ( $settings['amount'] ?? 0 ),
			'amountField' => (string) ( $settings['amountField'] ?? '' ),
		);
	}

	/**
	 * Whether a form collects payment.
	 *
	 * @param Contact_Form $form Form being submitted.
	 * @return bool
	 */
	public static function is_enabled( Contact_Form $form ) {
		return (bool) self::get_settings( $form );
	}

	/**
	 * Resolve the amount owed for a submission, in minor units.
	 *
	 * This is the `Amount_Resolver` seam from the design. The prototype handles
	 * `fixed` and `buyer`; `computed` (quantity x price, priced options) is
	 * phase 3 and would be a third branch here with no change anywhere else.
	 *
	 * @param array $settings Payment settings from get_settings().
	 * @param array $values   Submitted values, keyed by field label.
	 * @return int|null Amount in minor units, or null when it cannot be resolved.
	 */
	public static function resolve_amount( array $settings, array $values ) {
		if ( 'buyer' === $settings['amountMode'] ) {
			$raw = self::find_value( $values, $settings['amountField'] );

			if ( null === $raw ) {
				return null;
			}

			// Strip anything that isn't part of a number: currency symbols,
			// thousands separators, stray whitespace.
			$raw = preg_replace( '/[^0-9.,]/', '', (string) $raw );
			$raw = str_replace( ',', '.', (string) $raw );

			if ( '' === $raw || ! is_numeric( $raw ) ) {
				return null;
			}

			$amount = (float) $raw;
		} else {
			$amount = (float) $settings['amount'];
		}

		$minor = (int) round( $amount * 100 );

		if ( $minor < self::CURRENCIES[ $settings['currency'] ]['minimum'] ) {
			return null;
		}

		return $minor;
	}

	/**
	 * Find a submitted value by (case-insensitive, loose) field label.
	 *
	 * Falls back to the first numeric-looking value when no label is configured,
	 * which keeps the prototype usable without exact label matching.
	 *
	 * @param array  $values Submitted values keyed by label.
	 * @param string $label  Configured field label.
	 * @return string|null
	 */
	private static function find_value( array $values, $label ) {
		if ( '' !== $label ) {
			foreach ( $values as $key => $value ) {
				if ( 0 === strcasecmp( trim( (string) $key ), trim( $label ) ) ) {
					return is_array( $value ) ? reset( $value ) : $value;
				}
			}
		}

		foreach ( $values as $value ) {
			if ( is_array( $value ) ) {
				continue;
			}

			$candidate = preg_replace( '/[^0-9.,]/', '', (string) $value );

			if ( '' !== $candidate && is_numeric( str_replace( ',', '.', $candidate ) ) ) {
				return $value;
			}
		}

		return null;
	}

	/**
	 * Start an order for a submission and return the front-end payload.
	 *
	 * @param Contact_Form $form     Form being submitted.
	 * @param int          $entry_id Feedback post ID.
	 * @param array        $values   Submitted values keyed by label.
	 * @return array|null Payload for the JSON submission response, or null.
	 */
	public static function start_order( Contact_Form $form, $entry_id, array $values ) {
		$settings = self::get_settings( $form );

		if ( ! $settings || ! $entry_id ) {
			return null;
		}

		$amount = self::resolve_amount( $settings, $values );

		if ( null === $amount ) {
			// The form asks for payment but we could not work out how much. The
			// response is already saved — flag it rather than silently dropping
			// the payment, which is the fail-open rule from the design.
			update_post_meta(
				$entry_id,
				Payment_Status::META_KEY,
				array(
					'order_token' => '',
					'amount'      => 0,
					'currency'    => $settings['currency'],
					'status'      => 'payment_unavailable',
					'order_id'    => null,
					'paid_at'     => null,
					'verified'    => false,
				)
			);

			return null;
		}

		$token = Order::mint(
			array(
				'entry_id' => $entry_id,
				'amount'   => $amount,
				'currency' => $settings['currency'],
			)
		);

		Payment_Status::start( $entry_id, $amount, $settings['currency'], $token );

		return array(
			'orderToken'      => $token,
			'amount'          => $amount,
			'currency'        => $settings['currency'],
			'formattedAmount' => self::format_amount( $amount, $settings['currency'] ),
			'confirmUrl'      => rest_url( Payment_Endpoint::NAMESPACE_V2 . '/' . Payment_Endpoint::REST_BASE . '/confirm' ),
			// Production replaces this with the subscribe.wordpress.com checkout
			// URL and the modal from extensions/shared/memberships.js.
			'simulated'       => true,
		);
	}

	/**
	 * Format an amount in minor units for display.
	 *
	 * @param int    $amount   Amount in minor units.
	 * @param string $currency Currency code.
	 * @return string
	 */
	public static function format_amount( $amount, $currency ) {
		$currency = isset( self::CURRENCIES[ $currency ] ) ? $currency : 'USD';

		return self::CURRENCIES[ $currency ]['symbol'] . number_format_i18n( $amount / 100, 2 );
	}
}
