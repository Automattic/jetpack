<?php
/*
 * Simple Payments lets users embed a PayPal button fully integrated with wpcom to sell products on the site.
 * This is not a proper module yet, because not all the pieces are in place. Until everything is shipped, it can be turned
 * into module that can be enabled/disabled.
 * TODO: Once the feature is fully shipped, create a file modules/simple-payments.php with a proper header to turn module on/off.
*/
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
		wp_register_script( 'paypal-checkout-js', 'https://www.paypalobjects.com/api/checkout.js', array(), null, true );
		wp_register_script( 'paypal-express-checkout', plugins_url( '/paypal-express-checkout.js', __FILE__ ) , array( 'jquery', 'paypal-checkout-js' ), '0.21' );
		wp_enqueue_style( 'simple-payments', plugins_url( '/simple-payments.css', __FILE__ ) );
	}
	private function register_init_hook() {
		add_action( 'init', array( $this, 'init_hook_action' ) );
	}
	private function register_shortcode() {
		add_shortcode( self::$shortcode, array( $this, 'parse_shortcode' ) );
	}

	public function init_hook_action() {
		add_filter( 'rest_api_allowed_post_types', array( $this, 'allow_rest_api_types' ) );
		add_filter( 'jetpack_sync_post_meta_whitelist', array( $this, 'allow_sync_post_meta' ) );
		$this->register_scripts();
		$this->register_shortcode();
		$this->setup_cpts();
	}

	function parse_shortcode( $attrs, $content = false ) {
		if ( empty( $attrs['id'] ) ) {
			return;
		}
		$product = get_post( $attrs['id'] );
		if ( ! $product || is_wp_error( $product ) ) {
			return;
		}
		if ( $product->post_type !== self::$post_type_product ) {
			return;
		}

		// We allow for overriding the presentation labels
		$data = shortcode_atts( array(
			'blog_id' => Jetpack_Options::get_option( 'id' ),
			'dom_id' => uniqid( 'jetpack-simple-payments-' . $product->ID . '_', true ),
			'class' => 'jetpack-simple-payments-' . $product->ID,
			'title' => get_the_title( $product ),
			'description' => $product->post_content,
			'cta' => get_post_meta( $product->ID, 'spay_cta', true ),
			'multiple' => get_post_meta( $product->ID, 'spay_multiple', true ) || '0'
		), $attrs );
		$data['price'] = $this->format_price(
			get_post_meta( $product->ID, 'spay_price', true ),
			get_post_meta( $product->ID, 'spay_currency', true ),
			$data
		);

		if ( ! wp_script_is( 'paypal-express-checkout','enqueued' ) ) {
			wp_enqueue_script( 'paypal-express-checkout' );
		}

		wp_add_inline_script( 'paypal-express-checkout', "try{PaypalExpressCheckout.renderButton( '{$data['blog_id']}', '{$attrs['id']}', '{$data['dom_id']}', '{$data['multiple']}' );}catch(e){}" );

		return $this->output_shortcode( $data );
	}

	function output_shortcode( $data ) {
		$items = '';
		if ( $data['multiple'] ) {
		       $items="<div class='jetpack-simple-payments-items'>
		       <input class='jetpack-simple-payments-items-number' type='number' min='1' value='1' id='{$data['dom_id']}_number'>
		       </div>";
		}
		$output = "
<div class='{$data[ 'class' ]} jetpack-simple-payments__wrapper'>
	<p class='jetpack-simple-payments__purchase-message'>
	</p>
	<div class='jetpack-simple-payments__title'>{$data['title']}</div>
	<div class='jetpack-simple-payments__description'>{$data['description']}</div>
	<div class='jetpack-simple-payments__price'>{$data['price']}</div>
	{$items}
	<div class='jetpack-simple-payments__button' id='{$data['dom_id']}_button'></div>
</div>
";
		return $output;
	}

	function format_price( $price, $currency, $all_data ) {
		// TODO: better price formatting logic. Extracting from woocmmerce is not a solution since its bound with woo site options.
		return "$price $currency";
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

	function allow_sync_post_meta( $post_meta ) {
		return array_merge( $post_meta, array(
			'spay_paypal_id',
			'spay_status',
			'spay_product_id',
			'spay_quantity',
			'spay_price',
			'spay_customer_email',
			'spay_currency',
			'spay_cta',
			'spay_email',
			'spay_multiple'
		) );
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
			'label'                 => esc_html__( 'Order', 'jetpack' ),
			'description'           => esc_html__( 'Simple Payments orders', 'jetpack' ),
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
			'label'                 => esc_html__( 'Product', 'jetpack' ),
			'description'           => esc_html__( 'Simple Payments products', 'jetpack' ),
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
