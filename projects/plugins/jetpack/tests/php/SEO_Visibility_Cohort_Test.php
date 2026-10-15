<?php
/**
 * Tests the one-time seed of the Jetpack SEO discoverability cohort flag, which makes
 * the new SEO surface auto-visible on fresh installs but opt-in on existing ones.
 *
 * @package jetpack
 */

use Automattic\Jetpack\SEO\Initializer as Jetpack_SEO_Initializer;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;

/**
 * @covers \Jetpack
 */
#[CoversClass( Jetpack::class )]
class SEO_Visibility_Cohort_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * The durable cohort option under test.
	 *
	 * @var string
	 */
	private $option = Jetpack_SEO_Initializer::VISIBILITY_OPTION;

	/**
	 * Reset the option between tests.
	 */
	public function set_up() {
		parent::set_up();
		delete_option( $this->option );
	}

	/**
	 * A fresh install (no prior version) seeds the surface visible.
	 */
	public function test_fresh_install_seeds_visible() {
		Jetpack::seed_seo_visibility_cohort( '14.0:1700000000', false );

		$this->assertTrue( (bool) get_option( $this->option ) );
	}

	/**
	 * An existing install (a prior version is present) seeds the surface hidden — these
	 * sites opt in later rather than being switched over automatically.
	 */
	public function test_existing_install_seeds_hidden() {
		Jetpack::seed_seo_visibility_cohort( '14.0:1700000000', '13.9:1690000000' );

		// The option exists (a sentinel default would be returned only if absent)...
		$this->assertNotSame( 'sentinel', get_option( $this->option, 'sentinel' ) );
		// ...and reads as hidden.
		$this->assertFalse( (bool) get_option( $this->option ) );
	}

	/**
	 * The seed never overwrites a value a later opt-in (or opt-out) has already set.
	 */
	public function test_seed_does_not_clobber_existing_value() {
		add_option( $this->option, true ); // e.g. the user has already opted in.

		// The existing-install path would otherwise seed this hidden.
		Jetpack::seed_seo_visibility_cohort( '14.0:1700000000', '13.9:1690000000' );

		$this->assertTrue( (bool) get_option( $this->option ) );
	}

	/**
	 * An upgrading install is re-seeded hidden whatever the superseded key held, and that key is dropped.
	 *
	 * @dataProvider provide_superseded_values
	 * @param bool $superseded_value The superseded key's stored value.
	 */
	#[DataProvider( 'provide_superseded_values' )]
	public function test_upgrade_reseeds_hidden_and_drops_superseded_key( $superseded_value ) {
		add_option( 'jetpack_seo_surface_visible', $superseded_value );

		Jetpack::seed_seo_visibility_cohort( '14.0:1700000000', '13.9:1690000000' );

		$this->assertFalse( (bool) get_option( $this->option ) );
		$this->assertNull( get_option( 'jetpack_seo_surface_visible', null ) );
	}

	/**
	 * @return array Values the superseded key was seeded with.
	 */
	public static function provide_superseded_values() {
		return array(
			'seeded visible' => array( true ),
			'seeded hidden'  => array( false ),
		);
	}
}
