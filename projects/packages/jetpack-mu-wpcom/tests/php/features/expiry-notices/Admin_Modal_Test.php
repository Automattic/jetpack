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
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunInSeparateProcess;

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
		wpcom_expiry_notices_admin_modal_data( true );
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
		unset( $GLOBALS['wpcom_blog_details_domain_test_value'] );
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

	/**
	 * A site the revert has already moved back to Simple.
	 *
	 * `has_blog_sticker` is declared per test because other suites declare their
	 * own, and a shared definition makes theirs a fatal redeclare -- hence the
	 * separate process on every caller.
	 */
	private function pretend_reverted_to_simple(): void {
		Constants::set_constant( 'IS_ATOMIC', false );
		Constants::set_constant( 'IS_WPCOM', true );
		if ( ! function_exists( 'has_blog_sticker' ) ) {
			eval( 'namespace { function has_blog_sticker( $sticker, $blog_id = 0 ) { return "blog-transfer-reverted" === $sticker; } }' ); // phpcs:ignore Squiz.PHP.Eval.Discouraged,MediaWiki.Usage.ForbiddenFunctions.eval
		}
	}

	/**
	 * Record a dismissal and clear the modal memo, which in production could not
	 * change inside one request.
	 *
	 * @param string $meta_key Dismiss meta key.
	 * @param int    $when     Timestamp to store.
	 */
	private function set_dismissed( string $meta_key, int $when ): void {
		update_user_meta( $this->admin_id, $meta_key, $when );
		wpcom_expiry_notices_admin_modal_data( true );
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
		// Both memos have already answered for the previous fixture.
		wpcom_expiry_notices_eligible_state( true );
		wpcom_expiry_notices_admin_modal_data( true );
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

	/**
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_shows_after_grace_with_the_post_revert_copy(): void {
		$this->pretend_reverted_to_simple();
		$this->set_purchase( -45 );
		$data = wpcom_expiry_notices_admin_modal_data();

		$this->assertNotNull( $data );
		$this->assertSame( Expiry_Notice_Dismiss::META_MODAL, $data['metaKey'] );
		$this->assertStringContainsString( 'has been moved to the Free plan', $data['description'] );
		$this->assertSame( 'Contact support', $data['primary']['label'] );
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

	public function test_does_not_show_on_a_simple_site_that_was_never_atomic(): void {
		// Every change the copy lists is something the revert does, and a site
		// that never carried a transfer is never reverted.
		Constants::set_constant( 'IS_ATOMIC', false );
		foreach ( array( -5, -45 ) as $days ) {
			$this->set_purchase( $days );
			$this->assertNull( wpcom_expiry_notices_admin_modal_data(), "expected no modal on a Simple site {$days} days past expiry" );
		}
	}

	/**
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_does_not_show_in_grace_on_a_reverted_site(): void {
		// A site already reverted was reverted by an earlier lapse. This one has
		// not reached the changes the pre-revert variant promises are coming.
		$this->pretend_reverted_to_simple();

		$this->set_purchase( -5 );
		$this->assertNull( wpcom_expiry_notices_admin_modal_data() );
	}

	/**
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_shows_for_any_plan_that_could_have_carried_a_transfer(): void {
		// WPCOM_Features::ATOMIC is granted to Personal and higher, so there is no
		// paid tier whose lapse could not have produced this revert. Narrowing to
		// Business would hide the modal from most of the sites it is meant for.
		$this->pretend_reverted_to_simple();

		foreach ( array( 'personal-bundle', 'value_bundle', 'business-bundle' ) as $slug ) {
			$this->set_purchase( -45, $slug );
			$this->assertNotNull( wpcom_expiry_notices_admin_modal_data(), "expected a modal for {$slug}" );
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

		$this->set_dismissed( Expiry_Notice_Dismiss::META_MODAL_GRACE, time() );
		$this->assertNull( wpcom_expiry_notices_admin_modal_data(), 'a fresh dismissal should hide the modal' );

		$this->set_dismissed( Expiry_Notice_Dismiss::META_MODAL_GRACE, time() - ( Expiry_Notice_Dismiss::MODAL_GRACE_DISMISS_TTL + HOUR_IN_SECONDS ) );
		$this->assertNotNull( wpcom_expiry_notices_admin_modal_data(), 'the site is still lapsing, so a stale dismissal should not hold' );
	}

	/**
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_post_grace_dismissal_does_not_lapse(): void {
		$this->pretend_reverted_to_simple();
		$this->set_purchase( -45 );
		// Dismissed 10 days ago -- within this term, since the revert it reports
		// happened at day 30, but far outside the grace TTL, which must not apply
		// once the revert has actually happened.
		$this->set_dismissed( Expiry_Notice_Dismiss::META_MODAL, time() - 10 * DAY_IN_SECONDS );
		$this->assertNull( wpcom_expiry_notices_admin_modal_data() );
	}

	/**
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_a_grace_dismissal_does_not_bury_the_post_grace_modal(): void {
		$this->pretend_reverted_to_simple();
		// The two states dismiss to separate keys precisely so this can't happen:
		// a grace dismissal is stamped after expiry and would otherwise satisfy
		// the post-grace "belongs to this term" check.
		$this->set_purchase( -45 );
		$this->set_dismissed( Expiry_Notice_Dismiss::META_MODAL_GRACE, time() - DAY_IN_SECONDS );
		$this->assertNotNull( wpcom_expiry_notices_admin_modal_data() );
	}

	/**
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_dismissal_of_an_earlier_term_shows_again(): void {
		$this->pretend_reverted_to_simple();
		$this->set_purchase( -45 );
		// Dismissed against a purchase that has since been renewed and lapsed
		// again: this revert is news.
		$this->set_dismissed( Expiry_Notice_Dismiss::META_MODAL, time() - YEAR_IN_SECONDS );
		$this->assertNotNull( wpcom_expiry_notices_admin_modal_data() );
	}

	public function test_names_the_domain_the_site_will_move_to_in_grace(): void {
		$this->set_revert_domain( 'example.wordpress.com' );

		$this->set_purchase( -5 );
		$grace = wpcom_expiry_notices_admin_modal_data();

		$this->assertNotNull( $grace );
		$this->assertStringContainsString( 'Use example.wordpress.com as your primary domain.', implode( "\n", $grace['items'] ) );
	}

	/**
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_names_the_domain_the_site_moved_to_after_the_revert(): void {
		$this->pretend_reverted_to_simple();
		// WorDBless serves example.org, so a matching blogs-table domain is a site
		// sitting on its own unmapped address -- the switch already happened.
		$GLOBALS['wpcom_blog_details_domain_test_value'] = 'example.org';

		$this->set_purchase( -45 );
		$reverted = wpcom_expiry_notices_admin_modal_data();

		$this->assertNotNull( $reverted );
		$this->assertStringContainsString( 'switched to example.org', implode( "\n", $reverted['items'] ) );
	}

	public function test_omits_the_domain_line_when_the_site_keeps_its_domain(): void {
		// A custom primary domain survives the revert, so promising to move the
		// site off it would be false. The resolver answers null and the bullet
		// goes away rather than naming the wrong domain.
		$this->set_revert_domain( null );

		$this->set_purchase( -5 );
		$data = wpcom_expiry_notices_admin_modal_data();
		$this->assertNotNull( $data );
		$this->assertCount( 3, $data['items'] );
		$this->assertStringNotContainsString( 'primary domain', implode( "\n", $data['items'] ) );
	}

	/**
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_omits_the_domain_when_a_reverted_site_kept_its_own(): void {
		// Serving from example.org while the blogs table says otherwise: the
		// custom domain survived the revert, so nothing was switched.
		$this->pretend_reverted_to_simple();
		$GLOBALS['wpcom_blog_details_domain_test_value'] = 'unused.wordpress.com';

		$this->set_purchase( -45 );
		$data = wpcom_expiry_notices_admin_modal_data();

		$this->assertNotNull( $data );
		$this->assertStringNotContainsString( 'primary domain', implode( "\n", $data['items'] ) );
	}

	/**
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_the_support_cta_prefills_a_message(): void {
		$this->pretend_reverted_to_simple();
		$this->set_purchase( -45 );
		$data = wpcom_expiry_notices_admin_modal_data();

		$this->assertNotNull( $data );
		$this->assertStringContainsString( 'I need your help getting it restored', $data['primary']['message'] );
		// A click the Help Center cannot answer still has to land somewhere.
		$this->assertStringContainsString( 'wordpress.com/help', $data['primary']['url'] );
	}

	public function test_the_support_message_names_the_plan_when_it_is_known(): void {
		// Plans::get_plan_short_name() does not resolve in this environment, so
		// drive the two branches from the state directly.
		$this->assertSame(
			'My Business plan expired and I need your help getting it restored.',
			wpcom_expiry_notices_support_cta( array( 'plan_name' => 'Business' ) )['message']
		);
		// A sentence with a hole in it is worse than one without the name.
		$this->assertSame(
			'My plan expired and I need your help getting it restored.',
			wpcom_expiry_notices_support_cta( array( 'plan_name' => null ) )['message']
		);
	}

	public function test_the_grace_cta_is_still_checkout(): void {
		// Renewing still saves the site while the revert is ahead of it.
		$this->set_purchase( -5 );
		$data = wpcom_expiry_notices_admin_modal_data();

		$this->assertNotNull( $data );
		$this->assertStringContainsString( '/checkout/', $data['primary']['url'] );
		$this->assertArrayNotHasKey( 'message', $data['primary'] );
	}

	public function test_waits_for_the_revert_rather_than_the_date(): void {
		// The post-grace state opens 30 days after expiry, but the revert runs off
		// the subscription-removal record and can lag it. In that gap the site is
		// still Atomic and still renewable, so past-tense copy would be untrue.
		Constants::set_constant( 'IS_ATOMIC', true );
		$this->set_purchase( -45 );

		$this->assertNull( wpcom_expiry_notices_admin_modal_data() );
	}
}
