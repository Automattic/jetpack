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
	 * The content of the cart page or where the cart page is ultimately derived from if using a template.
	 *
	 * @var string
	 */
	protected $cart_content_source = '';

	/**
	 * The content of the checkout page or where the cart page is ultimately derived from if using a template.
	 *
	 * @var string
	 */
	protected $checkout_content_source = '';

	/**
	 * Gets the content of the cart/checkout page or where the cart/checkout page is ultimately derived from if using a template.
	 * This method sets the class properties $checkout_content_source and $cart_content_source.
	 *
	 * @return void Does not return, but sets class properties.
	 */
	public function find_cart_checkout_content_sources() {

		/**
		 * The steps we take to find the content are:
		 * 1. Check the transient, if that contains content and is not expired, return that.
		 * 2. Check if the cart/checkout templates are in use. If *not in use*, get the content from the pages and
		 *    return it, there is no need to dig further.
		 * 3. If the templates *are* in use, check if the `page-content-wrapper` block is in use. If so, get the content
		 *    from the pages (same as step 2) and return it.
		 * 4. If the templates are in use but `page-content-wrapper` is not, then get the content directly from the
		 *    template and return it.
		 * 5. At the end of each step, assign the found content to the relevant class properties and save them in a
		 *    transient with a 1-day lifespan. This will prevent us from having to do this work on every page load.
		 */

		$cart_checkout_content_cache_transient_name = 'jetpack_woocommerce_analytics_cart_checkout_content_sources';

		$transient_value = get_transient( $cart_checkout_content_cache_transient_name );

		if (
			false !== $transient_value &&
			! empty( $transient_value['checkout_content_source'] ) &&
			! empty( $transient_value['cart_content_source'] )
		) {
			$this->cart_content_source     = $transient_value['cart_content_source'];
			$this->checkout_content_source = $transient_value['checkout_content_source'];
			return;
		}

		// Cart/Checkout *pages* are in use if the templates are not in use. Return their content and do nothing else.
		if ( ! $this->cart_checkout_templates_in_use ) {
			$cart_page_id     = wc_get_page_id( 'cart' );
			$checkout_page_id = wc_get_page_id( 'checkout' );
			$cart_page        = get_post( $cart_page_id );
			$checkout_page    = get_post( $checkout_page_id );

			if ( $cart_page && isset( $cart_page->post_content ) ) {
				$this->cart_content_source = $cart_page->post_content;
			}
			if ( $checkout_page && isset( $checkout_page->post_content ) ) {
				$this->checkout_content_source = $checkout_page->post_content;
			}

			set_transient(
				$cart_checkout_content_cache_transient_name,
				array(
					'cart_content_source'     => $this->cart_content_source,
					'checkout_content_source' => $this->checkout_content_source,
				),
				DAY_IN_SECONDS
			);
			return;
		}

		// We are in a Block theme - so we need to find out if the templates are being used.
		if ( function_exists( 'get_block_template' ) ) {
			$checkout_template = get_block_template( 'woocommerce/woocommerce//page-checkout' );
			$cart_template     = get_block_template( 'woocommerce/woocommerce//page-cart' );
			if ( ! $checkout_template ) {
				$checkout_template = get_block_template( 'woocommerce/woocommerce//checkout' );
			}
			if ( ! $cart_template ) {
				$cart_template = get_block_template( 'woocommerce/woocommerce//cart' );
			}
		}

		if ( function_exists( 'gutenberg_get_block_template' ) ) {
			$checkout_template = gutenberg_get_block_template( 'woocommerce/woocommerce//page-checkout' );
			$cart_template     = gutenberg_get_block_template( 'woocommerce/woocommerce//page-cart' );
			if ( ! $checkout_template ) {
				$checkout_template = gutenberg_get_block_template( 'woocommerce/woocommerce//checkout' );
			}
			if ( ! $cart_template ) {
				$cart_template = gutenberg_get_block_template( 'woocommerce/woocommerce//cart' );
			}
		}

		if ( ! empty( $checkout_template->content ) ) {
			// Checkout template is in use, but we need to see if the page-content-wrapper is in use, or if the template is being used directly.
			$this->checkout_content_source = $checkout_template->content;
			$is_using_page_content         = str_contains( $checkout_template->content, '<!-- wp:woocommerce/page-content-wrapper {"page":"checkout"}' );

			if ( $is_using_page_content ) {
				// The page-content-wrapper is in use, so we need to get the page content.
				$checkout_page_id = wc_get_page_id( 'checkout' );
				$checkout_page    = get_post( $checkout_page_id );

				if ( $checkout_page && isset( $checkout_page->post_content ) ) {
					$this->checkout_content_source = $checkout_page->post_content;
				}
			}
		}

		if ( ! empty( $cart_template->content ) ) {
			// Cart template is in use, but we need to see if the page-content-wrapper is in use, or if the template is being used directly.
			$this->cart_content_source = $cart_template->content;
			$is_using_page_content     = str_contains( $cart_template->content, '<!-- wp:woocommerce/page-content-wrapper {"page":"cart"}' );

			if ( $is_using_page_content ) {
				// The page-content-wrapper is in use, so we need to get the page content.
				$cart_page_id = wc_get_page_id( 'cart' );
				$cart_page    = get_post( $cart_page_id );

				if ( $cart_page && isset( $cart_page->post_content ) ) {
					$this->cart_content_source = $cart_page->post_content;
				}
			}
		}

		set_transient(
			$cart_checkout_content_cache_transient_name,
			array(
				'cart_content_source'     => $this->cart_content_source,
				'checkout_content_source' => $this->checkout_content_source,
			),
			DAY_IN_SECONDS
		);
	}

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
			'device'         => wp_is_mobile() ? 'mobile' : 'desktop',
			'template_used'                      => $this->cart_checkout_templates_in_use ? '1' : '0',
			'store_currency'                     => get_woocommerce_currency(),
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
	 * Gets an array containing the block or shortcode use properties for the Cart page.
	 *
	 * @return array            An array containing the block or shortcode use properties for the Cart page.
	 */
	public function get_cart_page_block_usage() {
		$new_info = array();

		$content                    = $this->cart_content_source;
		$block_presence             = str_contains(
			$content,
			'<!-- wp:woocommerce/cart'
		);
		$shortcode_presence         = str_contains(
			$content,
			'[woocommerce_cart]'
		);
		$classic_shortcode_presence = str_contains(
			$content,
			'<!-- wp:woocommerce/classic-shortcode'
		);

		$new_info['cart_page_contains_cart_block']     = $block_presence ? '1' : '0';
		$new_info['cart_page_contains_cart_shortcode'] = $shortcode_presence || $classic_shortcode_presence ? '1' : '0';
		return $new_info;
	}

	/**
	 * Gets an array containing the block or shortcode use properties for the Checkout page.
	 *
	 * @return array                An array containing the block or shortcode use properties for the Checkout page.
	 */
	public function get_checkout_page_block_usage() {
		$new_info = array();

		$content                    = $this->checkout_content_source;
		$block_presence             = str_contains(
			$content,
			'<!-- wp:woocommerce/checkout'
		);
		$shortcode_presence         = str_contains(
			$content,
			'[woocommerce_checkout]'
		);
		$classic_shortcode_presence = str_contains(
			$content,
			'<!-- wp:woocommerce/classic-shortcode'
		);

		$new_info['checkout_page_contains_checkout_block']     = $block_presence ? '1' : '0';
		$new_info['checkout_page_contains_checkout_shortcode'] = $shortcode_presence || $classic_shortcode_presence ? '1' : '0';
		return $new_info;
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
		$info = array_merge(
			$this->get_cart_page_block_usage(),
			$this->get_checkout_page_block_usage()
		);
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
