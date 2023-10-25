<?php
/**
 * Adds WooCommerce phpunit dependencies once, before all tests of the class
 * using this trait are run.
 */
trait WooCommerceTestTrait {
	/**
	 * Is Woo Enabled
	 *
	 * @var bool
	 */
	protected static $woo_enabled = false;

	/**
	 * @beforeClass
	 **/
	public static function set_up_woo_before_class() {
		if ( '1' !== getenv( 'JETPACK_TEST_WOOCOMMERCE' ) ) {
			return;
		}

		self::$woo_enabled = true;

		$woo_tests_dir = JETPACK_WOOCOMMERCE_INSTALL_DIR . '/tests';

		if ( ! file_exists( $woo_tests_dir ) ) {
			error_log( 'PLEASE RUN THE GIT VERSION OF WooCommerce that has the tests folder. Found at github.com/WooCommerce/woocommerce' );
			self::$woo_enabled = false;
		}

		// This is taken from WooCommerce's bootstrap.php file

		// framework
		require_once $woo_tests_dir . '/legacy/framework/class-wc-unit-test-factory.php';
		require_once $woo_tests_dir . '/legacy/framework/class-wc-mock-session-handler.php';
		require_once $woo_tests_dir . '/legacy/framework/class-wc-mock-wc-data.php';
		require_once $woo_tests_dir . '/legacy/framework/class-wc-mock-wc-object-query.php';
		require_once $woo_tests_dir . '/legacy/framework/class-wc-mock-payment-gateway.php';
		require_once $woo_tests_dir . '/legacy/framework/class-wc-mock-enhanced-payment-gateway.php';
		require_once $woo_tests_dir . '/legacy/framework/class-wc-payment-token-stub.php';
		// commenting this out for now. require_once( $woo_tests_dir . '/framework/vendor/class-wp-test-spy-rest-server.php' );

		// test cases
		require_once $woo_tests_dir . '/legacy/includes/wp-http-testcase.php';
		require_once $woo_tests_dir . '/legacy/framework/class-wc-unit-test-case.php';
		require_once $woo_tests_dir . '/legacy/framework/class-wc-api-unit-test-case.php';
		require_once $woo_tests_dir . '/legacy/framework/class-wc-rest-unit-test-case.php';

		// Helpers
		require_once $woo_tests_dir . '/legacy/framework/helpers/class-wc-helper-product.php';
		require_once $woo_tests_dir . '/legacy/framework/helpers/class-wc-helper-coupon.php';
		require_once $woo_tests_dir . '/legacy/framework/helpers/class-wc-helper-fee.php';
		require_once $woo_tests_dir . '/legacy/framework/helpers/class-wc-helper-shipping.php';
		require_once $woo_tests_dir . '/legacy/framework/helpers/class-wc-helper-customer.php';
		require_once $woo_tests_dir . '/legacy/framework/helpers/class-wc-helper-order.php';
		require_once $woo_tests_dir . '/legacy/framework/helpers/class-wc-helper-shipping-zones.php';
		require_once $woo_tests_dir . '/legacy/framework/helpers/class-wc-helper-payment-token.php';
		require_once $woo_tests_dir . '/legacy/framework/helpers/class-wc-helper-settings.php';
		require_once $woo_tests_dir . '/legacy/framework/helpers/class-wc-helper-reports.php';
		require_once $woo_tests_dir . '/legacy/framework/helpers/class-wc-helper-admin-notes.php';
		require_once $woo_tests_dir . '/legacy/framework/helpers/class-wc-test-action-queue.php';
		require_once $woo_tests_dir . '/legacy/framework/helpers/class-wc-helper-queue.php';

		// Traits.
		require_once $woo_tests_dir . '/legacy/framework/traits/trait-wc-rest-api-complex-meta.php';
		require_once $woo_tests_dir . '/php/helpers/HPOSToggleTrait.php';

		// Action Scheduler.
		$as_file = dirname( $woo_tests_dir ) . '/packages/action-scheduler/action-scheduler.php';
		require_once dirname( $woo_tests_dir ) . '/packages/action-scheduler/classes/abstracts/ActionScheduler.php';
		ActionScheduler::init( $as_file );
	}
}
