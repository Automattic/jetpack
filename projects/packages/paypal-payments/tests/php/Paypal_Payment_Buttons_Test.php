<?php
/**
 * Tests for the PayPal_Payment_Buttons class.
 *
 * @package automattic/jetpack-paypal-payments
 */

namespace Automattic\Jetpack\PaypalPayments;

use Automattic\Jetpack\Feature_Flags\Feature_Flags;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

/**
 * Class Paypal_Payment_Buttons_Test
 *
 * @coversDefaultClass Automattic\Jetpack\PaypalPayments\PayPal_Payment_Buttons
 * @covers \Automattic\Jetpack\PaypalPayments\PayPal_Payment_Buttons
 */
#[CoversClass( PayPal_Payment_Buttons::class )]
class Paypal_Payment_Buttons_Test extends TestCase {

	/**
	 * Clean up after each test.
	 */
	protected function tearDown(): void {
		parent::tearDown();
		// Clean up any registered scripts.
		global $wp_scripts;
		$wp_scripts = null;

		\WP_Block_Supports::$block_to_render = null;

		remove_all_filters( self::FLAG_FILTER );
		Feature_Flags::reset();
	}

	/**
	 * Per-flag filter that forces the API-managed buttons on.
	 */
	private const FLAG_FILTER = 'jetpack_feature_flag_enabled_' . PayPal_Payment_Buttons::API_MANAGED_BUTTONS_FLAG;

	/**
	 * Register the PayPal routes the way production does -- on rest_api_init --
	 * and return the resulting route table.
	 *
	 * @return array The REST server's route table.
	 */
	private function build_rest_routes() {
		global $wp_rest_server;
		$wp_rest_server = null;

		remove_all_actions( 'rest_api_init' );
		PayPal_Payment_Buttons::init_rest_api();

		$routes = rest_get_server()->get_routes();

		remove_all_actions( 'rest_api_init' );

		return $routes;
	}

	public function test_feature_flag_registers_off_by_default() {
		Feature_Flags::reset();

		PayPal_Payment_Buttons::register_feature_flags();

		$definition = Feature_Flags::get( PayPal_Payment_Buttons::API_MANAGED_BUTTONS_FLAG );
		$this->assertIsArray( $definition );
		$this->assertFalse( $definition['default'] );
		$this->assertFalse( PayPal_Payment_Buttons::is_api_managed_enabled() );
	}

	public function test_is_api_managed_enabled_honours_the_flag_filter() {
		PayPal_Payment_Buttons::register_feature_flags();
		add_filter( self::FLAG_FILTER, '__return_true' );

		$this->assertTrue( PayPal_Payment_Buttons::is_api_managed_enabled() );
	}

	public function test_add_editor_feature_flags_reports_the_flag_state() {
		PayPal_Payment_Buttons::register_feature_flags();

		$flags = PayPal_Payment_Buttons::add_editor_feature_flags( array( 'other-flag' => true ) );
		$this->assertSame(
			array(
				'other-flag' => true,
				PayPal_Payment_Buttons::API_MANAGED_BUTTONS_FLAG => false,
			),
			$flags
		);

		add_filter( self::FLAG_FILTER, '__return_true' );

		$flags = PayPal_Payment_Buttons::add_editor_feature_flags( array() );
		$this->assertTrue( $flags[ PayPal_Payment_Buttons::API_MANAGED_BUTTONS_FLAG ] );
	}

	public function test_register_rest_routes_registers_nothing_while_the_flag_is_off() {
		PayPal_Payment_Buttons::register_feature_flags();

		$routes = $this->build_rest_routes();

		$this->assertArrayNotHasKey( '/wpcom/v2/paypal/connection', $routes );
		$this->assertArrayNotHasKey( '/wpcom/v2/paypal/buttons', $routes );
	}

	public function test_register_rest_routes_registers_the_routes_while_the_flag_is_on() {
		PayPal_Payment_Buttons::register_feature_flags();
		add_filter( self::FLAG_FILTER, '__return_true' );

		$routes = $this->build_rest_routes();

		$this->assertArrayHasKey( '/wpcom/v2/paypal/connection', $routes );
		$this->assertArrayHasKey( '/wpcom/v2/paypal/buttons', $routes );
	}

	/**
	 * Gutenberg omits attributes matching the default, so buttons saved as stacked carry
	 * no buttonType -- the default must stay 'stacked' or they re-render as single.
	 */
	public function test_a_legacy_stacked_button_still_renders_the_sdk_widget() {
		register_block_type_from_metadata(
			dirname( __DIR__, 2 ) . '/src/paypal-payment-buttons',
			array( 'render_callback' => array( PayPal_Payment_Buttons::class, 'render_block' ) )
		);

		$html = do_blocks( '<!-- wp:jetpack/paypal-payment-buttons {"scriptSrc":"https://www.paypal.com/sdk/js?client-id=TEST&components=hosted-buttons","hostedButtonId":"ABC123XYZ"} /-->' );

		unregister_block_type( 'jetpack/paypal-payment-buttons' );

		$this->assertStringContainsString( 'paypal-container-ABC123XYZ', $html );
		$this->assertStringNotContainsString( '/ncp/payment/', $html );
	}

	/**
	 * A `file:` asset field here makes core register the editor bundle a second time,
	 * on top of the copy load_editor_scripts() already enqueues.
	 */
	public function test_block_json_declares_no_asset_fields() {
		$metadata = json_decode(
			file_get_contents( dirname( __DIR__, 2 ) . '/src/paypal-payment-buttons/block.json' ),
			true
		);

		$this->assertArrayNotHasKey( 'editorScript', $metadata );
		$this->assertArrayNotHasKey( 'editorStyle', $metadata );
		$this->assertArrayNotHasKey( 'style', $metadata );
	}

