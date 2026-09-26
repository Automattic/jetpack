<?php
/**
 * Prices an on-site PayPal checkout from a payment link.
 *
 * @package automattic/jetpack-paypal-payments
 */

namespace Automattic\Jetpack\PaypalPayments;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class PayPal_Order_Builder
 *
 * Turns a payment resource plus the buyer's quantity and option choices into the
 * purchase unit of an Orders API request. The payment link is the price list:
 * nothing the browser sends becomes an amount.
 *
 * @since $$next-version$$
 */
class PayPal_Order_Builder {

	/**
	 * PayPal's length limit on an item name and description.
	 *
	 * @var int
	 */
	const MAX_ITEM_TEXT_LENGTH = 127;

	/**
	 * Build the purchase unit for one payment link.
	 *
	 * @param array $resource  The payment resource, as PayPal returns it.
	 * @param int   $quantity  Units the buyer asked for.
	 * @param array $selection Option label per dimension name, for a payment with options.
	 * @return array|\WP_Error {
	 *     @type array $purchase_unit The Orders API purchase unit.
	 *     @type array $summary       What was bought: name, options, quantity, unit_amount, currency, total.
	 * }
	 */
	public static function build( array $resource, $quantity, array $selection = array() ) {
		$item = $resource['line_items'][0] ?? null;
		$name = is_array( $item ) ? trim( (string) ( $item['name'] ?? '' ) ) : '';

		if ( '' === $name ) {
			return new \WP_Error(
				'paypal_order_invalid_resource',
				__( 'This payment link cannot be used for checkout.', 'jetpack-paypal-payments' ),
				array( 'status' => 400 )
			);
		}

		$quantity = (int) $quantity;
		$maximum  = max( 1, (int) ( $item['adjustable_quantity']['maximum'] ?? 1 ) );
		if ( $quantity < 1 || $quantity > $maximum ) {
			return new \WP_Error(
				'paypal_order_invalid_quantity',
				sprintf(
					/* translators: %d: the largest quantity the payment link allows */
					_n( 'You can buy up to %d of this item.', 'You can buy up to %d of this item.', $maximum, 'jetpack-paypal-payments' ),
					$maximum
				),
				array( 'status' => 400 )
			);
		}

		if ( ! self::supports_item( $item ) ) {
			return new \WP_Error(
				'paypal_order_profile_rates',
				__( 'This payment link uses tax or shipping rates from the PayPal account, so it has to be paid on PayPal.', 'jetpack-paypal-payments' ),
				array( 'status' => 400 )
			);
		}

		$priced = self::resolve_unit_price( $item, $selection );
		if ( is_wp_error( $priced ) ) {
			return $priced;
		}

		$unit_value = $priced['value'];
		$currency   = $priced['currency'];
		$options    = $priced['options'];
		$decimals   = PayPal_Attribute_Mapper::is_zero_decimal_currency( $currency ) ? 0 : 2;

		$item_total = round( $unit_value * $quantity, $decimals );
		$tax        = self::tax_total( $item, $item_total, $quantity, $decimals );
		$shipping   = self::shipping_total( $item, $quantity, $decimals );
		$handling   = round( (float) ( $item['handling'][0]['value'] ?? 0 ), $decimals );
		$discount   = self::discount_total( $item, $item_total, $decimals );
		$total      = round( $item_total + $tax + $shipping + $handling - $discount, $decimals );

		if ( $total <= 0 ) {
			return new \WP_Error(
				'paypal_order_invalid_amount',
				__( 'This item cannot be paid for on this page.', 'jetpack-paypal-payments' ),
				array( 'status' => 400 )
			);
		}

		$money = function ( $value ) use ( $currency, $decimals ) {
			return array(
				'currency_code' => $currency,
				'value'         => number_format( $value, $decimals, '.', '' ),
			);
		};

		$breakdown = array( 'item_total' => $money( $item_total ) );
		foreach ( compact( 'tax', 'shipping', 'handling', 'discount' ) as $line => $value ) {
			if ( $value > 0 ) {
				$breakdown[ 'tax' === $line ? 'tax_total' : $line ] = $money( $value );
			}
		}

		$item_name        = self::trim_to( $name );
		$options_summary  = self::describe_options( $options );
		$item_description = '' !== $options_summary ? $options_summary : (string) ( $item['description'] ?? '' );
		$order_item       = array(
			'name'        => $item_name,
			'quantity'    => (string) $quantity,
			'unit_amount' => $money( $unit_value ),
		);
		if ( '' !== trim( $item_description ) ) {
			$order_item['description'] = self::trim_to( $item_description );
		}

		$purchase_unit = array(
			'custom_id'   => (string) ( $resource['id'] ?? '' ),
			'description' => $item_name,
			'amount'      => array_merge( $money( $total ), array( 'breakdown' => $breakdown ) ),
			'items'       => array( $order_item ),
		);

		return array(
			'purchase_unit' => $purchase_unit,
			'summary'       => array(
				'name'        => $item_name,
				'options'     => $options,
				'quantity'    => $quantity,
				'unit_amount' => number_format( $unit_value, $decimals, '.', '' ),
				'currency'    => $currency,
				'total'       => number_format( $total, $decimals, '.', '' ),
			),
		);
	}

