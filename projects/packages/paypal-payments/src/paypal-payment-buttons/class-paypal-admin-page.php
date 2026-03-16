<?php
/**
 * PayPal Payment Links admin dashboard page.
 *
 * Registers the admin menu item and renders the payment links list table.
 * Handles delete actions with nonce verification.
 *
 * @package automattic/jetpack-paypal-payments
 * @since 0.9.0
 */

namespace Automattic\Jetpack\PaypalPayments;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Class PayPal_Admin_Page
 *
 * Manages the Payment Links admin dashboard.
 */
class PayPal_Admin_Page {

	/**
	 * Admin page slug.
	 *
	 * @var string
	 */
	const PAGE_SLUG = 'paypal-payment-links';

	/**
	 * Required capability for accessing the page.
	 *
	 * @var string
	 */
	const CAPABILITY = 'manage_options';

	/**
	 * Initialize admin hooks.
	 */
	public static function init() {
		add_action( 'admin_menu', array( __CLASS__, 'register_menu' ) );
		add_action( 'admin_init', array( __CLASS__, 'handle_actions' ) );
		add_action( 'admin_enqueue_scripts', array( __CLASS__, 'enqueue_assets' ) );
	}

	/**
	 * Register the admin menu item.
	 *
	 * Adds under the Jetpack menu if available, otherwise under Settings.
	 */
	public static function register_menu() {
		$parent_slug = self::get_parent_menu_slug();

		add_submenu_page(
			$parent_slug,
			__( 'PayPal Payment Links', 'jetpack-paypal-payments' ),
			__( 'Payment Links', 'jetpack-paypal-payments' ),
			self::CAPABILITY,
			self::PAGE_SLUG,
			array( __CLASS__, 'render_page' )
		);
	}

	/**
	 * Determine the parent menu slug.
	 *
	 * Uses Jetpack menu if available, otherwise falls back to Settings.
	 *
	 * @return string Parent menu slug.
	 */
	private static function get_parent_menu_slug() {
		global $admin_page_hooks;

		if ( isset( $admin_page_hooks['jetpack'] ) ) {
			return 'jetpack';
		}

		return 'options-general.php';
	}

