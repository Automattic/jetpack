<?php
/**
 * Attribute mapper between WordPress block attributes and PayPal Pay Links & Buttons API.
 *
 * Handles bidirectional mapping:
 * - Block attributes → PayPal API request body (for create/update)
 * - PayPal API response → Block attributes (for storing after create/update/get)
 *
 * @package automattic/jetpack-paypal-payments
 * @since 0.8.0
 */

namespace Automattic\Jetpack\PaypalPayments;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

use WP_Error;

/**
 * Class PayPal_Attribute_Mapper
 *
 * Maps block editor attributes to PayPal API request/response formats.
 * Provides validation, sanitization, and transformation for Phase 1
 * (BUY_NOW type, LINK integration mode, single line item).
 */
class PayPal_Attribute_Mapper {

	/**
	 * Supported currency codes for Phase 1.
	 *
	 * PayPal supports many currencies, but we validate against the most common
	 * to prevent typos. Full list at:
	 * https://developer.paypal.com/docs/reports/reference/paypal-supported-currencies/
	 *
	 * @var array
	 */
	const SUPPORTED_CURRENCIES = array(
		'USD',
		'EUR',
		'GBP',
		'CAD',
		'AUD',
		'JPY',
		'CNY',
		'CHF',
		'SEK',
		'NOK',
		'DKK',
		'NZD',
		'SGD',
		'HKD',
		'MXN',
		'BRL',
		'PLN',
		'CZK',
		'HUF',
		'ILS',
		'MYR',
		'PHP',
		'TWD',
		'THB',
		'INR',
	);

	/**
	 * Maximum product name length.
	 *
	 * @var int
	 */
	const MAX_NAME_LENGTH = 127;

	/**
	 * Maximum description length.
	 *
	 * @var int
	 */
	const MAX_DESCRIPTION_LENGTH = 256;

	/**
	 * Maximum button text length.
	 *
	 * @var int
	 */
	const MAX_BUTTON_TEXT_LENGTH = 50;

	/**
	 * Convert block attributes to a PayPal API request body.
	 *
	 * Takes the flat block attributes from the editor and transforms them
	 * into the nested structure required by the PayPal Pay Links & Buttons API.
	 *
	 * @param array $attributes Block attributes from the editor.
	 * @return array PayPal API request body.
	 */
	public static function attributes_to_api_request( array $attributes ) {
		$line_item = array(
			'name'        => sanitize_text_field( $attributes['productName'] ?? '' ),
			'unit_amount' => array(
				'currency_code' => sanitize_text_field( $attributes['currencyCode'] ?? 'USD' ),
				'value'         => sanitize_text_field( $attributes['price'] ?? '0.00' ),
			),
		);

		// Optional line item fields.
		if ( ! empty( $attributes['productDescription'] ) ) {
			$line_item['description'] = sanitize_text_field( $attributes['productDescription'] );
		}

		// Product variants (dimensions with options).
		if ( ! empty( $attributes['variantsEnabled'] ) && ! empty( $attributes['variants']['dimensions'] ) ) {
			$line_item['variants'] = self::sanitize_variants( $attributes['variants'] );
		}

		// Adjustable quantity (WOOPTP-170).
		if ( ! empty( $attributes['adjustableQuantity'] ) && ! empty( $attributes['maxQuantity'] ) ) {
			$max = absint( $attributes['maxQuantity'] );
			if ( $max >= 2 ) {
				$line_item['adjustable_quantity'] = array( 'maximum' => $max );
			}
		}

		// Customer notes / custom fields (WOOPTP-171).
		if ( ! empty( $attributes['customerNotes'] ) && is_array( $attributes['customerNotes'] ) ) {
			$notes = array();
			foreach ( $attributes['customerNotes'] as $note ) {
				$label = sanitize_text_field( $note['label'] ?? '' );
				if ( '' !== $label ) {
					$notes[] = array(
						'label'    => $label,
						'required' => ! empty( $note['required'] ),
					);
				}
			}
			if ( ! empty( $notes ) ) {
				$line_item['customer_notes'] = $notes;
			}
		}

		// Tax configuration (WOOPTP-172).
		if ( ! empty( $attributes['taxEnabled'] ) && ! empty( $attributes['taxName'] ) ) {
			$tax_type = sanitize_text_field( $attributes['taxType'] ?? 'PERCENTAGE' );
			$tax      = array(
				'name' => sanitize_text_field( $attributes['taxName'] ),
				'type' => in_array( $tax_type, array( 'PERCENTAGE', 'PREFERENCE' ), true ) ? $tax_type : 'PERCENTAGE',
			);

			if ( 'PREFERENCE' === $tax_type ) {
				$tax['value'] = 'PROFILE';
			} else {
				$tax['value'] = sanitize_text_field( $attributes['taxValue'] ?? '0' );
			}

			$line_item['taxes'] = array( $tax );
		}

		// Shipping configuration (WOOPTP-173).
		if ( ! empty( $attributes['shippingEnabled'] ) ) {
			$shipping_type = sanitize_text_field( $attributes['shippingType'] ?? 'FLAT' );

			$shipping = array(
				'type' => in_array( $shipping_type, array( 'FLAT', 'PREFERENCE' ), true ) ? $shipping_type : 'FLAT',
			);

			if ( 'PREFERENCE' === $shipping_type ) {
				$shipping['value'] = 'PROFILE';
			} else {
				$shipping['value'] = sanitize_text_field( $attributes['shippingValue'] ?? '0' );
			}

			$line_item['shipping'] = array( $shipping );
		}

		if ( ! empty( $attributes['collectShippingAddress'] ) ) {
			$line_item['collect_shipping_address'] = true;
		}

		$request = array(
			'type'             => 'BUY_NOW',
			'integration_mode' => 'LINK',
			'reusable'         => 'MULTIPLE',
			'line_items'       => array( $line_item ),
		);

		// Optional top-level fields.
		if ( ! empty( $attributes['returnUrl'] ) ) {
			$request['return_url'] = esc_url_raw( $attributes['returnUrl'] );
		}

		return $request;
	}