	public function test_register_block_style_registers_the_front_end_handle() {
		wp_deregister_script( PayPal_Payment_Buttons::STYLE_HANDLE );

		PayPal_Payment_Buttons::register_block_style();

		$this->assertTrue( wp_script_is( PayPal_Payment_Buttons::STYLE_HANDLE, 'registered' ) );

		wp_deregister_script( PayPal_Payment_Buttons::STYLE_HANDLE );
	}

	public function test_init_admin_registers_nothing_while_the_flag_is_off() {
		remove_all_actions( 'init' );
		remove_all_actions( 'admin_menu' );
		remove_all_actions( 'wp_ajax_' . PayPal_Email_Sender::AJAX_ACTION );

		PayPal_Payment_Buttons::register_feature_flags();

		PayPal_Payment_Buttons::init_admin();
		do_action( 'init' );

		// Covers the outcome, not the guard: both maybe_init() methods gate on the flag
		// themselves, so this still passes if init_admin()'s own check is removed. The
		// guard's only other effect -- keeping both classes off the autoloader -- is
		// process-global, so no in-process assertion can pin it.
		$this->assertFalse( has_action( 'admin_menu', array( PayPal_Admin_Page::class, 'register_menu' ) ) );
		$this->assertFalse( has_action( 'wp_ajax_' . PayPal_Email_Sender::AJAX_ACTION, array( PayPal_Email_Sender::class, 'handle_send' ) ) );

		remove_all_actions( 'init' );
	}

	public function test_init_admin_wires_the_admin_page_up_once_the_flag_is_on() {
		remove_all_actions( 'init' );
		remove_all_actions( 'admin_menu' );
		remove_all_actions( 'wp_ajax_' . PayPal_Email_Sender::AJAX_ACTION );

		PayPal_Payment_Buttons::register_feature_flags();
		add_filter( self::FLAG_FILTER, '__return_true' );

		PayPal_Payment_Buttons::init_admin();
		do_action( 'init' );

		$this->assertNotFalse( has_action( 'admin_menu', array( PayPal_Admin_Page::class, 'register_menu' ) ) );
		$this->assertNotFalse( has_action( 'wp_ajax_' . PayPal_Email_Sender::AJAX_ACTION, array( PayPal_Email_Sender::class, 'handle_send' ) ) );

		remove_all_actions( 'init' );
		remove_all_actions( 'admin_menu' );
		remove_all_actions( 'wp_ajax_' . PayPal_Email_Sender::AJAX_ACTION );
	}

	/**
	 * Put WP into a block-render context.
	 *
	 * The render callback calls get_block_wrapper_attributes(), which reads
	 * WP_Block_Supports::$block_to_render. WordPress sets that while rendering a
	 * block; calling the render callback directly leaves it null, which older
	 * WordPress releases warn about instead of bailing out.
	 *
	 * @param array $attributes The block attributes being rendered.
	 */
	private function set_up_block_render_context( array $attributes ) {
		\WP_Block_Supports::$block_to_render = array(
			'blockName' => 'jetpack/paypal-payment-buttons',
			'attrs'     => $attributes,
		);
	}

	/**
	 * Test that valid PayPal URLs pass through unchanged.
	 *
	 * @dataProvider valid_paypal_urls_provider
	 *
	 * @param string $url The URL to test.
	 */
	#[DataProvider( 'valid_paypal_urls_provider' )]
	public function test_valid_paypal_urls_pass_through( $url ) {
		$result = PayPal_Payment_Buttons::sanitize_paypal_script_url( $url );

		$this->assertNotFalse( $result, "URL should not return false: $url" );

		// Parse both URLs to compare hosts
		$original_parsed = wp_parse_url( $url );
		$result_parsed   = wp_parse_url( $result );

		$this->assertEquals( $original_parsed['host'], $result_parsed['host'], "Host should remain unchanged for valid PayPal URL: $url" );
	}

	/**
	 * Data provider for valid PayPal URLs.
	 *
	 * @return array
	 */
	public static function valid_paypal_urls_provider() {
		return array(
			'paypal.com'                              => array( 'https://www.paypal.com/sdk/js' ),
			'paypal.com subdomain'                    => array( 'https://www.paypal.com/sdk/js?client-id=test' ),
			'paypal.com subdomain with escaped query' => array( 'https://www.paypal.com/sdk/js?client-id=test&amp;currency=USD' ),
			'sandbox.paypal.com'                      => array( 'https://www.sandbox.paypal.com/sdk/js' ),
			'sandbox.paypal.com with query'           => array( 'https://www.sandbox.paypal.com/sdk/js?client-id=test&currency=USD' ),
			'www.paypal.com'                          => array( 'https://www.paypal.com/webapps/xoplatform' ),
			'www.sandbox.paypal.com'                  => array( 'https://www.sandbox.paypal.com/webapps/xoplatform' ),
		);
	}

	/**
	 * Test that invalid URLs are rejected and return false.
	 *
	 * @dataProvider invalid_urls_provider
	 *
	 * @param string $url The URL to test.
	 */
	#[DataProvider( 'invalid_urls_provider' )]
	public function test_invalid_urls_are_rejected( $url ) {
		$result = PayPal_Payment_Buttons::sanitize_paypal_script_url( $url );
		$this->assertFalse( $result, "URL should return false: $url" );
	}

