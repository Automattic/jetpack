<?php
/**
 * Front-end banner tests.
 *
 * @package automattic/jetpack-mu-wpcom
 */

declare( strict_types = 1 );

use Automattic\Jetpack\Jetpack_Mu_Wpcom;
use Automattic\Jetpack\Jetpack_Mu_Wpcom\Expiry_Notices\Expiry_Notice_Dismiss;

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

	private function render(): string {
		ob_start();
		wpcom_expiry_notices_render_frontend_banner();
		return (string) ob_get_clean();
	}

	public function test_nothing_for_visitors_and_non_admins(): void {
		$this->set_purchase( 5 );

		wp_set_current_user( 0 );
		$this->flush_expiry_memos();
		$this->assertFalse( wpcom_expiry_notices_frontend_banner_is_due() );
		$this->assertSame( '', $this->render() );

		wp_set_current_user( $this->subscriber_id );
		$this->flush_expiry_memos();
		$this->assertFalse( wpcom_expiry_notices_frontend_banner_is_due() );
	}

	public function test_shows_from_the_final_week_through_post_grace(): void {
		$cases = array(
			45  => null,
			8   => null,
			7   => false,
			0   => false,
			-1  => false,
			-29 => false,
			-30 => true,
			-59 => true,
			-60 => null,
		);
		foreach ( $cases as $days => $is_dismissible ) {
			$this->set_purchase( $days );
			$data = wpcom_expiry_notices_frontend_banner_data();
			$this->assertSame( null !== $is_dismissible, wpcom_expiry_notices_frontend_banner_is_due(), "wrong is_due at {$days} days" );
			$this->assertSame( $is_dismissible, $data['is_dismissible'] ?? null, "wrong banner at {$days} days" );
		}
	}

	public function test_each_stage_renders_one_run_of_text_with_its_actions(): void {
		$cases = array(
			// days => [ text prefix, CTA, dismiss ].
			5   => array( 'Your plan expires in 5 days. ', true, false ),
			-5  => array( 'Your plan has expired. Your site will move', true, false ),
			-45 => array( 'Your plan has expired. Your site has been moved', true, true ),
		);
		foreach ( $cases as $days => list( $prefix, $has_cta, $has_dismiss ) ) {
			$this->set_purchase( $days );
			$html = $this->render();
			$this->assertStringContainsString( 'id="wpcom-expiry-frontend-banner"', $html );
			$this->assertStringContainsString( $prefix, $html, "wrong text at {$days} days" );
			$this->assertStringNotContainsString( '<strong>', $html );
			$this->assertStringNotContainsString( '/plans/', $html );
			$this->assertSame( $has_cta, str_contains( $html, '/checkout/business-bundle/' ), "wrong CTA at {$days} days" );
			$this->assertSame( $has_dismiss, str_contains( $html, 'wpcom-expiry-frontend-banner__dismiss' ), "wrong dismiss at {$days} days" );
			$this->assertSame( $has_dismiss, str_contains( $html, 'wpcom-expiry-frontend-banner--dismissible' ), "wrong modifier at {$days} days" );
		}

		$this->set_purchase( 45 );
		$this->assertSame( '', $this->render() );
	}

	public function test_a_wp_admin_dismissal_hides_the_front_end_banner(): void {
		$this->set_purchase( -45 );
		update_user_meta( $this->admin_id, Expiry_Notice_Dismiss::META_BANNER, time() - DAY_IN_SECONDS );
		$this->assertNull( wpcom_expiry_notices_frontend_banner_data() );
	}

	public function test_checkout_redirects_back_to_the_front_end_url(): void {
		$_SERVER['REQUEST_URI'] = '/about/?utm_source=x&settings-updated=true';
		$this->set_purchase( 5 );
		$url = wpcom_expiry_notices_frontend_banner_data()['urls']['primary']['url'];

		$this->assertStringContainsString( 'redirect_to=' . rawurlencode( home_url( '/about/?utm_source=x' ) ), $url );
		$this->assertStringNotContainsString( 'settings-updated', rawurldecode( $url ) );
		$this->assertStringNotContainsString( 'wp-admin', $url );
	}

	public function test_a_non_owner_admin_gets_the_reason_and_no_cta(): void {
		$this->act_as_non_owner();
		$this->set_purchase( 5 );
		$html = $this->render();
		$this->assertStringContainsString( 'Your plan expires in 5 days. This plan was purchased by a different WordPress.com account.', $html );
		$this->assertStringNotContainsString( 'wpcom-expiry-frontend-banner__cta', $html );

		$this->set_purchase( -45 );
		$html = $this->render();
		$this->assertStringNotContainsString( 'wpcom-expiry-frontend-banner__cta', $html );
		$this->assertStringContainsString( 'wpcom-expiry-frontend-banner__dismiss', $html );
	}

	public function test_the_script_carries_the_track_props(): void {
		$this->set_purchase( 5 );
		wpcom_expiry_notices_enqueue_frontend_banner_assets();

		$inline = wp_scripts()->get_inline_script_data( 'jetpack-mu-wpcom-expiry-notices-frontend-banner', 'before' );
		$this->assertStringContainsString( 'window.wpcomExpiryFrontendBanner = {', $inline );
		$this->assertStringContainsString( '"is_plan_owner":"true"', $inline );
		$this->assertStringContainsString( '"state":"approaching_expiry"', $inline );
		$this->assertStringContainsString( '"surface":"frontend"', $inline );
	}

	public function test_body_class_follows_the_banner(): void {
		$this->set_purchase( 5 );
		$this->assertContains( 'has-wpcom-expiry-banner', wpcom_expiry_notices_frontend_banner_body_class( array() ) );

		$this->set_purchase( 45 );
		$this->assertNotContains( 'has-wpcom-expiry-banner', wpcom_expiry_notices_frontend_banner_body_class( array() ) );
	}

	public function test_is_due_is_false_in_admin_and_for_held_back_sites(): void {
		$this->set_purchase( 5 );
		$this->assertTrue( wpcom_expiry_notices_frontend_banner_is_due() );

		set_current_screen( 'dashboard' );
		$this->assertFalse( wpcom_expiry_notices_frontend_banner_is_due() );
		set_current_screen( 'front' );

		add_filter( 'wpcom_expiry_notices_enabled', '__return_false' );
		$this->assertFalse( wpcom_expiry_notices_frontend_banner_is_due() );
		remove_filter( 'wpcom_expiry_notices_enabled', '__return_false' );
	}

	public function test_footer_fallback_stays_quiet_once_body_open_has_rendered(): void {
		$this->set_purchase( 5 );
		ob_start();
		do_action( 'wp_body_open' );
		$this->assertStringContainsString( 'id="wpcom-expiry-frontend-banner"', (string) ob_get_clean() );

		ob_start();
		wpcom_expiry_notices_render_frontend_banner_fallback();
		$this->assertSame( '', (string) ob_get_clean() );
	}

	public function test_claims_the_simple_banner_slot_only_when_due(): void {
		$others = array(
			'wpcom_gifting_banner' => '__return_null',
			'wpcom_marketing_bar'  => '__return_null',
		);

		$this->set_purchase( 5 );
		$this->assertSame( array( 'wpcom_expiry_banner' => '__return_null' ), wpcom_expiry_notices_claim_wpcom_banner_slot( $others ) );

		$this->set_purchase( 45 );
		$this->assertSame( $others, wpcom_expiry_notices_claim_wpcom_banner_slot( $others ) );
	}
}
