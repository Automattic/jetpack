<?php
/**
 * Tests for i18n.php.
 *
 * @package wpcomsh
 */

/**
 * Class I18nTest.
 */
class I18nTest extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Ensure GlotPress locales are loadable (normally provided by Jetpack on Atomic).
	 */
	public function set_up() {
		parent::set_up();

		if ( ! defined( 'JETPACK__GLOTPRESS_LOCALES_PATH' ) ) {
			$locales = dirname( __DIR__, 3 ) . '/packages/compat/lib/locales.php';
			if ( ! file_exists( $locales ) ) {
				$this->markTestSkipped( 'Jetpack compat locales file not found: ' . $locales );
			}
			define( 'JETPACK__GLOTPRESS_LOCALES_PATH', $locales );
		}
	}

	/**
	 * When the .mo file already exists, the path must not be rewritten.
	 */
	public function test_returns_unchanged_when_mo_file_exists() {
		$tmp = tempnam( sys_get_temp_dir(), 'wpcomsh-i18n-' );
		$this->assertNotFalse( $tmp );
		$mofile = $tmp . '.mo';
		$this->assertTrue( rename( $tmp, $mofile ) );

		$result = wpcomsh_wporg_to_wpcom_locale_mo_file( $mofile, 'any-domain' );
		$this->assertSame( $mofile, $result );

		$this->assertTrue( unlink( $mofile ) );
	}

	public function test_rewrites_domain_prefixed_theme_mo_nb_no_to_no_slug() {
		$theme_root = trailingslashit( wp_normalize_path( get_theme_root() ) );
		$mofile     = $theme_root . 'faketheme/languages/faketheme-nb_NO.mo';
		$this->assertFalse( file_exists( $mofile ) );

		$result = wpcomsh_wporg_to_wpcom_locale_mo_file( $mofile, 'faketheme' );

		$this->assertSame( $theme_root . 'faketheme/languages/no.mo', $result );
	}

	public function test_rewrites_domain_prefixed_theme_mo_de_de_formal() {
		$theme_root = trailingslashit( wp_normalize_path( get_theme_root() ) );
		$mofile     = $theme_root . 'faketheme/languages/faketheme-de_DE_formal.mo';
		$this->assertFalse( file_exists( $mofile ) );

		$result = wpcomsh_wporg_to_wpcom_locale_mo_file( $mofile, 'faketheme' );

		$this->assertSame( $theme_root . 'faketheme/languages/de.mo', $result );
	}

	public function test_rewrites_unprefixed_theme_mo_de_de_to_de_slug() {
		$theme_root = trailingslashit( wp_normalize_path( get_theme_root() ) );
		$mofile     = $theme_root . 'faketheme/languages/de_DE.mo';
		$this->assertFalse( file_exists( $mofile ) );

		$result = wpcomsh_wporg_to_wpcom_locale_mo_file( $mofile, 'faketheme' );

		$this->assertSame( $theme_root . 'faketheme/languages/de.mo', $result );
	}

	/**
	 * Paths outside get_theme_root() do not strip {domain}- from the basename; unknown wp_locale leaves path unchanged.
	 */
	public function test_does_not_rewrite_plugin_style_path_with_domain_like_basename() {
		$mofile = trailingslashit( wp_normalize_path( WP_PLUGIN_DIR ) ) . 'some-plugin/languages/some-plugin-nb_NO.mo';
		$this->assertFalse( file_exists( $mofile ) );

		$result = wpcomsh_wporg_to_wpcom_locale_mo_file( $mofile, 'some-plugin' );

		$this->assertSame( $mofile, $result );
	}
}
