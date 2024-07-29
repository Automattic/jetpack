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

	/**
	 * Checks that the Footer Credit customizer settings and controls are not registered
	 * for child block themes without causing a fatal error.
	 *
	 * @see p1721946083481019-slack-C02FMH4G8
	 */
	public function test_wpcomsh_footer_credit_customizer_child_block_theme() {
		$wp_theme = $this->getMockBuilder( WP_Theme::class )
						->onlyMethods( array( 'is_block_theme' ) )
						->getMock();
		$wp_theme->expects( $this->once() )
				->method( 'is_block_theme' );

		require_once __DIR__ . '/../../footer-credit/footer-credit/customizer.php';
	}
}