	/**
	 * Data provider for invalid URLs.
	 *
	 * @return array
	 */
	public static function invalid_urls_provider() {
		return array(
			'empty string'              => array( '' ),
			'attacker domain'           => array( 'https://attacker.example/x.js' ),
			'attacker with paypal name' => array( 'https://paypal.com.evil.com/script.js' ),
			'subdomain injection'       => array( 'https://evilpaypal.com/script.js' ),
			'javascript protocol'       => array( 'javascript:alert(1)' ),
			'data protocol'             => array( 'data:text/html,<script>alert(1)</script>' ),
			'no host'                   => array( '/script.js' ),
			'malformed url'             => array( 'not-a-url' ),
			'paypal typo domain'        => array( 'https://paypai.com/script.js' ),
			'different TLD'             => array( 'https://paypal.co/script.js' ),
		);
	}

	/**
	 * Test that paths are preserved when sanitizing URLs.
	 */
	public function test_paths_are_preserved() {
		// Valid PayPal URL with path
		$valid_url = 'https://www.paypal.com/sdk/js/some/deep/path.js';
		$result    = PayPal_Payment_Buttons::sanitize_paypal_script_url( $valid_url );

		$result_parsed = wp_parse_url( $result );
		$this->assertEquals( '/sdk/js/some/deep/path.js', $result_parsed['path'] );
	}

	/**
	 * Test that query parameters are preserved when sanitizing URLs.
	 */
	public function test_query_parameters_are_preserved() {
		// Valid PayPal URL with query params
		$valid_url = 'https://www.paypal.com/sdk/js?client-id=test&currency=USD&locale=en_US&amp;foo=bar';
		$result    = PayPal_Payment_Buttons::sanitize_paypal_script_url( $valid_url );

		$result_parsed = wp_parse_url( $result );
		$this->assertEquals( 'client-id=test&currency=USD&locale=en_US&foo=bar', $result_parsed['query'] );
	}

	/**
	 * Test that fragments are stripped when sanitizing URLs.
	 * PayPal SDK URLs don't use fragments, so they are not preserved.
	 */
	public function test_fragments_are_stripped() {
		// Valid PayPal URL with fragment
		$valid_url = 'https://www.paypal.com/sdk/js#section';
		$result    = PayPal_Payment_Buttons::sanitize_paypal_script_url( $valid_url );

		$result_parsed = wp_parse_url( $result );
		$this->assertArrayNotHasKey( 'fragment', $result_parsed );
	}

	/**
	 * Test that all URL components work together.
	 */
	public function test_all_url_components_together() {
		// Valid PayPal URL with all components (fragment and port are stripped)
		$valid_url = 'https://www.paypal.com:443/sdk/js?client-id=test&currency=USD&amp;foo=bar#init';
		$result    = PayPal_Payment_Buttons::sanitize_paypal_script_url( $valid_url );

		$result_parsed = wp_parse_url( $result );
		$this->assertEquals( 'www.paypal.com', $result_parsed['host'] );
		$this->assertEquals( 'https', $result_parsed['scheme'] );
		$this->assertEquals( '/sdk/js', $result_parsed['path'] );
		$this->assertEquals( 'client-id=test&currency=USD&foo=bar', $result_parsed['query'] );
		$this->assertArrayNotHasKey( 'fragment', $result_parsed, 'Fragment should be stripped' );
	}

	/**
	 * Test that HTTP scheme is upgraded to HTTPS.
	 */
	public function test_http_is_upgraded_to_https() {
		// Valid PayPal URL with http should be upgraded to https
		$http_url = 'http://www.paypal.com/sdk/js';
		$result   = PayPal_Payment_Buttons::sanitize_paypal_script_url( $http_url );

		$result_parsed = wp_parse_url( $result );
		$this->assertEquals( 'https', $result_parsed['scheme'], 'HTTP should be upgraded to HTTPS' );
	}

	/**
	 * Test that the XSS attack from the security report is mitigated.
	 */
	public function test_xss_attack_is_mitigated() {
		$malicious_url = 'https://attacker.example/malicious.js';
		$result        = PayPal_Payment_Buttons::sanitize_paypal_script_url( $malicious_url );

		$this->assertFalse( $result, 'Malicious URL should be rejected' );
	}

	/**
	 * Test that trailing dots in hostnames are normalized.
	 * FQDNs can technically end with a dot (DNS root), so www.paypal.com. should be treated as www.paypal.com
	 */
	public function test_trailing_dot_is_normalized() {
		// Test with trailing dot
		$url_with_dot = 'https://www.paypal.com./sdk/js';
		$result       = PayPal_Payment_Buttons::sanitize_paypal_script_url( $url_with_dot );

		$this->assertNotFalse( $result, 'URL with trailing dot should be accepted' );

		$result_parsed = wp_parse_url( $result );
		$this->assertEquals( 'www.paypal.com', $result_parsed['host'], 'Trailing dot should be stripped' );

		// Test sandbox with trailing dot
		$sandbox_with_dot = 'https://sandbox.paypal.com./sdk/js';
		$result           = PayPal_Payment_Buttons::sanitize_paypal_script_url( $sandbox_with_dot );

		$this->assertNotFalse( $result, 'Sandbox URL with trailing dot should be accepted' );

		$result_parsed = wp_parse_url( $result );
		$this->assertEquals( 'sandbox.paypal.com', $result_parsed['host'], 'Trailing dot should be stripped from sandbox' );
	}

