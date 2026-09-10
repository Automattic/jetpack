<?php
/**
 * Tests for the loader and the helpers every expiry-notice surface shares.
 *
 * @package automattic/jetpack-mu-wpcom
 */

declare( strict_types = 1 );

use Automattic\Jetpack\Jetpack_Mu_Wpcom;
use Automattic\Jetpack\Jetpack_Mu_Wpcom\Expiry_Notices\Expiry_Data;
use Automattic\Jetpack\Jetpack_Mu_Wpcom\Expiry_Notices\Expiry_Notice_Dismiss;

require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/expiry-notices/expiry-notices.php';
require_once __DIR__ . '/trait-expiry-notices-fixtures.php';

class Expiry_Notices_Test extends \WorDBless\BaseTestCase {
	use Expiry_Notices_Fixtures;

	public function set_up() {
		parent::set_up();
		$this->set_up_expiry_fixtures();
		set_current_screen( 'dashboard' );
	}

	public function tear_down() {
		delete_transient( 'wpcom_expiry_notices_plan_name_business-bundle_' . get_user_locale() );
		remove_all_filters( 'wpcom_expiry_notices_enabled' );
		foreach ( array( Expiry_Notice_Dismiss::META_BANNER, Expiry_Notice_Dismiss::META_MODAL, Expiry_Notice_Dismiss::META_MODAL_GRACE ) as $base ) {
			unregister_meta_key( 'user', Expiry_Notice_Dismiss::meta_key( $base ) );
		}
		$this->tear_down_expiry_fixtures();
		parent::tear_down();
	}

	public function test_the_filter_receives_both_arguments_and_can_hold_a_site_back(): void {
		$received = array();
		add_filter(
			'wpcom_expiry_notices_enabled',
			static function ( $enabled, $percentage ) use ( &$received ) {
				$received = array( $enabled, $percentage );
				return false;
			},
			10,
			2
		);

		$this->assertFalse( wpcom_expiry_notices_is_enabled_for_site() );
		$this->assertSame( array( true, 100 ), $received );
	}

	public function test_eligible_state_needs_an_admin_on_a_regular_site_with_a_lapsing_plan(): void {
		$this->set_purchase( 5 );
		$this->assertNotNull( wpcom_expiry_notices_eligible_state() );

		$this->set_purchase( 200 );
		$this->assertNull( wpcom_expiry_notices_eligible_state(), 'an active plan has nothing to say' );

		unset( $GLOBALS['wpcom_get_site_purchases_test_value'] );
		$this->flush_expiry_memos();
		$this->assertNull( wpcom_expiry_notices_eligible_state(), 'no purchases, no state' );

		$this->set_purchase( 5 );
		$GLOBALS['wpcom_is_vip_test_value'] = true;
		$this->flush_expiry_memos();
		$this->assertNull( wpcom_expiry_notices_eligible_state(), 'the Simple notice this replaces skipped VIP sites' );

		unset( $GLOBALS['wpcom_is_vip_test_value'] );
		wp_set_current_user( $this->subscriber_id );
		$this->flush_expiry_memos();
		$this->assertNull( wpcom_expiry_notices_eligible_state(), 'only admins are told' );
	}

	public function test_registers_the_dismiss_meta_in_admin_but_not_on_the_front_end(): void {
		set_current_screen( 'front' );
		wpcom_expiry_notices_register_meta();
		$this->assertArrayNotHasKey( Expiry_Notice_Dismiss::banner_meta_key(), get_registered_meta_keys( 'user' ) );

		set_current_screen( 'dashboard' );
		wpcom_expiry_notices_register_meta();
		$registered = get_registered_meta_keys( 'user' );
		foreach ( array( Expiry_Notice_Dismiss::META_BANNER, Expiry_Notice_Dismiss::META_MODAL, Expiry_Notice_Dismiss::META_MODAL_GRACE ) as $base ) {
			$this->assertArrayHasKey( Expiry_Notice_Dismiss::meta_key( $base ), $registered );
		}
	}

	public function test_registers_meta_on_rest_api_init(): void {
		$this->assertNotFalse(
			has_action( 'rest_api_init', 'wpcom_expiry_notices_register_meta' ),
			'the meta keys must also register on rest_api_init, or dismissals silently no-op'
		);
	}

	public function test_current_url_drops_one_shot_query_args(): void {
		$_SERVER['REQUEST_URI'] = '/wp-admin/edit.php?post_type=page&settings-updated=true';
		$this->assertSame( admin_url( 'edit.php?post_type=page' ), wpcom_expiry_notices_current_url() );

		set_current_screen( 'front' );
		$_SERVER['REQUEST_URI'] = '/about/?utm_source=x&updated=1';
		$this->assertSame( home_url( '/about/?utm_source=x' ), wpcom_expiry_notices_current_url() );
	}

	/**
	 * A state for the copy helpers, with the plan name for its slug already remembered.
	 *
	 * @param array<string,mixed> $overrides State fields to set.
	 */
	private function message_state( array $overrides = array() ): array {
		set_transient( 'wpcom_expiry_notices_plan_name_business-bundle_' . get_user_locale(), 'Business', HOUR_IN_SECONDS );
		return array_merge(
			array(
				'state'          => Expiry_Data::STATE_APPROACHING,
				'expiry_ts'      => time() + ( 45 * DAY_IN_SECONDS ),
				'days_remaining' => 45,
				'product_slug'   => 'business-bundle',
				'auto_renew'     => false,
			),
			$overrides
		);
	}

