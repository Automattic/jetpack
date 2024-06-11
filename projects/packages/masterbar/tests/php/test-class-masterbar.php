<?php
/**
 * Tests for Masterbar class.
 *
 * @package automattic/jetpack-masterbar
 */

namespace Automattic\Jetpack\Masterbar;

use Automattic\Jetpack\Constants as Jetpack_Constants;
use PHPUnit\Framework\TestCase;
use WorDBless\Options as WorDBless_Options;
use WorDBless\Users as WorDBless_Users;

/**
 * Class Test_Masterbar.
 *
 * @covers Automattic\Jetpack\Masterbar\Masterbar
 */
class Test_Masterbar extends TestCase {
	/**
	 * Mock user ID.
	 *
	 * @var int
	 */
	private static $user_id = 0;

	/**
	 * A backup of the original $l10n global.
	 *
	 * @var array
	 */
	private $l10n_backup;

	/**
	 * Set up each test.
	 *
	 * @before
	 */
	public function set_up() {
		global $l10n;
		$this->l10n_backup = $l10n;

		static::$user_id = wp_insert_user(
			array(
				'user_login' => 'test_admin',
				'user_pass'  => '123',
				'role'       => 'administrator',
			)
		);

		wp_set_current_user( static::$user_id );

		$plugin_dir = dirname( __DIR__, 4 ) . '/';
		Jetpack_Constants::set_constant( 'JETPACK__PLUGIN_FILE', $plugin_dir . 'jetpack.php' );
	}

	/**
	 * Returning the environment into its initial state.
	 *
	 * @after
	 */
	public function tear_down() {
		// Restore the original global.
		global $l10n;
		$l10n = $this->l10n_backup;

		Jetpack_Constants::clear_constants();
		WorDBless_Options::init()->clear_options();
		WorDBless_Users::init()->clear_all_users();
	}

	/**
	 * Tests unload_non_default_textdomains_on_wpcom_user_locale_switch
	 *
	 * @param string $stored_user_locale The user's locale as stored on the site.
	 * @param string $detected_wpcom_locale The user's WordPress.com locale as detected by the Masterbar.
	 *
	 * @dataProvider wpcom_user_locale_switch_data_provider
	 * @covers ::unload_non_default_textdomains_on_wpcom_user_locale_switch
	 */
	public function test_unload_non_default_textdomains_on_wpcom_user_locale_switch(
		$stored_user_locale,
		$detected_wpcom_locale
	) {
		// Pretend some textdomains have been loaded.
		global $l10n;
		$l10n = array(
			'default'       => 'MO file',
			'jetpack'       => 'MO file',
			'jetpack-boost' => 'MO file',
		);

		// Make get_user_locale() return $stored_user_locale.
		wp_get_current_user()->locale = $stored_user_locale;

		// @phan-suppress-next-line PhanDeprecatedFunction -- Needed for PHP 7.0 and 7.1 CI tests. We can replace with addMethods once WP 6.7 comes out.
		$masterbar = $this->getMockBuilder( Masterbar::class )
			->disableOriginalConstructor()
			->setMethodsExcept( array( 'unload_non_default_textdomains_on_wpcom_user_locale_switch' ) )
			->getMock();
		// @phan-suppress-next-line PhanUndeclaredMethod -- This will be resolved when we start using addMethods above.
		$masterbar->unload_non_default_textdomains_on_wpcom_user_locale_switch( $detected_wpcom_locale );

		// Check the result.
		$user_switched_locale = $stored_user_locale !== $detected_wpcom_locale;
		if ( $user_switched_locale ) {
			// All non-default textdomains should have been unloaded.
			$this->assertEquals( array( 'default' ), array_keys( $l10n ) );
		} else {
			// No textdomains should have been unloaded.
			$this->assertEquals( array( 'default', 'jetpack', 'jetpack-boost' ), array_keys( $l10n ) );
		}
	}

	public function test_add_styles_and_scripts() {
		// @phan-suppress-next-line PhanDeprecatedFunction -- Needed for PHP 7.0 and 7.1 CI tests. We can replace with addMethods once WP 6.7 comes out.
		$masterbar = $this->getMockBuilder( Masterbar::class )
			->disableOriginalConstructor()
			->setMethodsExcept( array( 'add_styles_and_scripts' ) )
			->getMock();
		// @phan-suppress-next-line PhanUndeclaredMethod -- This will be resolved when we start using addMethods above.
		$masterbar->add_styles_and_scripts();

		$this->assertTrue( wp_style_is( 'a8c-wpcom-masterbar' ) );
		$this->assertTrue( wp_style_is( 'a8c-wpcom-masterbar-overrides' ) );
		$this->assertTrue( wp_script_is( 'a8c_wpcom_css_override' ) );
		$this->assertTrue( wp_script_is( 'jetpack-accessible-focus' ) );
		$this->assertTrue( wp_script_is( 'a8c_wpcom_masterbar_tracks_events' ) );
		$this->assertTrue( wp_script_is( 'a8c_wpcom_masterbar_overrides' ) );
	}

	/**
	 * Data provider for test_unload_non_default_textdomains_on_wpcom_user_locale_switch.
	 *
	 * @return array With format [stored_user_locale, detected_wpcom_locale].
	 */
	public function wpcom_user_locale_switch_data_provider() {
		return array(
			// Simulate the user changing their locale on WordPress.com.
			array( 'fr_FR', 'en_US' ),
			array( 'en_US', 'fr_FR' ),
			array( 'nl_NL', 'fr_FR' ),

			// No locale change.
			array( 'nl_NL', 'nl_NL' ),
			array( 'fr_FR', 'fr_FR' ),
		);
	}
}
