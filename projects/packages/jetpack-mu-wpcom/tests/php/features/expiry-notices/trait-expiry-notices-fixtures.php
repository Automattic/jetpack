<?php
/**
 * Fixtures shared by the expiry-notices surface tests.
 *
 * @package automattic/jetpack-mu-wpcom
 */

declare( strict_types = 1 );

use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Jetpack_Mu_Wpcom\Expiry_Notices\Expiry_Notice_Dismiss;
use Automattic\Jetpack\Jetpack_Mu_Wpcom\Expiry_Notices\Expiry_Owner;

trait Expiry_Notices_Fixtures {

	/**
	 * The subscription every fixture purchase belongs to.
	 *
	 * @var string
	 */
	protected $subscription_id = '26532009';

	/**
	 * The WordPress.com account the admin signs in as, and by default the one
	 * that bought the plan.
	 *
	 * @var int
	 */
	protected $admin_wpcom_id = 777;

	/**
	 * @var int
	 */
	protected $admin_id;

	/**
	 * @var int
	 */
	protected $subscriber_id;

	/**
	 * @var string|null
	 */
	private $request_uri;

	/**
	 * Create the users the tests act as, and act as the admin, who owns the plan.
	 */
	protected function set_up_expiry_fixtures(): void {
		$this->request_uri   = $_SERVER['REQUEST_URI'] ?? null;
		$this->admin_id      = wp_insert_user(
			array(
				'user_login' => 'expiry_admin',
				'user_pass'  => 'pass',
				'user_email' => 'expiry_admin@example.com',
				'role'       => 'administrator',
			)
		);
		$this->subscriber_id = wp_insert_user(
			array(
				'user_login' => 'expiry_subscriber',
				'user_pass'  => 'pass',
				'user_email' => 'expiry_subscriber@example.com',
				'role'       => 'subscriber',
			)
		);
		wp_set_current_user( $this->admin_id );
		update_user_meta( $this->admin_id, 'wpcom_user_id', (string) $this->admin_wpcom_id );
		$this->set_plan_owner( $this->admin_wpcom_id );
		$this->flush_expiry_memos();
	}

	protected function tear_down_expiry_fixtures(): void {
		// Restored rather than unset: later suites read it and CI reports the missing key.
		if ( null === $this->request_uri ) {
			unset( $_SERVER['REQUEST_URI'] );
		} else {
			$_SERVER['REQUEST_URI'] = $this->request_uri;
		}
		unset( $GLOBALS['wpcom_get_site_purchases_test_value'] );
		unset( $GLOBALS['wpcom_is_vip_test_value'] );
		unset( $GLOBALS['wpcom_site_stickers_test_value'] );
		foreach ( array( Expiry_Notice_Dismiss::META_BANNER, Expiry_Notice_Dismiss::META_MODAL, Expiry_Notice_Dismiss::META_MODAL_GRACE ) as $meta_key ) {
			delete_user_meta( $this->admin_id, $meta_key );
			delete_user_meta( $this->admin_id, $GLOBALS['wpdb']->get_blog_prefix() . $meta_key );
		}
		delete_transient( $this->owner_cache_key() );
		Constants::clear_constants();
	}

	/**
	 * Drop the per-request memo.
	 */
	protected function flush_expiry_memos(): void {
		wpcom_expiry_notices_eligible_state( true );
	}

	/**
	 * A site the revert has already moved back to Simple.
	 */
	protected function pretend_reverted(): void {
		Constants::set_constant( 'IS_ATOMIC', false );
		Constants::set_constant( 'IS_WPCOM', true );
		$GLOBALS['wpcom_site_stickers_test_value'] = array( 'blog-transfer-reverted' );
		// On Simple the viewer's WordPress.com ID is their user ID.
		$this->set_plan_owner( $this->admin_id );
	}

	/**
	 * Record who bought the plan the way the lookup, a request on Atomic, would have.
	 *
	 * @param int $wpcom_user_id WordPress.com user ID of the owner.
	 */
	protected function set_plan_owner( int $wpcom_user_id ): void {
		set_transient( $this->owner_cache_key(), $wpcom_user_id, HOUR_IN_SECONDS );
		$this->flush_expiry_memos();
	}

	/**
	 * Act as an admin who is not the account that bought the plan.
	 */
	protected function act_as_non_owner(): void {
		$this->set_plan_owner( $this->admin_wpcom_id + 1 );
	}

	private function owner_cache_key(): string {
		return Expiry_Owner::cache_key( array( 'subscription_id' => $this->subscription_id ) );
	}

	/**
	 * The site's one plan purchase, expiring the given number of days from now.
	 *
	 * Half a day of slack: the state floors whole days at read time, so an
	 * expiry at exactly N days becomes N-1 a second later.
	 *
	 * @param int    $days_until_expiry Negative for a plan that has lapsed.
	 * @param bool   $auto_renew        Whether the customer left auto-renew on.
	 * @param string $slug              Product slug.
	 */
	protected function set_purchase( int $days_until_expiry, bool $auto_renew = false, string $slug = 'business-bundle' ): void {
		$GLOBALS['wpcom_get_site_purchases_test_value'] = array(
			(object) array(
				'product_slug'           => $slug,
				'product_type'           => 'bundle',
				'expiry_date'            => gmdate( 'c', time() + ( $days_until_expiry * DAY_IN_SECONDS ) + ( 12 * HOUR_IN_SECONDS ) ),
				'user_allows_auto_renew' => $auto_renew,
				'subscription_id'        => $this->subscription_id,
			),
		);
		$this->flush_expiry_memos();
	}
}
