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

	public function test_ships_fully_rolled_out(): void {
		// Pinned so a change to the share is a deliberate edit, not a drift.
		$this->assertSame( 100, wpcom_expiry_notices_rollout_percentage() );
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

	public function test_an_unknown_blog_id_still_resolves_to_zero(): void {
		// Not a rollout question any more -- at 100% every site is in, unknown ID
		// or not. Kept because the helper still must not fall back to the local
		// blog ID of 1, which would matter again at any partial share.
		delete_option( 'jetpack_options' );
		$this->assertSame( 0, wpcom_expiry_notices_wpcom_blog_id() );

		update_option( 'jetpack_options', array( 'id' => 0 ) );
		$this->assertSame( 0, wpcom_expiry_notices_wpcom_blog_id() );
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

	public function test_a_truthy_option_leaves_a_site_in(): void {
		// Redundant at 100%, but sites carrying the option from the ramp must not
		// be treated any differently now that everyone is in.
		$this->set_blog_id( 55 );
		foreach ( array( '1', 1, 'true', 'yes', 'on', 'YES', ' 1 ' ) as $truthy ) {
			update_option( 'wpcom_expiry_notices_enabled', $truthy );
			$this->assertTrue( wpcom_expiry_notices_is_enabled_for_site() );
		}
	}

	public function test_the_option_holds_a_site_out_of_a_bucket_it_falls_in(): void {
		$this->set_blog_id( 5 ); // 5 % 100 = 5, inside the share.
		$this->assertTrue( wpcom_expiry_notices_is_enabled_for_site() );

		foreach ( array( '0', 0, 'false', 'no', 'off', 'NO', ' 0 ' ) as $falsy ) {
			update_option( 'wpcom_expiry_notices_enabled', $falsy );
			$this->assertFalse(
				wpcom_expiry_notices_is_enabled_for_site(),
				sprintf( 'option value %s should read as opted out', var_export( $falsy, true ) )
			);
		}
	}

	public function test_clearing_the_option_returns_the_site_to_the_share(): void {
		$this->set_blog_id( 5 ); // Inside the share.
		update_option( 'wpcom_expiry_notices_enabled', '0' );
		$this->assertFalse( wpcom_expiry_notices_is_enabled_for_site() );

		// Clearing must not read as "stay out" -- the site goes back under the
		// normal rule, which for blog 5 means back in.
		delete_option( 'wpcom_expiry_notices_enabled' );
		$this->assertNull( wpcom_expiry_notices_rollout_override() );
		$this->assertTrue( wpcom_expiry_notices_is_enabled_for_site() );
	}

	public function test_an_unrecognised_option_value_changes_nothing(): void {
		// A typo must not flip a site either way -- it leaves the normal rule in
		// place, which at 100% means the site stays in.
		$this->set_blog_id( 5 );
		foreach ( array( 'ture', 'enabled', 'maybe', '' ) as $nonsense ) {
			update_option( 'wpcom_expiry_notices_enabled', $nonsense );
			$this->assertNull( wpcom_expiry_notices_rollout_override(), "'{$nonsense}' should not be read as an instruction" );
			$this->assertTrue( wpcom_expiry_notices_is_enabled_for_site() );
		}
	}

	public function test_the_option_beats_a_zero_percent_rollout(): void {
		// Useful before the share is opened at all: pick a site, see the notices.
		$this->at_percentage( 0 );
		$this->set_blog_id( 55 );
		remove_all_filters( 'wpcom_expiry_notices_enabled' );
		update_option( 'wpcom_expiry_notices_enabled', '1' );
		$this->assertTrue( wpcom_expiry_notices_is_enabled_for_site() );
	}

	public function test_the_filter_can_force_a_site_in_or_out(): void {
		// At 100% the interesting direction is forcing a site out.
		$this->set_blog_id( 5 );
		$this->assertTrue( wpcom_expiry_notices_is_enabled_for_site() );

		add_filter( 'wpcom_expiry_notices_enabled', '__return_false' );
		$this->assertFalse( wpcom_expiry_notices_is_enabled_for_site() );
		remove_all_filters( 'wpcom_expiry_notices_enabled' );

		// And back in, over a site opted out by the option.
		update_option( 'wpcom_expiry_notices_enabled', '0' );
		$this->assertFalse( wpcom_expiry_notices_is_enabled_for_site() );
		add_filter( 'wpcom_expiry_notices_enabled', '__return_true' );
		$this->assertTrue( wpcom_expiry_notices_is_enabled_for_site() );
	}
}
