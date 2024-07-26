<?php
/**
 * Footer Credit Customizer Test file.
 *
 * @package wpcomsh
 */

/**
 * Class FooterCreditCustomizerTest.
 */
class FooterCreditCustomizerTest extends WP_UnitTestCase {
	public function set_up() {
		switch_theme( 'block-theme-child' );
		parent::set_up();
	}

	/**
	 * Checks that the Footer Credit customizer settings and controls are not registered
	 * for child block themes without causing a fatal error.
	 *
	 * @see p1721946083481019-slack-C02FMH4G8
	 */
	public function test_wpcomsh_footer_credit_customizer_child_block_theme() {
		$this->assertFalse( wp_get_theme()->errors() );
	}
}
