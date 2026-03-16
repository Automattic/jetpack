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
