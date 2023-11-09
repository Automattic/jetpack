<?php
/**
 * Jetpack_WooCommerce_Analytics_Trait
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
 * Jetpack_WooCommerce_Analytics_Trait
 * Common functionality for WooCommerce Analytics classes.
 */
trait Jetpack_WooCommerce_Analytics_Trait {

	/**
	 * Saves whether the cart/checkout templates are in use based on WC Blocks version.
	 *
	 * @var bool true if the templates are in use.
	 */
	protected $cart_checkout_templates_in_use;

	/**
	 * Default event properties which should be included with all events.
	 *
	 * @return array Array of standard event props.
	 */
	public function get_common_properties() {
		$site_info          = array(
			'blog_id'     => Jetpack::get_option( 'id' ),
			'ui'          => $this->get_user_id(),
			'url'         => home_url(),
			'woo_version' => WC()->version,
			'store_admin' => in_array( 'administrator', wp_get_current_user()->roles, true ) ? 1 : 0,
		);
		$cart_checkout_info = $this->get_cart_checkout_info();
		return array_merge( $site_info, $cart_checkout_info );
	}

	/**
	 * Render tracks event properties as string of JavaScript object props.
	 *
	 * @param  array $properties Array of key/value pairs.
	 * @return string String of the form "key1: value1, key2: value2, " (etc).
	 */
	private function render_properties_as_js( $properties ) {
		$js_args_string = '';
		foreach ( $properties as $key => $value ) {
			if ( is_array( $value ) ) {
				$js_args_string = $js_args_string . "'$key': " . wp_json_encode( $value ) . ',';
			} else {
				$js_args_string = $js_args_string . "'$key': '" . esc_js( $value ) . "', ";
			}
		}
		return $js_args_string;
	}

		/**
		 * Record an event with optional product and custom properties.
		 *
		 * @param string  $event_name The name of the event to record.
		 * @param array   $properties Optional array of (key => value) event properties.
		 * @param integer $product_id The id of the product relating to the event.
		 *
		 * @return string|void
		 */
	public function record_event( $event_name, $properties = array(), $product_id = null ) {
		$js = $this->process_event_properties( $event_name, $properties, $product_id );
		wc_enqueue_js( "_wca.push({$js});" );
	}

	/**
	 * Compose event properties.
	 *
	 * @param string  $event_name The name of the event to record.
	 * @param array   $properties Optional array of (key => value) event properties.
	 * @param integer $product_id Optional id of the product relating to the event.
	 *
	 * @return string|void
	 */
	public function process_event_properties( $event_name, $properties = array(), $product_id = null ) {

		// Only set product details if we have a product id.
		if ( $product_id ) {
			$product = wc_get_product( $product_id );
			if ( ! $product instanceof WC_Product ) {
				return;
			}
			$product_details = $this->get_product_details( $product );
		}

		/**
		 * Allow defining custom event properties in WooCommerce Analytics.
		 *
		 * @module woocommerce-analytics
		 *
		 * @since 12.5
		 *
		 * @param array $all_props Array of event props to be filtered.
		 */
		$all_props = apply_filters(
			'jetpack_woocommerce_analytics_event_props',
			array_merge(
				$properties,
				$this->get_common_properties()
			)
		);

		$js = "{'_en': '" . esc_js( $event_name ) . "'";

		if ( isset( $product_details ) ) {
				$js .= ",'pi': '" . esc_js( $product_id ) . "'";
				$js .= ",'pn': '" . esc_js( $product_details['name'] ) . "'";
				$js .= ",'pc': '" . esc_js( $product_details['category'] ) . "'";
				$js .= ",'pp': '" . esc_js( $product_details['price'] ) . "'";
				$js .= ",'pt': '" . esc_js( $product_details['type'] ) . "'";
		}

		$js .= ',' . $this->render_properties_as_js( $all_props ) . '}';

		return $js;
	}

	/**
	 * Get the current user id
	 *
	 * @return int
	 */
	public function get_user_id() {
		if ( is_user_logged_in() ) {
			$blogid = Jetpack::get_option( 'id' );
			$userid = get_current_user_id();
			return $blogid . ':' . $userid;
		}
		return 'null';
	}

