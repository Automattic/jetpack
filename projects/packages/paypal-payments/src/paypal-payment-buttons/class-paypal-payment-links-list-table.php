<?php
/**
 * Payment Links list table for the WordPress admin dashboard.
 *
 * Displays all PayPal payment links in a WP_List_Table format
 * with pagination, delete actions, and status badges.
 *
 * @package automattic/jetpack-paypal-payments
 * @since 0.9.0
 */

namespace Automattic\Jetpack\PaypalPayments;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

if ( ! class_exists( 'WP_List_Table' ) ) {
	require_once ABSPATH . 'wp-admin/includes/class-wp-list-table.php';
}

/**
 * Class PayPal_Payment_Links_List_Table
 *
 * WP_List_Table subclass for displaying PayPal payment links.
 */
class PayPal_Payment_Links_List_Table extends \WP_List_Table {

	/**
	 * Items per page.
	 *
	 * @var int
	 */
	const PER_PAGE = 20;

	/**
	 * API error from the last prepare_items() call, if any.
	 *
	 * @var \WP_Error|null
	 */
	public $api_error = null;

	/**
	 * Next page token for cursor-based pagination.
	 *
	 * @var string|null
	 */
	public $next_page_token = null;

	/**
	 * Constructor.
	 */
	public function __construct() {
		parent::__construct(
			array(
				'singular' => 'payment_link',
				'plural'   => 'payment_links',
				'ajax'     => false,
			)
		);
	}

	/**
	 * Define table columns.
	 *
	 * @return array Column slug => label.
	 */
	public function get_columns() {
		return array(
			'name'         => __( 'Product', 'jetpack-paypal-payments' ),
			'price'        => __( 'Price', 'jetpack-paypal-payments' ),
			'status'       => __( 'Status', 'jetpack-paypal-payments' ),
			'created'      => __( 'Created', 'jetpack-paypal-payments' ),
			'payment_link' => __( 'Payment Link', 'jetpack-paypal-payments' ),
		);
	}

	/**
	 * Columns that should be sortable.
	 *
	 * Note: Sorting is client-side only since PayPal's API does not
	 * support server-side sort parameters.
	 *
	 * @return array
	 */
	public function get_sortable_columns() {
		return array();
	}

	/**
	 * Fetch payment links from the PayPal API and populate the table.
	 */
	public function prepare_items() {
		$this->api_error       = null;
		$this->next_page_token = null;

		$columns  = $this->get_columns();
		$hidden   = array();
		$sortable = $this->get_sortable_columns();

		$this->_column_headers = array( $columns, $hidden, $sortable );

		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Read-only pagination parameter.
		$page_token = isset( $_GET['page_token'] ) ? sanitize_text_field( wp_unslash( $_GET['page_token'] ) ) : '';

		$result = PayPal_API_Client::list_resources( self::PER_PAGE, $page_token );

		if ( is_wp_error( $result ) ) {
			$this->api_error = $result;
			$this->items     = array();
			return;
		}

		$this->items = isset( $result['items'] ) ? $result['items'] : array();

		// Extract next page token from HATEOAS links if present.
		if ( isset( $result['links'] ) && is_array( $result['links'] ) ) {
			foreach ( $result['links'] as $link ) {
				if ( isset( $link['rel'] ) && 'next' === $link['rel'] && isset( $link['href'] ) ) {
					$parsed = wp_parse_url( $link['href'] );
					if ( isset( $parsed['query'] ) ) {
						parse_str( $parsed['query'], $query_params );
						if ( isset( $query_params['page_token'] ) ) {
							$this->next_page_token = $query_params['page_token'];
						}
					}
					break;
				}
			}
		}

		$total_items = isset( $result['total_items'] ) ? (int) $result['total_items'] : count( $this->items );

		$this->set_pagination_args(
			array(
				'total_items' => $total_items,
				'per_page'    => self::PER_PAGE,
			)
		);
	}

	/**
	 * Render the product name column with row actions.
	 *
	 * @param array $item The payment link data.
	 * @return string Column HTML.
	 */
	public function column_name( $item ) {
		$name = isset( $item['line_items'][0]['name'] ) ? esc_html( $item['line_items'][0]['name'] ) : '—';

		$actions = array();

		// View details link (admin detail view).
		if ( isset( $item['id'] ) ) {
			$detail_url = add_query_arg(
				array(
					'page'        => 'paypal-payment-links',
					'action'      => 'view',
					'resource_id' => $item['id'],
				),
				admin_url( 'admin.php' )
			);

			$actions['view_details'] = sprintf(
				'<a href="%s">%s</a>',
				esc_url( $detail_url ),
				esc_html__( 'View Details', 'jetpack-paypal-payments' )
			);
		}

		// View on PayPal link.
		$payment_link = $this->get_payment_link( $item );
		if ( $payment_link ) {
			$actions['view_paypal'] = sprintf(
				'<a href="%s" target="_blank" rel="noopener noreferrer">%s</a>',
				esc_url( $payment_link ),
				esc_html__( 'View on PayPal', 'jetpack-paypal-payments' )
			);
		}

		// Delete action.
		if ( isset( $item['id'] ) ) {
			$delete_url = wp_nonce_url(
				add_query_arg(
					array(
						'page'        => 'paypal-payment-links',
						'action'      => 'delete',
						'resource_id' => $item['id'],
					),
					admin_url( 'admin.php' )
				),
				'delete_payment_link_' . $item['id']
			);

			$actions['delete'] = sprintf(
				'<a href="%s" class="submitdelete" onclick="return confirm(%s);">%s</a>',
				esc_url( $delete_url ),
				wp_json_encode( __( 'Are you sure you want to delete this payment link? This cannot be undone.', 'jetpack-paypal-payments' ), JSON_HEX_TAG | JSON_HEX_AMP ),
				esc_html__( 'Delete', 'jetpack-paypal-payments' )
			);
		}

		return sprintf( '<strong>%s</strong>%s', $name, $this->row_actions( $actions ) );
	}

