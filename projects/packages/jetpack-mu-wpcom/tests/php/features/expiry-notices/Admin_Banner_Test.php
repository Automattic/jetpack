<?php
/**
 * Admin Banner Tests
 *
 * @package automattic/jetpack-mu-wpcom
 */

declare( strict_types = 1 );

use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Jetpack_Mu_Wpcom;
use Automattic\Jetpack\Jetpack_Mu_Wpcom\Expiry_Notices\Expiry_Notice_Dismiss;

require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/expiry-notices/expiry-notices.php';
require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/expiry-notices/admin-banner.php';
require_once __DIR__ . '/trait-expiry-notices-fixtures.php';

class Admin_Banner_Test extends \WorDBless\BaseTestCase {
	use Expiry_Notices_Fixtures;

	public function set_up() {
		parent::set_up();
		$this->set_up_expiry_fixtures();
		set_current_screen( 'dashboard' );
	}

	public function tear_down() {
		$this->tear_down_expiry_fixtures();
		parent::tear_down();
	}

	private function render(): string {
		ob_start();
		wpcom_expiry_notices_render_admin_banner();
		return (string) ob_get_clean();
	}

	public function test_leaves_block_editor_screens_to_the_editor_notice(): void {
		$this->set_purchase( 5 );
		set_current_screen( 'post' );
		get_current_screen()->is_block_editor( true );
		$this->assertSame( '', $this->render() );

		get_current_screen()->is_block_editor( false );
		$this->assertStringContainsString( 'notice-error', $this->render() );
	}

	public function test_each_stage_renders_its_own_severity_and_actions(): void {
		$renew = '/checkout/business-bundle/renew/' . $this->subscription_id . '/';
		$cases = array(
			// days => [ notice class, primary CTA, other-plans link, dismiss button ].
			45  => array( 'notice-warning', $renew, false, false ),
			5   => array( 'notice-error', $renew, false, false ),
			0   => array( 'notice-error', $renew, false, false ),
			-5  => array( 'notice-error', $renew, true, false ),
			-45 => array( 'notice-error', $renew, false, true ),
		);
		foreach ( $cases as $days => list( $class, $primary, $has_plans, $has_dismiss ) ) {
			$this->set_purchase( $days );
			$out = $this->render();
			$this->assertStringContainsString( $class, $out, "wrong severity at {$days} days" );
			$this->assertStringContainsString( $primary, $out, "wrong primary CTA at {$days} days" );
			$this->assertSame( $has_plans, str_contains( $out, '/plans/' ), "wrong other-plans link at {$days} days" );
			$this->assertSame( $has_dismiss, str_contains( $out, 'wpcom-expiry-banner__dismiss' ), "wrong dismiss button at {$days} days" );
		}

		foreach ( array( 200, -60 ) as $days ) {
			$this->set_purchase( $days );
			$this->assertSame( '', $this->render(), "expected no notice at {$days} days" );
		}
	}

	/**
	 * The 7-day mark escalates two things at once: wp-admin widens from the
	 * Dashboard to every admin screen, and monthly plans enter the flow at all.
	 */
	public function test_surface_and_severity_escalate_together_at_seven_days(): void {
		$cases = array(
			// [ days, slug, expected on Dashboard, expected on a non-Dashboard screen ]
			array( 45, 'business-bundle', 'notice-warning', '' ),
			array( 8, 'business-bundle', 'notice-warning', '' ),
			array( 7, 'business-bundle', 'notice-error', 'notice-error' ),
			array( 5, 'business-bundle', 'notice-error', 'notice-error' ),
			array( -5, 'business-bundle', 'notice-error', 'notice-error' ),
			array( -45, 'business-bundle', 'notice-error', 'notice-error' ),
			array( 45, 'business-bundle-monthly', '', '' ),
			array( 8, 'business-bundle-monthly', '', '' ),
			array( 5, 'business-bundle-monthly', 'notice-error', 'notice-error' ),
		);

		foreach ( $cases as list( $days, $slug, $on_dashboard, $elsewhere ) ) {
			$this->set_purchase( $days, false, $slug );
			$where = "{$slug} at {$days} days";

			set_current_screen( 'dashboard' );
			$out = $this->render();
			if ( '' === $on_dashboard ) {
				$this->assertSame( '', $out, "expected no Dashboard notice for {$where}" );
			} else {
				$this->assertStringContainsString( $on_dashboard, $out, "wrong Dashboard notice for {$where}" );
			}

			set_current_screen( 'edit-post' );
			$out = $this->render();
			if ( '' === $elsewhere ) {
				$this->assertSame( '', $out, "expected no notice outside the Dashboard for {$where}" );
			} else {
				$this->assertStringContainsString( $elsewhere, $out, "wrong notice outside the Dashboard for {$where}" );
			}
		}
	}

