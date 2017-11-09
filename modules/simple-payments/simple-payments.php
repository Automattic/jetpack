<?php
/*
 * Simple Payments lets users embed a PayPal button fully integrated with wpcom to sell products on the site.
 * This is not a proper module yet, because not all the pieces are in place. Until everything is shipped, it can be turned
 * into module that can be enabled/disabled.
*/
class Jetpack_Simple_Payments {
	// These have to be under 20 chars because that is CPT limit.
	static $post_type_order = 'jp_pay_order';
	static $post_type_product = 'jp_pay_product';

	static $shortcode = 'simple-payment';

	static $css_classname_prefix = 'jetpack-simple-payments';

	// Increase this number each time there's a change in CSS or JS to bust cache.
	static $version = '0.25';

	// Classic singleton pattern:
	private static $instance;

	private function __construct() {}

	static function getInstance() {
		if ( ! self::$instance ) {
			self::$instance = new self();
			self::$instance->register_init_hook();
			self::$instance->register_gutenberg_block();
		}
		return self::$instance;
	}

	private function register_scripts() {
		/**
		 * Paypal heavily discourages putting that script in your own server:
		 * @see https://developer.paypal.com/docs/integration/direct/express-checkout/integration-jsv4/add-paypal-button/
		 */
		wp_register_script( 'paypal-checkout-js', 'https://www.paypalobjects.com/api/checkout.js', array(), null, true );
		wp_register_script( 'paypal-express-checkout', plugins_url( '/paypal-express-checkout.js', __FILE__ ),
			array( 'jquery', 'paypal-checkout-js' ), self::$version );
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
		$this->setup_meta_fields_for_rest();

		add_filter( 'the_content', array( $this, 'remove_auto_paragraph_from_product_description' ), 0 );
	}

	private function register_gutenberg_block() {
		add_action( 'enqueue_block_editor_assets', array( $this, 'enqueue_block_editor_assets' ) );
		add_action( 'enqueue_block_assets', array( $this, 'enqueue_block_assets' ) );

		register_block_type( 'jetpack/simple-payments-button', array(
			'render_callback' => array( $this, 'render_gutenberg_block' ),
		) );
	}

	public function enqueue_block_editor_assets() {
		wp_enqueue_script(
			'gutenberg-simple-payments-button',
			plugins_url( 'simple-payments-block.js', __FILE__ ),
			array( 'wp-blocks', 'wp-element' )
		);
	}

	public function enqueue_block_assets() {
		if ( is_admin() ) {
			// Load the styles just in admin area and rely on custom PayPal
			// styles on front end
			wp_enqueue_style(
				'gutenberg-simple-payments-button-styles',
				plugins_url( 'simple-payments-block.css', __FILE__ ),
				array(),
				JETPACK__VERSION
			);
		}
	}

	/**
	 * This function is mostly similar on existing output_shortcode(),
	 * with some elements like product title and description removed,
	 * since we don't want to include these as part of the block.
	 *
	 * @param array $attributes Array of Gutenberg block attributes
	 *
	 * @return string HTML to be rendered on front end
	 */
	public function render_gutenberg_block( $attributes ) {
		$data = array();
		// mock product ID for now since we don't have CPT support in Gutenberg yet
		$data['id'] = 111;
		$data['multiple'] = $attributes['multiple'];
		$data['dom_id'] = uniqid( self::$css_classname_prefix . '-' . $data['id'] . '_', true );
		$data['class'] = self::$css_classname_prefix . '-' . $data['id'];
		$data['price'] = $attributes['price'];
		$data['blog_id'] = $this->get_blog_id();
		$data['currency'] = $attributes['currency'];

		$currency_symbols = array(
			'US' => '$',
			'EU' => '€',
			'CA' => '$',
		);

		if ( ! wp_script_is( 'paypal-express-checkout', 'enqueued' ) ) {
			wp_enqueue_script( 'paypal-express-checkout' );
		}
		if ( ! wp_style_is( 'simple-payments', 'enqueued' ) ) {
			wp_enqueue_style( 'simple-payments', plugins_url( 'simple-payments.css', __FILE__ ), array( 'dashicons' ) );
		}

		wp_add_inline_script( 'paypal-express-checkout', sprintf(
			"try{PaypalExpressCheckout.renderButton( '%d', '%d', '%s', '%d' );}catch(e){}",
			esc_js( $data['blog_id'] ),
			esc_js( $data['id'] ),
			esc_js( $data['dom_id'] ),
			esc_js( $data['multiple'] )
		) );

		$css_prefix = self::$css_classname_prefix;
		$display_price = $currency_symbols[ $data['currency'] ] . $data['price'];

		if ( $data['multiple'] ) {
			$items = "
				<div class='${css_prefix}-items'>
					<input class='${css_prefix}-items-number' type='number' value='1' min='1' id='{$data['dom_id']}_number' />
				</div>
				";
		}

		return "
			<div class='{$data['class']} ${css_prefix}-wrapper'>
				<div class='${css_prefix}-product'>
					<div class='${css_prefix}-details'>
						<div class='${css_prefix}-price'><p>{$display_price}</p></div>
						<div class='${css_prefix}-purchase-message' id='{$data['dom_id']}-message-container'></div>
						<div class='${css_prefix}-purchase-box'>
							{$items}
							<div class='${css_prefix}-button' id='{$data['dom_id']}_button'></div>
						</div>
					</div>
				</div>
			</div>
		";
	}