	/**
	 * Test that render_block uses CSS selector with # prefix for stacked buttons.
	 *
	 * This test ensures that the render() call uses a proper CSS ID selector (with #)
	 * rather than just the container ID. The PayPal SDK expects a CSS selector.
	 *
	 * @see https://github.com/Automattic/jetpack/pull/46259
	 */
	public function test_render_block_uses_css_selector_with_hash_prefix() {
		$attributes = array(
			'buttonType'     => 'stacked',
			'scriptSrc'      => 'https://www.paypal.com/sdk/js?client-id=test',
			'hostedButtonId' => 'TESTBUTTONID123',
		);

		// Call render_block
		$result = PayPal_Payment_Buttons::render_block( $attributes, '' );

		// Verify the container div is created
		$this->assertStringContainsString(
			'id="paypal-container-TESTBUTTONID123"',
			$result,
			'Container div should have the correct ID'
		);

		// Get the inline script that was added
		global $wp_scripts;
		$inline_script = $wp_scripts->get_data( 'paypal-payment-buttons-block-head', 'after' );

		$this->assertNotEmpty( $inline_script, 'Inline script should be registered' );

		// The inline script is an array, join it to search
		$script_content = implode( '', $inline_script );

		// Verify the render call uses CSS selector with # prefix
		$this->assertStringContainsString(
			'.render("#paypal-container-TESTBUTTONID123")',
			$script_content,
			'The render() call must use a CSS ID selector with # prefix'
		);

		// Verify it does NOT use the container ID without #
		$this->assertStringNotContainsString(
			'.render("paypal-container-TESTBUTTONID123")',
			$script_content,
			'The render() call must NOT use container ID without # prefix'
		);
	}

	/**
	 * Test that init_rest_api() hooks the REST routes.
	 *
	 * The Jetpack plugin calls this instead of init_api(); if it stops registering
	 * the routes, every request the block editor makes returns 404.
	 */
	public function test_init_rest_api_registers_the_routes() {
		remove_all_actions( 'rest_api_init' );

		PayPal_Payment_Buttons::init_rest_api();

		$this->assertNotFalse(
			has_action( 'rest_api_init', array( PayPal_Payment_Buttons::class, 'register_rest_routes' ) )
		);

		remove_all_actions( 'rest_api_init' );
	}

	/**
	 * The editor bundle imports isWpcomPlatformSite from @automattic/jetpack-script-data,
	 * which only exists in the real jetpack-script-data.js. Script_Data registers that file
	 * on wp_loaded; anything that claims the handle on init wins, and the editor is left with
	 * a module missing the export.
	 */
	public function test_init_api_leaves_the_script_data_handle_alone() {
		remove_all_actions( 'init' );
		remove_all_actions( 'rest_api_init' );
		wp_deregister_script( 'jetpack-script-data' );

		PayPal_Payment_Buttons::init_api();
		do_action( 'init' );

		$this->assertFalse( wp_script_is( 'jetpack-script-data', 'registered' ) );
		$this->assertNotFalse( has_action( 'rest_api_init', array( PayPal_Payment_Buttons::class, 'register_rest_routes' ) ) );

		remove_all_actions( 'init' );
		remove_all_actions( 'rest_api_init' );
	}

	/**
	 * Test that render_block includes product image when imageUrl is set.
	 */
	public function test_render_block_includes_product_image() {
		$attributes = array(
			'isApiManaged' => true,
			'resourceId'   => 'PLB-IMG123',
			'paymentLink'  => 'https://www.paypal.com/ncp/payment/PLB-IMG123',
			'productName'  => 'Widget',
			'price'        => '10.00',
			'currencyCode' => 'USD',
			'imageUrl'     => 'https://example.com/widget.jpg',
		);

		$this->set_up_block_render_context( $attributes );

		$result = PayPal_Payment_Buttons::render_block( $attributes, '' );

		$this->assertStringContainsString( 'jetpack-paypal-button__product-image', $result );
		$this->assertStringContainsString( 'https://example.com/widget.jpg', $result );
		$this->assertStringContainsString( 'alt="Widget"', $result );
	}

	/**
	 * Test that render_block omits product image when imageUrl is not set.
	 */
	public function test_render_block_omits_product_image_when_not_set() {
		$attributes = array(
			'isApiManaged' => true,
			'resourceId'   => 'PLB-NOIMG',
			'paymentLink'  => 'https://www.paypal.com/ncp/payment/PLB-NOIMG',
			'productName'  => 'Widget',
			'price'        => '10.00',
			'currencyCode' => 'USD',
		);

		$this->set_up_block_render_context( $attributes );

		$result = PayPal_Payment_Buttons::render_block( $attributes, '' );

		$this->assertStringNotContainsString( 'jetpack-paypal-button__product-image', $result );
	}

	/**
	 * Test that the checkout button uses the buttonText attribute, with no wordmark.
	 */
	public function test_render_block_labels_the_button_with_button_text() {
		$attributes = array(
			'isApiManaged' => true,
			'resourceId'   => 'PLB-LABEL1',
			'paymentLink'  => 'https://www.paypal.com/ncp/payment/PLB-LABEL1',
			'productName'  => 'Widget',
			'price'        => '10.00',
			'currencyCode' => 'USD',
			'buttonText'   => 'Checkout',
		);

		$this->set_up_block_render_context( $attributes );

		$result = PayPal_Payment_Buttons::render_block( $attributes, '' );

		$this->assertStringContainsString(
			'<span class="jetpack-paypal-button__button-text">Checkout</span>',
			$result
		);
		$this->assertStringNotContainsString( 'jetpack-paypal-button__logo', $result );
		$this->assertStringContainsString(
			'<p class="jetpack-paypal-button__attribution">Powered by PayPal</p>',
			$result
		);
	}

	/**
	 * Test that a block with no buttonText falls back to the default label.
	 */
	public function test_render_block_falls_back_to_default_text_with_no_button_text() {
		$attributes = array(
			'isApiManaged' => true,
			'resourceId'   => 'PLB-LABEL2',
			'paymentLink'  => 'https://www.paypal.com/ncp/payment/PLB-LABEL2',
			'productName'  => 'Widget',
			'price'        => '10.00',
			'currencyCode' => 'USD',
		);

		$this->set_up_block_render_context( $attributes );

		$result = PayPal_Payment_Buttons::render_block( $attributes, '' );

		$this->assertStringContainsString(
			'<span class="jetpack-paypal-button__button-text">Buy Now</span>',
			$result
		);
	}