	/**
	 * Whether a block's payment can be priced here rather than on PayPal.
	 *
	 * Profile tax and shipping rates live in the merchant's PayPal account, where
	 * only PayPal's own checkout can read them.
	 *
	 * @param array $attributes The block attributes.
	 * @return bool
	 */
	public static function supports_attributes( array $attributes ) {
		if ( ! empty( $attributes['taxEnabled'] ) && 'PREFERENCE' === ( $attributes['taxType'] ?? '' ) ) {
			return false;
		}

		return empty( $attributes['shippingEnabled'] ) || 'PROFILE' !== ( $attributes['shippingMode'] ?? '' );
	}

	/**
	 * The same test as supports_attributes(), on the payment PayPal holds.
	 *
	 * @param array $item The payment's line item.
	 * @return bool
	 */
	private static function supports_item( array $item ) {
		if ( 'PREFERENCE' === ( $item['taxes'][0]['type'] ?? '' ) ) {
			return false;
		}

		$shipping = $item['shipping'][0] ?? array();

		return 'PREFERENCE' !== ( $shipping['type'] ?? '' ) || 'PROFILE' !== ( $shipping['value'] ?? '' );
	}

	/**
	 * Find the unit price, from the chosen option when the options carry their own.
	 *
	 * @param array $item      The payment's line item.
	 * @param array $selection Option label per dimension name.
	 * @return array|\WP_Error value (float), currency, and the chosen options as name => label pairs.
	 */
	private static function resolve_unit_price( array $item, array $selection ) {
		$amount  = $item['unit_amount'] ?? null;
		$options = array();

		foreach ( ( $item['variants']['dimensions'] ?? array() ) as $dimension ) {
			$dimension_name = trim( (string) ( $dimension['name'] ?? '' ) );
			if ( '' === $dimension_name || empty( $dimension['options'] ) || ! is_array( $dimension['options'] ) ) {
				continue;
			}

			$chosen = self::find_option( $dimension['options'], (string) ( $selection[ $dimension_name ] ?? '' ) );
			if ( null === $chosen ) {
				return new \WP_Error(
					'paypal_order_invalid_option',
					sprintf(
						/* translators: %s: the name of an option group, e.g. "Size" */
						__( 'Please choose a %s.', 'jetpack-paypal-payments' ),
						$dimension_name
					),
					array( 'status' => 400 )
				);
			}

			$options[] = array(
				'name'  => $dimension_name,
				'label' => trim( (string) $chosen['label'] ),
			);

			// PayPal prices the primary dimension alone.
			if ( ! empty( $dimension['primary'] ) && isset( $chosen['unit_amount']['value'] ) ) {
				$amount = $chosen['unit_amount'];
			}
		}

		$value    = isset( $amount['value'] ) ? trim( (string) $amount['value'] ) : '';
		$currency = strtoupper( trim( (string) ( $amount['currency_code'] ?? '' ) ) );

		if ( '' === $value || ! is_numeric( $value ) || (float) $value < 0 || ! preg_match( '/^[A-Z]{3}$/', $currency ) ) {
			return new \WP_Error(
				'paypal_order_invalid_amount',
				__( 'This item cannot be paid for on this page.', 'jetpack-paypal-payments' ),
				array( 'status' => 400 )
			);
		}

		return array(
			'value'    => (float) $value,
			'currency' => $currency,
			'options'  => $options,
		);
	}

