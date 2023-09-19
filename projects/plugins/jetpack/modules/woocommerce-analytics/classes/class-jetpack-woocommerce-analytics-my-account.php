<?php
/**
 * Jetpack_WooCommerce_Analytics_My_Account
 *
 * @package automattic/jetpack
 * @author  Automattic
 */

/**
 * Bail if accessed directly
 */
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class Jetpack_WooCommerce_Analytics_My_Account
 * Filters and Actions added to My Account pages to perform analytics
 */
class Jetpack_WooCommerce_Analytics_My_Account {

	use Jetpack_WooCommerce_Analytics_Trait;
	/**
	 * Jetpack_WooCommerce_Analytics_My_Account constructor.
	 */
	public function __construct() {

		add_action( 'woocommerce_account_content', array( $this, 'track_tabs' ) );
		add_action( 'woocommerce_customer_save_address', array( $this, 'track_save_address' ), 10, 2 );
		add_action( 'wp', array( $this, 'track_add_payment_method' ) );
		add_action( 'wp', array( $this, 'track_delete_payment_method' ) );
		add_action( 'woocommerce_save_account_details', array( $this, 'track_save_account_details' ) );
		add_action( 'wp_logout', array( $this, 'track_logouts' ) );
		add_filter( 'woocommerce_my_account_my_orders_actions', array( $this, 'add_initiator_prop_to_my_account_action_links' ) );
		add_action( 'woocommerce_cancelled_order', array( $this, 'track_order_cancel_event' ), 10, 0 );
		add_action( 'before_woocommerce_pay', array( $this, 'track_order_pay_event' ) );
		add_action( 'woocommerce_account_content', array( $this, 'add_initiator_prop_to_order_urls' ) );
		add_filter( 'query_vars', array( $this, 'add_initiator_param_to_query_vars' ) );
	}

	/**
	 * Track my account tabs, we only trigger an event if a tab is viewed.
	 *
	 * We also track other events here, like order number clicks, order action clicks,
	 * address clicks, payment method add and delete.
	 */
	public function track_tabs() {
		global $wp;

		// WooCommerce keeps a map of my-account endpoints keys and their custom permalinks.
		$core_endpoints = WC()->query->get_query_vars();

		if ( ! empty( $wp->query_vars ) ) {

			foreach ( $wp->query_vars as $key => $value ) {
				// we skip pagename
				if ( 'pagename' === $key ) {
					continue;
				}

				// We don't want to track our own analytics params.
				if ( '_wca_initiator' === $key ) {
					continue;
				}

				if ( $core_endpoints['view-order'] === $key && is_numeric( $value ) ) {
					$initiator = get_query_var( '_wca_initiator' );
					if ( 'number' === $initiator ) {
						$this->record_event( 'woocommerceanalytics_my_account_order_number_click' );
						continue;
					}
					if ( 'action' === $initiator ) {
						$this->record_event( 'woocommerceanalytics_my_account_order_action_click', array( 'action' => 'view' ) );
						continue;
					}
				}

				if ( $core_endpoints['edit-address'] === $key && in_array( $value, array( 'billing', 'shipping' ), true ) ) {
					$this->record_event( 'woocommerceanalytics_my_account_address_click', array( 'address' => $value ) );
					continue;
				}

				if ( $core_endpoints['add-payment-method'] === $key ) {
					$this->record_event( 'woocommerceanalytics_my_account_payment_add' );
					continue;
				}

				/**
				 * The main dashboard view has page as key, so we rename it.
				 */
				if ( 'page' === $key ) {
					$key = 'dashboard';
				}

				/**
				 * If a custom permalink is used for one of the pages, query_vars will have 2 keys, the custom permalink and the core endpoint key.
				 * To avoid triggering the event twice, we skip the core one and only track the custom one.
				 * Tracking the custom endpoint is safer than hoping the duplicated, redundant core endpoint is always present.
				 */
				if ( $core_endpoints[ $key ] && $core_endpoints[ $key ] !== $key ) {
					continue;
				}

				/**
				 * We don't want to register the custom endpoint name but the core name for.
				 */
				if ( array_search( $key, $core_endpoints, true ) ) {
					$key = array_search( $key, $core_endpoints, true );
				}

				$this->record_event( 'woocommerceanalytics_my_account_page_view', array( 'tab' => $key ) );
			}
		}
	}

