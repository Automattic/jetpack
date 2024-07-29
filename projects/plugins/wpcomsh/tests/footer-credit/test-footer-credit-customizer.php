<?php
/**
 * Footer Credit Customizer Test file.
 *
 * @package wpcomsh
 */

use Brain\Monkey;
use Brain\Monkey\Functions;

/**
 * Class FooterCreditCustomizerTest.
 */
class FooterCreditCustomizerTest extends WP_UnitTestCase {

	/**
	 * Tear down.
	 */
	public function tear_down() {
		Monkey\tearDown();
		parent::tear_down();
	}

	/**
	 * Checks that the Footer Credit customizer settings and controls are not registered
	 * for child block themes without causing a fatal error.
	 *
	 * @see p1721946083481019-slack-C02FMH4G8
	 */
	public function test_wpcomsh_footer_credit_customizer_child_block_theme() {
		Functions\expect( 'wp_is_block_theme' )->once();

		include __DIR__ . '/../../footer-credit/footer-credit/customizer.php';
	}
}
