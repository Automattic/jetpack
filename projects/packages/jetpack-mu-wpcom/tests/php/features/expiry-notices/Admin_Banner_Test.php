<?php
/**
 * Admin Banner Tests
 *
 * @package automattic/jetpack-mu-wpcom
 */

declare( strict_types = 1 );

use Automattic\Jetpack\Jetpack_Mu_Wpcom;
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
		$this->assertStringContainsString( 'wpcom-expiry-banner__remind', $out );
	}

	public function test_renders_for_expired_grace_state(): void {
		$this->set_purchase( -5 );
		$out = $this->render();
		$this->assertStringContainsString( 'notice-error', $out );
		$this->assertStringContainsString( '/checkout/business-bundle/', $out );
		$this->assertStringContainsString( '/plans/', $out );
		$this->assertStringNotContainsString( 'wpcom-expiry-banner__remind', $out );
	}

	public function test_renders_for_expired_post_grace_state(): void {
		$this->set_purchase( -45 );
		$out = $this->render();
		$this->assertStringContainsString( 'notice-error', $out );
		$this->assertStringContainsString( 'wpcom-expiry-banner__remind', $out );
		$this->assertStringNotContainsString( '/plans/', $out );
	}

	public function test_post_grace_recent_dismiss_hides_for_cadence(): void {
		$this->set_purchase( -45 );
		update_user_meta( $this->admin_id, Expiry_Notice_Dismiss::META_BANNER, time() - DAY_IN_SECONDS );
		$this->assertSame( '', $this->render() );
	}

	public function test_post_grace_old_dismiss_reappears_after_cadence(): void {
		$this->set_purchase( -45 );
		update_user_meta( $this->admin_id, Expiry_Notice_Dismiss::META_BANNER, time() - ( 14 * DAY_IN_SECONDS ) );
		$out = $this->render();
		$this->assertStringContainsString( 'notice-error', $out );
		$this->assertStringContainsString( 'wpcom-expiry-banner__remind', $out );
	}

	public function test_final_7_days_renders_as_error_with_no_dismiss(): void {
		$this->set_purchase( 5 );
		$out = $this->render();
		$this->assertStringContainsString( 'notice-error', $out );
		$this->assertStringNotContainsString( 'notice-warning', $out );
		$this->assertStringNotContainsString( 'wpcom-expiry-banner__remind', $out );
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

	public function test_hides_when_recently_dismissed_within_cadence(): void {
		$this->set_purchase( 45 );
		update_user_meta( $this->admin_id, Expiry_Notice_Dismiss::META_BANNER, time() - DAY_IN_SECONDS );
		$this->assertSame( '', $this->render() );
	}

	public function test_cadence_above_zero_hides_on_non_dashboard_screen(): void {
		$this->set_purchase( 45 );
		set_current_screen( 'edit-post' );
		$this->assertSame( '', $this->render() );
	}

	public function test_cadence_zero_shows_on_non_dashboard_screen(): void {
		$this->set_purchase( 5 );
		set_current_screen( 'edit-post' );
		$out = $this->render();
		$this->assertStringContainsString( 'notice-error', $out );
	}
}