	/**
	 * Test that a whitespace-only buttonText falls back to the default label.
	 */
	public function test_render_block_falls_back_to_default_text_with_whitespace_button_text() {
		$attributes = array(
			'isApiManaged' => true,
			'resourceId'   => 'PLB-LABEL3',
			'paymentLink'  => 'https://www.paypal.com/ncp/payment/PLB-LABEL3',
			'productName'  => 'Widget',
			'price'        => '10.00',
			'currencyCode' => 'USD',
			'buttonText'   => '   ',
		);

		$this->set_up_block_render_context( $attributes );

		$result = PayPal_Payment_Buttons::render_block( $attributes, '' );

		$this->assertStringContainsString(
			'<span class="jetpack-paypal-button__button-text">Buy Now</span>',
			$result
		);
	}

	/**
	 * Test that a price of 0 renders, since PayPal accepts one.
	 */
	public function test_render_block_shows_a_price_of_zero() {
		$attributes = array(
			'isApiManaged'    => true,
			'resourceId'      => 'PLB-ZERO2',
			'paymentLink'     => 'https://www.paypal.com/ncp/payment/PLB-ZERO2',
			'productName'     => 'Widget',
			'price'           => '0',
			'currencyCode'    => 'USD',
			'variantsEnabled' => true,
			'variants'        => array(
				'dimensions' => array(
					array(
						'name'    => 'Size',
						'primary' => true,
						'options' => array(
							array(
								'label'       => 'Free',
								'unit_amount' => array(
									'currency_code' => 'USD',
									'value'         => '0',
								),
							),
						),
					),
				),
			),
		);

		$this->set_up_block_render_context( $attributes );

		$result = PayPal_Payment_Buttons::render_block( $attributes, '' );

		$this->assertStringContainsString(
			'<span class="jetpack-paypal-button__variant-price">$0</span>',
			$result
		);
	}

	/**
	 * Test that a product price of 0 renders when no option is priced.
	 */
	public function test_render_block_shows_a_product_price_of_zero() {
		$attributes = array(
			'isApiManaged' => true,
			'resourceId'   => 'PLB-ZERO3',
			'paymentLink'  => 'https://www.paypal.com/ncp/payment/PLB-ZERO3',
			'productName'  => 'Widget',
			'price'        => '0',
			'currencyCode' => 'USD',
		);

		$this->set_up_block_render_context( $attributes );

		$result = PayPal_Payment_Buttons::render_block( $attributes, '' );

		$this->assertStringContainsString(
			'<span class="jetpack-paypal-button__product-price">$0</span>',
			$result
		);
	}

	/**
	 * Test that a group named 0 and an option labeled 0 both render.
	 */
	public function test_render_block_keeps_a_variant_named_zero() {
		$attributes = array(
			'isApiManaged'    => true,
			'resourceId'      => 'PLB-ZERO1',
			'paymentLink'     => 'https://www.paypal.com/ncp/payment/PLB-ZERO1',
			'productName'     => 'Widget',
			'price'           => '10.00',
			'currencyCode'    => 'USD',
			'variantsEnabled' => true,
			'variants'        => array(
				'dimensions' => array(
					array(
						'name'    => 'Size',
						'primary' => true,
						'options' => array( array( 'label' => '0' ) ),
					),
					array(
						'name'    => '0',
						'options' => array( array( 'label' => 'Red' ) ),
					),
				),
			),
		);

		$this->set_up_block_render_context( $attributes );

		$result = PayPal_Payment_Buttons::render_block( $attributes, '' );

		$this->assertStringContainsString(
			'<span class="jetpack-paypal-button__variant-name">Size:</span>',
			$result
		);
		$this->assertStringContainsString(
			'<span class="jetpack-paypal-button__variant-name">0:</span>',
			$result
		);
		$this->assertStringContainsString(
			'<span class="jetpack-paypal-button__variant-option">0</span>',
			$result
		);
	}

	// --- QR code ---

	/**
	 * Test that render_block puts the same link on the standalone QR canvas.
	 */
	public function test_render_block_standalone_qr_canvas_carries_payment_link() {
		$attributes = array(
			'isApiManaged' => true,
			'resourceId'   => 'PLB-QR456',
			'paymentLink'  => 'https://www.paypal.com/ncp/payment/PLB-QR456',
			'productName'  => 'Widget',
			'price'        => '10.00',
			'currencyCode' => 'USD',
			'format'       => 'QR',
		);

		$this->set_up_block_render_context( $attributes );

		$result = PayPal_Payment_Buttons::render_block( $attributes, '' );

		$this->assertStringContainsString(
			'data-qr-url="https://www.paypal.com/ncp/payment/PLB-QR456?at_code=' . PayPal_Payment_Buttons::PAYPAL_PARTNER_ATTRIBUTION_ID . '"',
			$result,
			'The standalone QR canvas should carry the payment link with the attribution code'
		);

		$this->assertLessThan(
			strpos( $result, 'jetpack-paypal-button__qr-caption' ),
			strpos( $result, 'jetpack-paypal-button__qr-canvas' ),
			'The caption should read below the QR code, not above it'
		);
	}

