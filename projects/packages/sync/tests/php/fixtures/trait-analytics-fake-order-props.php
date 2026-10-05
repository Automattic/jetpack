<?php
/**
 * Order getters for the configurable WooCommerce Analytics order stubs.
 *
 * @package automattic/jetpack-sync
 */

require_once __DIR__ . '/class-analytics-fake-line-item.php';

if ( ! trait_exists( 'Analytics_Fake_Order_Props', false ) ) {
	/**
	 * The getters order stats read, backed by a property array.
	 */
	trait Analytics_Fake_Order_Props {
		/**
		 * Order properties.
		 *
		 * @var array
		 */
		public $props;

		/**
		 * Dates turned into WC_DateTime objects, kept so each call returns the same object.
		 *
		 * @var WC_DateTime[]
		 */
		private $dates = array();

		/**
		 * Constructor.
		 *
		 * @param array $props Properties overriding the defaults below.
		 */
		public function __construct( array $props = array() ) {
			$this->props = array_merge(
				array(
					'id'             => 1,
					'parent_id'      => 0,
					'status'         => 'completed',
					'total'          => '0',
					'total_tax'      => '0',
					'shipping_total' => '0',
					'quantities'     => array(),
					'date_created'   => '2026-01-15 12:00:00',
					'date_paid'      => null,
					'date_completed' => null,
					'meta'           => array(),
					'refunds'        => array(),
				),
				$props
			);
		}

		/**
		 * Get the order ID.
		 *
		 * @return int
		 */
		public function get_id() {
			return $this->props['id'];
		}

		/**
		 * Get the parent order ID.
		 *
		 * @param string $context Unused.
		 * @return int
		 */
		public function get_parent_id( $context = 'view' ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
			return $this->props['parent_id'];
		}

		/**
		 * Get the order status.
		 *
		 * @param string $context Unused.
		 * @return string
		 */
		public function get_status( $context = 'view' ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
			return $this->props['status'];
		}

		/**
		 * Get the order total.
		 *
		 * @param string $context Unused.
		 * @return float
		 */
		public function get_total( $context = 'view' ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
			return $this->props['total'];
		}

		/**
		 * Get the total tax.
		 *
		 * @param string $context Unused.
		 * @return float
		 */
		public function get_total_tax( $context = 'view' ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
			return $this->props['total_tax'];
		}

		/**
		 * Get the shipping total.
		 *
		 * @param string $context Unused.
		 * @return string
		 */
		public function get_shipping_total( $context = 'view' ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
			return $this->props['shipping_total'];
		}

		/**
		 * Get line items, one per quantity; there are no fee items.
		 *
		 * @param string|array $types Item type.
		 * @return object[]
		 */
		public function get_items( $types = 'line_item' ) {
			if ( 'line_item' !== $types ) {
				return array();
			}

			$items = array();
			foreach ( $this->props['quantities'] as $quantity ) {
				$items[] = new Analytics_Fake_Line_Item( $quantity );
			}

			return $items;
		}

		/**
		 * Get the created date. Each call returns the same object, as WooCommerce does.
		 *
		 * @param string $context Unused.
		 * @return WC_DateTime|null
		 */
		public function get_date_created( $context = 'view' ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
			return $this->get_date( 'date_created' );
		}

		/**
		 * Get the paid date.
		 *
		 * @param string $context Unused.
		 * @return WC_DateTime|null
		 */
		public function get_date_paid( $context = 'view' ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
			return $this->get_date( 'date_paid' );
		}

		/**
		 * Get the completed date.
		 *
		 * @param string $context Unused.
		 * @return WC_DateTime|null
		 */
		public function get_date_completed( $context = 'view' ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
			return $this->get_date( 'date_completed' );
		}

		/**
		 * Get a date property from its UTC string.
		 *
		 * @param string $key Property name.
		 * @return WC_DateTime|null
		 */
		private function get_date( $key ) {
			if ( null === $this->props[ $key ] ) {
				return null;
			}
			if ( ! isset( $this->dates[ $key ] ) ) {
				$this->dates[ $key ] = new WC_DateTime( $this->props[ $key ], new DateTimeZone( 'UTC' ) );
			}

			return $this->dates[ $key ];
		}

		/**
		 * Get a meta value.
		 *
		 * @param string $key     Meta key.
		 * @param bool   $single  Whether to return a single value.
		 * @param string $context Unused.
		 * @return mixed
		 */
		public function get_meta( $key = '', $single = true, $context = 'view' ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
			return $this->props['meta'][ $key ] ?? '';
		}

		/**
		 * Get the order's refunds.
		 *
		 * @return array
		 */
		public function get_refunds() {
			return $this->props['refunds'];
		}

		/**
		 * Get the total fees.
		 *
		 * @return float
		 */
		public function get_total_fees() {
			return 0.0;
		}

		/**
		 * Get the shipping tax.
		 *
		 * @param string $context Unused.
		 * @return string
		 */
		public function get_shipping_tax( $context = 'view' ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
			return '0';
		}

		/**
		 * Get the discount total.
		 *
		 * @param string $context Unused.
		 * @return string
		 */
		public function get_discount_total( $context = 'view' ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
			return '0';
		}

		/**
		 * Get the discount tax.
		 *
		 * @param string $context Unused.
		 * @return string
		 */
		public function get_discount_tax( $context = 'view' ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
			return '0';
		}

		/**
		 * Whether the customer is returning.
		 *
		 * @return bool
		 */
		public function is_returning_customer() {
			return false;
		}

		/**
		 * Get the report customer ID.
		 *
		 * @return int
		 */
		public function get_report_customer_id() {
			return 7;
		}
	}
}