	public function test_post_grace_dismiss_hides_the_banner(): void {
		$this->set_purchase( -45 );
		update_user_meta( $this->admin_id, Expiry_Notice_Dismiss::banner_meta_key(), time() - DAY_IN_SECONDS );
		$this->assertSame( '', $this->render() );
	}

	public function test_heading_and_body_render_as_separate_paragraphs(): void {
		$this->set_purchase( 45 );
		$out = $this->render();
		$this->assertStringContainsString( '<strong>Your plan expires in 45 days</strong>', $out );
		$this->assertStringContainsString( '50 GB of storage', $out );
	}

	public function test_after_the_revert_the_cta_points_at_support(): void {
		$this->pretend_reverted();
		$this->set_purchase( -45 );
		$out = $this->render();

		$this->assertStringContainsString( 'Contact support', $out );
		$this->assertStringContainsString( 'data-support-message="My plan expired', $out );
		$this->assertStringContainsString( 'wordpress.com/help', $out );
		$this->assertStringNotContainsString( 'Renew now', $out );
		$this->assertStringNotContainsString( '/checkout/', $out );
	}

	public function test_a_site_that_was_never_atomic_is_not_sent_to_support(): void {
		Constants::set_constant( 'IS_ATOMIC', false );
		$this->set_purchase( -45 );
		$out = $this->render();

		$this->assertStringNotContainsString( 'Contact support', $out );
		$this->assertStringNotContainsString( 'data-support-message', $out );
		$this->assertStringContainsString( 'Restore site', $out );
		$this->assertStringContainsString( '/checkout/', $out );
		$this->assertStringContainsString( 'Upgrade your plan to restore your site.', $out );
	}

	public function test_before_the_revert_runs_the_cta_still_offers_checkout(): void {
		// Post-grace by date but not yet reverted: renewing still works, so the
		// copy must not claim the changes have already happened.
		Constants::set_constant( 'IS_ATOMIC', true );
		$this->set_purchase( -45 );
		$out = $this->render();

		$this->assertStringNotContainsString( 'Contact support', $out );
		$this->assertStringContainsString( '/checkout/', $out );
		$this->assertStringNotContainsString( 'has been moved to the Free plan', $out );
		$this->assertStringContainsString( 'will move to the Free plan', $out );
	}

	public function test_a_non_owner_admin_is_told_why_there_is_nothing_to_click(): void {
		$this->act_as_non_owner();
		$this->set_purchase( 5 );
		$out = $this->render();
		$this->assertStringContainsString( 'purchased by a different WordPress.com account', $out );
		$this->assertStringNotContainsString( '/checkout/', $out );
		$this->assertStringNotContainsString( 'wpcom-expiry-banner__actions', $out );

		$this->set_purchase( -45 );
		$out = $this->render();
		$this->assertStringContainsString( '<strong>Your plan has expired</strong>', $out );
		$this->assertStringNotContainsString( 'Restore site', $out );
		$this->assertStringContainsString( 'wpcom-expiry-banner__dismiss', $out );
	}

	public function test_the_script_carries_the_track_props(): void {
		$this->act_as_non_owner();
		$this->set_purchase( 5 );
		wpcom_expiry_notices_enqueue_admin_banner_assets();

		$inline = wp_scripts()->get_inline_script_data( 'jetpack-mu-wpcom-expiry-notices-banner', 'before' );
		$this->assertStringContainsString( 'window.wpcomExpiryBanner = {', $inline );
		$this->assertStringContainsString( '"is_plan_owner":"false"', $inline );
		$this->assertStringContainsString( '"days_remaining":5', $inline );
		$this->assertStringContainsString( '"surface":"wp_admin"', $inline );
	}
}
