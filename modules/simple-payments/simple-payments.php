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
		}
		return self::$instance;
	}

	private function register_scripts_and_styles() {
		/**
		 * Paypal heavily discourages putting that script in your own server:
		 * @see https://developer.paypal.com/docs/integration/direct/express-checkout/integration-jsv4/add-paypal-button/
		 */
		wp_register_script( 'paypal-checkout-js', 'https://www.paypalobjects.com/api/checkout.js', array(), null, true );
		wp_register_script( 'paypal-express-checkout', plugins_url( '/paypal-express-checkout.js', __FILE__ ),
			array( 'jquery', 'paypal-checkout-js' ), self::$version );
		wp_register_style( 'jetpack-simple-payments', plugins_url( '/simple-payments.css', __FILE__ ), array( 'dashicons' ) );
	}

	private function register_init_hook() {
		add_action( 'init', array( $this, 'init_hook_action' ) );
		add_action( 'rest_api_init', array( $this, 'register_meta_fields_in_rest_api' ) );
	}

	private function register_shortcode() {
		add_shortcode( self::$shortcode, array( $this, 'parse_shortcode' ) );
	}

	public function init_hook_action() {
		add_filter( 'rest_api_allowed_post_types', array( $this, 'allow_rest_api_types' ) );
		add_filter( 'jetpack_sync_post_meta_whitelist', array( $this, 'allow_sync_post_meta' ) );
		$this->register_scripts_and_styles();
		$this->register_shortcode();
		$this->setup_cpts();

		add_filter( 'the_content', array( $this, 'remove_auto_paragraph_from_product_description' ), 0 );
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

	/**
	 * Used to check whether Simple Payments are enabled for given site.
	 *
	 * @return bool True if Simple Payments are enabled, false otherwise.
	 */
	function is_enabled_jetpack_simple_payments() {
		/**
		 * Can be used by plugin authors to disable the conflicting output of Simple Payments.
		 *
		 * @since 6.3.0
		 *
		 * @param bool True if Simple Payments should be disabled, false otherwise.
		 */
		if ( apply_filters( 'jetpack_disable_simple_payments', false ) ) {
			return false;
		}

		// For WPCOM sites
		if ( defined( 'IS_WPCOM' ) && IS_WPCOM && function_exists( 'has_blog_sticker' ) ) {
			$site_id = $this->get_blog_id();
			return has_blog_sticker( 'premium-plan', $site_id ) || has_blog_sticker( 'business-plan', $site_id );
		}

		// For all Jetpack sites
		return Jetpack::is_active() && Jetpack::active_plan_supports( 'simple-payments');
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

		if( ! wp_style_is( 'jetpack-simple-payments', 'enqueue' ) ) {
			wp_enqueue_style( 'jetpack-simple-payments' );
		}

		if ( ! $this->is_enabled_jetpack_simple_payments() ) {
			return $this->output_admin_warning( $data );
		}

		if ( ! wp_script_is( 'paypal-express-checkout', 'enqueued' ) ) {
			wp_enqueue_script( 'paypal-express-checkout' );
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

	function output_admin_warning( $data ) {
		if ( ! current_user_can( 'manage_options' ) ) {
			return;
		}
		$css_prefix = self::$css_classname_prefix;

		$support_url = ( defined( 'IS_WPCOM' ) && IS_WPCOM )
			? 'https://support.wordpress.com/simple-payments/'
			: 'https://jetpack.com/support/simple-payment-button/';

		return sprintf( '
<div class="%1$s">
	<div class="%2$s">
		<div class="%3$s">
			<div class="%4$s" id="%5$s">
				<p>%6$s</p>
				<p>%7$s</p>
			</div>
		</div>
	</div>
</div>
',
			esc_attr( "{$data['class']} ${css_prefix}-wrapper" ),
			esc_attr( "${css_prefix}-product" ),
			esc_attr( "${css_prefix}-details" ),
			esc_attr( "${css_prefix}-purchase-message show error" ),
			esc_attr( "{$data['dom_id']}-message-container" ),
			sprintf(
				wp_kses(
					__( 'Your plan doesn\'t include Simple Payments. <a href="%s" rel="noopener noreferrer" target="_blank">Learn more and upgrade</a>.', 'jetpack' ),
					array( 'a' => array( 'href' => array(), 'rel' => array(), 'target' => array() ) )
				),
				esc_url( $support_url )
			),
			esc_html__( '(Only administrators will see this message.)', 'jetpack' )
		);
	}

	function output_shortcode( $data ) {
		$items = '';
		$css_prefix = self::$css_classname_prefix;

		if ( $data['multiple'] ) {
			$items = sprintf( '
				<div class="%1$s">
					<input class="%2$s" type="number" value="1" min="1" id="%3$s" />
				</div>
				',
				esc_attr( "${css_prefix}-items" ),
				esc_attr( "${css_prefix}-items-number" ),
				esc_attr( "{$data['dom_id']}_number" )
			);
		}
		$image = "";
		if( has_post_thumbnail( $data['id'] ) ) {
			$image = sprintf( '<div class="%1$s"><div class="%2$s">%3$s</div></div>',
				esc_attr( "${css_prefix}-product-image" ),
				esc_attr( "${css_prefix}-image" ),
				get_the_post_thumbnail( $data['id'], 'full' )
			);
		}
		return sprintf( '
<div class="%1$s">
	<div class="%2$s">
		%3$s
		<div class="%4$s">
			<div class="%5$s"><p>%6$s</p></div>
			<div class="%7$s"><p>%8$s</p></div>
			<div class="%9$s"><p>%10$s</p></div>
			<div class="%11$s" id="%12$s"></div>
			<div class="%13$s">
				%14$s
				<div class="%15$s" id="%16$s"></div>
			</div>
		</div>
	</div>
</div>
',
			esc_attr( "{$data['class']} ${css_prefix}-wrapper" ),
			esc_attr( "${css_prefix}-product" ),
			$image,
			esc_attr( "${css_prefix}-details" ),
			esc_attr( "${css_prefix}-title" ),
			$data['title'],
			esc_attr( "${css_prefix}-description" ),
			$data['description'],
			esc_attr( "${css_prefix}-price" ),
			esc_html( $data['price'] ),
			esc_attr( "${css_prefix}-purchase-message" ),
			esc_attr( "{$data['dom_id']}-message-container" ),
			esc_attr( "${css_prefix}-purchase-box" ),
			$items,
			esc_attr( "${css_prefix}-button" ),
			esc_attr( "{$data['dom_id']}_button" )
		);
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
	 * Enable Simple payments custom meta values for access through the REST API.
	 * Field’s value will be exposed on a .meta key in the endpoint response,
	 * and WordPress will handle setting up the callbacks for reading and writing
	 * to that meta key.
	 *
	 * @link https://developer.wordpress.org/rest-api/extending-the-rest-api/modifying-responses/
	 */
	public function register_meta_fields_in_rest_api() {
		register_meta( 'post', 'spay_price', array(
			'description'       => esc_html__( 'Simple payments; price.', 'jetpack' ),
			'object_subtype'    => self::$post_type_product,
			'sanitize_callback' => array( $this, 'sanitize_price' ),
			'show_in_rest'      => true,
			'single'            => true,
			'type'              => 'number',
		) );

		register_meta( 'post', 'spay_currency', array(
			'description'       => esc_html__( 'Simple payments; currency code.', 'jetpack' ),
			'object_subtype'    => self::$post_type_product,
			'sanitize_callback' => array( $this, 'sanitize_currency' ),
			'show_in_rest'      => true,
			'single'            => true,
			'type'              => 'string',
		) );

		register_meta( 'post', 'spay_cta', array(
			'description'       => esc_html__( 'Simple payments; text with "Buy" or other CTA', 'jetpack' ),
			'object_subtype'    => self::$post_type_product,
			'sanitize_callback' => 'sanitize_text_field',
			'show_in_rest'      => true,
			'single'            => true,
			'type'              => 'string',
		) );

		register_meta( 'post', 'spay_multiple', array(
			'description'       => esc_html__( 'Simple payments; allow multiple items', 'jetpack' ),
			'object_subtype'    => self::$post_type_product,
			'sanitize_callback' => 'absint',
			'show_in_rest'      => true,
			'single'            => true,
			'type'              => 'integer',
		) );

		register_meta( 'post', 'spay_email', array(
			'description'       => esc_html__( 'Simple payments button; paypal email.', 'jetpack' ),
			'sanitize_callback' => 'sanitize_email',
			'show_in_rest'      => true,
			'single'            => true,
			'type'              => 'string',
		) );

		register_meta( 'post', 'spay_formatted_price', array(
			'description'       => esc_html__( 'Simple payments; formatted price.', 'jetpack' ),
			'object_subtype'    => self::$post_type_product,
			'sanitize_callback' => 'sanitize_text_field',
			'show_in_rest'      => true,
			'single'            => true,
			'type'              => 'string',
		) );

		register_meta( 'post', 'spay_status', array(
			'description'       => esc_html__( 'Simple payments; status.', 'jetpack' ),
			'object_subtype'    => self::$post_type_product,
			'sanitize_callback' => 'sanitize_text_field',
			'show_in_rest'      => true,
			'single'            => true,
			'type'              => 'string',
		) );
	}

	/**
	 * Sanitize three-character ISO-4217 Simple payments currency
	 *
	 * @link https://developer.paypal.com/docs/integration/direct/rest/currency-codes/
	 *
	 * List has to be in sync with list at the client side:
	 * @link https://github.com/Automattic/wp-calypso/blob/6d02ffe73cc073dea7270a22dc30881bff17d8fb/client/lib/simple-payments/constants.js
	 */
	public function sanitize_currency( $currency ) {
		$valid_currencies = array(
			'USD',
			'EUR',
			'AUD',
			'BRL',
			'CAD',
			'CZK',
			'DKK',
			'HKD',
			'HUF',
			'ILS',
			'JPY',
			'MYR',
			'MXN',
			'TWD',
			'NZD',
			'NOK',
			'PHP',
			'PLN',
			'GBP',
			'RUB',
			'SGD',
			'SEK',
			'CHF',
			'THB',
		);

		return in_array( $currency, $valid_currencies ) ? $currency : false;
	}

	/**
	 * Sanitize price:
	 *
	 * Positive integers and floats
	 * Supports two decimal places.
	 * Maximum length: 10.
	 *
	 * See `price` from PayPal docs:
	 * @link https://developer.paypal.com/docs/api/orders/v1/#definition-item
	 *
	 * @param      $value
	 * @return null|string
	 */
	public static function sanitize_price( $price ) {
		return preg_match( '/^[0-9]{0,10}(\.[0-9]{0,2})?$/', $price ) ? $price : false;
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
			'label'                 => esc_html_x( 'Order', 'noun: a quantity of goods or items purchased or sold', 'jetpack' ),
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
			'edit_posts'            => 'publish_posts',
			'edit_others_posts'     => 'edit_others_posts',
			'publish_posts'         => 'publish_posts',
			'read_private_posts'    => 'read_private_posts',
		);
		$product_args = array(
			'label'                 => esc_html__( 'Product', 'jetpack' ),
			'description'           => esc_html__( 'Simple Payments products', 'jetpack' ),
			'supports'              => array( 'title', 'editor','thumbnail', 'custom-fields', 'author' ),
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
