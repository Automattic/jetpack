<?php
/**
 * Admin Banner Tests
 *
 * @package automattic/jetpack-mu-wpcom
 */

declare( strict_types = 1 );

use Automattic\Jetpack\Jetpack_Mu_Wpcom;
use Automattic\Jetpack\Jetpack_Mu_Wpcom\Expiry_Notices\Expiry_Data;
use Automattic\Jetpack\Jetpack_Mu_Wpcom\Expiry_Notices\Expiry_Notice_Dismiss;

require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/expiry-notices/expiry-notices.php';
require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/expiry-notices/admin-banner.php';

class Admin_Banner_Test extends \WorDBless\BaseTestCase {

	/**
	 * @var int
	 */
	private $admin_id;

	/**
	 * @var int
	 */
	private $subscriber_id;

	public function set_up() {
		parent::set_up();
		// WorDBless resets the users table between tests, so recreate fixture
		// users here rather than in set_up_before_class.
		$this->admin_id      = wp_insert_user(
			array(
				'user_login' => 'banner_admin',
				'user_pass'  => 'pass',
				'user_email' => 'banner_admin@example.com',
				'role'       => 'administrator',
			)
		);
		$this->subscriber_id = wp_insert_user(
			array(
				'user_login' => 'banner_subscriber',
				'user_pass'  => 'pass',
				'user_email' => 'banner_subscriber@example.com',
				'role'       => 'subscriber',
			)
		);
		wp_set_current_user( $this->admin_id );
		set_current_screen( 'dashboard' );
	}

	public function tear_down() {
		unset( $GLOBALS['wpcom_get_site_purchases_test_value'] );
		delete_user_meta( $this->admin_id, Expiry_Notice_Dismiss::META_BANNER );
		parent::tear_down();
	}

	private function set_purchase( int $days_until_expiry, bool $auto_renew = false ): void {
		$GLOBALS['wpcom_get_site_purchases_test_value'] = array(
			(object) array(
				'product_slug'           => 'business-bundle',
				'product_type'           => 'bundle',
				'expiry_date'            => gmdate( 'c', time() + ( $days_until_expiry * DAY_IN_SECONDS ) ),
				'user_allows_auto_renew' => $auto_renew,
			),
		);
	}

	private function render(): string {
		ob_start();
		wpcom_expiry_notices_render_admin_banner();
		return (string) ob_get_clean();
	}

	public function test_renders_for_approaching_state(): void {
		$this->set_purchase( 45 );
		$out = $this->render();
		$this->assertStringContainsString( 'notice-warning', $out );
		$this->assertStringContainsString( '/checkout/business-bundle/', $out );
		$this->assertStringNotContainsString( 'wpcom-expiry-banner__dismiss', $out );
	}

	public function test_renders_for_expired_grace_state(): void {
		$this->set_purchase( -5 );
		$out = $this->render();
		$this->assertStringContainsString( 'notice-error', $out );
		$this->assertStringContainsString( '/checkout/business-bundle/', $out );
		$this->assertStringContainsString( '/plans/', $out );
		$this->assertStringNotContainsString( 'wpcom-expiry-banner__dismiss', $out );
	}

	public function test_renders_for_expired_post_grace_state(): void {
		$this->set_purchase( -45 );
		$out = $this->render();
		$this->assertStringContainsString( 'notice-error', $out );
		$this->assertStringContainsString( 'wpcom-expiry-banner__dismiss', $out );
		$this->assertStringNotContainsString( '/plans/', $out );
	}

	public function test_post_grace_dismiss_hides_the_banner(): void {
		$this->set_purchase( -45 );
		update_user_meta( $this->admin_id, Expiry_Notice_Dismiss::META_BANNER, time() - DAY_IN_SECONDS );
		$this->assertSame( '', $this->render() );
	}

	public function test_post_grace_dismiss_never_lapses(): void {
		$this->set_purchase( -45 );
		update_user_meta( $this->admin_id, Expiry_Notice_Dismiss::META_BANNER, time() - YEAR_IN_SECONDS );
		$this->assertSame( '', $this->render() );
	}

	public function test_final_7_days_renders_as_error_with_no_dismiss(): void {
		$this->set_purchase( 5 );
		$out = $this->render();
		$this->assertStringContainsString( 'notice-error', $out );
		$this->assertStringNotContainsString( 'notice-warning', $out );
		$this->assertStringNotContainsString( 'wpcom-expiry-banner__dismiss', $out );
	}

	public function test_no_render_for_active_state(): void {
		$this->set_purchase( 200 );
		$this->assertSame( '', $this->render() );
	}

	public function test_no_render_when_purchases_empty(): void {
		$this->assertSame( '', $this->render() );
	}

	public function test_no_render_for_auto_renew_on(): void {
		$this->set_purchase( 30, true );
		$this->assertSame( '', $this->render() );
	}

	public function test_no_render_for_non_admin(): void {
		wp_set_current_user( $this->subscriber_id );
		$this->set_purchase( 45 );
		$this->assertSame( '', $this->render() );
	}

	public function test_stale_dismissal_does_not_hide_pre_revert_banner(): void {
		$this->set_purchase( 45 );
		update_user_meta( $this->admin_id, Expiry_Notice_Dismiss::META_BANNER, time() - DAY_IN_SECONDS );
		$this->assertStringContainsString( 'notice-warning', $this->render() );
	}

	public function test_early_warning_hides_on_non_dashboard_screen(): void {
		$this->set_purchase( 45 );
		set_current_screen( 'edit-post' );
		$this->assertSame( '', $this->render() );
	}

