<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Simple Payments lets users embed a PayPal button fully integrated with wpcom to sell products on the site.
 * This is not a proper module yet, because not all the pieces are in place. Until everything is shipped, it can be turned
 * into module that can be enabled/disabled.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Paypal_Payments\Simple_Payments as PayPal_Simple_Payments;

/**
 * Jetpack_Simple_Payments
 */
class Jetpack_Simple_Payments {
	// These have to be under 20 chars because that is CPT limit.

	/**
	 * Post type order.
	 *
	 * @var string
	 */
	public static $post_type_order = 'jp_pay_order';

	/**
	 * Post type product.
	 *
	 * @var string
	 */
	public static $post_type_product = 'jp_pay_product';

	/**
	 * Define simple payment shortcode.
	 *
	 * @var string
	 */
	public static $shortcode = 'simple-payment';

	/**
	 * Define simple payment CSS prefix.
	 *
	 * @var string
	 */
	public static $css_classname_prefix = 'jetpack-simple-payments';

	/**
	 * Which plan the user is on.
	 *
	 * @var string value_bundle or jetpack_premium
	 */
	public static $required_plan;

	/**
	 * Instance of the class.
	 *
	 * @var Jetpack_Simple_Payments
	 */
	private static $instance;

	/**
	 * Construction function.
	 */
	private function __construct() {}

	/**
	 * Original singleton.
	 *
	 * @todo Remove this when nothing calles getInstance anymore.
	 */
	public static function getInstance() { // phpcs:ignore WordPress.NamingConventions.ValidFunctionName.MethodNameInvalid
		return self::get_instance();
	}

	/**
	 * Create instance of class.
	 */
	public static function get_instance() {
		if ( ! self::$instance ) {
			self::$instance = new self();
			self::$instance->init_hook_action();
			self::$required_plan = ( defined( 'IS_WPCOM' ) && IS_WPCOM ) ? 'value_bundle' : 'jetpack_premium';
		}
		return self::$instance;
	}

	/**
	 * Actions that are run on init.
	 */
	public function init_hook_action() {
		return PayPal_Simple_Payments::get_instance()->init_hook_action();
	}

	/**
	 * Enqueue the static assets needed in the frontend.
	 */
	public function enqueue_frontend_assets() {
		return PayPal_Simple_Payments::get_instance()->enqueue_frontend_assets();
	}

	/**
	 * Add an inline script for setting up the PayPal checkout button.
	 *
	 * @param int     $id Product ID.
	 * @param int     $dom_id ID of the DOM element with the purchase message.
	 * @param boolean $is_multiple Whether multiple items of the same product can be purchased.
	 */
	public function setup_paypal_checkout_button( $id, $dom_id, $is_multiple ) {
		return PayPal_Simple_Payments::get_instance()->setup_paypal_checkout_button( $id, $dom_id, $is_multiple );
	}

	/**
	 * Remove auto paragraph from product description.
	 *
	 * @param string $content - the content of the post.
	 */
	public function remove_auto_paragraph_from_product_description( $content ) {
		return PayPal_Simple_Payments::get_instance()->remove_auto_paragraph_from_product_description( $content );
	}

	/** Return the blog ID */
	public function get_blog_id() {
		return PayPal_Simple_Payments::get_instance()->get_blog_id();
	}

	/**
	 * Used to check whether Simple Payments are enabled for given site.
	 *
	 * @return bool True if Simple Payments are enabled, false otherwise.
	 */
	public function is_enabled_jetpack_simple_payments() {
		return PayPal_Simple_Payments::is_enabled_jetpack_simple_payments();
	}

	/**
	 * Creates the content from a shortcode
	 *
	 * @param array $attrs Shortcode attributes.
	 * @param mixed $content unused.
	 *
	 * @return string|void
	 */
	public function parse_shortcode( $attrs, $content = false ) {
		return PayPal_Simple_Payments::get_instance()->parse_shortcode( $attrs, $content );
	}

	/**
	 * Output an admin warning if user can't use Pay with PayPal.
	 *
	 * @param array $data unused.
	 */
	public function output_admin_warning( $data ) {
		return PayPal_Simple_Payments::get_instance()->output_admin_warning( $data );
	}

	/**
	 * Get the HTML output to use as PayPal purchase box.
	 *
	 * @param string  $dom_id ID of the DOM element with the purchase message.
	 * @param boolean $is_multiple Whether multiple items of the same product can be purchased.
	 *
	 * @return string
	 */
	public function output_purchase_box( $dom_id, $is_multiple ) {
		return PayPal_Simple_Payments::get_instance()->output_purchase_box( $dom_id, $is_multiple );
	}

	/**
	 * Get the HTML output to replace the `simple-payments` shortcode.
	 *
	 * @param array $data Product data.
	 * @return string
	 */
	public function output_shortcode( $data ) {
		return PayPal_Simple_Payments::get_instance()->output_shortcode( $data );
	}

	/**
	 * Allows custom post types to be used by REST API.
	 *
	 * @param array $post_types - the allows post types.
	 * @see hook 'rest_api_allowed_post_types'
	 * @return array
	 */
	public function allow_rest_api_types( $post_types ) {
		return PayPal_Simple_Payments::get_instance()->allow_rest_api_types( $post_types );
	}

	/**
	 * Merge $post_meta with additional meta information.
	 *
	 * @param array $post_meta - the post's meta information.
	 */
	public function allow_sync_post_meta( $post_meta ) {
		return PayPal_Simple_Payments::get_instance()->allow_sync_post_meta( $post_meta );
	}

	/**
	 * Enable Simple payments custom meta values for access through the REST API.
	 * Field's value will be exposed on a .meta key in the endpoint response,
	 * and WordPress will handle setting up the callbacks for reading and writing
	 * to that meta key.
	 *
	 * @link https://developer.wordpress.org/rest-api/extending-the-rest-api/modifying-responses/
	 */
	public function register_meta_fields_in_rest_api() {
		return PayPal_Simple_Payments::get_instance()->register_meta_fields_in_rest_api();
	}

	/**
	 * Sanitize three-character ISO-4217 Simple payments currency
	 *
	 * List has to be in sync with list at the block's client side and widget's backend side:
	 *
	 * @param array $currency - list of currencies.
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
		return PayPal_Simple_Payments::sanitize_currency( $currency );
	}

	/**
	 * Sanitize price:
	 *
	 * Positive integers and floats
	 * Supports two decimal places.
	 * Maximum length: 10.
	 *
	 * See `price` from PayPal docs:
	 *
	 * @link https://developer.paypal.com/docs/api/orders/v1/#definition-item
	 *
	 * @param string $price - the price we want to sanitize.
	 * @return null|string
	 */
	public static function sanitize_price( $price ) {
		return PayPal_Simple_Payments::sanitize_price( $price );
	}

	/**
	 * Sets up the custom post types for the module.
	 */
	public function setup_cpts() {
		return PayPal_Simple_Payments::get_instance()->setup_cpts();
	}

	/**
	 * Validate the block attributes
	 *
	 * @param array $attrs The block attributes, expected to contain:
	 *                      * email - an email address.
	 *                      * price - a float between 0.01 and 9999999999.99.
	 *                      * productId - the ID of the product being paid for.
	 *
	 * @return bool
	 */
	public function is_valid( $attrs ) {
		return PayPal_Simple_Payments::get_instance()->is_valid( $attrs );
	}
}

PayPal_Simple_Payments::get_instance();
