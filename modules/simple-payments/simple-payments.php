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

	static $required_plan;

	// Increase this number each time there's a change in CSS or JS to bust cache.
	static $version = '0.25';

	// Classic singleton pattern:
	private static $instance;
	private function __construct() {}
	static function getInstance() {
		if ( ! self::$instance ) {
			self::$instance = new self();
			self::$instance->register_init_hooks();
			self::$required_plan = ( defined( 'IS_WPCOM' ) && IS_WPCOM ) ? 'value_bundle' : 'jetpack_premium';
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

	private function register_init_hooks() {
		add_action( 'init', array( $this, 'init_hook_action' ) );
		add_action( 'jetpack_register_gutenberg_extensions', array( $this, 'register_gutenberg_block' ) );
		add_action( 'rest_api_init', array( $this, 'register_meta_fields_in_rest_api' ) );
	}

	private function register_shortcode() {
		add_shortcode( self::$shortcode, array( $this, 'parse_shortcode' ) );
	}

	public function init_hook_action() {
		add_filter( 'rest_api_allowed_post_types', array( $this, 'allow_rest_api_types' ) );
		add_filter( 'jetpack_sync_post_meta_whitelist', array( $this, 'allow_sync_post_meta' ) );
		if ( ! is_admin() ) {
			$this->register_scripts_and_styles();
		}
		$this->register_shortcode();
		$this->setup_cpts();

		add_filter( 'the_content', array( $this, 'remove_auto_paragraph_from_product_description' ), 0 );
	}

	function register_gutenberg_block() {
		if ( $this->is_enabled_jetpack_simple_payments() ) {
			jetpack_register_block( 'jetpack/simple-payments' );
		} else {
			Jetpack_Gutenberg::set_extension_unavailable(
				'jetpack/simple-payments',
				'missing_plan',
				array(
					'required_feature' => 'simple-payments',
					'required_plan'    => self::$required_plan,
				)
			);
		}
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
		if ( defined( 'IS_WPCOM' ) && IS_WPCOM && function_exists( 'has_any_blog_stickers' ) ) {
			$site_id = $this->get_blog_id();
			return has_any_blog_stickers( array( 'premium-plan', 'business-plan', 'ecommerce-plan' ), $site_id );
		}

		// For all Jetpack sites
		return Jetpack::is_active() && Jetpack_Plan::supports( 'simple-payments');
	}

	function parse_shortcode( $attrs, $content = false ) {
		if ( empty( $attrs['id'] ) ) {
			return;
		}
		$product = get_post( $attrs['id'] );
		if ( ! $product || is_wp_error( $product ) ) {
			return;
		}
		if ( $product->post_type !== self::$post_type_product || 'publish' !== $product->post_status ) {
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
			get_post_meta( $product->ID, 'spay_price', true ),
			get_post_meta( $product->ID, 'spay_currency', true )
		);

		$data['id'] = $attrs['id'];

		if( ! wp_style_is( 'jetpack-simple-payments', 'enqueued' ) ) {
			wp_enqueue_style( 'jetpack-simple-payments' );
		}

		if ( ! $this->is_enabled_jetpack_simple_payments() ) {
			if ( ! is_feed() ) {
				$this->output_admin_warning( $data );
			}
			return;
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

		jetpack_require_lib( 'components' );
		return Jetpack_Components::render_upgrade_nudge( array(
			'plan' => self::$required_plan
		) );
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
			esc_html( $data['title'] ),
			esc_attr( "${css_prefix}-description" ),
			wp_kses( $data['description'], wp_kses_allowed_html( 'post' ) ),
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

	/**
	 * Format a price with currency
	 *
	 * Uses currency-aware formatting to output a formatted price with a simple fallback.
	 *
	 * Largely inspired by WordPress.com's Store_Price::display_currency
	 *
	 * @param  string $price    Price.
	 * @param  string $currency Currency.
	 * @return string           Formatted price.
	 */
	private function format_price( $price, $currency ) {
		$currency_details = self::get_currency( $currency );

		if ( $currency_details ) {
			// Ensure USD displays as 1234.56 even in non-US locales.
			$amount = 'USD' === $currency
				? number_format( $price, $currency_details['decimal'], '.', ',' )
				: number_format_i18n( $price, $currency_details['decimal'] );

			return sprintf(
				$currency_details['format'],
				$currency_details['symbol'],
				$amount
			);
		}

		// Fall back to unspecified currency symbol like `¤1,234.05`.
		// @link https://en.wikipedia.org/wiki/Currency_sign_(typography).
		if ( ! $currency ) {
			return '¤' . number_format_i18n( $price, 2 );
		}

		return number_format_i18n( $price, 2 ) . ' ' . $currency;
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
			'sanitize_callback' => 'rest_sanitize_boolean',
			'show_in_rest'      => true,
			'single'            => true,
			'type'              => 'boolean',
		) );

		register_meta( 'post', 'spay_email', array(
			'description'       => esc_html__( 'Simple payments button; paypal email.', 'jetpack' ),
			'sanitize_callback' => 'sanitize_email',
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
	 * List has to be in sync with list at the block's client side and widget's backend side:
	 * @link https://github.com/Automattic/jetpack/blob/31efa189ad223c0eb7ad085ac0650a23facf9ef5/extensions/blocks/simple-payments/constants.js#L9-L39
	 * @link https://github.com/Automattic/jetpack/blob/31efa189ad223c0eb7ad085ac0650a23facf9ef5/modules/widgets/simple-payments.php#L19-L44
	 *
	 * Currencies should be supported by PayPal:
	 * @link https://developer.paypal.com/docs/api/reference/currency-codes/
	 *
	 * Indian Rupee (INR) not supported because at the time of the creation of this file
	 * because it's limited to in-country PayPal India accounts only.
	 * Discussion: https://github.com/Automattic/wp-calypso/pull/28236
	 */
	public static function sanitize_currency( $currency ) {
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

	/**
	 * Format a price for display
	 *
	 * Largely taken from WordPress.com Store_Price class
	 *
	 * The currency array will have the shape:
	 *   format  => string sprintf format with placeholders `%1$s`: Symbol `%2$s`: Price.
	 *   symbol  => string Symbol string
	 *   desc    => string Text description of currency
	 *   decimal => int    Number of decimal places
	 *
	 * @param  string $the_currency The desired currency, e.g. 'USD'.
	 * @return ?array               Currency object or null if not found.
	 */
	private static function get_currency( $the_currency ) {
		$currencies = array(
			'USD' => array(
				'format'  => '%1$s%2$s', // 1: Symbol 2: currency value
				'symbol'  => '$',
				'decimal' => 2,
			),
			'GBP' => array(
				'format'  => '%1$s%2$s', // 1: Symbol 2: currency value
				'symbol'  => '&#163;',
				'decimal' => 2,
			),
			'JPY' => array(
				'format'  => '%1$s%2$s', // 1: Symbol 2: currency value
				'symbol'  => '&#165;',
				'decimal' => 0,
			),
			'BRL' => array(
				'format'  => '%1$s%2$s', // 1: Symbol 2: currency value
				'symbol'  => 'R$',
				'decimal' => 2,
			),
			'EUR' => array(
				'format'  => '%1$s%2$s', // 1: Symbol 2: currency value
				'symbol'  => '&#8364;',
				'decimal' => 2,
			),
			'NZD' => array(
				'format'  => '%1$s%2$s', // 1: Symbol 2: currency value
				'symbol'  => 'NZ$',
				'decimal' => 2,
			),
			'AUD' => array(
				'format'  => '%1$s%2$s', // 1: Symbol 2: currency value
				'symbol'  => 'A$',
				'decimal' => 2,
			),
			'CAD' => array(
				'format'  => '%1$s%2$s', // 1: Symbol 2: currency value
				'symbol'  => 'C$',
				'decimal' => 2,
			),
			'ILS' => array(
				'format'  => '%2$s %1$s', // 1: Symbol 2: currency value
				'symbol'  => '₪',
				'decimal' => 2,
			),
			'RUB' => array(
				'format'  => '%2$s %1$s', // 1: Symbol 2: currency value
				'symbol'  => '₽',
				'decimal' => 2,
			),
			'MXN' => array(
				'format'  => '%1$s%2$s', // 1: Symbol 2: currency value
				'symbol'  => 'MX$',
				'decimal' => 2,
			),
			'MYR' => array(
				'format'  => '%2$s%1$s', // 1: Symbol 2: currency value
				'symbol'  => 'RM',
				'decimal' => 2,
			),
			'SEK' => array(
				'format'  => '%2$s %1$s', // 1: Symbol 2: currency value
				'symbol'  => 'Skr',
				'decimal' => 2,
			),
			'HUF' => array(
				'format'  => '%2$s %1$s', // 1: Symbol 2: currency value
				'symbol'  => 'Ft',
				'decimal' => 0, // Decimals are supported by Stripe but not by PayPal.
			),
			'CHF' => array(
				'format'  => '%2$s %1$s', // 1: Symbol 2: currency value
				'symbol'  => 'CHF',
				'decimal' => 2,
			),
			'CZK' => array(
				'format'  => '%2$s %1$s', // 1: Symbol 2: currency value
				'symbol'  => 'Kč',
				'decimal' => 2,
			),
			'DKK' => array(
				'format'  => '%2$s %1$s', // 1: Symbol 2: currency value
				'symbol'  => 'Dkr',
				'decimal' => 2,
			),
			'HKD' => array(
				'format'  => '%2$s %1$s', // 1: Symbol 2: currency value
				'symbol'  => 'HK$',
				'decimal' => 2,
			),
			'NOK' => array(
				'format'  => '%2$s %1$s', // 1: Symbol 2: currency value
				'symbol'  => 'Kr',
				'decimal' => 2,
			),
			'PHP' => array(
				'format'  => '%2$s %1$s', // 1: Symbol 2: currency value
				'symbol'  => '₱',
				'decimal' => 2,
			),
			'PLN' => array(
				'format'  => '%2$s %1$s', // 1: Symbol 2: currency value
				'symbol'  => 'PLN',
				'decimal' => 2,
			),
			'SGD' => array(
				'format'  => '%1$s%2$s', // 1: Symbol 2: currency value
				'symbol'  => 'S$',
				'decimal' => 2,
			),
			'TWD' => array(
				'format'  => '%1$s%2$s', // 1: Symbol 2: currency value
				'symbol'  => 'NT$',
				'decimal' => 0, // Decimals are supported by Stripe but not by PayPal.
			),
			'THB' => array(
				'format'  => '%2$s%1$s', // 1: Symbol 2: currency value
				'symbol'  => '฿',
				'decimal' => 2,
			),
		);

		if ( isset( $currencies[ $the_currency ] ) ) {
			return $currencies[ $the_currency ];
		}
		return null;
	}
}
Jetpack_Simple_Payments::getInstance();