	/**
	 * Convert a PayPal API response to block attributes.
	 *
	 * Extracts the relevant fields from the PayPal API response and maps
	 * them to the flat attribute structure used by the block editor.
	 *
	 * @param array $response PayPal API response body (decoded JSON).
	 * @return array Block attributes to store.
	 */
	public static function api_response_to_attributes( array $response ) {
		$attributes = array(
			'isApiManaged' => true,
			'resourceId'   => sanitize_text_field( $response['id'] ?? '' ),
			'paymentLink'  => esc_url_raw( $response['payment_link'] ?? '' ),
		);

		// Extract first line item details.
		if ( ! empty( $response['line_items'] ) && is_array( $response['line_items'] ) ) {
			$line_item = $response['line_items'][0];

			$attributes['productName'] = sanitize_text_field( $line_item['name'] ?? '' );

			if ( isset( $line_item['unit_amount'] ) && is_array( $line_item['unit_amount'] ) ) {
				$attributes['currencyCode'] = sanitize_text_field( $line_item['unit_amount']['currency_code'] ?? 'USD' );
				$attributes['price']        = sanitize_text_field( $line_item['unit_amount']['value'] ?? '0.00' );
			}

			if ( ! empty( $line_item['description'] ) ) {
				$attributes['productDescription'] = sanitize_text_field( $line_item['description'] );
			}

			if ( ! empty( $line_item['variants']['dimensions'] ) ) {
				$attributes['variantsEnabled'] = true;
				$attributes['variants']        = $line_item['variants'];
			}

			// Adjustable quantity (WOOPTP-170).
			if ( ! empty( $line_item['adjustable_quantity']['maximum'] ) ) {
				$attributes['adjustableQuantity'] = true;
				$attributes['maxQuantity']        = absint( $line_item['adjustable_quantity']['maximum'] );
			}

			// Customer notes (WOOPTP-171).
			if ( ! empty( $line_item['customer_notes'] ) && is_array( $line_item['customer_notes'] ) ) {
				$attributes['customerNotes'] = array_map(
					function ( $note ) {
						return array(
							'label'    => sanitize_text_field( $note['label'] ?? '' ),
							'required' => ! empty( $note['required'] ),
						);
					},
					$line_item['customer_notes']
				);
			}

			// Tax configuration (WOOPTP-172).
			if ( ! empty( $line_item['taxes'] ) && is_array( $line_item['taxes'] ) ) {
				$tax                      = $line_item['taxes'][0];
				$attributes['taxEnabled'] = true;
				$attributes['taxName']    = sanitize_text_field( $tax['name'] ?? 'Sales Tax' );
				$attributes['taxType']    = sanitize_text_field( $tax['type'] ?? 'PERCENTAGE' );
				$attributes['taxValue']   = 'PREFERENCE' === $attributes['taxType'] ? '' : sanitize_text_field( $tax['value'] ?? '' );
			}

			// Shipping configuration (WOOPTP-173).
			if ( ! empty( $line_item['shipping'] ) && is_array( $line_item['shipping'] ) ) {
				$shipping                      = $line_item['shipping'][0];
				$attributes['shippingEnabled'] = true;
				$attributes['shippingType']    = sanitize_text_field( $shipping['type'] ?? 'FLAT' );
				$attributes['shippingValue']   = 'PREFERENCE' === $attributes['shippingType'] ? '' : sanitize_text_field( $shipping['value'] ?? '' );
			}

			if ( ! empty( $line_item['collect_shipping_address'] ) ) {
				$attributes['collectShippingAddress'] = true;
			}
		}

		// Extract return_url if present.
		if ( ! empty( $response['return_url'] ) ) {
			$attributes['returnUrl'] = esc_url_raw( $response['return_url'] );
		}

		// Extract payment_link from HATEOAS links if not in top-level field.
		if ( empty( $attributes['paymentLink'] ) && ! empty( $response['links'] ) && is_array( $response['links'] ) ) {
			foreach ( $response['links'] as $link ) {
				if ( isset( $link['rel'] ) && 'payment_link' === $link['rel'] && ! empty( $link['href'] ) ) {
					$attributes['paymentLink'] = esc_url_raw( $link['href'] );
					break;
				}
			}
		}

		return $attributes;
	}

