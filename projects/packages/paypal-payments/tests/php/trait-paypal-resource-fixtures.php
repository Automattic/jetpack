<?php
/**
 * Payment resources shared by the PayPal tests.
 *
 * @package automattic/jetpack-paypal-payments
 */

namespace Automattic\Jetpack\PaypalPayments;

/**
 * Payment resources as PayPal returns them, and a mock that serves one.
 */
trait PayPal_Resource_Fixtures {

	/**
	 * Mock a get_resource API response.
	 *
	 * @param array $resource The resource data to return.
	 */
	private function mock_get_resource_response( $resource ) {
		add_filter(
			'pre_http_request',
			function ( $preempt, $args, $url ) use ( $resource ) {
				if ( false !== strpos( $url, '/v1/oauth2/token' ) ) {
					return $preempt;
				}
				return array(
					'response' => array(
						'code'    => 200,
						'message' => '',
					),
					'body'     => wp_json_encode( $resource, JSON_UNESCAPED_SLASHES ),
				);
			},
			10,
			3
		);
	}

	/**
	 * A payment priced on the product, as PayPal returns it.
	 *
	 * @return array
	 */
	private static function get_product_price_resource() {
		return array(
			'id'               => 'PLB-U7XQRUHKESAZ',
			'integration_mode' => 'LINK',
			'type'             => 'BUY_NOW',
			'reusable'         => 'MULTIPLE',
			'line_items'       => array(
				array(
					'name'                     => 'Test Link',
					'unit_amount'              => array(
						'currency_code' => 'USD',
						'value'         => '11.00',
					),
					'collect_shipping_address' => false,
				),
			),
			'status'           => 'ACTIVE',
			'payment_link'     => 'https://www.sandbox.paypal.com/ncp/payment/PLB-U7XQRUHKESAZ',
		);
	}

	/**
	 * A payment priced per Size, with an unpriced Color, as PayPal returns it.
	 *
	 * @return array
	 */
	private static function get_per_option_resource() {
		return array(
			'id'               => 'PLB-ZC45RDYZRHS9',
			'integration_mode' => 'LINK',
			'type'             => 'BUY_NOW',
			'reusable'         => 'MULTIPLE',
			'line_items'       => array(
				array(
					'name'                     => 'Test Widget',
					'description'              => 'A widget in three sizes.',
					'collect_shipping_address' => true,
					'variants'                 => array(
						'dimensions' => array(
							array(
								'name'    => 'Size',
								'primary' => true,
								'options' => array(
									array(
										'label'       => 'Small',
										'unit_amount' => array(
											'currency_code' => 'USD',
											'value' => '24.50',
										),
									),
									array(
										'label'       => 'Medium',
										'unit_amount' => array(
											'currency_code' => 'USD',
											'value' => '29.50',
										),
									),
									array(
										'label'       => 'Large',
										'unit_amount' => array(
											'currency_code' => 'USD',
											'value' => '34.50',
										),
									),
								),
							),
							array(
								'name'    => 'Color',
								'primary' => false,
								'options' => array(
									array( 'label' => 'Red' ),
									array( 'label' => 'Blue' ),
								),
							),
						),
					),
				),
			),
			'status'           => 'ACTIVE',
			'create_time'      => '2026-09-11T17:32:35Z',
			'payment_link'     => 'https://www.sandbox.paypal.com/ncp/payment/PLB-ZC45RDYZRHS9',
		);
	}

	/**
	 * A payment priced per option in yen, as PayPal returns it.
	 *
	 * @return array
	 */
	private static function get_per_option_yen_resource() {
		return array(
			'id'               => 'PLB-Q5Z4GDYFS367',
			'integration_mode' => 'LINK',
			'type'             => 'BUY_NOW',
			'reusable'         => 'MULTIPLE',
			'line_items'       => array(
				array(
					'name'                     => 'Yen Widget',
					'description'              => "First line.\nSecond line.\n\nAfter a blank line.",
					'taxes'                    => array(
						array(
							'name'  => 'Sales Tax',
							'type'  => 'FLAT',
							'value' => '1500',
						),
					),
					'shipping'                 => array(
						array(
							'type'                  => 'FLAT',
							'value'                 => '500',
							'additional_unit_value' => '200',
						),
					),
					'handling'                 => array(
						array(
							'type'  => 'FLAT',
							'value' => '400',
						),
					),
					'collect_shipping_address' => false,
					'variants'                 => array(
						'dimensions' => array(
							array(
								'name'    => 'Size',
								'primary' => true,
								'options' => array(
									array(
										'label'       => 'Small',
										'unit_amount' => array(
											'currency_code' => 'JPY',
											'value' => '1000',
										),
									),
									array(
										'label'       => 'Large',
										'unit_amount' => array(
											'currency_code' => 'JPY',
											'value' => '2000',
										),
									),
								),
							),
						),
					),
				),
			),
			'status'           => 'ACTIVE',
			'create_time'      => '2026-09-16T16:39:34Z',
			'payment_link'     => 'https://www.sandbox.paypal.com/ncp/payment/PLB-Q5Z4GDYFS367',
		);
	}
}
