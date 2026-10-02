<?php
/**
 * Tests for the AI Assistant banner Tracks props.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Jetpack_Mu_Wpcom;

//phpcs:ignore WordPressVIPMinimum.Files.IncludingFile.NotAbsolutePath
require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/ai-launchpad/helpers.php';
//phpcs:ignore WordPressVIPMinimum.Files.IncludingFile.NotAbsolutePath
require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/expiry-notices/expiry-notices.php';
//phpcs:ignore WordPressVIPMinimum.Files.IncludingFile.NotAbsolutePath
require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/ai-assistant-banner/ai-assistant-banner.php';

/**
 * Test class for the AI Assistant banner Tracks props.
 */
class AI_Assistant_Banner_Tracks_Props_Test extends \WorDBless\BaseTestCase {

	/**
	 * Tear down.
	 */
	public function tear_down() {
		Constants::clear_constants();
		unset( $GLOBALS['wpcom_get_site_purchases_test_value'] );
		parent::tear_down();
	}

	/**
	 * The constant props, and the screen id passing through unchanged.
	 */
	public function test_constant_props_and_screen() {
		$props = wpcom_ai_assistant_banner_tracks_props( 'dashboard' );

		$this->assertSame( 'web', $props['channel'] );
		$this->assertSame( 'dashboard', $props['surface'] );
		$this->assertSame( 'dashboard', $props['screen'] );
	}

	/**
	 * The site_type prop reports the hosting platform.
	 */
	public function test_site_type_follows_the_platform() {
		Constants::set_constant( 'IS_WPCOM', true );
		$this->assertSame( 'simple', wpcom_ai_assistant_banner_tracks_props( 'dashboard' )['site_type'] );

		Constants::set_constant( 'IS_WPCOM', false );
		$this->assertSame( 'atomic', wpcom_ai_assistant_banner_tracks_props( 'dashboard' )['site_type'] );
	}

	/**
	 * The primary plan purchase supplies product_slug.
	 */
	public function test_product_slug_from_primary_plan() {
		$GLOBALS['wpcom_get_site_purchases_test_value'] = array(
			(object) array(
				'product_slug' => 'business-bundle',
				'product_type' => 'bundle',
				'expiry_date'  => '2027-01-01T00:00:00+00:00',
			),
		);

		$props = wpcom_ai_assistant_banner_tracks_props( 'dashboard' );

		$this->assertSame( 'business-bundle', $props['product_slug'] );
	}

	/**
	 * Non-bundle purchases never supply the slug, even when they expire later and
	 * their slug would pass the expiry picker's substring inference.
	 */
	public function test_product_slug_ignores_non_plan_purchases() {
		$GLOBALS['wpcom_get_site_purchases_test_value'] = array(
			(object) array(
				'product_slug' => 'wp_titan_mail_premium_yearly',
				'product_type' => 'mailbox',
				'expiry_date'  => '2028-01-01T00:00:00+00:00',
			),
			(object) array(
				'product_slug' => 'business-bundle',
				'product_type' => 'bundle',
				'expiry_date'  => '2027-01-01T00:00:00+00:00',
			),
		);

		$props = wpcom_ai_assistant_banner_tracks_props( 'dashboard' );

		$this->assertSame( 'business-bundle', $props['product_slug'] );
	}

	/**
	 * Without a plan purchase the prop is the string "none", never empty or null.
	 */
	public function test_product_slug_defaults_to_none() {
		$props = wpcom_ai_assistant_banner_tracks_props( 'dashboard' );

		$this->assertSame( 'none', $props['product_slug'] );
	}

	/**
	 * The audience flags travel as literal strings, false by default in this environment.
	 */
	public function test_audience_props_are_false_strings_by_default() {
		$props = wpcom_ai_assistant_banner_tracks_props( 'dashboard' );

		$this->assertSame( 'false', $props['is_test'] );
		$this->assertSame( 'false', $props['is_a11n'] );
	}

	/**
	 * The a11n flag follows the shared launchpad helper: the Atomic proxy signal flips it.
	 */
	public function test_is_a11n_follows_proxied_request() {
		Constants::set_constant( 'AT_PROXIED_REQUEST', true );

		$props = wpcom_ai_assistant_banner_tracks_props( 'dashboard' );

		$this->assertSame( 'true', $props['is_a11n'] );
	}
}
