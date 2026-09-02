<?php
/**
 * Admin Modal Tests
 *
 * @package automattic/jetpack-mu-wpcom
 */

declare( strict_types = 1 );

use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Jetpack_Mu_Wpcom;
use Automattic\Jetpack\Jetpack_Mu_Wpcom\Expiry_Notices\Expiry_Notice_Dismiss;

require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/expiry-notices/expiry-notices.php';
require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/expiry-notices/admin-modal.php';

class Admin_Modal_Test extends \WorDBless\BaseTestCase {

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
				'user_login' => 'modal_admin',
				'user_pass'  => 'pass',
				'user_email' => 'modal_admin@example.com',
				'role'       => 'administrator',
			)
		);
		$this->subscriber_id = wp_insert_user(
			array(
				'user_login' => 'modal_subscriber',
				'user_pass'  => 'pass',
				'user_email' => 'modal_subscriber@example.com',
				'role'       => 'subscriber',
			)
		);
		wp_set_current_user( $this->admin_id );
		wpcom_expiry_notices_eligible_state( true );
		set_current_screen( 'dashboard' );
		Constants::set_constant( 'IS_ATOMIC', true );
		// The modal names the domain the site reverts to; resolving it is an HTTP
		// call, so prime the cache the resolver reads. Tests that care about the
		// domain bullet override this.
		$this->set_revert_domain( null );
	}

	public function tear_down() {
		unset( $GLOBALS['wpcom_get_site_purchases_test_value'] );
		unset( $GLOBALS['wpcom_is_vip_test_value'] );
		delete_user_meta( $this->admin_id, Expiry_Notice_Dismiss::META_MODAL );
		delete_user_meta( $this->admin_id, Expiry_Notice_Dismiss::META_MODAL_GRACE );
		delete_transient( \Automattic\Jetpack\Jetpack_Mu_Wpcom\Expiry_Notices\Expiry_Domain::CACHE_KEY );
		Constants::clear_constants();
		parent::tear_down();
	}

	/**
	 * @param string|null $domain Domain the site reverts to, or null for none.
	 */
	private function set_revert_domain( ?string $domain ): void {
		set_transient(
			\Automattic\Jetpack\Jetpack_Mu_Wpcom\Expiry_Notices\Expiry_Domain::CACHE_KEY,
			$domain ?? \Automattic\Jetpack\Jetpack_Mu_Wpcom\Expiry_Notices\Expiry_Domain::NONE,
			HOUR_IN_SECONDS
		);
	}

	private function set_purchase( int $days_until_expiry, string $slug = 'business-bundle' ): void {
		$GLOBALS['wpcom_get_site_purchases_test_value'] = array(
			(object) array(
				'product_slug'           => $slug,
				'product_type'           => 'bundle',
				// Half a day of slack so a case can't slip into the neighbouring
				// day bucket between this call and the read. Same reasoning as
				// Admin_Banner_Test::set_purchase().
				'expiry_date'            => gmdate( 'c', time() + ( $days_until_expiry * DAY_IN_SECONDS ) + ( 12 * HOUR_IN_SECONDS ) ),
				'user_allows_auto_renew' => false,
			),
		);
		// The eligible-state memo has already answered for the previous fixture.
		wpcom_expiry_notices_eligible_state( true );
	}

	public function test_shows_in_grace_with_the_pre_revert_copy(): void {
		$this->set_purchase( -5 );
		$data = wpcom_expiry_notices_admin_modal_data();

		$this->assertNotNull( $data );
		$this->assertSame( Expiry_Notice_Dismiss::META_MODAL_GRACE, $data['metaKey'] );
		$this->assertStringContainsString( 'will be moved to the Free plan', $data['description'] );
		$this->assertSame( 'Renew now', $data['primary']['label'] );
		// Renewing is still one of two options while the plan can simply be paid for.
		$this->assertNotNull( $data['secondary'] );
		$this->assertStringContainsString( '/plans/', $data['secondary']['url'] );
	}

	public function test_shows_after_grace_with_the_post_revert_copy(): void {
		$this->set_purchase( -45 );
		$data = wpcom_expiry_notices_admin_modal_data();

		$this->assertNotNull( $data );
		$this->assertSame( Expiry_Notice_Dismiss::META_MODAL, $data['metaKey'] );
		$this->assertStringContainsString( 'has been moved to the Free plan', $data['description'] );
		$this->assertSame( 'Restore my site', $data['primary']['label'] );
		// Nothing left to compare once the site is already on Free.
		$this->assertNull( $data['secondary'] );
		$this->assertStringContainsString( 'what changed', $data['listIntro'] );
	}

	public function test_does_not_show_before_expiry(): void {
		foreach ( array( 200, 45, 5, 0 ) as $days ) {
			$this->set_purchase( $days );
			$this->assertNull( wpcom_expiry_notices_admin_modal_data(), "expected no modal {$days} days before expiry" );
		}
	}

	public function test_does_not_show_on_simple_sites(): void {
		// Every change the copy lists is something the Atomic revert does. A
		// Simple site is not reverted, so none of it would be true of one.
		Constants::set_constant( 'IS_ATOMIC', false );
		foreach ( array( -5, -45 ) as $days ) {
			$this->set_purchase( $days );
			$this->assertNull( wpcom_expiry_notices_admin_modal_data(), "expected no modal on a Simple site {$days} days past expiry" );
		}
	}

	public function test_does_not_show_for_non_admins(): void {
		wp_set_current_user( $this->subscriber_id );
		$this->set_purchase( -5 );
		$this->assertNull( wpcom_expiry_notices_admin_modal_data() );
	}

	public function test_does_not_show_on_vip_sites(): void {
		$GLOBALS['wpcom_is_vip_test_value'] = true;
		$this->set_purchase( -5 );
		$this->assertNull( wpcom_expiry_notices_admin_modal_data() );
	}

	public function test_shows_on_every_admin_screen(): void {
		$this->set_purchase( -5 );
		foreach ( array( 'dashboard', 'edit-post', 'options-general' ) as $screen ) {
			set_current_screen( $screen );
			$this->assertNotNull( wpcom_expiry_notices_admin_modal_data(), "expected a modal on {$screen}" );
		}
	}

	public function test_grace_dismissal_lapses_so_the_modal_returns(): void {
		$this->set_purchase( -5 );

		update_user_meta( $this->admin_id, Expiry_Notice_Dismiss::META_MODAL_GRACE, time() );
		$this->assertNull( wpcom_expiry_notices_admin_modal_data(), 'a fresh dismissal should hide the modal' );

		update_user_meta( $this->admin_id, Expiry_Notice_Dismiss::META_MODAL_GRACE, time() - ( Expiry_Notice_Dismiss::MODAL_GRACE_DISMISS_TTL + HOUR_IN_SECONDS ) );
		$this->assertNotNull( wpcom_expiry_notices_admin_modal_data(), 'the site is still lapsing, so a stale dismissal should not hold' );
	}

	public function test_post_grace_dismissal_does_not_lapse(): void {
		$this->set_purchase( -45 );
		// Dismissed 10 days ago -- within this term, since the revert it reports
		// happened at day 30, but far outside the grace TTL, which must not apply
		// once the revert has actually happened.
		update_user_meta( $this->admin_id, Expiry_Notice_Dismiss::META_MODAL, time() - 10 * DAY_IN_SECONDS );
		$this->assertNull( wpcom_expiry_notices_admin_modal_data() );
	}

	public function test_a_grace_dismissal_does_not_bury_the_post_grace_modal(): void {
		// The two states dismiss to separate keys precisely so this can't happen:
		// a grace dismissal is stamped after expiry and would otherwise satisfy
		// the post-grace "belongs to this term" check.
		$this->set_purchase( -45 );
		update_user_meta( $this->admin_id, Expiry_Notice_Dismiss::META_MODAL_GRACE, time() - DAY_IN_SECONDS );
		$this->assertNotNull( wpcom_expiry_notices_admin_modal_data() );
	}

	public function test_dismissal_of_an_earlier_term_shows_again(): void {
		$this->set_purchase( -45 );
		// Dismissed against a purchase that has since been renewed and lapsed
		// again: this revert is news.
		update_user_meta( $this->admin_id, Expiry_Notice_Dismiss::META_MODAL, time() - YEAR_IN_SECONDS );
		$this->assertNotNull( wpcom_expiry_notices_admin_modal_data() );
	}

	public function test_names_the_revert_domain_when_there_is_one(): void {
		$this->set_revert_domain( 'example.wordpress.com' );

		$this->set_purchase( -5 );
		$grace = wpcom_expiry_notices_admin_modal_data();
		$this->assertNotNull( $grace );
		$this->assertStringContainsString( 'Use example.wordpress.com as your primary domain.', implode( "\n", $grace['items'] ) );

		$this->set_purchase( -45 );
		$reverted = wpcom_expiry_notices_admin_modal_data();
		$this->assertNotNull( $reverted );
		$this->assertStringContainsString( 'switched to example.wordpress.com', implode( "\n", $reverted['items'] ) );
	}

	public function test_omits_the_domain_line_when_the_site_keeps_its_domain(): void {
		// A custom primary domain survives the revert, so promising to move the
		// site off it would be false. The resolver answers null and the bullet
		// goes away rather than naming the wrong domain.
		$this->set_revert_domain( null );

		foreach ( array( -5, -45 ) as $days ) {
			$this->set_purchase( $days );
			$data = wpcom_expiry_notices_admin_modal_data();
			$this->assertNotNull( $data, "expected a modal {$days} days past expiry" );
			$this->assertCount( 3, $data['items'], "expected three items {$days} days past expiry" );
			$this->assertStringNotContainsString( 'primary domain', implode( "\n", $data['items'] ) );
		}
	}
}