	/**
	 * Validate block attributes before sending to the PayPal API.
	 *
	 * Checks required fields, format constraints, and business rules.
	 * Returns WP_Error on failure with specific error codes for each validation issue.
	 *
	 * @param array $attributes Block attributes to validate.
	 * @return true|WP_Error True if valid, WP_Error with details on failure.
	 */
	public static function validate_attributes( array $attributes ) {
		// Required: product name (reject empty and whitespace-only).
		if ( empty( $attributes['productName'] ) || '' === trim( $attributes['productName'] ) ) {
			return new WP_Error(
				'missing_product_name',
				__( 'Product name is required.', 'jetpack-paypal-payments' ),
				array( 'status' => 400 )
			);
		}

		$product_name = sanitize_text_field( $attributes['productName'] );
		if ( mb_strlen( $product_name ) > self::MAX_NAME_LENGTH ) {
			return new WP_Error(
				'product_name_too_long',
				/* translators: %d: maximum allowed characters */
				sprintf( __( 'Product name must be %d characters or fewer.', 'jetpack-paypal-payments' ), self::MAX_NAME_LENGTH ),
				array( 'status' => 400 )
			);
		}

		// Required: price.
		if ( ! isset( $attributes['price'] ) || '' === $attributes['price'] ) {
			return new WP_Error(
				'missing_price',
				__( 'Price is required.', 'jetpack-paypal-payments' ),
				array( 'status' => 400 )
			);
		}

		if ( ! self::is_valid_price( $attributes['price'] ) ) {
			return new WP_Error(
				'invalid_price',
				__( 'Price must be a valid positive number (e.g., "29.99").', 'jetpack-paypal-payments' ),
				array( 'status' => 400 )
			);
		}

		// Required: currency code.
		$currency = $attributes['currencyCode'] ?? 'USD';
		if ( ! in_array( strtoupper( $currency ), self::SUPPORTED_CURRENCIES, true ) ) {
			return new WP_Error(
				'invalid_currency',
				__( 'Unsupported currency code.', 'jetpack-paypal-payments' ),
				array( 'status' => 400 )
			);
		}

		// Optional: description length.
		if ( ! empty( $attributes['productDescription'] ) ) {
			$description = sanitize_text_field( $attributes['productDescription'] );
			if ( mb_strlen( $description ) > self::MAX_DESCRIPTION_LENGTH ) {
				return new WP_Error(
					'description_too_long',
					/* translators: %d: maximum allowed characters */
					sprintf( __( 'Description must be %d characters or fewer.', 'jetpack-paypal-payments' ), self::MAX_DESCRIPTION_LENGTH ),
					array( 'status' => 400 )
				);
			}
		}

		// Optional: button text length.
		if ( ! empty( $attributes['buttonText'] ) ) {
			$button_text = sanitize_text_field( $attributes['buttonText'] );
			if ( mb_strlen( $button_text ) > self::MAX_BUTTON_TEXT_LENGTH ) {
				return new WP_Error(
					'button_text_too_long',
					/* translators: %d: maximum allowed characters */
					sprintf( __( 'Button text must be %d characters or fewer.', 'jetpack-paypal-payments' ), self::MAX_BUTTON_TEXT_LENGTH ),
					array( 'status' => 400 )
				);
			}
		}

		// Optional: return URL validation.
		if ( ! empty( $attributes['returnUrl'] ) ) {
			$return_url = esc_url_raw( $attributes['returnUrl'] );
			if ( empty( $return_url ) || ! wp_http_validate_url( $return_url ) || 0 !== strpos( $return_url, 'https://' ) ) {
				return new WP_Error(
					'invalid_return_url',
					__( 'Return URL must be a valid HTTPS URL.', 'jetpack-paypal-payments' ),
					array( 'status' => 400 )
				);
			}
		}

		return true;
	}