	/**
	 * Track address save events, this can only come from the my account page.
	 *
	 * @param int    $customer_id The customer id.
	 * @param string $load_address The address type (billing, shipping).
	 */
	public function track_save_address( $customer_id, $load_address ) {
		$this->record_event( 'woocommerceanalytics_my_account_address_save', array( 'address' => $load_address ) );
	}

	/**
	 * Track payment method add events, this can only come from the my account page.
	 */
	public function track_add_payment_method() {
		if ( isset( $_POST['woocommerce_add_payment_method'] ) && isset( $_POST['payment_method'] ) ) {

			$nonce_value = wc_get_var( $_REQUEST['woocommerce-add-payment-method-nonce'], wc_get_var( $_REQUEST['_wpnonce'], '' ) ); // @codingStandardsIgnoreLine.

			if ( ! wp_verify_nonce( $nonce_value, 'woocommerce-add-payment-method' ) ) {
				return;
			}

			$this->record_event( 'woocommerceanalytics_my_account_details_save' );
			return;
		}
	}

	/**
	 * Track payment method delete events.
	 */
	public function track_delete_payment_method() {
		global $wp;
		if ( isset( $wp->query_vars['delete-payment-method'] ) ) {
			$this->record_event( 'woocommerceanalytics_my_account_payment_delete' );
			return;
		}
	}

	/**
	 * Track order cancel events.
	 */
	public function track_order_cancel_event() {
		if ( isset( $_GET['_wca_initiator'] ) && ( isset( $_GET['_wpnonce'] ) && wp_verify_nonce( wp_unslash( $_GET['_wpnonce'] ), 'woocommerce-cancel_order' ) ) ) { // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
			$this->record_event( 'woocommerceanalytics_my_account_order_action_click', array( 'action' => 'cancel' ) );
		}
	}

	/**
	 * Track order pay events.
	 */
	public function track_order_pay_event() {
		if ( isset( $_GET['_wca_initiator'] ) ) { // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
			$this->record_event( 'woocommerceanalytics_my_account_order_action_click', array( 'action' => 'pay' ) );
		}
	}

	/**
	 * Track account details save events, this can only come from the my account page.
	 */
	public function track_save_account_details() {
		$this->record_event( 'woocommerceanalytics_my_account_details_save' );
	}

	/**
	 * Track logout events.
	 */
	public function track_logouts() {
		$referrer = wp_get_referer();

		if ( ! $referrer ) {
			return;
		}
		// check if the dashboard url is contained whithin the referrer url
		if ( false === strpos( $referrer, wc_get_account_endpoint_url( 'dashboard' ) ) ) {
			return;
		}

		$this->record_event( 'woocommerceanalytics_my_account_tab_click', array( 'tab' => 'logout' ) );
	}

	/**
	 * Add referrer prop to my account action links
	 *
	 * @param array $actions My account action links.
	 * @return array
	 */
	public function add_initiator_prop_to_my_account_action_links( $actions ) {
		foreach ( $actions as $key => $action ) {
			if ( ! isset( $action['url'] ) ) {
				continue;
			}
			$url                    = add_query_arg( array( '_wca_initiator' => 'action' ), $action['url'] );
			$actions[ $key ]['url'] = $url;
		}

		return $actions;
	}

	/**
	 * Add an initiator prop to the order url.
	 *
	 * The get_view_order_url is used in a lot of places,
	 * so we want to limit it just to my account page.
	 */
	public function add_initiator_prop_to_order_urls() {
		add_filter(
			'woocommerce_get_view_order_url',
			function ( $url ) {
				return add_query_arg( array( '_wca_initiator' => 'number' ), $url );
			},
			10,
			1
		);

		add_filter(
			'woocommerce_get_endpoint_url',
			function ( $url, $endpoint ) {
				if ( 'edit-address' === $endpoint ) {
					return add_query_arg( array( '_wca_initiator' => 'action' ), $url );
				}
				return $url;
			},
			10,
			2
		);
	}

	/**
	 * Add initiator to query vars
	 *
	 * @param array $query_vars Query vars.
	 * @return array
	 */
	public function add_initiator_param_to_query_vars( $query_vars ) {
		$query_vars[] = '_wca_initiator';
		return $query_vars;
	}
}
