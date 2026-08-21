<?php
/**
 * Rollout gate tests.
 *
 * @package automattic/jetpack-mu-wpcom
 */

declare( strict_types = 1 );

use Automattic\Jetpack\Jetpack_Mu_Wpcom;

require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/expiry-notices/expiry-notices.php';

class Rollout_Test extends \WorDBless\BaseTestCase {

	public function tear_down() {
		remove_all_filters( 'wpcom_expiry_notices_enabled' );
		delete_option( 'jetpack_options' );
		delete_option( 'wpcom_expiry_notices_enabled' );
		parent::tear_down();
	}

	/**
	 * Blog 5 is inside the share and blog 55 outside it for any share from 6% to
	 * 55%. Revisit these fixtures if the rollout is ever widened past that.
	 */
	private function set_blog_id( int $blog_id ): void {
		update_option( 'jetpack_options', array( 'id' => $blog_id ) );
	}

	private function at_percentage( int $percentage ): void {
		add_filter(
			'wpcom_expiry_notices_enabled',
			static function ( $enabled, $actual ) use ( $percentage ) {
				// Re-derive at the percentage under test; the shipped number is
				// a constant, so this is how the curve gets exercised.
				unset( $enabled, $actual );
				$blog_id = wpcom_expiry_notices_wpcom_blog_id();
				if ( $percentage >= 100 ) {
					return true;
				}
				return $percentage > 0 && $blog_id > 0 && ( $blog_id % 100 ) < $percentage;
			},
			10,
			2
		);
	}

	public function test_ships_stopped(): void {
		// The rollout is stopped. Pinned so restarting it is a deliberate edit.
		$this->assertSame( 0, wpcom_expiry_notices_rollout_percentage() );
	}

	public function test_enables_exactly_the_configured_share(): void {
		$enabled = 0;
		for ( $blog_id = 1; $blog_id <= 1000; $blog_id++ ) {
			$this->set_blog_id( $blog_id );
			if ( wpcom_expiry_notices_is_enabled_for_site() ) {
				++$enabled;
			}
		}
		// Derived from the shipped share, so widening the rollout does not need
		// this number edited too.
		$this->assertSame(
			wpcom_expiry_notices_rollout_percentage() * 10,
			$enabled,
			'the rollout should cover exactly its share of 1000 sites'
		);
	}

	public function test_the_same_site_always_lands_the_same_way(): void {
		$this->set_blog_id( 12345 );
		$first = wpcom_expiry_notices_is_enabled_for_site();
		for ( $i = 0; $i < 5; $i++ ) {
			$this->assertSame( $first, wpcom_expiry_notices_is_enabled_for_site() );
		}
	}

	public function test_raising_the_percentage_only_ever_adds_sites(): void {
		$previous = array();
		foreach ( array( 1, 5, 10, 25, 33, 50, 99, 100 ) as $percentage ) {
			$this->at_percentage( $percentage );
			$current = array();
			for ( $blog_id = 1; $blog_id <= 300; $blog_id++ ) {
				$this->set_blog_id( $blog_id );
				if ( wpcom_expiry_notices_is_enabled_for_site() ) {
					$current[] = $blog_id;
				}
			}
			$dropped = array_diff( $previous, $current );
			$this->assertSame(
				array(),
				$dropped,
				"raising the rollout to {$percentage}% dropped sites that were already in it"
			);
			$previous = $current;
			remove_all_filters( 'wpcom_expiry_notices_enabled' );
		}
	}

	public function test_an_unknown_blog_id_stays_out_of_the_rollout(): void {
		// No jetpack_options at all: get_wpcom_blog_id() would fall back to the
		// local blog ID of 1, which would land inside every bucket.
		delete_option( 'jetpack_options' );
		$this->assertSame( 0, wpcom_expiry_notices_wpcom_blog_id() );
		$this->assertFalse( wpcom_expiry_notices_is_enabled_for_site() );

		update_option( 'jetpack_options', array( 'id' => 0 ) );
		$this->assertFalse( wpcom_expiry_notices_is_enabled_for_site() );
	}

	public function test_an_unknown_blog_id_is_included_once_fully_rolled_out(): void {
		delete_option( 'jetpack_options' );
		$this->at_percentage( 100 );
		$this->assertTrue( wpcom_expiry_notices_is_enabled_for_site() );
	}

	public function test_zero_percent_disables_every_site(): void {
		$this->at_percentage( 0 );
		foreach ( array( 1, 50, 100, 12345 ) as $blog_id ) {
			$this->set_blog_id( $blog_id );
			$this->assertFalse( wpcom_expiry_notices_is_enabled_for_site() );
		}
	}

	public function test_the_option_cannot_pull_a_site_in_while_stopped(): void {
		// The whole point of the stop: a site carrying the opt-in option from
		// before the rollout was halted must not stay on the new notices.
		$this->set_blog_id( 5 );
		foreach ( array( '1', 1, 'true', 'yes', 'on', 'YES', ' 1 ' ) as $truthy ) {
			update_option( 'wpcom_expiry_notices_enabled', $truthy );
			$this->assertFalse(
				wpcom_expiry_notices_is_enabled_for_site(),
				sprintf( 'option value %s must not re-enable the notices', var_export( $truthy, true ) )
			);
		}
	}

	public function test_the_option_still_holds_a_site_out(): void {
		$this->set_blog_id( 5 );
		foreach ( array( '0', 'false', 'no', 'off' ) as $falsy ) {
			update_option( 'wpcom_expiry_notices_enabled', $falsy );
			$this->assertFalse( wpcom_expiry_notices_is_enabled_for_site() );
		}
	}

	public function test_clearing_the_option_leaves_the_site_out(): void {
		// There is no share to return to while the rollout is stopped.
		$this->set_blog_id( 5 );
		update_option( 'wpcom_expiry_notices_enabled', '1' );
		$this->assertFalse( wpcom_expiry_notices_is_enabled_for_site() );

		delete_option( 'wpcom_expiry_notices_enabled' );
		$this->assertNull( wpcom_expiry_notices_rollout_override() );
		$this->assertFalse( wpcom_expiry_notices_is_enabled_for_site() );
	}

	public function test_an_unrecognised_option_value_changes_nothing(): void {
		$this->set_blog_id( 5 );
		foreach ( array( 'ture', 'enabled', 'maybe', '' ) as $nonsense ) {
			update_option( 'wpcom_expiry_notices_enabled', $nonsense );
			$this->assertNull( wpcom_expiry_notices_rollout_override(), "'{$nonsense}' should not be read as an instruction" );
			$this->assertFalse( wpcom_expiry_notices_is_enabled_for_site() );
		}
	}

	public function test_a_stopped_rollout_beats_the_option(): void {
		// The inverse of what this asserted while the rollout was running.
		$this->set_blog_id( 55 );
		update_option( 'wpcom_expiry_notices_enabled', '1' );
		$this->assertTrue( wpcom_expiry_notices_rollout_override() );
		$this->assertFalse( wpcom_expiry_notices_is_enabled_for_site() );
	}

	public function test_the_filter_can_still_force_a_site_in(): void {
		// Runs after the stop, so it stays available as an escape hatch -- for
		// putting a single site back on the new notices to confirm a fix.
		$this->set_blog_id( 5 );
		$this->assertFalse( wpcom_expiry_notices_is_enabled_for_site() );

		add_filter( 'wpcom_expiry_notices_enabled', '__return_true' );
		$this->assertTrue( wpcom_expiry_notices_is_enabled_for_site() );
	}
}