	/**
	 * Get info about the cart & checkout pages, in particular
	 * whether the store is using shortcodes or Gutenberg blocks.
	 * This info is cached in a transient.
	 *
	 * Note: similar code is in a WooCommerce core PR:
	 * https://github.com/woocommerce/woocommerce/pull/25932
	 *
	 * @return array
	 */
	public function get_cart_checkout_info() {
		$transient_name = 'jetpack_woocommerce_analytics_cart_checkout_info_cache';

		$info = get_transient( $transient_name );

		// Return cached data early to prevent additional processing, the transient lasts for 1 day.
		if ( false !== $info ) {
			return $info;
		}

		if ( ! $this->cart_checkout_templates_in_use ) {
			$cart_page_id     = wc_get_page_id( 'cart' );
			$checkout_page_id = wc_get_page_id( 'checkout' );

			$info = array(
				'cart_page_contains_cart_block'         => $this->post_contains_text(
					$cart_page_id,
					'<!-- wp:woocommerce/cart'
				),
				'cart_page_contains_cart_shortcode'     => $this->post_contains_text(
					$cart_page_id,
					'[woocommerce_cart]'
				),
				'checkout_page_contains_checkout_block' => $this->post_contains_text(
					$checkout_page_id,
					'<!-- wp:woocommerce/checkout'
				),
				'checkout_page_contains_checkout_shortcode' => $this->post_contains_text(
					$checkout_page_id,
					'[woocommerce_checkout]'
				),
			);
			set_transient( $transient_name, $info, DAY_IN_SECONDS );
			return $info;
		}

		// We will only reach here if the Cart/Checkout templates are in use.

		$cart_template        = null;
		$checkout_template    = null;
		$cart_template_id     = null;
		$checkout_template_id = null;
		$block_controller     = Automattic\WooCommerce\Blocks\Package::container()->get( Automattic\WooCommerce\Blocks\BlockTemplatesController::class );
		$templates            = $block_controller->get_block_templates( array( 'cart', 'checkout', 'page-checkout', 'page-cart' ) );

		foreach ( $templates as $template ) {
			if ( 'cart' === $template->slug || 'page-cart' === $template->slug ) {
				$cart_template_id = ( $template->id );
				continue;
			}
			if ( 'checkout' === $template->slug || 'page-checkout' === $template->slug ) {
				$checkout_template_id = ( $template->id );
			}
		}

		// Get the template and its contents from the IDs we found above.
		if ( function_exists( 'get_block_template' ) ) {
			$cart_template     = get_block_template( $cart_template_id );
			$checkout_template = get_block_template( $checkout_template_id );
		}

		if ( function_exists( 'gutenberg_get_block_template' ) ) {
			$cart_template     = get_block_template( $cart_template_id );
			$checkout_template = get_block_template( $checkout_template_id );
		}

		// Something failed with the template retrieval, return early with 0 values rather than let a warning appear.
		if ( ! $cart_template || ! $checkout_template ) {
			return array(
				'cart_page_contains_cart_block'         => 0,
				'cart_page_contains_cart_shortcode'     => 0,
				'checkout_page_contains_checkout_block' => 0,
				'checkout_page_contains_checkout_shortcode' => 0,
			);
		}

		// Update the info transient with data we got from the templates, if the site isn't using WC Blocks we
		// won't be doing this so no concern about overwriting.
		$info = array(
			'cart_page_contains_cart_block'             => str_contains( $cart_template->content, '<!-- wp:woocommerce/cart' ) ? 1 : 0,
			'cart_page_contains_cart_shortcode'         => str_contains( $cart_template->content, '[woocommerce_cart]' ) ? 1 : 0,
			'checkout_page_contains_checkout_block'     => str_contains( $checkout_template->content, '<!-- wp:woocommerce/checkout' ) ? 1 : 0,
			'checkout_page_contains_checkout_shortcode' => str_contains( $checkout_template->content, '[woocommerce_checkout]' ) ? 1 : 0,
		);
		set_transient( $transient_name, $info, DAY_IN_SECONDS );
		return $info;
	}

		/**
		 * Search a specific post for text content.
		 *
		 * Note: similar code is in a WooCommerce core PR:
		 * https://github.com/woocommerce/woocommerce/pull/25932
		 *
		 * @param integer $post_id The id of the post to search.
		 * @param string  $text    The text to search for.
		 * @return integer 1 if post contains $text (otherwise 0).
		 */
	public function post_contains_text( $post_id, $text ) {
		global $wpdb;

		// Search for the text anywhere in the post.
		$wildcarded = "%{$text}%";

		// No better way to search post content without having filters expanding blocks.
		// This is already cached up in the parent function.
		$result = $wpdb->get_var( // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching
			$wpdb->prepare(
				"
				SELECT COUNT( * ) FROM {$wpdb->prefix}posts
				WHERE ID=%d
				AND {$wpdb->prefix}posts.post_content LIKE %s
				",
				array( $post_id, $wildcarded )
			)
		);

		return ( '0' !== $result ) ? 1 : 0;
	}
}
