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
	 * Theme root directory.
	 *
	 * @var string
	 */
	const THEME_ROOT = DIR_TESTDATA . '/themedir1';

	/**
	 * Original theme directory.
	 *
	 * @var string
	 */
	private $orig_theme_dir;

	public function set_up() {
		parent::set_up();

		$this->orig_theme_dir            = $GLOBALS['wp_theme_directories'];
		$GLOBALS['wp_theme_directories'] = array( WP_CONTENT_DIR . '/themes', self::THEME_ROOT );

		add_filter( 'theme_root', array( $this, 'filter_theme_root' ) );
		add_filter( 'stylesheet_root', array( $this, 'filter_theme_root' ) );
		add_filter( 'template_root', array( $this, 'filter_theme_root' ) );

		// Clear caches.
		wp_clean_themes_cache();
		unset( $GLOBALS['wp_themes'] );

		// Remove Footer Credit action in case it was previously registered.
		remove_action( 'customize_register', 'footercredits_register', 99 );
	}

	public function tear_down() {
		$GLOBALS['wp_theme_directories'] = $this->orig_theme_dir;
		remove_filter( 'theme_root', array( $this, 'filter_theme_root' ) );
		remove_filter( 'stylesheet_root', array( $this, 'filter_theme_root' ) );
		remove_filter( 'template_root', array( $this, 'filter_theme_root' ) );

		wp_clean_themes_cache();
		unset( $GLOBALS['wp_themes'] );
		parent::tear_down();
	}

	/**
	 * Replace the normal theme root directory with our premade test directory.
	 *
	 * @return string Replaced theme root.
	 */
	public function filter_theme_root() {
		return self::THEME_ROOT;
	}

	/**
	 * Checks that the Footer Credit customizer settings and controls are not registered
	 * for child block themes without causing a fatal error.
	 *
	 * @see p1721946083481019-slack-C02FMH4G8
	 */
	public function test_wpcomsh_footer_credit_customizer_child_block_theme() {
		switch_theme( 'block-theme' );
		do_action( 'init' );
		$this->assertFalse( has_action( 'customize_register', 'footercredits_register' ) );
	}
}