	/**
	 * Test that a QR block that never touched the control still captions the code.
	 */
	public function test_render_block_qr_caption_defaults_on() {
		$attributes = array(
			'isApiManaged' => true,
			'resourceId'   => 'PLB-QRCAP',
			'paymentLink'  => 'https://www.paypal.com/ncp/payment/PLB-QRCAP',
			'productName'  => 'Premium Widget',
			'format'       => 'QR',
		);

		$this->set_up_block_render_context( $attributes );

		$result = PayPal_Payment_Buttons::render_block( $attributes, '' );

		$this->assertStringContainsString(
			'<p class="jetpack-paypal-button__qr-caption">Buy Now</p>',
			$result,
			'An unset caption should fall back to the default label, not the product name'
		);
	}

	/**
	 * Test that Show text under QR code, when off, removes the caption.
	 */
	public function test_render_block_qr_caption_can_be_switched_off() {
		$attributes = array(
			'isApiManaged'  => true,
			'resourceId'    => 'PLB-QRNOCAP',
			'paymentLink'   => 'https://www.paypal.com/ncp/payment/PLB-QRNOCAP',
			'productName'   => 'Premium Widget',
			'format'        => 'QR',
			'qrShowCaption' => false,
			'qrCaption'     => 'Scan to pay',
		);

		$this->set_up_block_render_context( $attributes );

		$result = PayPal_Payment_Buttons::render_block( $attributes, '' );

		$this->assertStringNotContainsString( 'jetpack-paypal-button__qr-caption', $result );
		$this->assertStringNotContainsString( 'Scan to pay', $result );
		$this->assertStringContainsString( 'jetpack-paypal-button__qr-canvas', $result );
	}

	/**
	 * Test that Width, Border and caption settings reach the published markup.
	 */
	public function test_render_block_qr_applies_width_border_and_caption_styles() {
		$attributes = array(
			'isApiManaged'     => true,
			'resourceId'       => 'PLB-QRSTYLE',
			'paymentLink'      => 'https://www.paypal.com/ncp/payment/PLB-QRSTYLE',
			'format'           => 'QR',
			'qrCaption'        => 'Scan to pay',
			'blockWidth'       => '50%',
			'style'            => array(
				'spacing' => array( 'margin' => array( 'top' => '12px', 'bottom' => '12px' ) ),
				'border'  => array( 'radius' => '8px', 'width' => '2px', 'color' => '#ff0000' ),
			),
			'captionColor'     => '#0000ff',
			'captionFontSize'  => 20,
		);

		$this->set_up_block_render_context( $attributes );

		$result = PayPal_Payment_Buttons::render_block( $attributes, '' );

		$this->assertStringContainsString( 'max-width:50%', $result );
		$this->assertStringContainsString( 'margin-top:12px', $result );
		$this->assertStringContainsString( 'margin-bottom:12px', $result );
		$this->assertStringContainsString( 'border-radius:8px', $result );
		$this->assertStringContainsString( 'border-width:2px', $result );
		$this->assertStringContainsString( 'border-color:#ff0000', $result );
		// The caption's own styles belong on the caption, not the block.
		$this->assertStringContainsString(
			'<p class="jetpack-paypal-button__qr-caption" style="color:#0000ff;font-size:20px;">',
			$result
		);
	}

	/**
	 * Test that a theme palette color reaches the style attribute.
	 */
	public function test_render_block_accepts_a_theme_palette_color() {
		$attributes = array(
			'isApiManaged'      => true,
			'resourceId'        => 'PLB-QRPALETTE',
			'paymentLink'       => 'https://www.paypal.com/ncp/payment/PLB-QRPALETTE',
			'format'            => 'QR',
			'style'            => array(
				'border' => array( 'width' => '2px', 'color' => 'var:preset|color|primary' ),
			),
		);

		$this->set_up_block_render_context( $attributes );

		$result = PayPal_Payment_Buttons::render_block( $attributes, '' );

		// The style engine expands the preset reference the editor stored.
		$this->assertStringContainsString( 'border-color:var(--wp--preset--color--primary)', $result );
	}

	/**
	 * Test that Width and Border settings reach a published BUTTON block too.
	 */
	public function test_render_block_button_applies_width_and_border_styles() {
		$attributes = array(
			'isApiManaged'      => true,
			'resourceId'        => 'PLB-BTNSTYLE',
			'paymentLink'       => 'https://www.paypal.com/ncp/payment/PLB-BTNSTYLE',
			'productName'       => 'Premium Widget',
			'price'             => '29.99',
			'format'            => 'BUTTON',
			'blockWidth'       => '75%',
			'style'            => array( 'border' => array( 'radius' => '6px' ) ),
		);

		$this->set_up_block_render_context( $attributes );

		$result = PayPal_Payment_Buttons::render_block( $attributes, '' );

		// On .jetpack-paypal-button, the element style.scss caps at 400px — not
		// the outer block wrapper, where it would not override that cap.
		$this->assertStringContainsString(
			'max-width:75%;border-radius:6px;',
			$result
		);
	}

	/**
	 * Test that a whitespace-only caption falls back to the default.
	 */
	public function test_render_block_qr_caption_whitespace_falls_back() {
		$attributes = array(
			'isApiManaged' => true,
			'resourceId'   => 'PLB-QRWS',
			'paymentLink'  => 'https://www.paypal.com/ncp/payment/PLB-QRWS',
			'format'       => 'QR',
			'qrCaption'    => '   ',
		);

		$this->set_up_block_render_context( $attributes );

		$result = PayPal_Payment_Buttons::render_block( $attributes, '' );

		$this->assertStringContainsString(
			'<p class="jetpack-paypal-button__qr-caption">Buy Now</p>',
			$result
		);
	}

