<?php
/**
 * Tests for the dashboard capability layer.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

use PHPUnit\Framework\Attributes\CoversFunction;
use WorDBless\BaseTestCase;

require_once __DIR__ . '/../../src/capabilities.php';
require_once __DIR__ . '/traits/trait-analytics-capabilities.php';

/**
 * @covers ::Automattic\Jetpack\PremiumAnalytics\map_analytics_meta_caps
 * @covers ::Automattic\Jetpack\PremiumAnalytics\register_capabilities
 * @covers ::Automattic\Jetpack\PremiumAnalytics\current_user_can_view_analytics
 * @covers ::Automattic\Jetpack\PremiumAnalytics\current_user_can_view_commerce_analytics
 */
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\map_analytics_meta_caps' )]
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\register_capabilities' )]
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\current_user_can_view_analytics' )]
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\current_user_can_view_commerce_analytics' )]
class Capabilities_Test extends BaseTestCase {

	use Analytics_Capabilities_Trait;

	/**
	 * Drop this test's stand-in for the Stats mapping, then put back the mapping
	 * under test — capabilities.php hooks it on include, which is once per run.
	 */
	public function tear_down() {
		remove_all_filters( 'map_meta_cap' );
		register_capabilities();
		wp_set_current_user( 0 );

		parent::tear_down();
	}

	/**
	 * Administrators reach the dashboard through manage_options, with no help from
	 * the Stats mapping — which is absent on platforms that never boot Stats.
	 */
	public function test_administrator_can_view_analytics_without_the_stats_mapping() {
		$this->login_as( 'administrator' );

		$this->assertTrue( current_user_can_view_analytics() );
	}

	/**
	 * The point of the issue: an editor the site granted view_stats keeps access.
	 */
	public function test_editor_granted_view_stats_can_view_analytics() {
		$user_id = $this->login_as( 'editor' );
		$this->grant_view_stats_to( $user_id );

		$this->assertTrue( current_user_can_view_analytics() );
	}

	/**
	 * An editor the site never granted view_stats gets nothing.
	 */
	public function test_plain_editor_cannot_view_analytics() {
		$this->login_as( 'editor' );

		$this->assertFalse( current_user_can_view_analytics() );
	}

	/**
	 * Logged out is not a reader.
	 */
	public function test_logged_out_user_cannot_view_analytics() {
		wp_set_current_user( 0 );

		$this->assertFalse( current_user_can_view_analytics() );
	}

	/**
	 * Capabilities other than ours pass through the mapping untouched.
	 */
	public function test_mapping_leaves_other_capabilities_alone() {
		$this->assertSame(
			array( 'edit_posts' ),
			map_analytics_meta_caps( array( 'edit_posts' ), 'edit_posts', 1 )
		);
	}

	/**
	 * Commerce surfaces stay administrator-only: view_stats is not enough.
	 */
	public function test_view_stats_reader_cannot_view_commerce_analytics() {
		$user_id = $this->login_as( 'editor' );
		$this->grant_view_stats_to( $user_id );

		$this->assertTrue( current_user_can_view_analytics() );
		$this->assertFalse( current_user_can_view_commerce_analytics() );
	}

	/**
	 * Administrators keep the commerce surfaces.
	 */
	public function test_administrator_can_view_commerce_analytics() {
		$this->login_as( 'administrator' );

		$this->assertTrue( current_user_can_view_commerce_analytics() );
	}
}
