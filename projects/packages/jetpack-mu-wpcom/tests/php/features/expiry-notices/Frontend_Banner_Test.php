<?php
/**
 * Front-end banner tests.
 *
 * @package automattic/jetpack-mu-wpcom
 */

declare( strict_types = 1 );

use Automattic\Jetpack\Jetpack_Mu_Wpcom;
use Automattic\Jetpack\Jetpack_Mu_Wpcom\Expiry_Notices\Expiry_Notice_Dismiss;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunInSeparateProcess;

require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/expiry-notices/expiry-notices.php';
require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/expiry-notices/frontend-banner.php';
require_once __DIR__ . '/trait-expiry-notices-fixtures.php';

class Frontend_Banner_Test extends \WorDBless\BaseTestCase {
	use Expiry_Notices_Fixtures;

	public function set_up() {
		parent::set_up();
		$this->set_up_expiry_fixtures();
		set_current_screen( 'front' );
	}

	public function tear_down() {
		$this->tear_down_expiry_fixtures();
		parent::tear_down();
	}

	private function data(): ?array {
		wpcom_expiry_notices_frontend_banner_data( true );
		return wpcom_expiry_notices_frontend_banner_data();
	}

	public function test_nothing_for_anonymous_visitors(): void {
		$this->set_purchase( 5 );
		wp_set_current_user( 0 );
		$this->assertNull( $this->data() );
		$this->assertFalse( wpcom_expiry_notices_frontend_banner_is_due() );
	}

	public function test_nothing_for_non_admins(): void {
		$this->set_purchase( 5 );
		wp_set_current_user( $this->subscriber_id );
		$this->assertNull( $this->data() );
	}

	public function test_skips_the_early_reminder(): void {
		$this->set_purchase( 45 );
		$this->assertNull( $this->data() );
		$this->set_purchase( 8 );
		$this->assertNull( $this->data() );
	}

	public function test_shows_from_the_final_week_through_post_grace(): void {
		foreach ( array( 7, 5, 0, -1, -29, -30, -59 ) as $days ) {
			$this->set_purchase( $days );
			$this->assertNotNull( $this->data(), "expected a banner at {$days} days" );
			$this->assertTrue( wpcom_expiry_notices_frontend_banner_is_due() );
		}
		foreach ( array( -60, -90, 200 ) as $days ) {
			$this->set_purchase( $days );
			$this->assertNull( $this->data(), "expected no banner at {$days} days" );
		}
	}

	public function test_only_post_grace_is_dismissible(): void {
		$this->set_purchase( -5 );
		$grace = $this->data();
		$this->assertNotNull( $grace );
		$this->assertFalse( $grace['is_dismissible'] );
		$this->set_purchase( -45 );
		$post_grace = $this->data();
		$this->assertNotNull( $post_grace );
		$this->assertTrue( $post_grace['is_dismissible'] );
	}

	public function test_a_wp_admin_dismissal_hides_the_front_end_banner(): void {
		$this->set_purchase( -45 );
		update_user_meta( $this->admin_id, Expiry_Notice_Dismiss::META_BANNER, time() - DAY_IN_SECONDS );
		$this->assertNull( $this->data() );
	}

	public function test_a_dismissal_of_an_earlier_term_shows_again(): void {
		$this->set_purchase( -45 );
		update_user_meta( $this->admin_id, Expiry_Notice_Dismiss::META_BANNER, time() - YEAR_IN_SECONDS );
		$this->assertNotNull( $this->data() );
	}

	public function test_checkout_redirects_back_to_the_front_end_url(): void {
		$_SERVER['REQUEST_URI'] = '/about/?utm_source=x&settings-updated=true';
		$this->set_purchase( 5 );
		$data = $this->data();
		$this->assertNotNull( $data );
		$url = $data['urls']['primary']['url'];
		$this->assertStringContainsString( 'redirect_to=' . rawurlencode( home_url( '/about/?utm_source=x' ) ), $url );
		$this->assertStringNotContainsString( 'settings-updated', rawurldecode( $url ) );
		$this->assertStringNotContainsString( 'wp-admin', $url );
		unset( $_SERVER['REQUEST_URI'] );
	}

	public function test_no_secondary_cta_in_grace(): void {
		$this->set_purchase( -5 );
		$html = $this->render();
		$this->assertStringNotContainsString( '/plans/', $html );
	}

	public function test_renders_one_run_of_text_with_no_heading_markup(): void {
		$this->set_purchase( 5 );
		$html = $this->render();
		$this->assertStringContainsString( 'id="wpcom-expiry-frontend-banner"', $html );
		// The Plans package isn't loaded under test, so the plan name resolves to
		// null and the heading falls back to its no-plan-name variant.
		$this->assertStringContainsString( 'Your plan expires in 5 days. ', $html );
		$this->assertStringNotContainsString( '<strong>', $html );
		$this->assertStringContainsString( 'wpcom-expiry-frontend-banner__cta', $html );
		$this->assertStringContainsString( '/checkout/business-bundle/', $html );
		$this->assertStringNotContainsString( 'wpcom-expiry-frontend-banner__dismiss', $html );
	}

	public function test_post_grace_renders_the_close_button(): void {
		$this->set_purchase( -45 );
		$this->assertStringContainsString( 'wpcom-expiry-frontend-banner__dismiss', $this->render() );
	}

	public function test_renders_nothing_when_not_due(): void {
		$this->set_purchase( 45 );
		$this->assertSame( '', $this->render() );
	}

	/**
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_reverted_site_asks_for_support(): void {
		$this->pretend_reverted();
		$this->set_purchase( -45 );
		$html = $this->render();
		$this->assertStringContainsString( 'Contact support', $html );
		$this->assertStringContainsString( 'data-support-message=', $html );
	}

	public function test_body_class_follows_the_banner(): void {
		$this->set_purchase( 5 );
		wpcom_expiry_notices_frontend_banner_data( true );
		$this->assertContains( 'has-wpcom-expiry-banner', wpcom_expiry_notices_frontend_banner_body_class( array() ) );

		$this->set_purchase( 45 );
		wpcom_expiry_notices_frontend_banner_data( true );
		$this->assertNotContains( 'has-wpcom-expiry-banner', wpcom_expiry_notices_frontend_banner_body_class( array() ) );
	}

	public function test_hooks_are_registered(): void {
		$this->assertNotFalse( has_action( 'wp_enqueue_scripts', 'wpcom_expiry_notices_enqueue_frontend_banner_assets' ) );
		$this->assertNotFalse( has_action( 'wp_footer', 'wpcom_expiry_notices_render_frontend_banner' ) );
		$this->assertNotFalse( has_filter( 'body_class', 'wpcom_expiry_notices_frontend_banner_body_class' ) );
	}

	private function render(): string {
		wpcom_expiry_notices_frontend_banner_data( true );
		ob_start();
		wpcom_expiry_notices_render_frontend_banner();
		return (string) ob_get_clean();
	}
}