	/**
	 * Test that a color the picker cannot produce never reaches the style attribute.
	 */
	public function test_render_block_rejects_an_unparseable_color() {
		$attributes = array(
			'isApiManaged'  => true,
			'resourceId'    => 'PLB-QRBADCOL',
			'paymentLink'   => 'https://www.paypal.com/ncp/payment/PLB-QRBADCOL',
			'format'        => 'QR',
			'style'         => array(
				'border' => array( 'width' => '2px', 'color' => 'red; background:url(evil)' ),
			),
			'captionColor'  => 'javascript:alert(1)',
			'qrShowCaption' => true,
		);

		$this->set_up_block_render_context( $attributes );

		$result = PayPal_Payment_Buttons::render_block( $attributes, '' );

		$this->assertStringNotContainsString( 'evil', $result );
		$this->assertStringNotContainsString( 'javascript:', $result );
		$this->assertStringNotContainsString( 'background:url', $result );
	}

	/**
	 * Test that the BUTTON format draws no QR code — EMBED AS picks one output.
	 */
	public function test_render_block_button_format_draws_no_qr_code() {
		$attributes = array(
			'isApiManaged' => true,
			'resourceId'   => 'PLB-QR789',
			'paymentLink'  => 'https://www.paypal.com/ncp/payment/PLB-QR789',
			'productName'  => 'Widget',
			'price'        => '10.00',
			'currencyCode' => 'USD',
			'format'       => 'BUTTON',
		);

		$this->set_up_block_render_context( $attributes );

		$result = PayPal_Payment_Buttons::render_block( $attributes, '' );

		$this->assertStringNotContainsString( 'jetpack-paypal-button__qr-canvas', $result );
		$this->assertStringNotContainsString( 'jetpack-paypal-button__qr-toggle', $result );
	}

	// --- Partner attribution ---

	/**
	 * Test that add_partner_attribution appends the BN code.
	 */
	public function test_add_partner_attribution_appends_the_bn_code() {
		$result = PayPal_Payment_Buttons::add_partner_attribution( 'https://www.paypal.com/ncp/payment/ABC123' );

		$this->assertStringContainsString(
			'at_code=' . PayPal_Payment_Buttons::PAYPAL_PARTNER_ATTRIBUTION_ID,
			$result
		);
	}

	/**
	 * Test that add_partner_attribution replaces an existing BN code rather than duplicating it.
	 */
	public function test_add_partner_attribution_replaces_an_existing_code() {
		$result = PayPal_Payment_Buttons::add_partner_attribution(
			'https://www.paypal.com/ncp/payment/ABC123?at_code=Stale&foo=bar'
		);

		$this->assertStringNotContainsString( 'Stale', $result );
		$this->assertStringContainsString( 'foo=bar', $result );
		$this->assertSame( 1, substr_count( $result, 'at_code=' ) );
	}

	/**
	 * Test that add_partner_attribution leaves a non-PayPal URL alone.
	 */
	public function test_add_partner_attribution_ignores_non_paypal_urls() {
		$this->assertSame(
			'https://evil.example.com/pay',
			PayPal_Payment_Buttons::add_partner_attribution( 'https://evil.example.com/pay' )
		);
	}

	// --- Per-option pricing display ---

	/**
	 * Test that the cheapest option price is shown when there is no product price.
	 */
	public function test_render_block_shows_from_price_for_priced_variants() {
		$attributes = array(
			'isApiManaged'    => true,
			'resourceId'      => 'PLB-VAR1',
			'paymentLink'     => 'https://www.paypal.com/ncp/payment/PLB-VAR1',
			'productName'     => 'Widget',
			'price'           => '',
			'currencyCode'    => 'USD',
			'variantsEnabled' => true,
			'variants'        => array(
				'dimensions' => array(
					array(
						'name'    => 'Size',
						'primary' => true,
						'options' => array(
							array(
								'label'       => 'Large',
								'unit_amount' => array(
									'currency_code' => 'USD',
									'value'         => '20.00',
								),
							),
							array(
								'label'       => 'Small',
								'unit_amount' => array(
									'currency_code' => 'USD',
									'value'         => '10.00',
								),
							),
						),
					),
				),
			),
		);

		$this->set_up_block_render_context( $attributes );

		$result = PayPal_Payment_Buttons::render_block( $attributes, '' );

		$this->assertStringContainsString( 'From $10.00', $result );
	}

	/**
	 * Test that no price is shown when neither the product nor its options are priced.
	 */
	public function test_render_block_omits_price_when_nothing_is_priced() {
		$attributes = array(
			'isApiManaged'    => true,
			'resourceId'      => 'PLB-VAR2',
			'paymentLink'     => 'https://www.paypal.com/ncp/payment/PLB-VAR2',
			'productName'     => 'Widget',
			'price'           => '',
			'currencyCode'    => 'USD',
			'variantsEnabled' => true,
			'variants'        => array(
				'dimensions' => array(
					array(
						'name'    => 'Size',
						'primary' => true,
						'options' => array( array( 'label' => 'Small' ) ),
					),
				),
			),
		);

		$this->set_up_block_render_context( $attributes );

		$result = PayPal_Payment_Buttons::render_block( $attributes, '' );

		$this->assertStringNotContainsString( 'jetpack-paypal-button__product-price', $result );
	}