	/**
	 * The option whose label the buyer picked.
	 *
	 * @param array  $options The dimension's options.
	 * @param string $label   The chosen label.
	 * @return array|null
	 */
	private static function find_option( array $options, $label ) {
		$label = trim( $label );
		if ( '' === $label ) {
			return null;
		}

		foreach ( $options as $option ) {
			if ( is_array( $option ) && trim( (string) ( $option['label'] ?? '' ) ) === $label ) {
				return $option;
			}
		}

		return null;
	}

	/**
	 * The tax on the order: a percentage of the items, or a flat amount per item.
	 *
	 * @param array $item       The payment's line item.
	 * @param float $item_total Items before tax.
	 * @param int   $quantity   Units bought.
	 * @param int   $decimals   Decimal places of the currency.
	 * @return float
	 */
	private static function tax_total( array $item, $item_total, $quantity, $decimals ) {
		$tax = $item['taxes'][0] ?? null;
		if ( ! is_array( $tax ) || ! isset( $tax['value'] ) || ! is_numeric( $tax['value'] ) ) {
			return 0.0;
		}

		$value = (float) $tax['value'];

		return 'PERCENTAGE' === ( $tax['type'] ?? '' )
			? round( $item_total * $value / 100, $decimals )
			: round( $value * $quantity, $decimals );
	}

	/**
	 * The shipping fee: a flat amount, plus a per-unit amount for each extra unit.
	 *
	 * @param array $item     The payment's line item.
	 * @param int   $quantity Units bought.
	 * @param int   $decimals Decimal places of the currency.
	 * @return float
	 */
	private static function shipping_total( array $item, $quantity, $decimals ) {
		$shipping = $item['shipping'][0] ?? null;
		if ( ! is_array( $shipping ) || 'FLAT' !== ( $shipping['type'] ?? '' ) || ! is_numeric( $shipping['value'] ?? null ) ) {
			return 0.0;
		}

		$extra = is_numeric( $shipping['additional_unit_value'] ?? null ) ? (float) $shipping['additional_unit_value'] : 0.0;

		return round( (float) $shipping['value'] + $extra * ( $quantity - 1 ), $decimals );
	}

	/**
	 * The discount, capped at the items' total.
	 *
	 * @param array $item       The payment's line item.
	 * @param float $item_total Items before tax.
	 * @param int   $decimals   Decimal places of the currency.
	 * @return float
	 */
	private static function discount_total( array $item, $item_total, $decimals ) {
		$discount = $item['discounts'][0] ?? null;
		if ( ! is_array( $discount ) || ! is_numeric( $discount['value'] ?? null ) ) {
			return 0.0;
		}

		$value = (float) $discount['value'];
		$total = 'PERCENTAGE' === ( $discount['type'] ?? '' ) ? $item_total * $value / 100 : $value;

		return round( min( max( $total, 0 ), $item_total ), $decimals );
	}

	/**
	 * "Size: Large, Color: Red" for the chosen options.
	 *
	 * @param array $options Chosen options as name => label pairs.
	 * @return string
	 */
	private static function describe_options( array $options ) {
		return implode(
			', ',
			array_map(
				function ( $option ) {
					return $option['name'] . ': ' . $option['label'];
				},
				$options
			)
		);
	}

	/**
	 * Cut a string to PayPal's item text limit.
	 *
	 * @param string $text The text.
	 * @return string
	 */
	private static function trim_to( $text ) {
		$text = trim( (string) $text );

		return mb_strlen( $text ) > self::MAX_ITEM_TEXT_LENGTH ? mb_substr( $text, 0, self::MAX_ITEM_TEXT_LENGTH ) : $text;
	}
}
