<?php

class Jetpack_Simple_Payments {
	// These have to be under 20 chars because that is CPT limit.
	static $post_type_order = 'jp_pay_order';
	static $post_type_product = 'jp_pay_product';

	static $shortcode = 'simple-payment';

	// Classic singleton pattern:
	private static $instance;
	private function __construct() {}
	static function getInstance() {
		if ( ! self::$instance ) {
			self::$instance = new self();
			self::$instance->register_init_hook();
		}
		return self::$instance;
	}

	private function register_scripts() {
		/**
		 * Paypal heavily discourages putting that script in your own server:
		 * @see https://developer.paypal.com/docs/integration/direct/express-checkout/integration-jsv4/add-paypal-button/
		 */
		wp_register_script( 'paypal-checkout-js', 'https://www.paypalobjects.com/api/checkout.js' );
		wp_register_script( 'paypal-express-checkout', plugins_url( '/paypal-express-checkout.js', __FILE__ ) , array( 'paypal-checkout-js' ) );
	}
	private function register_init_hook() {
		add_action( 'init', array( $this, 'init_hook_action' ) );
	}
	private function register_shortcode() {
		add_shortcode( static::$shortcode, array( $this, 'parse_shortcode' ) );
	}

	public function init_hook_action() {
		add_filter( 'rest_api_allowed_post_types', array( $this, 'allow_rest_api_types' ) );
		$this->register_scripts();
		$this->register_shortcode();
		$this->setup_cpts();
	}

	function parse_shortcode( $attrs, $content = false ) {
		if( empty( $attrs[ 'id' ] ) ) {
			return;
		}
		$product = get_post( $attrs[ 'id' ] );
		if( is_wp_error( $product ) ) {
			return;
		}
		if( $product->post_type !== self::$post_type_product ) {
			return;
		}

		// We allow for overriding the presentation labels
		$data = shortcode_atts( array(
			'dom_id' => uniqid( 'jp_simple_payments__button_' . $product->ID . '_' ),
			'class' => 'jp_simple_payments__' . $product->ID,
			'title' => get_the_title( $product ),
			'description' => apply_filters( 'the_content', $product->post_content ),
			'cta' => get_post_meta( $product->ID, 'spay_cta', true ),
			'multiple' => get_post_meta( $product->ID, 'spay_multiple', true )
		), $attrs );
		$data[ 'price' ] = $this->format_price(
			get_post_meta( $product->ID, 'spay_price', true ),
			get_post_meta( $product->ID, 'spay_currency', true ),
			$data
		);

		wp_enqueue_script( 'paypal-express-checkout' );
		wp_add_inline_script( 'paypal-express-checkout', "try{PaypalExpressCheckout.renderButton( {$data['dom_id']} );}catch(e){}" );

		return $this->output_shortcode( $data );
	}

	function output_shortcode( $data ) {
		$items="";
		// TODO: tie number of items to request
		if( $data['multiple'] ) {
		       $items='<div class="jp_simple_payments__items" ><input type="number" value="1"></div>';
		}
		$output = <<<TEMPLATE
<div class="{$data[ 'class' ]} jp_simple_payments__wrapper">
	<h2 class="jp_simple_payments__title">{$data['title']}</h2>
	<div class="jp_simple_payments__description">{$data['description']}</div>
	<div class="jp_simple_payments__price">{$data['price']}</div>
	{$items}
	<div class="jp_simple_payments__button" id="{$data['dom_id']}"></div>
</div>
TEMPLATE;
		return $output;
	}

	function format_price( $price, $currency ) {
		// TODO: better logic here.
		return $price. " " . $currency;
	}

	/**
	 * Allows custom post types to be used by REST API.
	 * @param $post_types
	 * @see hook 'rest_api_allowed_post_types'
	 * @return array
	 */
	function allow_rest_api_types( $post_types ) {
		$post_types[] = self::$post_type_order;
		$post_types[] = self::$post_type_product;
		return $post_types;
	}

	/**
	 * Sets up the custom post types for the module.
	 */
	function setup_cpts() {

		/*
		 * ORDER data structure. holds:
		 * title = customer_name | 4xproduct_name
		 * excerpt = customer_name + customer contact info + customer notes from paypal form
		 * metadata:
		 * spay_paypal_id - paypal id of transaction
		 * spay_status
		 * spay_product_id - post_id of bought product
		 * spay_quantity - quantity of product
		 * spay_price - item price at the time of purchase
		 * spay_customer_email - customer email
		 * ... (WIP)
		 */
		$order_capabilities = array(
			'edit_post'             => 'edit_posts',
			'read_post'             => 'read_private_posts',
			'delete_post'           => 'delete_posts',
			'edit_posts'            => 'edit_posts',
			'edit_others_posts'     => 'edit_others_posts',
			'publish_posts'         => 'publish_posts',
			'read_private_posts'    => 'read_private_posts',
		);
		$order_args = array(
			'label'                 => __( 'Order', 'jetpack' ),
			'description'           => __( 'Simple Payments orders', 'jetpack' ),
			'supports'              => array( 'custom-fields', 'excerpt' ),
			'hierarchical'          => false,
			'public'                => false,
			'show_ui'               => false,
			'show_in_menu'          => false,
			'show_in_admin_bar'     => false,
			'show_in_nav_menus'     => false,
			'can_export'            => true,
			'has_archive'           => false,
			'exclude_from_search'   => true,
			'publicly_queryable'    => false,
			'rewrite'               => false,
			'capabilities'          => $order_capabilities,
			'show_in_rest'          => true,
		);
		register_post_type( self::$post_type_order, $order_args );

		/*
		 * PRODUCT data structure. Holds:
		 * title - title
		 * content - description
		 * thumbnail - image
		 * metadata:
		 * spay_price - price
		 * spay_currency - currency code
		 * spay_cta - text with "Buy" or other CTA
		 * spay_email - paypal email
		 * spay_multiple - allow for multiple items
		 * spay_status - status. { enabled | disabled }
		 */
		$product_capabilities = array(
			'edit_post'             => 'edit_posts',
			'read_post'             => 'read_private_posts',
			'delete_post'           => 'delete_posts',
			'edit_posts'            => 'edit_posts',
			'edit_others_posts'     => 'edit_others_posts',
			'publish_posts'         => 'publish_posts',
			'read_private_posts'    => 'read_private_posts',
		);
		$product_args = array(
			'label'                 => __( 'Product', 'jetpack' ),
			'description'           => __( 'Simple Payments products', 'jetpack' ),
			'supports'              => array( 'title', 'editor','thumbnail', 'custom-fields' ),
			'hierarchical'          => false,
			'public'                => false,
			'show_ui'               => false,
			'show_in_menu'          => false,
			'show_in_admin_bar'     => false,
			'show_in_nav_menus'     => false,
			'can_export'            => true,
			'has_archive'           => false,
			'exclude_from_search'   => true,
			'publicly_queryable'    => false,
			'rewrite'               => false,
			'capabilities'          => $product_capabilities,
			'show_in_rest'          => true,
		);
		register_post_type( self::$post_type_product, $product_args );
	}

}
Jetpack_Simple_Payments::getInstance();