	/**
	 * Test that render_block shows the option price instead of a stale product price.
	 */
	public function test_render_block_ignores_stale_price_when_options_are_priced() {
		$attributes = array(
			'isApiManaged'    => true,
			'resourceId'      => 'PLB-VAR3',
			'paymentLink'     => 'https://www.paypal.com/ncp/payment/PLB-VAR3',
			'productName'     => 'Widget',
			'price'           => '9.99',
			'currencyCode'    => 'USD',
			'variantsEnabled' => true,
			'variants'        => array(
				'dimensions' => array(
					array(
						'name'    => 'Size',
						'primary' => true,
						'options' => array(
							array(
								'label'       => 'Small',
								'unit_amount' => array(
									'currency_code' => 'USD',
									'value'         => '12.50',
								),
							),
						),
					),
				),
			),
		);

		$this->set_up_block_render_context( $attributes );

		$result = PayPal_Payment_Buttons::render_block( $attributes, '' );

		$this->assertStringContainsString( 'jetpack-paypal-button__product-price">From $12.50</span>', $result );
	}

	/**
	 * Test that render_block keeps an option's price badge when it matches the stale product price.
	 */
	public function test_render_block_keeps_option_badge_matching_stale_price() {
		$attributes = array(
			'isApiManaged'    => true,
			'resourceId'      => 'PLB-VAR4',
			'paymentLink'     => 'https://www.paypal.com/ncp/payment/PLB-VAR4',
			'productName'     => 'Widget',
			'price'           => '12.50',
			'currencyCode'    => 'USD',
			'variantsEnabled' => true,
			'variants'        => array(
				'dimensions' => array(
					array(
						'name'    => 'Size',
						'primary' => true,
						'options' => array(
							array(
								'label'       => 'Small',
								'unit_amount' => array(
									'currency_code' => 'USD',
									'value'         => '12.50',
								),
							),
							array(
								'label'       => 'Large',
								'unit_amount' => array(
									'currency_code' => 'USD',
									'value'         => '20.00',
								),
							),
						),
					),
				),
			),
		);

		$this->set_up_block_render_context( $attributes );

		$result = PayPal_Payment_Buttons::render_block( $attributes, '' );

		$this->assertStringContainsString( 'jetpack-paypal-button__variant-price">$12.50</span>', $result );
		$this->assertStringContainsString( 'jetpack-paypal-button__variant-price">$20.00</span>', $result );
	}

	/**
	 * Test that the product price is still shown when no option is priced.
	 *
	 * Options can exist without prices, so the product price stays until one of
	 * them is priced.
	 */
	public function test_render_block_keeps_product_price_when_no_option_is_priced() {
		$attributes = array(
			'isApiManaged'    => true,
			'resourceId'      => 'PLB-VAR5',
			'paymentLink'     => 'https://www.paypal.com/ncp/payment/PLB-VAR5',
			'productName'     => 'Widget',
			'price'           => '9.99',
			'currencyCode'    => 'USD',
			'variantsEnabled' => true,
			'variants'        => array(
				'dimensions' => array(
					array(
						'name'    => 'Size',
						'primary' => true,
						'options' => array(
							array( 'label' => 'Small' ),
							array( 'label' => 'Large' ),
						),
					),
				),
			),
		);

		$this->set_up_block_render_context( $attributes );

		$result = PayPal_Payment_Buttons::render_block( $attributes, '' );

		$this->assertStringContainsString( 'jetpack-paypal-button__product-price">$9.99</span>', $result );
	}

	/**
	 * Test that a price left on a non-primary option never becomes the headline.
	 *
	 * PayPal only prices the primary group, so the $5.00 here is not a price a
	 * buyer can pay.
	 */
	public function test_render_block_ignores_prices_on_non_primary_options() {
		$attributes = array(
			'isApiManaged'    => true,
			'resourceId'      => 'PLB-VAR7',
			'paymentLink'     => 'https://www.paypal.com/ncp/payment/PLB-VAR7',
			'productName'     => 'Widget',
			'price'           => '',
			'currencyCode'    => 'USD',
			'variantsEnabled' => true,
			'variants'        => array(
				'dimensions' => array(
					array(
						'name'    => 'Size',
						'primary' => true,
						'options' => array(
							array(
								'label'       => 'Small',
								'unit_amount' => array(
									'currency_code' => 'USD',
									'value'         => '12.50',
								),
							),
						),
					),
					array(
						'name'    => 'Color',
						'primary' => false,
						'options' => array(
							array(
								'label'       => 'Red',
								'unit_amount' => array(
									'currency_code' => 'USD',
									'value'         => '5.00',
								),
							),
						),
					),
				),
			),
		);

		$this->set_up_block_render_context( $attributes );

		$result = PayPal_Payment_Buttons::render_block( $attributes, '' );

		$this->assertStringContainsString( 'jetpack-paypal-button__product-price">From $12.50</span>', $result );
		$this->assertStringNotContainsString( 'From $5.00', $result );
	}

	/**
	 * Test that render_block keeps the product price when the options are off.
	 *
	 * Whether the options have prices is a separate question from whether they
	 * are switched on, so the renderer asks both. PayPal still uses the product
	 * price here.
	 */
	public function test_render_block_keeps_product_price_when_variants_are_disabled() {
		$attributes = array(
			'isApiManaged'    => true,
			'resourceId'      => 'PLB-VAR6',
			'paymentLink'     => 'https://www.paypal.com/ncp/payment/PLB-VAR6',
			'productName'     => 'Widget',
			'price'           => '9.99',
			'currencyCode'    => 'USD',
			'variantsEnabled' => false,
			'variants'        => array(
				'dimensions' => array(
					array(
						'name'    => 'Size',
						'primary' => true,
						'options' => array(
							array(
								'label'       => 'Small',
								'unit_amount' => array(
									'currency_code' => 'USD',
									'value'         => '12.50',
								),
							),
						),
					),
				),
			),
		);

		$this->set_up_block_render_context( $attributes );

		$result = PayPal_Payment_Buttons::render_block( $attributes, '' );

		$this->assertStringContainsString( 'jetpack-paypal-button__product-price">$9.99</span>', $result );
	}
}