	public function test_heading_names_the_plan_and_the_time_left(): void {
		$cases = array(
			'Your Business plan expires in 45 days'    => array(),
			'Your Business plan expires in 1 day'      => array( 'days_remaining' => 1 ),
			'Your Business plan expires today'         => array( 'days_remaining' => 0 ),
			'Your Business plan has 45 days remaining' => array( 'auto_renew' => true ),
			'Your Business plan has expired'           => array(
				'state'          => Expiry_Data::STATE_EXPIRED_GRACE,
				'days_remaining' => -5,
			),
			'Your plan expires in 45 days'             => array( 'product_slug' => 'mystery-bundle' ),
		);
		foreach ( $cases as $expected => $overrides ) {
			$this->assertSame( $expected, wpcom_expiry_notices_banner_heading( $this->message_state( $overrides ) ) );
		}

		// The day of expiry is never "expired", and never a neutral countdown either.
		$this->assertSame(
			'Your Business plan expires today',
			wpcom_expiry_notices_banner_heading(
				$this->message_state(
					array(
						'days_remaining' => 0,
						'auto_renew'     => true,
					)
				)
			)
		);
	}

	public function test_body_describes_each_stage(): void {
		$cases = array(
			array(
				array( 'days_remaining' => 5 ),
				'Your site will move to the Free plan and you’ll lose plugins, custom themes, and 50 GB of storage. Renew now to keep everything in place.',
			),
			array(
				array( 'days_remaining' => 0 ),
				'Unless you renew your plan, your site will move to the Free plan, and you’ll lose plugins, custom themes, and 50 GB of storage. Renew now to keep everything in place.',
			),
			array(
				array( 'auto_renew' => true ),
				'If renewal doesn’t go through, your site will move to the Free plan, and you’ll lose access to plugins, custom themes, and 50 GB of storage.',
			),
			array(
				array(
					'days_remaining' => 5,
					'auto_renew'     => true,
				),
				'If renewal doesn’t go through, your site will move to the Free plan and you’ll lose plugins, custom themes, and 50 GB of storage. Renew now to keep everything in place.',
			),
			array(
				array(
					'days_remaining' => 0,
					'auto_renew'     => true,
				),
				'If renewal doesn’t go through, your site will move to the Free plan and you’ll lose plugins, custom themes, and 50 GB of storage. Renew now to keep everything in place.',
			),
			array(
				array(
					'state'          => Expiry_Data::STATE_EXPIRED_GRACE,
					'days_remaining' => -5,
					'auto_renew'     => true,
				),
				'If renewal doesn’t go through, your site will move to the Free plan. That means losing plugins, custom themes, and 50 GB of storage. But it’s not too late. Renew now to keep your site as it is.',
			),
			array(
				array(
					'state'          => Expiry_Data::STATE_EXPIRED_GRACE,
					'days_remaining' => -5,
				),
				'Your site will move to the Free plan. That means losing plugins, custom themes, and 50 GB of storage. But it’s not too late. Renew now to keep your site as it is.',
			),
			array(
				array(
					'state'          => Expiry_Data::STATE_EXPIRED,
					'days_remaining' => -45,
				),
				'Your site has been moved to the Free plan. You no longer have access to plugins, custom themes, or 50 GB of storage. Upgrade your plan to restore your site.',
			),
			array(
				array( 'product_slug' => 'mystery-bundle' ),
				'Your site will move to the Free plan, which means you’ll lose access to plugins, custom themes, and additional storage.',
			),
		);
		update_option( 'date_format', '' );
		foreach ( $cases as list( $overrides, $expected ) ) {
			$this->assertSame( $expected, wpcom_expiry_notices_banner_body( $this->message_state( $overrides ), true ) );
		}

		$this->assertSame(
			'This plan was purchased by a different WordPress.com account. To manage this plan, log in to that account or contact the account owner.',
			wpcom_expiry_notices_banner_body( $this->message_state(), false )
		);
	}

	public function test_the_early_reminder_names_the_expiry_date_when_it_can(): void {
		$state = $this->message_state( array( 'expiry_ts' => 1767225600 ) ); // 2026-01-01.

		update_option( 'date_format', 'F j, Y' );
		$this->assertSame(
			'After January 1, 2026, your site will move to the Free plan, which means you’ll lose access to plugins, custom themes, and 50 GB of storage.',
			wpcom_expiry_notices_banner_body( $state, true )
		);

		update_option( 'date_format', '' );
		$this->assertStringStartsWith( 'Your site will move to the Free plan,', wpcom_expiry_notices_banner_body( $state, true ) );
	}

	public function test_after_the_revert_the_body_and_cta_ask_for_support(): void {
		$this->pretend_reverted();
		$state = $this->message_state(
			array(
				'state'          => Expiry_Data::STATE_EXPIRED,
				'days_remaining' => -45,
			)
		);

		$this->assertSame(
			'Your site has been moved to the Free plan and set to private. You no longer have access to plugins, custom themes, or 50 GB of storage. Contact support to get help restoring it.',
			wpcom_expiry_notices_banner_body( $state, true )
		);

		$cta = wpcom_expiry_notices_banner_urls( $state, '' )['primary'];
		$this->assertSame( 'Contact support', $cta['label'] );
		$this->assertSame( 'My Business plan expired and I need your help getting it restored.', $cta['message'] );
		$this->assertStringContainsString( 'wordpress.com/help', $cta['url'] );

		$this->assertSame(
			'My plan expired and I need your help getting it restored.',
			wpcom_expiry_notices_support_cta( array( 'product_slug' => 'mystery-bundle' ) )['message']
		);
	}

	public function test_the_sentence_joins_heading_and_body(): void {
		$this->assertSame(
			'Your Business plan expires in 5 days. Your site will move to the Free plan and you’ll lose plugins, custom themes, and 50 GB of storage. Renew now to keep everything in place.',
			wpcom_expiry_notices_banner_sentence( $this->message_state( array( 'days_remaining' => 5 ) ), true )
		);
	}
}
