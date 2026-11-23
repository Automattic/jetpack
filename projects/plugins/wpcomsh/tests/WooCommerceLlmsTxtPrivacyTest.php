<?php
/**
 * WooCommerce llms.txt privacy tests.
 *
 * @package wpcomsh
 */

use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunInSeparateProcess;

/**
 * Check the WooCommerce filter alongside WordPress.com access rules.
 */
class WooCommerceLlmsTxtPrivacyTest extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * @param string $role Site member role.
	 * @dataProvider site_member_roles
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[DataProvider( 'site_member_roles' )]
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_coming_soon_does_not_disable_guidance_for_members( $role ) {
		global $wp_query;

		if ( \Private_Site\site_is_private() ) {
			$this->markTestSkipped( 'Public Coming Soon is not available on a private test site.' );
		}
		update_option( 'wpcom_public_coming_soon', 1 );
		$previous_query = $wp_query;
		// A full request can exit at WP Cloud's private-site check.
		$wp_query = new WP_Query();
		$wp_query->set_404();

		try {
			wp_set_current_user( 0 );
			$this->assertTrue( \A8C\FSE\Coming_soon\should_show_coming_soon_page() );

			wp_set_current_user( self::factory()->user->create( array( 'role' => $role ) ) );
			$this->assertFalse( \A8C\FSE\Coming_soon\should_show_coming_soon_page() );
			$this->assertTrue( apply_filters( 'woocommerce_enable_llms_txt', true ) );
		} finally {
			$wp_query = $previous_query;
		}
	}

	/**
	 * @return array Site member roles.
	 */
	public static function site_member_roles(): array {
		return array(
			'administrator' => array( 'administrator' ),
			'subscriber'    => array( 'subscriber' ),
		);
	}

	/**
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_private_site_does_not_disable_guidance_for_members() {
		if ( defined( 'AT_PRIVACY_MODEL' ) && 'wp_uploads' !== AT_PRIVACY_MODEL ) {
			$this->markTestSkipped( 'The test site already defines a different privacy model.' );
		}
		if ( ! defined( 'AT_PRIVACY_MODEL' ) ) {
			define( 'AT_PRIVACY_MODEL', 'wp_uploads' );
		}

		wp_set_current_user( self::factory()->user->create( array( 'role' => 'subscriber' ) ) );
		$this->assertTrue( \Private_Site\is_private_blog_user() );
		$this->assertTrue( apply_filters( 'woocommerce_enable_llms_txt', true ) );
	}

	/**
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_coming_soon_does_not_disable_guidance_for_preview_links() {
		if ( \Private_Site\site_is_private() ) {
			$this->markTestSkipped( 'Public Coming Soon is not available on a private test site.' );
		}
		update_option( 'wpcom_public_coming_soon', 1 );
		update_option( 'wpcom_public_preview_links', array( array( 'code' => 'preview-code' ) ) );
		wp_set_current_user( 0 );
		$_COOKIE['wp_share_code'] = 'preview-code';

		try {
			$this->assertTrue( \A8C\FSE\Coming_soon\is_accessed_by_valid_share_link( \A8C\FSE\Coming_soon\get_share_code() ) );
			$this->assertTrue( apply_filters( 'woocommerce_enable_llms_txt', true ) );
		} finally {
			unset( $_COOKIE['wp_share_code'] );
		}
	}
}
