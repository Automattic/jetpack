<?php
/**
 * @package automattic/jetpack-menu-badges
 */

namespace Automattic\Jetpack\Menu_Badges;

use PHPUnit\Framework\TestCase;

class Notification_Counts_Test extends TestCase {

	protected function tearDown(): void {
		Notification_Counts::reset();
		remove_all_filters( 'jetpack_menu_notification_counts' );
		parent::tearDown();
	}

	public function test_total_sums_counts_and_counts_attention_as_one() {
		Notification_Counts::register(
			'forms',
			array(
				'menu_slug' => 'jetpack-forms-responses-wp-admin',
				'count'     => 15,
				'type'      => 'count',
			)
		);
		Notification_Counts::register(
			'protect',
			array(
				'menu_slug' => 'jetpack-protect',
				'count'     => 3,
				'type'      => 'count',
			)
		);
		Notification_Counts::register(
			'plan-expiring',
			array(
				'menu_slug' => 'my-jetpack',
				'type'      => 'attention',
			)
		);

		$this->assertSame( 19, Notification_Counts::get_total() ); // 15 + 3 + 1
	}

	public function test_get_for_menu_returns_that_items_count() {
		Notification_Counts::register(
			'forms',
			array(
				'menu_slug' => 'jetpack-forms-responses-wp-admin',
				'count'     => 15,
				'type'      => 'count',
			)
		);
		Notification_Counts::register(
			'protect',
			array(
				'menu_slug' => 'jetpack-protect',
				'count'     => 3,
				'type'      => 'count',
			)
		);

		$this->assertSame( 15, Notification_Counts::get_for_menu( 'jetpack-forms-responses-wp-admin' ) );
		$this->assertSame( 3, Notification_Counts::get_for_menu( 'jetpack-protect' ) );
		$this->assertSame( 0, Notification_Counts::get_for_menu( 'nonexistent' ) );
	}

	public function test_silent_entries_are_excluded() {
		Notification_Counts::register(
			'forms',
			array(
				'menu_slug' => 'x',
				'count'     => 5,
			)
		);
		Notification_Counts::register(
			'welcome',
			array(
				'menu_slug' => 'my-jetpack',
				'type'      => 'attention',
				'is_silent' => true,
			)
		);

		$this->assertSame( 5, Notification_Counts::get_total() );
		$this->assertArrayNotHasKey( 'welcome', Notification_Counts::all() );
	}

	public function test_reregistering_same_id_overwrites() {
		Notification_Counts::register(
			'forms',
			array(
				'menu_slug' => 'x',
				'count'     => 15,
			)
		);
		Notification_Counts::register(
			'forms',
			array(
				'menu_slug' => 'x',
				'count'     => 14,
			)
		);

		$this->assertSame( 14, Notification_Counts::get_total() );
	}

	public function test_filter_can_add_entries() {
		add_filter(
			'jetpack_menu_notification_counts',
			function ( $entries ) {
				$entries['third-party'] = array(
					'menu_slug' => 'x',
					'count'     => 2,
					'type'      => 'count',
				);
				return $entries;
			}
		);

		$this->assertSame( 2, Notification_Counts::get_total() );
	}
}