	/**
	 * Handle admin actions (delete).
	 */
	public static function handle_actions() {
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Nonce is verified below.
		if ( ! isset( $_GET['page'] ) || self::PAGE_SLUG !== $_GET['page'] ) {
			return;
		}

		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Nonce is verified below.
		if ( ! isset( $_GET['action'] ) || 'delete' !== $_GET['action'] ) {
			return;
		}

		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Nonce is verified below.
		$resource_id = isset( $_GET['resource_id'] ) ? sanitize_text_field( wp_unslash( $_GET['resource_id'] ) ) : '';
		if ( empty( $resource_id ) ) {
			return;
		}

		// Verify nonce and capability.
		if ( ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_GET['_wpnonce'] ?? '' ) ), 'delete_payment_link_' . $resource_id ) ) {
			wp_die( esc_html__( 'Security check failed.', 'jetpack-paypal-payments' ) );
		}

		if ( ! current_user_can( self::CAPABILITY ) ) {
			wp_die( esc_html__( 'You do not have permission to perform this action.', 'jetpack-paypal-payments' ) );
		}

		$result = PayPal_API_Client::delete_resource( $resource_id );

		if ( is_wp_error( $result ) ) {
			set_transient(
				'paypal_admin_notice',
				array(
					'type'    => 'error',
					'message' => sprintf(
						/* translators: %s: error message */
						__( 'Failed to delete payment link: %s', 'jetpack-paypal-payments' ),
						$result->get_error_message()
					),
				),
				30
			);
		} else {
			set_transient(
				'paypal_admin_notice',
				array(
					'type'    => 'success',
					'message' => __( 'Payment link deleted successfully.', 'jetpack-paypal-payments' ),
				),
				30
			);
		}

		wp_safe_redirect( admin_url( 'admin.php?page=' . self::PAGE_SLUG ) );
		exit;
	}

	/**
	 * Enqueue admin page assets.
	 *
	 * @param string $hook_suffix The current admin page hook suffix.
	 */
	public static function enqueue_assets( $hook_suffix ) {
		// Only load on our page.
		if ( false === strpos( $hook_suffix, self::PAGE_SLUG ) ) {
			return;
		}

		wp_add_inline_style(
			'wp-admin',
			'
			.paypal-status-badge {
				display: inline-block;
				padding: 2px 8px;
				border-radius: 3px;
				font-size: 12px;
				font-weight: 600;
				text-transform: uppercase;
			}
			.paypal-status-active {
				background: #d4edda;
				color: #155724;
			}
			.paypal-status-inactive {
				background: #f8d7da;
				color: #721c24;
			}
			.paypal-payment-url {
				font-size: 12px;
				padding: 2px 6px;
				background: #f0f0f1;
			}
			.paypal-copy-link {
				vertical-align: middle;
				margin-left: 4px !important;
			}
			.paypal-admin-header {
				display: flex;
				align-items: center;
				justify-content: space-between;
				margin-bottom: 12px;
			}
			.paypal-disconnected-notice {
				max-width: 600px;
				margin: 40px auto;
				text-align: center;
				padding: 40px 20px;
			}
			.paypal-disconnected-notice h2 {
				margin-bottom: 12px;
			}
			.paypal-pagination-nav {
				margin: 12px 0;
			}
			.paypal-detail-card {
				max-width: 800px;
				margin-bottom: 20px;
				padding: 16px 20px;
			}
			.paypal-detail-card h3 {
				margin-top: 0;
				border-bottom: 1px solid #dcdcde;
				padding-bottom: 8px;
			}
			.paypal-detail-card .form-table th {
				width: 160px;
				font-weight: 600;
			}
			.paypal-detail-actions .button {
				margin-right: 8px;
			}
			.paypal-send-email-form .regular-text {
				width: 100%;
				max-width: 400px;
			}
			.paypal-send-email-form .large-text {
				width: 100%;
				max-width: 400px;
			}
			.paypal-detail-link-url {
				font-size: 14px;
				padding: 4px 8px;
				background: #f0f0f1;
				word-break: break-all;
			}
			'
		);

		wp_add_inline_script(
			'wp-admin',
			'
			document.addEventListener("click", function(e) {
				if (e.target.classList.contains("paypal-copy-link")) {
					var url = e.target.getAttribute("data-url");
					if (navigator.clipboard) {
						navigator.clipboard.writeText(url).then(function() {
							var original = e.target.textContent;
							e.target.textContent = ' . wp_json_encode( __( 'Copied!', 'jetpack-paypal-payments' ), JSON_HEX_TAG | JSON_HEX_AMP ) . ';
							setTimeout(function() { e.target.textContent = original; }, 2000);
						});
					}
				}
			});

			// Send via Email form handler (WOOPTP-181).
			var emailForm = document.getElementById("paypal-send-email-form");
			if (emailForm) {
				emailForm.addEventListener("submit", function(ev) {
					ev.preventDefault();
					var btn = document.getElementById("paypal-send-email-btn");
					var status = document.getElementById("paypal-send-email-status");
					btn.disabled = true;
					status.textContent = ' . wp_json_encode( __( 'Sending...', 'jetpack-paypal-payments' ), JSON_HEX_TAG | JSON_HEX_AMP ) . ';
					status.style.color = "#555";

					var formData = new FormData(emailForm);
					fetch(' . wp_json_encode( admin_url( 'admin-ajax.php' ), JSON_HEX_TAG | JSON_HEX_AMP ) . ', {
						method: "POST",
						credentials: "same-origin",
						body: formData,
					})
					.then(function(r) { return r.json(); })
					.then(function(data) {
						if (data.success) {
							status.textContent = data.data.message;
							status.style.color = "#00a32a";
							emailForm.querySelector("[name=recipient]").value = "";
							emailForm.querySelector("[name=message]").value = "";
						} else {
							status.textContent = data.data.message || ' . wp_json_encode( __( 'Failed to send.', 'jetpack-paypal-payments' ), JSON_HEX_TAG | JSON_HEX_AMP ) . ';
							status.style.color = "#d63638";
						}
					})
					.catch(function() {
						status.textContent = ' . wp_json_encode( __( 'Network error. Please try again.', 'jetpack-paypal-payments' ), JSON_HEX_TAG | JSON_HEX_AMP ) . ';
						status.style.color = "#d63638";
					})
					.finally(function() {
						btn.disabled = false;
					});
				});
			}
			'
		);
	}

	/**
	 * Render the admin page.
	 */
	public static function render_page() {
		if ( ! current_user_can( self::CAPABILITY ) ) {
			wp_die( esc_html__( 'You do not have permission to access this page.', 'jetpack-paypal-payments' ) );
		}

		// Display admin notices from transient.
		$notice = get_transient( 'paypal_admin_notice' );
		if ( $notice ) {
			delete_transient( 'paypal_admin_notice' );
			printf(
				'<div class="notice notice-%s is-dismissible"><p>%s</p></div>',
				esc_attr( $notice['type'] ),
				esc_html( $notice['message'] )
			);
		}

		echo '<div class="wrap">';

		// Header.
		echo '<div class="paypal-admin-header">';
		echo '<h1>' . esc_html__( 'PayPal Payment Links', 'jetpack-paypal-payments' ) . '</h1>';

		$status = PayPal_OAuth::get_connection_status();
		if ( ! empty( $status['connected'] ) ) {
			printf(
				'<span class="paypal-status-badge paypal-status-active">%s — %s</span>',
				esc_html__( 'Connected', 'jetpack-paypal-payments' ),
				esc_html( ucfirst( $status['environment'] ?? 'production' ) )
			);
		}

		echo '</div>';

		// Disconnected state.
		if ( ! PayPal_OAuth::has_credentials() ) {
			self::render_disconnected_state();
			echo '</div>';
			return;
		}

		// Detail view (WOOPTP-167).
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Read-only view parameter.
		if ( isset( $_GET['action'] ) && 'view' === $_GET['action'] && ! empty( $_GET['resource_id'] ) ) {
			// phpcs:ignore WordPress.Security.NonceVerification.Recommended
			self::render_detail_view( sanitize_text_field( wp_unslash( $_GET['resource_id'] ) ) );
			echo '</div>';
			return;
		}

		// List table.
		$table = new PayPal_Payment_Links_List_Table();
		$table->prepare_items();

		// Error state.
		if ( $table->api_error ) {
			printf(
				'<div class="notice notice-error"><p>%s</p></div>',
				esc_html( $table->api_error->get_error_message() )
			);
		}

		echo '<form method="get">';
		echo '<input type="hidden" name="page" value="' . esc_attr( self::PAGE_SLUG ) . '">';
		$table->display();
		echo '</form>';

		// Cursor-based next page link.
		if ( $table->next_page_token ) {
			$next_url = add_query_arg(
				array(
					'page'       => self::PAGE_SLUG,
					'page_token' => $table->next_page_token,
				),
				admin_url( 'admin.php' )
			);
			printf(
				'<div class="paypal-pagination-nav"><a href="%s" class="button">%s &rarr;</a></div>',
				esc_url( $next_url ),
				esc_html__( 'Next Page', 'jetpack-paypal-payments' )
			);
		}

		echo '</div>';
	}

	/**
	 * Render the detail view for a single payment link (WOOPTP-167).
	 *
	 * @param string $resource_id The PayPal resource ID (PLB-...).
	 */
	private static function render_detail_view( $resource_id ) {
		$resource = PayPal_API_Client::get_resource( $resource_id );

		// Breadcrumb.
		printf(
			'<p><a href="%s">&larr; %s</a></p>',
			esc_url( admin_url( 'admin.php?page=' . self::PAGE_SLUG ) ),
			esc_html__( 'Back to Payment Links', 'jetpack-paypal-payments' )
		);

		// 404 / error handling.
		if ( is_wp_error( $resource ) ) {
			printf(
				'<div class="notice notice-error"><p>%s</p></div>',
				esc_html( $resource->get_error_message() )
			);
			return;
		}

		$line_item = isset( $resource['line_items'][0] ) ? $resource['line_items'][0] : array();
		$name      = isset( $line_item['name'] ) ? $line_item['name'] : $resource_id;
		$status    = isset( $resource['status'] ) ? strtoupper( $resource['status'] ) : 'UNKNOWN';
		$badge_cls = 'ACTIVE' === $status ? 'paypal-status-active' : 'paypal-status-inactive';

		// Extract payment link.
		$payment_link = '';
		if ( ! empty( $resource['payment_link'] ) ) {
			$payment_link = $resource['payment_link'];
		} elseif ( isset( $resource['links'] ) && is_array( $resource['links'] ) ) {
			foreach ( $resource['links'] as $link ) {
				if ( isset( $link['rel'] ) && 'payment_link' === $link['rel'] && isset( $link['href'] ) ) {
					$payment_link = $link['href'];
					break;
				}
			}
		}

		// --- Header ---
		printf( '<h2>%s <span class="paypal-status-badge %s">%s</span></h2>', esc_html( $name ), esc_attr( $badge_cls ), esc_html( $status ) );

		printf( '<p class="description"><code>%s</code>', esc_html( $resource_id ) );
		if ( isset( $resource['create_time'] ) ) {
			$timestamp = strtotime( $resource['create_time'] );
			if ( false !== $timestamp ) {
				printf(
					' &middot; %s %s',
					esc_html__( 'Created', 'jetpack-paypal-payments' ),
					esc_html( wp_date( get_option( 'date_format' ) . ' ' . get_option( 'time_format' ), $timestamp ) )
				);
			}
		}
		echo '</p>';

		// --- Action buttons ---
		echo '<p class="paypal-detail-actions">';
		if ( $payment_link ) {
			printf(
				'<a href="%s" target="_blank" rel="noopener noreferrer" class="button button-primary">%s</a> ',
				esc_url( $payment_link ),
				esc_html__( 'Open Payment Page', 'jetpack-paypal-payments' )
			);
			printf(
				'<button type="button" class="button paypal-copy-link" data-url="%s">%s</button> ',
				esc_attr( $payment_link ),
				esc_html__( 'Copy Link', 'jetpack-paypal-payments' )
			);
		}

		$delete_url = wp_nonce_url(
			add_query_arg(
				array(
					'page'        => self::PAGE_SLUG,
					'action'      => 'delete',
					'resource_id' => $resource_id,
				),
				admin_url( 'admin.php' )
			),
			'delete_payment_link_' . $resource_id
		);
		printf(
			'<a href="%s" class="button" onclick="return confirm(%s);">%s</a>',
			esc_url( $delete_url ),
			wp_json_encode( __( 'Are you sure you want to delete this payment link?', 'jetpack-paypal-payments' ), JSON_HEX_TAG | JSON_HEX_AMP ),
			esc_html__( 'Delete', 'jetpack-paypal-payments' )
		);
		echo '</p>';

		// --- Payment Details Card ---
		echo '<div class="card paypal-detail-card">';
		printf( '<h3>%s</h3>', esc_html__( 'Payment Details', 'jetpack-paypal-payments' ) );
		echo '<table class="form-table">';

		self::render_detail_row( __( 'Product Name', 'jetpack-paypal-payments' ), $line_item['name'] ?? '' );

		if ( ! empty( $line_item['description'] ) ) {
			self::render_detail_row( __( 'Description', 'jetpack-paypal-payments' ), $line_item['description'] );
		}

		if ( isset( $line_item['unit_amount'] ) ) {
			$price_display = PayPal_Payment_Buttons::format_price(
				$line_item['unit_amount']['value'] ?? '0.00',
				$line_item['unit_amount']['currency_code'] ?? 'USD'
			);
			self::render_detail_row( __( 'Price', 'jetpack-paypal-payments' ), $price_display );
			self::render_detail_row( __( 'Currency', 'jetpack-paypal-payments' ), $line_item['unit_amount']['currency_code'] ?? 'USD' );
		}

		if ( ! empty( $line_item['product_id'] ) ) {
			self::render_detail_row( __( 'Product ID', 'jetpack-paypal-payments' ), $line_item['product_id'] );
		}

		if ( ! empty( $line_item['image_url'] ) ) {
			self::render_detail_row_html(
				__( 'Image', 'jetpack-paypal-payments' ),
				sprintf( '<img src="%s" alt="%s" style="max-width:200px;height:auto;" />', esc_url( $line_item['image_url'] ), esc_attr( $line_item['name'] ?? '' ) )
			);
		}

		self::render_detail_row( __( 'Type', 'jetpack-paypal-payments' ), $resource['type'] ?? '' );
		self::render_detail_row( __( 'Integration Mode', 'jetpack-paypal-payments' ), $resource['integration_mode'] ?? '' );
		self::render_detail_row( __( 'Reusable', 'jetpack-paypal-payments' ), $resource['reusable'] ?? 'MULTIPLE' );

		if ( ! empty( $resource['return_url'] ) ) {
			self::render_detail_row( __( 'Return URL', 'jetpack-paypal-payments' ), $resource['return_url'] );
		}

		echo '</table>';
		echo '</div>';

		// --- Configuration Card (taxes, shipping, variants, etc.) ---
		$has_config = ! empty( $line_item['taxes'] )
			|| ! empty( $line_item['shipping'] )
			|| isset( $line_item['collect_shipping_address'] )
			|| ! empty( $line_item['adjustable_quantity'] )
			|| ! empty( $line_item['customer_notes'] )
			|| ! empty( $line_item['variants'] );

		if ( $has_config ) {
			echo '<div class="card paypal-detail-card">';
			printf( '<h3>%s</h3>', esc_html__( 'Configuration', 'jetpack-paypal-payments' ) );
			echo '<table class="form-table">';

			if ( ! empty( $line_item['taxes'] ) ) {
				$tax_parts = array();
				foreach ( $line_item['taxes'] as $tax ) {
					$tax_parts[] = sprintf( '%s: %s (%s)', $tax['name'] ?? '', $tax['value'] ?? '', $tax['type'] ?? '' );
				}
				self::render_detail_row( __( 'Taxes', 'jetpack-paypal-payments' ), implode( ', ', $tax_parts ) );
			}

			if ( ! empty( $line_item['shipping'] ) ) {
				$ship_parts = array();
				foreach ( $line_item['shipping'] as $ship ) {
					$ship_parts[] = sprintf( '%s: %s', $ship['type'] ?? '', $ship['value'] ?? '' );
				}
				self::render_detail_row( __( 'Shipping', 'jetpack-paypal-payments' ), implode( ', ', $ship_parts ) );
			}

			if ( isset( $line_item['collect_shipping_address'] ) ) {
				self::render_detail_row(
					__( 'Collect Shipping Address', 'jetpack-paypal-payments' ),
					$line_item['collect_shipping_address'] ? __( 'Yes', 'jetpack-paypal-payments' ) : __( 'No', 'jetpack-paypal-payments' )
				);
			}

			if ( ! empty( $line_item['adjustable_quantity']['maximum'] ) ) {
				self::render_detail_row(
					__( 'Adjustable Quantity', 'jetpack-paypal-payments' ),
					sprintf(
						/* translators: %d: maximum quantity */
						__( 'Up to %d', 'jetpack-paypal-payments' ),
						(int) $line_item['adjustable_quantity']['maximum']
					)
				);
			}

			if ( ! empty( $line_item['customer_notes'] ) ) {
				$note_parts = array();
				foreach ( $line_item['customer_notes'] as $note ) {
					$label        = $note['label'] ?? '';
					$required     = ! empty( $note['required'] ) ? __( 'required', 'jetpack-paypal-payments' ) : __( 'optional', 'jetpack-paypal-payments' );
					$note_parts[] = sprintf( '%s (%s)', $label, $required );
				}
				self::render_detail_row( __( 'Customer Fields', 'jetpack-paypal-payments' ), implode( ', ', $note_parts ) );
			}

			if ( ! empty( $line_item['variants']['dimensions'] ) ) {
				$variant_parts = array();
				foreach ( $line_item['variants']['dimensions'] as $dim ) {
					$options = array();
					foreach ( $dim['options'] ?? array() as $opt ) {
						$options[] = $opt['label'] ?? '';
					}
					$variant_parts[] = sprintf( '%s: %s', $dim['name'] ?? '', implode( ', ', $options ) );
				}
				self::render_detail_row( __( 'Variants', 'jetpack-paypal-payments' ), implode( ' | ', $variant_parts ) );
			}

			echo '</table>';
			echo '</div>';
		}

		// --- Payment Link Card ---
		if ( $payment_link ) {
			echo '<div class="card paypal-detail-card">';
			printf( '<h3>%s</h3>', esc_html__( 'Payment Link', 'jetpack-paypal-payments' ) );
			printf(
				'<p><code class="paypal-detail-link-url">%s</code></p>',
				esc_html( $payment_link )
			);
			printf(
				'<p><button type="button" class="button paypal-copy-link" data-url="%s">%s</button> ',
				esc_attr( $payment_link ),
				esc_html__( 'Copy to Clipboard', 'jetpack-paypal-payments' )
			);
			printf(
				'<a href="%s" target="_blank" rel="noopener noreferrer" class="button">%s</a></p>',
				esc_url( $payment_link ),
				esc_html__( 'Open Payment Page', 'jetpack-paypal-payments' )
			);
			echo '</div>';
		}

		// --- Send via Email Card (WOOPTP-181) ---
		if ( $payment_link ) {
			$nonce = wp_create_nonce( PayPal_Email_Sender::AJAX_ACTION );

			echo '<div class="card paypal-detail-card">';
			printf( '<h3>%s</h3>', esc_html__( 'Send via Email', 'jetpack-paypal-payments' ) );

			printf(
				'<form id="paypal-send-email-form" class="paypal-send-email-form">
					<input type="hidden" name="action" value="%s" />
					<input type="hidden" name="_wpnonce" value="%s" />
					<input type="hidden" name="payment_link" value="%s" />
					<input type="hidden" name="product_name" value="%s" />
					<input type="hidden" name="price" value="%s" />
					<input type="hidden" name="currency" value="%s" />
					<input type="hidden" name="resource_id" value="%s" />
					<p>
						<label for="paypal-email-recipient"><strong>%s</strong></label><br />
						<input type="email" id="paypal-email-recipient" name="recipient" class="regular-text" required placeholder="%s" />
					</p>
					<p>
						<label for="paypal-email-message"><strong>%s</strong></label><br />
						<textarea id="paypal-email-message" name="message" class="large-text" rows="3" placeholder="%s"></textarea>
					</p>
					<p>
						<button type="submit" class="button button-primary" id="paypal-send-email-btn">%s</button>
						<span id="paypal-send-email-status" style="margin-left:12px;"></span>
					</p>
				</form>',
				esc_attr( PayPal_Email_Sender::AJAX_ACTION ),
				esc_attr( $nonce ),
				esc_attr( $payment_link ),
				esc_attr( $name ),
				esc_attr( $line_item['unit_amount']['value'] ?? '' ),
				esc_attr( $line_item['unit_amount']['currency_code'] ?? 'USD' ),
				esc_attr( $resource_id ),
				esc_html__( 'Recipient email', 'jetpack-paypal-payments' ),
				esc_attr__( 'customer@example.com', 'jetpack-paypal-payments' ),
				esc_html__( 'Personal message (optional)', 'jetpack-paypal-payments' ),
				esc_attr__( 'Here is your payment link...', 'jetpack-paypal-payments' ),
				esc_html__( 'Send Email', 'jetpack-paypal-payments' )
			);

			// Send log for this resource.
			$send_log = PayPal_Email_Sender::get_log_for_resource( $resource_id );
			if ( ! empty( $send_log ) ) {
				printf( '<h4 style="margin-top:16px;">%s</h4>', esc_html__( 'Send History', 'jetpack-paypal-payments' ) );
				echo '<table class="widefat striped" style="max-width:500px;"><thead><tr>';
				printf( '<th>%s</th>', esc_html__( 'Recipient', 'jetpack-paypal-payments' ) );
				printf( '<th>%s</th>', esc_html__( 'Sent', 'jetpack-paypal-payments' ) );
				echo '</tr></thead><tbody>';
				foreach ( array_reverse( $send_log ) as $entry ) {
					printf(
						'<tr><td>%s</td><td>%s</td></tr>',
						esc_html( $entry['email'] ?? '' ),
						esc_html( isset( $entry['sent_at'] ) ? wp_date( get_option( 'date_format' ) . ' ' . get_option( 'time_format' ), strtotime( $entry['sent_at'] ) ) : '' )
					);
				}
				echo '</tbody></table>';
			}

			echo '</div>';
		}
	}

	/**
	 * Render a single detail row in a form-table.
	 *
	 * @param string $label Row label.
	 * @param string $value Row value (plain text, will be escaped).
	 */
	private static function render_detail_row( $label, $value ) {
		if ( '' === $value ) {
			return;
		}
		printf(
			'<tr><th scope="row">%s</th><td>%s</td></tr>',
			esc_html( $label ),
			esc_html( $value )
		);
	}

	/**
	 * Render a single detail row with HTML content.
	 *
	 * @param string $label Row label.
	 * @param string $html  Pre-built HTML (sanitized via wp_kses_post).
	 */
	private static function render_detail_row_html( $label, $html ) {
		if ( '' === $html ) {
			return;
		}
		printf(
			'<tr><th scope="row">%s</th><td>%s</td></tr>',
			esc_html( $label ),
			wp_kses_post( $html )
		);
	}

	/**
	 * Render the disconnected state.
	 */
	private static function render_disconnected_state() {
		echo '<div class="paypal-disconnected-notice">';
		printf( '<h2>%s</h2>', esc_html__( 'Connect PayPal to view your payment links', 'jetpack-paypal-payments' ) );
		printf(
			'<p>%s</p>',
			esc_html__( 'Add a PayPal Payment Buttons block in the editor to connect your PayPal account and start creating payment links.', 'jetpack-paypal-payments' )
		);
		printf(
			'<a href="%s" class="button button-primary">%s</a>',
			esc_url( admin_url( 'post-new.php' ) ),
			esc_html__( 'Create a Post', 'jetpack-paypal-payments' )
		);
		echo '</div>';
	}
}