	public function test_final_window_shows_on_non_dashboard_screen(): void {
		$this->set_purchase( 5 );
		set_current_screen( 'edit-post' );
		$out = $this->render();
		$this->assertStringContainsString( 'notice-error', $out );
	}

	public function test_post_grace_shows_on_non_dashboard_screen(): void {
		$this->set_purchase( -45 );
		set_current_screen( 'edit-post' );
		$out = $this->render();
		$this->assertStringContainsString( 'notice-error', $out );
		$this->assertStringContainsString( 'wpcom-expiry-banner__dismiss', $out );
	}

	public function test_no_reminder_button_in_any_state(): void {
		foreach ( array( 45, 5, 0, -5, -45 ) as $days ) {
			$this->set_purchase( $days );
			$this->assertStringNotContainsString( 'Remind me in', $this->render() );
		}
	}

	private function message_state( array $overrides = array() ): array {
		return array_merge(
			array(
				'state'          => Expiry_Data::STATE_APPROACHING,
				'expiry_ts'      => time() + ( 45 * DAY_IN_SECONDS ),
				'days_remaining' => 45,
				'plan_name'      => 'Business',
				'product_slug'   => 'business-bundle',
				'auto_renew'     => false,
			),
			$overrides
		);
	}

	public function test_heading_and_body_render_as_separate_paragraphs(): void {
		$this->set_purchase( 45 );
		$out = $this->render();
		// The Plans package isn't loaded under test, so the plan name resolves to
		// null and the heading falls back to its no-plan-name variant.
		$this->assertStringContainsString( '<strong>Your plan expires in 45 days</strong>', $out );
		$this->assertStringContainsString( '50 GB of storage', $out );
	}

	public function test_heading_quotes_plan_name_and_days(): void {
		$heading = wpcom_expiry_notices_admin_banner_heading( $this->message_state() );
		$this->assertSame( 'Your Business plan expires in 45 days', $heading );
	}

	public function test_heading_expires_today_never_says_expired(): void {
		$heading = wpcom_expiry_notices_admin_banner_heading( $this->message_state( array( 'days_remaining' => 0 ) ) );
		$this->assertSame( 'Your Business plan expires today', $heading );
	}

	public function test_heading_after_expiry(): void {
		$state = $this->message_state(
			array(
				'state'          => Expiry_Data::STATE_EXPIRED_GRACE,
				'days_remaining' => -5,
			)
		);
		$this->assertSame( 'Your Business plan has expired', wpcom_expiry_notices_admin_banner_heading( $state ) );
	}

	public function test_heading_without_plan_name(): void {
		$state = $this->message_state( array( 'plan_name' => null ) );
		$this->assertSame( 'Your plan expires in 45 days', wpcom_expiry_notices_admin_banner_heading( $state ) );
	}

	public function test_body_early_warning_names_the_expiry_date(): void {
		update_option( 'date_format', 'F j, Y' );
		$state = $this->message_state( array( 'expiry_ts' => 1767225600 ) ); // 2026-01-01.
		$body  = wpcom_expiry_notices_admin_banner_body( $state );
		$this->assertStringContainsString( 'After January 1, 2026,', $body );
		$this->assertStringContainsString( '50 GB of storage', $body );
	}

	public function test_body_early_warning_drops_the_date_when_it_cannot_be_formatted(): void {
		update_option( 'date_format', '' );
		$body = wpcom_expiry_notices_admin_banner_body( $this->message_state() );
		$this->assertStringStartsWith( 'Your site will move to the Free plan,', $body );
		$this->assertStringContainsString( '50 GB of storage', $body );
	}

	public function test_body_final_week_asks_for_renewal(): void {
		$body = wpcom_expiry_notices_admin_banner_body( $this->message_state( array( 'days_remaining' => 5 ) ) );
		$this->assertSame(
			'Your site will move to the Free plan and you’ll lose plugins, custom themes, and 50 GB of storage. Renew now to keep everything in place.',
			$body
		);
	}

	public function test_body_day_of_expiry(): void {
		$body = wpcom_expiry_notices_admin_banner_body( $this->message_state( array( 'days_remaining' => 0 ) ) );
		$this->assertStringContainsString( 'Unless you renew your plan', $body );
		$this->assertStringContainsString( 'Renew now to keep everything in place.', $body );
	}

	public function test_body_grace_mentions_pending_renewal_when_auto_renew_on(): void {
		$state = $this->message_state(
			array(
				'state'          => Expiry_Data::STATE_EXPIRED_GRACE,
				'days_remaining' => -5,
				'auto_renew'     => true,
			)
		);
		$this->assertStringContainsString( 'If renewal doesn’t go through', wpcom_expiry_notices_admin_banner_body( $state ) );
	}

	public function test_body_grace_without_auto_renew_is_unconditional(): void {
		$state = $this->message_state(
			array(
				'state'          => Expiry_Data::STATE_EXPIRED_GRACE,
				'days_remaining' => -5,
			)
		);
		$body  = wpcom_expiry_notices_admin_banner_body( $state );
		$this->assertStringStartsWith( 'Your site will move to the Free plan.', $body );
		$this->assertStringContainsString( 'But it’s not too late.', $body );
	}

	public function test_body_falls_back_to_additional_storage_for_unknown_slug(): void {
		$state = $this->message_state( array( 'product_slug' => 'mystery-bundle' ) );
		$this->assertStringContainsString( 'additional storage', wpcom_expiry_notices_admin_banner_body( $state ) );
	}
}