	/**
	 * Validate a resource ID format (PLB-XXXXXXXXXXXX).
	 *
	 * @param string $resource_id The resource ID to validate.
	 * @return bool True if valid format.
	 */
	public static function is_valid_resource_id( $resource_id ) {
		return (bool) preg_match( '/^PLB-[A-Za-z0-9]+$/', $resource_id );
	}

	/**
	 * Check whether block attributes indicate a V2 API-managed block.
	 *
	 * @param array $attributes Block attributes.
	 * @return bool True if the block is managed via the PayPal API (V2).
	 */
	public static function is_api_managed( array $attributes ) {
		return ! empty( $attributes['isApiManaged'] ) && true === $attributes['isApiManaged'];
	}

	/**
	 * Merge API response attributes into existing block attributes.
	 *
	 * After a create or update API call, merge the response data back
	 * into the block attributes without overwriting frontend-only fields
	 * like buttonText and buttonType.
	 *
	 * @param array $existing_attributes Current block attributes.
	 * @param array $response_attributes Attributes extracted from API response.
	 * @return array Merged attributes.
	 */
	public static function merge_response_attributes( array $existing_attributes, array $response_attributes ) {
		// Frontend-only fields that should not be overwritten by API response.
		$preserve_keys = array( 'buttonText', 'buttonType' );

		$merged = array_merge( $existing_attributes, $response_attributes );

		// Restore preserved frontend-only values.
		foreach ( $preserve_keys as $key ) {
			if ( isset( $existing_attributes[ $key ] ) ) {
				$merged[ $key ] = $existing_attributes[ $key ];
			}
		}

		return $merged;
	}

	/**
	 * Validate a price string.
	 *
	 * Ensures the price is a positive decimal number with up to 2 decimal places.
	 * PayPal requires string format prices like "29.99".
	 *
	 * @param string $price The price string to validate.
	 * @return bool True if valid.
	 */
	private static function is_valid_price( $price ) {
		// Must be a string representation of a positive decimal number.
		if ( ! is_string( $price ) && ! is_numeric( $price ) ) {
			return false;
		}

		$price = (string) $price;

		// Match positive numbers with optional decimal places (up to 2).
		if ( ! preg_match( '/^\d+(\.\d{1,2})?$/', $price ) ) {
			return false;
		}

		// Must be greater than zero.
		if ( (float) $price <= 0 ) {
			return false;
		}

		return true;
	}

	/**
	 * Sanitize and validate a variants structure for the PayPal API.
	 *
	 * Enforces: max 5 dimensions, max 10 options per dimension,
	 * only the primary dimension may have per-option pricing.
	 *
	 * @param array $variants Raw variants from block attributes.
	 * @return array Sanitized variants ready for the API.
	 */
	private static function sanitize_variants( array $variants ) {
		if ( empty( $variants['dimensions'] ) || ! is_array( $variants['dimensions'] ) ) {
			return array( 'dimensions' => array() );
		}

		$sanitized_dimensions = array();
		$count                = 0;

		foreach ( $variants['dimensions'] as $dimension ) {
			if ( ++$count > 5 ) {
				break;
			}

			$dim = array(
				'name'    => sanitize_text_field( $dimension['name'] ?? '' ),
				'primary' => ! empty( $dimension['primary'] ),
				'options' => array(),
			);

			if ( empty( $dim['name'] ) ) {
				continue;
			}

			$option_count = 0;
			foreach ( ( $dimension['options'] ?? array() ) as $option ) {
				if ( ++$option_count > 10 ) {
					break;
				}

				$opt = array(
					'label' => sanitize_text_field( $option['label'] ?? '' ),
				);

				if ( empty( $opt['label'] ) ) {
					continue;
				}

				// Only primary dimension can have per-option pricing.
				if ( $dim['primary'] && ! empty( $option['unit_amount'] ) && is_array( $option['unit_amount'] ) ) {
					$opt['unit_amount'] = array(
						'currency_code' => sanitize_text_field( $option['unit_amount']['currency_code'] ?? 'USD' ),
						'value'         => sanitize_text_field( $option['unit_amount']['value'] ?? '' ),
					);
				}

				$dim['options'][] = $opt;
			}

			if ( ! empty( $dim['options'] ) ) {
				$sanitized_dimensions[] = $dim;
			}
		}

		return array( 'dimensions' => $sanitized_dimensions );
	}
}
