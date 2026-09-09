<?php
/**
 * Admin Modal Tests
 *
 * @package automattic/jetpack-mu-wpcom
 */

declare( strict_types = 1 );

use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Jetpack_Mu_Wpcom;
use Automattic\Jetpack\Jetpack_Mu_Wpcom\Expiry_Notices\Expiry_Domain;
use Automattic\Jetpack\Jetpack_Mu_Wpcom\Expiry_Notices\Expiry_Notice_Dismiss;
use Automattic\Jetpack\Jetpack_Mu_Wpcom\Expiry_Notices\Expiry_Wpcom;

require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/expiry-notices/expiry-notices.php';
require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/expiry-notices/admin-modal.php';
require_once __DIR__ . '/trait-expiry-notices-fixtures.php';

class Admin_Modal_Test extends \WorDBless\BaseTestCase {
	use Expiry_Notices_Fixtures;

	public function set_up() {
		parent::set_up();
		$this->set_up_expiry_fixtures();
		set_current_screen( 'dashboard' );
		Constants::set_constant( 'IS_ATOMIC', true );
		$this->set_revert_domain( null );
	}

	public function tear_down() {
		delete_transient( Expiry_Domain::CACHE_KEY );
		$this->tear_down_expiry_fixtures();
		parent::tear_down();
	}

	/**
	 * Prime the remembered domain lookup, which is a request on Atomic.
	 *
	 * @param string|null $domain Domain the site reverts to, or null for none.
	 */
	private function set_revert_domain( ?string $domain ): void {
		set_transient( Expiry_Domain::CACHE_KEY, $domain ?? Expiry_Wpcom::NONE, HOUR_IN_SECONDS );
	}

	public function test_shows_in_grace_with_the_pre_revert_copy(): void {
		$this->set_purchase( -5 );
		$data = wpcom_expiry_notices_admin_modal_data();

		$this->assertNotNull( $data );
		$this->assertSame( Expiry_Notice_Dismiss::META_MODAL_GRACE, $data['metaKey'] );
		$this->assertStringContainsString( 'will be moved to the Free plan', $data['description'] );
		$this->assertSame( 'Renew now', $data['primary']['label'] );
		$this->assertStringContainsString( '/checkout/', $data['primary']['url'] );
		$this->assertArrayNotHasKey( 'message', $data['primary'] );
		$this->assertStringContainsString( '/plans/', $data['secondary']['url'] );
	}

	public function test_shows_after_grace_with_the_post_revert_copy(): void {
		$this->pretend_reverted();
		$this->set_purchase( -45 );
		$data = wpcom_expiry_notices_admin_modal_data();

		$this->assertNotNull( $data );
		$this->assertSame( Expiry_Notice_Dismiss::META_MODAL, $data['metaKey'] );
		$this->assertStringContainsString( 'has been moved to the Free plan', $data['description'] );
		$this->assertStringContainsString( 'what changed', $data['listIntro'] );
		$this->assertSame( 'Contact support', $data['primary']['label'] );
		$this->assertStringContainsString( 'I need your help getting it restored', $data['primary']['message'] );
		$this->assertStringContainsString( 'wordpress.com/help', $data['primary']['url'] );
		$this->assertNull( $data['secondary'] );
	}

	public function test_does_not_show_before_expiry(): void {
		foreach ( array( 45, 0 ) as $days ) {
			$this->set_purchase( $days );
			$this->assertNull( wpcom_expiry_notices_admin_modal_data(), "expected no modal {$days} days before expiry" );
		}
	}

	public function test_does_not_show_on_a_simple_site_that_was_never_atomic(): void {
		// Every change the copy lists is something the revert does.
		Constants::set_constant( 'IS_ATOMIC', false );
		foreach ( array( -5, -45 ) as $days ) {
			$this->set_purchase( $days );
			$this->assertNull( wpcom_expiry_notices_admin_modal_data(), "expected no modal on a Simple site {$days} days past expiry" );
		}
	}

	public function test_does_not_show_in_grace_on_a_reverted_site(): void {
		// Reverted by an earlier lapse: the changes the grace copy promises are behind it.
		$this->pretend_reverted();
		$this->set_purchase( -5 );
		$this->assertNull( wpcom_expiry_notices_admin_modal_data() );
	}

	public function test_waits_for_the_revert_rather_than_the_date(): void {
		// Post-grace by date, but the revert lags the subscription-removal record.
		$this->set_purchase( -45 );
		$this->assertNull( wpcom_expiry_notices_admin_modal_data() );
	}

	public function test_does_not_show_to_an_admin_who_cannot_renew(): void {
		$this->act_as_non_owner();
		$this->set_purchase( -5 );
		$this->assertNull( wpcom_expiry_notices_admin_modal_data() );

		$this->set_plan_owner( $this->admin_wpcom_id );
		$this->assertNotNull( wpcom_expiry_notices_admin_modal_data() );
	}

	public function test_grace_dismissal_lapses_so_the_modal_returns(): void {
		$this->set_purchase( -5 );

		update_user_meta( $this->admin_id, Expiry_Notice_Dismiss::META_MODAL_GRACE, time() );
		$this->assertNull( wpcom_expiry_notices_admin_modal_data() );

		update_user_meta( $this->admin_id, Expiry_Notice_Dismiss::META_MODAL_GRACE, time() - ( Expiry_Notice_Dismiss::MODAL_GRACE_DISMISS_TTL + HOUR_IN_SECONDS ) );
		$this->assertNotNull( wpcom_expiry_notices_admin_modal_data() );
	}

	public function test_names_the_domain_the_site_will_move_to_only_when_there_is_one(): void {
		$this->set_purchase( -5 );

		$this->set_revert_domain( 'example.wordpress.com' );
		$items = wpcom_expiry_notices_admin_modal_data()['items'];
		$this->assertCount( 4, $items );
		$this->assertSame( 'Use example.wordpress.com as your primary domain.', $items[0] );

		$this->set_revert_domain( null );
		$items = wpcom_expiry_notices_admin_modal_data()['items'];
		$this->assertCount( 3, $items );
		$this->assertStringNotContainsString( 'primary domain', implode( "\n", $items ) );
	}

	public function test_the_script_carries_the_modal_and_its_track_props(): void {
		$this->set_purchase( -5 );
		wpcom_expiry_notices_enqueue_admin_modal_assets();

		$this->assertTrue( wp_style_is( 'wp-components', 'enqueued' ) );
		$inline = wp_scripts()->get_inline_script_data( 'jetpack-mu-wpcom-expiry-notices-admin-modal', 'before' );
		$this->assertStringContainsString( 'window.wpcomExpiryModal = {', $inline );
		$this->assertStringContainsString( '"is_plan_owner":"true"', $inline );
		$this->assertStringContainsString( '"surface":"wp_admin"', $inline );
	}
}