	function remove_auto_paragraph_from_product_description( $content ) {
		if ( get_post_type() === self::$post_type_product ) {
			remove_filter( 'the_content', 'wpautop' );
		}

		return $content;
	}

	function get_blog_id() {
		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			return get_current_blog_id();
		}

		return Jetpack_Options::get_option( 'id' );
	}

	function parse_shortcode( $attrs, $content = false ) {
		if ( empty( $attrs['id'] ) ) {
			return;
		}
		$product = get_post( $attrs['id'] );
		if ( ! $product || is_wp_error( $product ) ) {
			return;
		}
		if ( $product->post_type !== self::$post_type_product || 'trash' === $product->post_status ) {
			return;
		}

		// We allow for overriding the presentation labels
		$data = shortcode_atts( array(
			'blog_id'     => $this->get_blog_id(),
			'dom_id'      => uniqid( self::$css_classname_prefix . '-' . $product->ID . '_', true ),
			'class'       => self::$css_classname_prefix . '-' . $product->ID,
			'title'       => get_the_title( $product ),
			'description' => $product->post_content,
			'cta'         => get_post_meta( $product->ID, 'spay_cta', true ),
			'multiple'    => get_post_meta( $product->ID, 'spay_multiple', true ) || '0'
		), $attrs );

		$data['price'] = $this->format_price(
			get_post_meta( $product->ID, 'spay_formatted_price', true ),
			get_post_meta( $product->ID, 'spay_price', true ),
			get_post_meta( $product->ID, 'spay_currency', true ),
			$data
		);

		$data['id'] = $attrs['id'];
		if ( ! wp_script_is( 'paypal-express-checkout', 'enqueued' ) ) {
			wp_enqueue_script( 'paypal-express-checkout' );
		}
		if ( ! wp_style_is( 'simple-payments', 'enqueued' ) ) {
			wp_enqueue_style( 'simple-payments', plugins_url( 'simple-payments.css', __FILE__ ), array( 'dashicons' ) );
		}

		wp_add_inline_script( 'paypal-express-checkout', sprintf(
			"try{PaypalExpressCheckout.renderButton( '%d', '%d', '%s', '%d' );}catch(e){}",
			esc_js( $data['blog_id'] ),
			esc_js( $attrs['id'] ),
			esc_js( $data['dom_id'] ),
			esc_js( $data['multiple'] )
		) );

		return $this->output_shortcode( $data );
	}

	function output_shortcode( $data ) {
		$items = '';
		$css_prefix = self::$css_classname_prefix;

		if ( $data['multiple'] ) {
			$items="<div class='${css_prefix}-items'>
				<input class='${css_prefix}-items-number' type='number' value='1' min='1' id='{$data['dom_id']}_number' />
			</div>";
		}
		$image = "";
		if( has_post_thumbnail( $data['id'] ) ) {
			$image = "<div class='${css_prefix}-product-image'><div class='${css_prefix}-image'>" . get_the_post_thumbnail( $data['id'], 'full' ) . "</div></div>";
		}
		return "
<div class='{$data['class']} ${css_prefix}-wrapper'>
	<div class='${css_prefix}-product'>
		{$image}
		<div class='${css_prefix}-details'>
			<div class='${css_prefix}-title'><p>{$data['title']}</p></div>
			<div class='${css_prefix}-description'><p>{$data['description']}</p></div>
			<div class='${css_prefix}-price'><p>{$data['price']}</p></div>
			<div class='${css_prefix}-purchase-message' id='{$data['dom_id']}-message-container'></div>
			<div class='${css_prefix}-purchase-box'>
				{$items}
				<div class='${css_prefix}-button' id='{$data['dom_id']}_button'></div>
			</div>
		</div>
	</div>
</div>
		";
	}

	function format_price( $formatted_price, $price, $currency, $all_data ) {
		if ( $formatted_price ) {
			return $formatted_price;
		}
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
			'spay_multiple',
			'spay_formatted_price',
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
		 * spay_formatted_price
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

	public function update_post_meta_for_api( $meta_arr, $object ) {
		//get the id of the post object array
		$post_id = $object->ID;

		foreach( $meta_arr as $meta_key => $meta_val ) {
			update_post_meta( $post_id, $meta_key, $meta_val );
		}

		return true;
	}

	function setup_meta_fields_for_rest() {
		$args = array(
		   'update_callback' => array( $this, 'update_post_meta_for_api'),
		);

		register_rest_field( self::$post_type_product, 'meta', $args );
	}

}
Jetpack_Simple_Payments::getInstance();
