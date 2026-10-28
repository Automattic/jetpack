<?php
/**
 * Tests for the AI Launchpad i18n helpers.
 *
 * @package automattic/jetpack-mu-wpcom
 */

//phpcs:ignore WordPressVIPMinimum.Files.IncludingFile.NotAbsolutePath
require_once \Automattic\Jetpack\Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/ai-launchpad/helpers.php';
require_once __DIR__ . '/fixtures/simple-site-stubs.php';

use PHPUnit\Framework\Attributes\CoversFunction;

/**
 * Tests for the AI Launchpad i18n helpers.
 *
 * @covers ::wpcom_ai_launchpad_in_site_language
 * @covers ::wpcom_ai_launchpad_site_locale
 * @covers ::wpcom_ai_launchpad_site_copy
 */
#[CoversFunction( 'wpcom_ai_launchpad_site_locale' )]
#[CoversFunction( 'wpcom_ai_launchpad_in_site_language' )]
#[CoversFunction( 'wpcom_ai_launchpad_site_copy' )]
class AI_Launchpad_I18n_Test extends \WorDBless\BaseTestCase {

	/**
	 * The locale switcher WordPress booted with, restored after a test replaces it.
	 *
	 * @var WP_Locale_Switcher|null
	 */
	private $original_switcher = null;

	/**
	 * Test teardown.
	 */
	public function tear_down() {
		remove_all_filters( 'determine_locale' );
		remove_all_filters( 'locale' );
		remove_all_filters( 'get_available_languages' );
		unset( $GLOBALS['wpcom_ai_launchpad_test_blog_lang'] );
		if ( $this->original_switcher ) {
			$GLOBALS['wp_locale_switcher'] = $this->original_switcher;
			$GLOBALS['wp_locale_switcher']->init();
			$this->original_switcher = null;
		}
		parent::tear_down();
	}

	/**
	 * Make the site language a locale the switcher will switch to, as an installed language pack would.
	 *
	 * @param string $site_locale The site language.
	 * @param string $user_locale The language the request is translated into.
	 */
	private function set_site_and_user_locales( $site_locale, $user_locale ) {
		add_filter( 'get_available_languages', fn( $languages ) => array_merge( $languages, array( $site_locale ) ) );
		// The switcher lists the available languages once, when WordPress boots.
		$this->original_switcher       = $GLOBALS['wp_locale_switcher'];
		$GLOBALS['wp_locale_switcher'] = new WP_Locale_Switcher();
		$GLOBALS['wp_locale_switcher']->init();
		// Below the switcher's own priority-10 filters, so a switch still wins while it lasts.
		add_filter( 'locale', fn() => $site_locale, 9 );
		add_filter( 'determine_locale', fn() => $user_locale, 9 );
	}

	public function test_site_locale_is_the_blog_language_not_the_readers_on_simple() {
		$GLOBALS['wpcom_ai_launchpad_test_blog_lang'] = 'fr';
		add_filter( 'locale', fn() => 'it', 9 );

		$this->assertSame( 'fr', wpcom_ai_launchpad_site_locale() );
	}

	public function test_site_locale_falls_back_to_the_request_locale_off_simple() {
		add_filter( 'locale', fn() => 'it_IT', 9 );

		$this->assertSame( 'it_IT', wpcom_ai_launchpad_site_locale() );
	}

	public function test_in_site_language_switches_to_the_site_locale_for_the_callback_only() {
		$this->set_site_and_user_locales( 'it_IT', 'en_US' );

		$seen = wpcom_ai_launchpad_in_site_language(
			static function () {
				return array( is_locale_switched(), determine_locale() );
			}
		);

		$this->assertSame( array( true, 'it_IT' ), $seen );
		$this->assertFalse( is_locale_switched() );
		$this->assertSame( 'en_US', determine_locale() );
	}

	public function test_in_site_language_does_not_switch_when_the_user_language_is_the_site_language() {
		$this->set_site_and_user_locales( 'it_IT', 'it_IT' );

		$this->assertFalse( wpcom_ai_launchpad_in_site_language( 'is_locale_switched' ) );
	}

	public function test_in_site_language_falls_back_to_english_when_the_site_language_will_not_load() {
		// Not the reader's language: every admin must get the same page.
		add_filter( 'locale', fn() => 'xx_XX', 9 );
		add_filter( 'determine_locale', fn() => 'it_IT', 9 );

		$seen = wpcom_ai_launchpad_in_site_language( static fn() => determine_locale() );

		$this->assertSame( 'en_US', $seen );
		$this->assertFalse( is_locale_switched() );
	}

	public function test_site_copy_fills_every_key_the_client_writes_into_a_page() {
		// The contract, not the wording: every key the client indexes is filled, placeholders intact.
		$copy = wpcom_ai_launchpad_site_copy();

		foreach ( json_decode( (string) file_get_contents( __DIR__ . '/fixtures/site-copy.json' ), true ) as $key => $english ) { // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents
			$this->assertArrayHasKey( $key, $copy );
			foreach ( (array) $copy[ $key ] as $index => $value ) {
				$this->assertNotSame( '', trim( (string) $value ), "$key is empty" );
				if ( str_contains( (string) ( (array) $english )[ $index ], '%s' ) ) {
					$this->assertStringContainsString( '%', (string) $value, "$key lost its placeholder" );
				}
			}
		}
	}
}
