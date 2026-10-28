<?php
/**
 * PayPal Payment Buttons admin dashboard page.
 *
 * Registers the admin menu item and renders the payment links list table.
 * Handles delete actions with nonce verification.
 *
 * @package automattic/jetpack-paypal-payments
 * @since 0.9.0
 */

namespace Automattic\Jetpack\PaypalPayments;

use Automattic\Jetpack\PayPal_Payments;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
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
	 * Most published posts scanned for embedded payment links.
	 *
	 * @since 0.9.0
	 *
	 * @var int
	 */
	const EMBED_SCAN_LIMIT = 100;

	/**
	 * Posts listed per page in the Button Locations card.
	 *
	 * @since 0.13.0
	 *
	 * @var int
	 */
	const LOCATIONS_PER_PAGE = 100;

	/**
	 * AJAX action that returns the next page of the Button Locations card.
	 *
	 * @since 0.13.0
	 *
	 * @var string
	 */
	const LOCATIONS_AJAX_ACTION = 'paypal_link_locations';

	/**
	 * PayPal's merchant activity list, per environment.
	 */
	const TRANSACTIONS_URLS = array(
		'sandbox'    => 'https://www.sandbox.paypal.com/unifiedtransactions/',
		'production' => 'https://www.paypal.com/unifiedtransactions/',
	);

	/**
	 * PayPal's help article on issuing a refund. Nothing here refunds through the API, so
	 * PayPal's certification asks that sellers be pointed at how to do it themselves.
	 */
	const REFUND_HELP_URL = 'https://www.paypal.com/us/cshelp/article/how-do-i-issue-a-refund-help101';

	/**
	 * The confirmation shown before a payment link is deleted from the admin.
	 *
	 * Deleting a link orphans every published block embedding it, so the
	 * warning has to be at least as strong as the one the block itself shows.
	 *
	 * @since 0.9.0
	 *
	 * @param int $embed_count Published posts embedding the link, when known.
	 * @return string Plain text; escape it for wherever it goes.
	 */
	public static function delete_confirm_text( $embed_count = 0 ) {
		$text = __( 'This will permanently delete your payment button. Any payment links, QR codes, or embedded buttons using it will stop working and cannot be recovered.', 'jetpack-paypal-payments' );

		if ( $embed_count > 0 ) {
			$text .= ' ' . sprintf(
				/* translators: %d: number of published posts embedding the payment button */
				_n(
					'It is embedded in %d published post, which will show a broken button.',
					'It is embedded in %d published posts, which will show broken buttons.',
					$embed_count,
					'jetpack-paypal-payments'
				),
				$embed_count
			);
		}

		return $text;
	}

	/**
	 * Count the published posts embedding each payment link.
	 *
	 * The id only exists inside the block comment in post_content, so this is
	 * one search for the block across published posts rather than a query per
	 * link. It is capped, so on a site with more block posts than the cap the
	 * counts are a lower bound.
	 *
	 * @since 0.9.0
	 *
	 * @param int $exclude_post_id One post to leave out of the count.
	 * @return array<string,int> Post counts keyed by resource id.
	 */
	public static function count_published_embeds( $exclude_post_id = 0 ) {
		$posts = self::published_block_posts();

		$counts = array();
		foreach ( $posts as $post ) {
			if ( $exclude_post_id && (int) $post->ID === (int) $exclude_post_id ) {
				continue;
			}
			if ( ! preg_match_all( '/"resourceId":"(PLB-[A-Za-z0-9]+)"/', $post->post_content, $matches ) ) {
				continue;
			}
			foreach ( array_unique( $matches[1] ) as $resource_id ) {
				$counts[ $resource_id ] = ( $counts[ $resource_id ] ?? 0 ) + 1;
			}
		}

		return $counts;
	}

	/**
	 * The published posts that embed one payment link.
	 *
	 * Capped the same way as count_published_embeds(), so on a site with more
	 * block posts than the cap this is a subset.
	 *
	 * @since 0.9.0
	 *
	 * @param string $resource_id PayPal resource ID.
	 * @return \WP_Post[]
	 */
	public static function find_published_embeds( $resource_id ) {
		$needle = '"resourceId":"' . $resource_id . '"';

		return array_values(
			array_filter(
				self::published_block_posts(),
				function ( $post ) use ( $needle ) {
					return false !== strpos( $post->post_content, $needle );
				}
			)
		);
	}

	/**
	 * One page of the posts embedding a payment button, drafts included.
	 *
	 * Unlike find_published_embeds(), this searches for the one button rather
	 * than scanning every block post, so it can page past the scan cap.
	 * Fetches one row past the page to learn whether there is a next one.
	 *
	 * @since 0.13.0
	 *
	 * @param string $resource_id PayPal resource ID.
	 * @param int    $page        1-based page number.
	 * @return array{posts: \WP_Post[], has_more: bool}
	 */
	public static function find_embeds_page( $resource_id, $page = 1 ) {
		$page  = max( 1, (int) $page );
		$posts = get_posts(
			array(
				'post_type'              => 'any',
				'post_status'            => array( 'publish', 'future', 'draft', 'pending', 'private' ),
				'posts_per_page'         => self::LOCATIONS_PER_PAGE + 1,
				'offset'                 => ( $page - 1 ) * self::LOCATIONS_PER_PAGE,
				's'                      => '"resourceId":"' . $resource_id . '"',
				'sentence'               => true,
				'orderby'                => 'date',
				'order'                  => 'DESC',
				'no_found_rows'          => true,
				'update_post_meta_cache' => false,
				'update_post_term_cache' => false,
			)
		);

		return array(
			'posts'    => array_slice( $posts, 0, self::LOCATIONS_PER_PAGE ),
			'has_more' => count( $posts ) > self::LOCATIONS_PER_PAGE,
		);
	}

	/**
	 * The published posts carrying a PayPal Payment Buttons block, capped.
	 *
	 * @return \WP_Post[]
	 */
	private static function published_block_posts() {
		return get_posts(
			array(
				'post_type'              => 'any',
				'post_status'            => 'publish',
				'posts_per_page'         => self::EMBED_SCAN_LIMIT,
				's'                      => 'wp:jetpack/paypal-payment-buttons',
				'sentence'               => true,
				'no_found_rows'          => true,
				'update_post_meta_cache' => false,
				'update_post_term_cache' => false,
			)
		);
	}

	/**
	 * The notice shown after a link is deleted, naming the posts that still embed it.
	 *
	 * Those blocks render nothing until the post is updated, which creates a new
	 * link, or the block is removed.
	 *
	 * @since 0.9.0
	 *
	 * @param string $resource_id The deleted PayPal resource ID.
	 * @return array{type: string, message: string, links: array<int, array{url: string, label: string}>}
	 */
	public static function deleted_link_notice( $resource_id ) {
		$posts   = self::find_published_embeds( $resource_id );
		$message = __( 'Payment button deleted successfully.', 'jetpack-paypal-payments' );
		$links   = array();

		if ( $posts ) {
			$message .= ' ' . sprintf(
				/* translators: %d: number of published posts */
				_n(
					'%d published post still embeds it and now shows nothing where the button was. Edit it to remove the block, or update it to create a new payment button:',
					'%d published posts still embed it and now show nothing where the button was. Edit them to remove the block, or update them to create a new payment button:',
					count( $posts ),
					'jetpack-paypal-payments'
				),
				count( $posts )
			);
			foreach ( $posts as $post ) {
				$links[] = array(
					'url'   => admin_url( 'post.php?post=' . (int) $post->ID . '&action=edit' ),
					'label' => get_the_title( $post ) ? get_the_title( $post ) : __( '(no title)', 'jetpack-paypal-payments' ),
				);
			}
		}

		return array(
			'type'    => 'success',
			'message' => $message,
			'links'   => $links,
		);
	}

	/**
	 * Initialize admin hooks when the API-managed buttons are enabled.
	 *
	 * @since 0.9.0
	 * @return void
	 */
	public static function maybe_init() {
		if ( ! PayPal_Payment_Buttons::is_api_managed_enabled() ) {
			return;
		}

		self::init();
	}

	/**
	 * Initialize admin hooks.
	 */
	public static function init() {
		add_action( 'admin_menu', array( __CLASS__, 'register_menu' ) );
		add_action( 'admin_init', array( __CLASS__, 'handle_actions' ) );
		add_action( 'admin_enqueue_scripts', array( __CLASS__, 'enqueue_assets' ) );
		add_action( 'wp_ajax_' . self::LOCATIONS_AJAX_ACTION, array( __CLASS__, 'handle_locations_request' ) );
	}

	/**
	 * Answer the Button Locations card's request for its next page of posts.
	 *
	 * @since 0.13.0
	 * @return void
	 */
	public static function handle_locations_request() {
		if ( ! check_ajax_referer( self::LOCATIONS_AJAX_ACTION, '_wpnonce', false ) ) {
			wp_send_json_error( array( 'message' => __( 'Security check failed.', 'jetpack-paypal-payments' ) ), 403, JSON_HEX_TAG | JSON_HEX_AMP );
		}
		if ( ! current_user_can( self::CAPABILITY ) ) {
			wp_send_json_error( array( 'message' => __( 'You do not have permission to view payment buttons.', 'jetpack-paypal-payments' ) ), 403, JSON_HEX_TAG | JSON_HEX_AMP );
		}

		$resource_id = isset( $_POST['resource_id'] ) ? sanitize_text_field( wp_unslash( $_POST['resource_id'] ) ) : '';
		if ( ! PayPal_Attribute_Mapper::is_valid_resource_id( $resource_id ) ) {
			wp_send_json_error( array( 'message' => __( 'Invalid payment button.', 'jetpack-paypal-payments' ) ), 400, JSON_HEX_TAG | JSON_HEX_AMP );
		}

		$locations = self::find_embeds_page( $resource_id, isset( $_POST['page'] ) ? absint( $_POST['page'] ) : 1 );

		wp_send_json_success(
			array(
				'rows'     => self::location_rows_html( $locations['posts'] ),
				'has_more' => $locations['has_more'],
			),
			200,
			JSON_HEX_TAG | JSON_HEX_AMP
		);
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
			__( 'PayPal Payment Buttons', 'jetpack-paypal-payments' ),
			__( 'PayPal Payment Buttons', 'jetpack-paypal-payments' ),
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
		if ( ! isset( $_GET['page'] ) || self::PAGE_SLUG !== sanitize_text_field( wp_unslash( $_GET['page'] ) ) ) {
			return;
		}

		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Nonce is verified below.
		if ( ! isset( $_GET['action'] ) || 'delete' !== sanitize_text_field( wp_unslash( $_GET['action'] ) ) ) {
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
				'paypal_admin_notice_' . get_current_user_id(),
				array(
					'type'    => 'error',
					'message' => sprintf(
						/* translators: %s: error message */
						__( 'Failed to delete payment button: %s', 'jetpack-paypal-payments' ),
						$result->get_error_message()
					),
				),
				30
			);
		} else {
			set_transient( 'paypal_admin_notice_' . get_current_user_id(), self::deleted_link_notice( $resource_id ), 30 );

			PayPal_Tracks::record_event(
				'jetpack_paypal_button_deleted',
				array(
					'environment'  => PayPal_OAuth::get_environment(),
					'source'       => 'admin',
					'already_gone' => false,
				)
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
			.paypal-admin-header__account {
				display: flex;
				align-items: center;
				gap: 8px;
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
			.paypal-link-locations {
				max-width: 600px;
			}
			.paypal-detail-link-url {
				font-size: 14px;
				padding: 4px 8px;
				background: #f0f0f1;
				word-break: break-all;
			}
			.paypal-delete-dialog {
				max-width: 480px;
				border: 0;
				border-radius: 4px;
				padding: 24px;
				box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
			}
			.paypal-delete-dialog::backdrop {
				background: rgba(0, 0, 0, 0.5);
			}
			.paypal-delete-dialog h2 {
				margin-block-start: 0;
			}
			.paypal-delete-dialog__acknowledge {
				display: block;
				margin-block: 16px;
			}
			.paypal-delete-dialog__actions {
				display: flex;
				justify-content: flex-end;
				gap: 8px;
			}
			'
		);

		// No file to load, so register an empty handle in the footer and hang the inline script off it.
		$handle = 'jetpack-paypal-admin';
		wp_register_script( $handle, false, array( 'wp-a11y' ), PayPal_Payments::PACKAGE_VERSION, true );
		wp_enqueue_script( $handle );

		wp_add_inline_script(
			$handle,
			'
			var deleteDialog = document.getElementById("paypal-delete-dialog");
			var deleteAcknowledge = document.getElementById("paypal-delete-acknowledge");
			var deleteConfirm = document.getElementById("paypal-delete-confirm");
			var deleteHref = "";

			function confirmDelete(e) {
				var link = e.target.closest(".paypal-delete-link");
				if (!link) {
					return;
				}
				// Browsers without <dialog> get the plain confirm.
				if (!deleteDialog || typeof deleteDialog.showModal !== "function") {
					if (!window.confirm(link.getAttribute("data-confirm"))) {
						e.preventDefault();
					}
					return;
				}
				e.preventDefault();
				deleteHref = link.href;
				deleteDialog.querySelector(".paypal-delete-dialog__text").textContent = link.getAttribute("data-confirm");
				deleteAcknowledge.checked = false;
				deleteConfirm.disabled = true;
				deleteDialog.showModal();
			}
			document.addEventListener("click", confirmDelete);
			document.addEventListener("auxclick", confirmDelete);

			if (deleteDialog) {
				deleteAcknowledge.addEventListener("change", function() {
					deleteConfirm.disabled = !deleteAcknowledge.checked;
				});
				deleteConfirm.addEventListener("click", function() {
					if (deleteAcknowledge.checked && deleteHref) {
						deleteDialog.close();
						window.location.assign(deleteHref);
					}
				});
				deleteDialog.querySelector(".paypal-delete-dialog__cancel").addEventListener("click", function() {
					deleteDialog.close();
				});
			}

			document.addEventListener("click", function(e) {
				if (e.target.classList.contains("paypal-copy-link")) {
					var url = e.target.getAttribute("data-url");
					if (navigator.clipboard) {
						navigator.clipboard.writeText(url).then(function() {
							var original = e.target.textContent;
							e.target.textContent = ' . wp_json_encode( __( 'Copied!', 'jetpack-paypal-payments' ), JSON_HEX_TAG | JSON_HEX_AMP ) . ';
							if (typeof wp !== "undefined" && wp.a11y) { wp.a11y.speak(' . wp_json_encode( __( 'Copied to clipboard', 'jetpack-paypal-payments' ), JSON_HEX_TAG | JSON_HEX_AMP ) . '); }
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

			// Button Locations "More" button (WOOPTP-597): appends the next page in place.
			var moreBtn = document.getElementById("paypal-link-locations-more");
			if (moreBtn) {
				moreBtn.addEventListener("click", function() {
					var rows = document.getElementById("paypal-link-locations-rows");
					var status = document.getElementById("paypal-link-locations-status");
					var body = new FormData();
					body.append("action", ' . wp_json_encode( self::LOCATIONS_AJAX_ACTION, JSON_HEX_TAG | JSON_HEX_AMP ) . ');
					body.append("_wpnonce", moreBtn.getAttribute("data-nonce"));
					body.append("resource_id", moreBtn.getAttribute("data-resource-id"));
					body.append("page", moreBtn.getAttribute("data-page"));
					moreBtn.disabled = true;
					status.textContent = ' . wp_json_encode( __( 'Loading…', 'jetpack-paypal-payments' ), JSON_HEX_TAG | JSON_HEX_AMP ) . ';

					fetch(' . wp_json_encode( admin_url( 'admin-ajax.php' ), JSON_HEX_TAG | JSON_HEX_AMP ) . ', {
						method: "POST",
						credentials: "same-origin",
						body: body,
					})
					.then(function(r) { return r.json(); })
					.then(function(data) {
						if (!data.success) {
							throw new Error(data.data && data.data.message);
						}
						rows.insertAdjacentHTML("beforeend", data.data.rows);
						status.textContent = "";
						if (data.data.has_more) {
							moreBtn.setAttribute("data-page", String(parseInt(moreBtn.getAttribute("data-page"), 10) + 1));
							moreBtn.disabled = false;
						} else {
							moreBtn.parentNode.remove();
						}
					})
					.catch(function(err) {
						status.textContent = (err && err.message) || ' . wp_json_encode( __( 'Could not load more. Please try again.', 'jetpack-paypal-payments' ), JSON_HEX_TAG | JSON_HEX_AMP ) . ';
						moreBtn.disabled = false;
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
		$notice = get_transient( 'paypal_admin_notice_' . get_current_user_id() );
		if ( $notice ) {
			delete_transient( 'paypal_admin_notice_' . get_current_user_id() );
			$links = '';
			foreach ( $notice['links'] ?? array() as $link ) {
				$links .= sprintf( '<li><a href="%s">%s</a></li>', esc_url( $link['url'] ), esc_html( $link['label'] ) );
			}
			printf(
				'<div class="notice notice-%s is-dismissible"><p>%s</p>%s</div>',
				esc_attr( $notice['type'] ),
				esc_html( $notice['message'] ),
				$links ? '<ul class="paypal-admin-notice__posts">' . $links . '</ul>' : '' // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Escaped while built above.
			);
		}

		echo '<div class="wrap">';

		// Header.
		echo '<div class="paypal-admin-header">';
		echo '<h1>' . esc_html__( 'PayPal Payment Buttons', 'jetpack-paypal-payments' ) . '</h1>';

		$status = PayPal_OAuth::get_connection_status();
		if ( ! empty( $status['connected'] ) ) {
			$environment = $status['environment'] ?? 'production';
			echo '<div class="paypal-admin-header__account">';
			printf(
				'<span class="paypal-status-badge paypal-status-active">%s — %s</span>',
				esc_html__( 'Connected', 'jetpack-paypal-payments' ),
				esc_html( ucfirst( $environment ) )
			);
			printf(
				'<a href="%s" class="button" target="_blank" rel="noopener noreferrer">%s</a>',
				esc_url( self::TRANSACTIONS_URLS[ $environment ] ?? self::TRANSACTIONS_URLS['production'] ),
				esc_html__( 'View transactions', 'jetpack-paypal-payments' )
			);
			printf(
				'<a href="%s" class="button" target="_blank" rel="noopener noreferrer">%s</a>',
				esc_url( self::REFUND_HELP_URL ),
				esc_html__( 'How to issue a refund', 'jetpack-paypal-payments' )
			);
			echo '</div>';
		}

		echo '</div>';

		// Disconnected state.
		if ( ! PayPal_OAuth::is_connected() ) {
			self::render_disconnected_state();
			echo '</div>';
			return;
		}

		// Detail view (WOOPTP-167).
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Read-only view parameter.
		if ( isset( $_GET['action'] ) && 'view' === sanitize_text_field( wp_unslash( $_GET['action'] ) ) && ! empty( $_GET['resource_id'] ) ) {
			// phpcs:ignore WordPress.Security.NonceVerification.Recommended
			self::render_detail_view( sanitize_text_field( wp_unslash( $_GET['resource_id'] ) ) );
			self::render_delete_dialog();
			echo '</div>';
			return;
		}

		PayPal_Tracks::record_event( 'jetpack_paypal_admin_page_viewed', array( 'environment' => PayPal_OAuth::get_environment() ) );

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

		self::render_delete_dialog();
		echo '</div>';
	}

	/**
	 * The delete confirmation, opened by the inline script when a Delete link is clicked.
	 *
	 * PayPal cannot pause or restore a payment button, so the confirm button stays
	 * disabled until the acknowledgement box is ticked. The warning paragraph is
	 * filled from the clicked link's data-confirm attribute.
	 *
	 * @since 0.9.0
	 */
	private static function render_delete_dialog() {
		echo '<dialog id="paypal-delete-dialog" class="paypal-delete-dialog" aria-labelledby="paypal-delete-dialog-title">';
		echo '<h2 id="paypal-delete-dialog-title">' . esc_html__( 'Delete payment button', 'jetpack-paypal-payments' ) . '</h2>';
		echo '<p class="paypal-delete-dialog__text"></p>';
		echo '<p>' . esc_html__( 'PayPal cannot pause, deactivate, or restore a payment button. Anyone who opens its link afterwards lands on a PayPal "not found" page instead of a checkout.', 'jetpack-paypal-payments' ) . '</p>';
		echo '<label class="paypal-delete-dialog__acknowledge"><input type="checkbox" id="paypal-delete-acknowledge"> ' . esc_html__( 'I understand this cannot be undone.', 'jetpack-paypal-payments' ) . '</label>';
		echo '<div class="paypal-delete-dialog__actions">';
		echo '<button type="button" class="button paypal-delete-dialog__cancel">' . esc_html__( 'Cancel', 'jetpack-paypal-payments' ) . '</button>';
		echo '<button type="button" class="button button-primary" id="paypal-delete-confirm" disabled>' . esc_html__( 'Delete permanently', 'jetpack-paypal-payments' ) . '</button>';
		echo '</div>';
		echo '</dialog>';
	}

	/**
	 * Render the detail view for a single payment link (WOOPTP-167).
	 *
	 * @param string $resource_id The PayPal resource ID (PLB-...).
	 */
	private static function render_detail_view( $resource_id ) {
		$resource = PayPal_API_Client::get_resource_cached( $resource_id );

		// Breadcrumb.
		printf(
			'<p><a href="%s">&larr; %s</a></p>',
			esc_url( admin_url( 'admin.php?page=' . self::PAGE_SLUG ) ),
			esc_html__( 'Back to Payment Buttons', 'jetpack-paypal-payments' )
		);

		// 404 / error handling.
		if ( is_wp_error( $resource ) ) {
			printf(
				'<div class="notice notice-error"><p>%s</p></div>',
				esc_html( $resource->get_error_message() )
			);
			return;
		}

		PayPal_Tracks::record_event( 'jetpack_paypal_admin_detail_viewed', array( 'environment' => PayPal_OAuth::get_environment() ) );

		$line_item = $resource['line_items'][0] ?? array();
		$name      = $line_item['name'] ?? $resource_id;
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

		// Everything below hands this link to a buyer — opened, copied, or
		// emailed — so it has to carry the same attribution code as the
		// rendered button.
		if ( '' !== $payment_link ) {
			$payment_link = PayPal_Payment_Buttons::add_partner_attribution( $payment_link );
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
			'<a href="%s" class="button paypal-delete-link" data-confirm="%s">%s</a>',
			esc_url( $delete_url ),
			esc_attr( self::delete_confirm_text( self::count_published_embeds()[ $resource_id ] ?? 0 ) ),
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

		// Same price the block shows, so a link priced per option shows "From" the cheapest option.
		$link_attributes = PayPal_Attribute_Mapper::api_response_to_attributes( $resource );
		$price_display   = PayPal_Payment_Buttons::link_price( $link_attributes );
		if ( '' !== $price_display ) {
			self::render_detail_row( __( 'Price', 'jetpack-paypal-payments' ), $price_display );
			self::render_detail_row( __( 'Currency', 'jetpack-paypal-payments' ), $link_attributes['currencyCode'] ?? 'USD' );
		}

		if ( ! empty( $line_item['product_id'] ) ) {
			self::render_detail_row( __( 'Product ID', 'jetpack-paypal-payments' ), $line_item['product_id'] );
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
					// PayPal labels the tax itself, so most payments leave the name empty.
					$detail      = sprintf( '%s (%s)', $tax['value'] ?? '', $tax['type'] ?? '' );
					$tax_parts[] = empty( $tax['name'] ) ? $detail : sprintf( '%s: %s', $tax['name'], $detail );
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

		// --- Button Locations Card (WOOPTP-597) ---
		$locations = self::find_embeds_page( $resource_id );

		echo '<div class="card paypal-detail-card">';
		printf( '<h3>%s</h3>', esc_html__( 'Button Locations', 'jetpack-paypal-payments' ) );
		if ( ! $locations['posts'] ) {
			printf( '<p>%s</p>', esc_html__( 'This payment button is not used on any post or page yet.', 'jetpack-paypal-payments' ) );
		} else {
			printf( '<p class="description">%s</p>', esc_html__( 'Posts and pages using this payment button.', 'jetpack-paypal-payments' ) );
			echo '<table class="widefat striped paypal-link-locations"><thead><tr>';
			printf( '<th scope="col">%s</th>', esc_html__( 'Title', 'jetpack-paypal-payments' ) );
			printf( '<th scope="col">%s</th>', esc_html__( 'Type', 'jetpack-paypal-payments' ) );
			printf( '<th scope="col">%s</th>', esc_html__( 'Actions', 'jetpack-paypal-payments' ) );
			echo '</tr></thead><tbody id="paypal-link-locations-rows">';
			echo self::location_rows_html( $locations['posts'] ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Escaped while built.
			echo '</tbody></table>';

			if ( $locations['has_more'] ) {
				printf(
					'<p class="paypal-link-locations__nav"><button type="button" class="button" id="paypal-link-locations-more" data-resource-id="%s" data-page="2" data-nonce="%s">%s</button> <span id="paypal-link-locations-status" role="status"></span></p>',
					esc_attr( $resource_id ),
					esc_attr( wp_create_nonce( self::LOCATIONS_AJAX_ACTION ) ),
					esc_html__( 'More', 'jetpack-paypal-payments' )
				);
			}
		}
		echo '</div>';

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
	 * The Button Locations table rows for a set of posts, escaped.
	 *
	 * @param \WP_Post[] $posts Posts embedding the button.
	 * @return string HTML table rows.
	 */
	private static function location_rows_html( array $posts ) {
		$html = '';
		foreach ( $posts as $post ) {
			$type_object = get_post_type_object( $post->post_type );
			$type        = $type_object ? $type_object->labels->singular_name : $post->post_type;
			$is_live     = 'publish' === $post->post_status;
			if ( ! $is_live ) {
				$status_object = get_post_status_object( $post->post_status );
				$type          = sprintf(
					/* translators: 1: post status label, such as Draft; 2: post type label, such as Page */
					__( '%1$s %2$s', 'jetpack-paypal-payments' ),
					$status_object ? $status_object->label : $post->post_status,
					$type
				);
			}
			$html .= sprintf(
				'<tr><td>%s</td><td>%s</td><td><a href="%s">%s</a> | <a href="%s" target="_blank" rel="noopener noreferrer">%s</a></td></tr>',
				esc_html( get_the_title( $post ) ? get_the_title( $post ) : __( '(no title)', 'jetpack-paypal-payments' ) ),
				esc_html( $type ),
				esc_url( admin_url( 'post.php?post=' . (int) $post->ID . '&action=edit' ) ),
				esc_html__( 'Edit', 'jetpack-paypal-payments' ),
				esc_url( $is_live ? get_permalink( $post ) : get_preview_post_link( $post ) ),
				$is_live ? esc_html__( 'View', 'jetpack-paypal-payments' ) : esc_html__( 'Preview', 'jetpack-paypal-payments' )
			);
		}

		return $html;
	}

	/**
	 * Render the disconnected state.
	 */
	private static function render_disconnected_state() {
		echo '<div class="paypal-disconnected-notice">';
		printf( '<h2>%s</h2>', esc_html__( 'Connect PayPal to view your payment buttons', 'jetpack-paypal-payments' ) );
		printf(
			'<p>%s</p>',
			esc_html__( 'Add a PayPal Payment Buttons block in the editor to connect your PayPal account and start creating payment buttons.', 'jetpack-paypal-payments' )
		);
		printf(
			'<a href="%s" class="button button-primary">%s</a>',
			esc_url( admin_url( 'post-new.php' ) ),
			esc_html__( 'Create a Post', 'jetpack-paypal-payments' )
		);
		echo '</div>';
	}
}