	/**
	 * Render the price column.
	 *
	 * @param array $item The payment link data.
	 * @return string Column HTML.
	 */
	public function column_price( $item ) {
		if ( ! isset( $item['line_items'][0]['unit_amount'] ) ) {
			return '—';
		}

		$amount   = $item['line_items'][0]['unit_amount'];
		$value    = isset( $amount['value'] ) ? $amount['value'] : '0.00';
		$currency = isset( $amount['currency_code'] ) ? $amount['currency_code'] : 'USD';

		return esc_html( PayPal_Payment_Buttons::format_price( $value, $currency ) );
	}

	/**
	 * Render the status column with a badge.
	 *
	 * @param array $item The payment link data.
	 * @return string Column HTML.
	 */
	public function column_status( $item ) {
		$status = isset( $item['status'] ) ? strtoupper( $item['status'] ) : 'UNKNOWN';

		$class = 'ACTIVE' === $status ? 'paypal-status-active' : 'paypal-status-inactive';

		return sprintf(
			'<span class="paypal-status-badge %s">%s</span>',
			esc_attr( $class ),
			esc_html( $status )
		);
	}

	/**
	 * Render the created date column.
	 *
	 * @param array $item The payment link data.
	 * @return string Column HTML.
	 */
	public function column_created( $item ) {
		if ( ! isset( $item['create_time'] ) ) {
			return '—';
		}

		$timestamp = strtotime( $item['create_time'] );
		if ( false === $timestamp ) {
			return '—';
		}

		return esc_html( wp_date( get_option( 'date_format' ) . ' ' . get_option( 'time_format' ), $timestamp ) );
	}

	/**
	 * Render the payment link column with a copy button.
	 *
	 * @param array $item The payment link data.
	 * @return string Column HTML.
	 */
	public function column_payment_link( $item ) {
		$link = $this->get_payment_link( $item );
		if ( ! $link ) {
			return '—';
		}

		$short = strlen( $link ) > 50 ? substr( $link, 0, 47 ) . '...' : $link;

		return sprintf(
			'<code class="paypal-payment-url" title="%s">%s</code> <button type="button" class="button button-small paypal-copy-link" data-url="%s">%s</button>',
			esc_attr( $link ),
			esc_html( $short ),
			esc_attr( $link ),
			esc_html__( 'Copy', 'jetpack-paypal-payments' )
		);
	}

	/**
	 * Default column rendering.
	 *
	 * @param array  $item        The payment link data.
	 * @param string $column_name The column slug.
	 * @return string Column HTML.
	 */
	public function column_default( $item, $column_name ) {
		return isset( $item[ $column_name ] ) ? esc_html( $item[ $column_name ] ) : '—';
	}

	/**
	 * Message shown when no items are found.
	 */
	public function no_items() {
		if ( $this->api_error ) {
			printf(
				'<p>%s</p><p><a href="%s" class="button">%s</a></p>',
				esc_html( $this->api_error->get_error_message() ),
				esc_url( admin_url( 'admin.php?page=paypal-payment-links' ) ),
				esc_html__( 'Try Again', 'jetpack-paypal-payments' )
			);
			return;
		}

		printf(
			'<p>%s</p><p>%s</p>',
			esc_html__( 'No payment links found.', 'jetpack-paypal-payments' ),
			esc_html__( 'Create your first payment link by adding a PayPal Payment Buttons block in the editor.', 'jetpack-paypal-payments' )
		);
	}

	/**
	 * Extract the payment link URL from an item.
	 *
	 * @param array $item The payment link data.
	 * @return string|null The payment link URL, or null.
	 */
	private function get_payment_link( $item ) {
		// Top-level payment_link field.
		if ( ! empty( $item['payment_link'] ) ) {
			return $item['payment_link'];
		}

		// HATEOAS links array.
		if ( isset( $item['links'] ) && is_array( $item['links'] ) ) {
			foreach ( $item['links'] as $link ) {
				if ( isset( $link['rel'] ) && 'payment_link' === $link['rel'] && isset( $link['href'] ) ) {
					return $link['href'];
				}
			}
		}

		return null;
	}
}
