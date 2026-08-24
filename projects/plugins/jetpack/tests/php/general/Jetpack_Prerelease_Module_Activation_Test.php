<?php
/**
 * Tests for auto-activating modules on prerelease versions of Jetpack.
 *
 * A module declaring `First Introduced: 16.2` is invisible to a site running `16.2-a.1`, because
 * version_compare() sorts a prerelease below its own release. These tests cover the rule that puts
 * it back in its release line, and the record that stops it being offered more than once.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Constants;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;

/**
 * Class Jetpack_Prerelease_Module_Activation_Test
 *
 * @covers \Jetpack
 */
#[CoversClass( Jetpack::class )]
class Jetpack_Prerelease_Module_Activation_Test extends \WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Reset everything this suite touches.
	 */
	public function tear_down() {
		delete_option( Jetpack::PRERELEASE_ACTIVATED_MODULES_OPTION );
		\Jetpack_Options::update_option( 'active_modules', array() );
		Constants::clear_single_constant( 'JETPACK__VERSION' );

		parent::tear_down();
	}

	/**
	 * Every prerelease suffix in the changelogger grammar reduces to its release version.
	 *
	 * @dataProvider provide_versions
	 *
	 * @param string $version  Raw version string.
	 * @param string $expected Expected release version.
	 */
	#[DataProvider( 'provide_versions' )]
	public function test_release_version_strips_prerelease_suffixes( $version, $expected ) {
		$this->assertSame( $expected, Jetpack::release_version( $version ) );
	}

	/**
	 * Version strings drawn from WordpressVersioning's canonical grammar.
	 *
	 * @return array
	 */
	public static function provide_versions() {
		return array(
			'plain release'    => array( '16.2', '16.2' ),
			'point release'    => array( '16.2.1', '16.2.1' ),
			'dev'              => array( '16.2-dev', '16.2' ),
			'alpha'            => array( '16.2-alpha', '16.2' ),
			'numbered alpha'   => array( '16.2-alpha3', '16.2' ),
			'dotted alpha'     => array( '16.2-a.1', '16.2' ),
			'beta'             => array( '16.2-beta', '16.2' ),
			'dotted beta'      => array( '16.2-beta.4', '16.2' ),
			'rc'               => array( '16.2-rc1', '16.2' ),
			'point prerelease' => array( '16.2.1-a.4', '16.2.1' ),
			'buildinfo'        => array( '16.2+build.7', '16.2' ),
			'both'             => array( '16.2-a.1+build.7', '16.2' ),
		);
	}

	/**
	 * Only modules genuinely in the raw active_modules option get recorded. A module a filter
	 * merely reports as active must not be, or removing that filter would leave it permanently
	 * suppressed.
	 */
	public function test_record_ignores_modules_that_are_not_really_active() {
		\Jetpack_Options::update_option( 'active_modules', array( 'stats' ) );

		Jetpack::record_prerelease_activated_modules( array( 'stats', 'ai' ) );

		$this->assertSame(
			array( 'stats' ),
			get_option( Jetpack::PRERELEASE_ACTIVATED_MODULES_OPTION ),
			'Only the genuinely active module is recorded.'
		);
	}

	/**
	 * Recording is additive across upgrades and never duplicates.
	 */
	public function test_record_accumulates_without_duplicates() {
		\Jetpack_Options::update_option( 'active_modules', array( 'stats', 'sso' ) );

		Jetpack::record_prerelease_activated_modules( array( 'stats' ) );
		Jetpack::record_prerelease_activated_modules( array( 'stats', 'sso' ) );

		$record = get_option( Jetpack::PRERELEASE_ACTIVATED_MODULES_OPTION );
		sort( $record );
		$this->assertSame( array( 'sso', 'stats' ), $record );
	}

	/**
	 * The record is read only during an upgrade, so it must not be autoloaded on every request.
	 */
	public function test_record_is_not_autoloaded() {
		global $wpdb;
		\Jetpack_Options::update_option( 'active_modules', array( 'stats' ) );

		Jetpack::record_prerelease_activated_modules( array( 'stats' ) );

		$autoload = $wpdb->get_var(
			$wpdb->prepare(
				"SELECT autoload FROM $wpdb->options WHERE option_name = %s",
				Jetpack::PRERELEASE_ACTIVATED_MODULES_OPTION
			)
		);

		$this->assertNotSame( 'yes', $autoload, 'The record must not be autoloaded.' );
		$this->assertNotSame( 'on', $autoload, 'The record must not be autoloaded.' );
	}

	/**
	 * Recording nothing must not create the option at all.
	 */
	public function test_record_with_nothing_active_writes_no_option() {
		\Jetpack_Options::update_option( 'active_modules', array() );

		Jetpack::record_prerelease_activated_modules( array( 'ai' ) );

		$this->assertFalse( get_option( Jetpack::PRERELEASE_ACTIVATED_MODULES_OPTION, false ) );
	}

	/**
	 * Present a set of fake modules to the module system.
	 *
	 * Modules::get() bails before the `jetpack_get_module` filter for a slug whose file cannot be
	 * read, so the path is pointed at a fixture carrying valid module headers; only then can
	 * individual headers be overridden.
	 *
	 * @param array $modules Map of slug to `First Introduced` version.
	 *
	 * @return void
	 */
	private function register_fake_modules( array $modules ) {
		add_filter(
			'jetpack_get_available_modules',
			function () use ( $modules ) {
				return $modules;
			}
		);

		add_filter(
			'jetpack_get_module_path',
			function () {
				return __DIR__ . '/fixtures/prerelease-test-module.php';
			}
		);

		add_filter(
			'jetpack_get_module',
			function ( $mod, $slug ) use ( $modules ) {
				if ( isset( $modules[ $slug ] ) ) {
					$mod['introduced']    = $modules[ $slug ];
					$mod['auto_activate'] = 'Yes';
				}
				return $mod;
			},
			10,
			2
		);
	}

	/**
	 * Only modules introduced in the release line now running are candidates. Anything older is
	 * out of reach, which is what makes an empty record safe on an established site.
	 */
	public function test_current_line_modules_selects_only_the_running_release_line() {
		Constants::set_constant( 'JETPACK__VERSION', '16.2-a.4' );
		$this->register_fake_modules(
			array(
				'jptest-current' => '16.2',
				'jptest-old'     => '16.1',
				'jptest-future'  => '16.3',
			)
		);

		$this->assertSame( array( 'jptest-current' ), array_values( Jetpack::get_current_line_modules() ) );
	}

	/**
	 * A module whose header itself carries a prerelease suffix still belongs to its release line.
	 */
	public function test_current_line_modules_tolerates_a_prerelease_in_the_header() {
		Constants::set_constant( 'JETPACK__VERSION', '16.2-a.4' );
		$this->register_fake_modules( array( 'jptest-current' => '16.2-a.2' ) );

		$this->assertSame( array( 'jptest-current' ), array_values( Jetpack::get_current_line_modules() ) );
	}

	/**
	 * On a plain release the line is the release itself.
	 */
	public function test_current_line_modules_on_a_release_version() {
		Constants::set_constant( 'JETPACK__VERSION', '16.2' );
		$this->register_fake_modules(
			array(
				'jptest-current' => '16.2',
				'jptest-old'     => '16.1',
			)
		);

		$this->assertSame( array( 'jptest-current' ), array_values( Jetpack::get_current_line_modules() ) );
	}

	/**
	 * Run one upgrade: pretend the site was on $from, is now running $to, and fire the upgrade.
	 *
	 * @param string $from Previously recorded version.
	 * @param string $to   Version now running.
	 *
	 * @return void
	 */
	private function run_upgrade( $from, $to ) {
		Constants::set_constant( 'JETPACK__VERSION', $to );

		$is_prerelease = function () use ( $to ) {
			return (bool) preg_match( '/[-+]/', $to );
		};

		add_filter( 'jetpack_is_connection_ready', '__return_true', 1000 );
		add_filter( 'jetpack_development_version', $is_prerelease );

		\Jetpack_Options::update_option( 'version', $from . ':' . ( time() - 86400 ) );

		Jetpack::activate_new_modules( false );

		remove_filter( 'jetpack_is_connection_ready', '__return_true', 1000 );
		remove_filter( 'jetpack_development_version', $is_prerelease );
	}

	/**
	 * The headline case: a module introduced in 16.2 turns on for a site running an alpha of 16.2,
	 * instead of waiting for the final release.
	 */
	public function test_module_activates_on_the_first_alpha_of_its_release() {
		$this->register_fake_modules( array( 'jptest-current' => '16.2' ) );

		$this->run_upgrade( '16.1', '16.2-a.1' );

		$this->assertContains( 'jptest-current', (array) \Jetpack_Options::get_option( 'active_modules' ) );
		$this->assertContains(
			'jptest-current',
			get_option( Jetpack::PRERELEASE_ACTIVATED_MODULES_OPTION, array() )
		);
	}

	/**
	 * Switching the module off must stick. The next alpha reopens a window that still contains it,
	 * so only the record keeps it off.
	 */
	public function test_opt_out_survives_the_next_alpha() {
		$this->register_fake_modules( array( 'jptest-current' => '16.2' ) );
		$this->run_upgrade( '16.1', '16.2-a.1' );

		$this->assertContains(
			'jptest-current',
			(array) \Jetpack_Options::get_option( 'active_modules' ),
			'Precondition: the first alpha activated the module.'
		);

		Jetpack::deactivate_module( 'jptest-current' );

		$this->run_upgrade( '16.2-a.1', '16.2-a.2' );

		$this->assertNotContains( 'jptest-current', (array) \Jetpack_Options::get_option( 'active_modules' ) );
	}

	/**
	 * The same opt-out must survive the final release, whose window also contains the module.
	 */
	public function test_opt_out_survives_the_final_release() {
		$this->register_fake_modules( array( 'jptest-current' => '16.2' ) );
		$this->run_upgrade( '16.1', '16.2-a.1' );

		$this->assertContains(
			'jptest-current',
			(array) \Jetpack_Options::get_option( 'active_modules' ),
			'Precondition: the first alpha activated the module.'
		);

		Jetpack::deactivate_module( 'jptest-current' );

		$this->run_upgrade( '16.2-a.9', '16.2' );

		$this->assertNotContains( 'jptest-current', (array) \Jetpack_Options::get_option( 'active_modules' ) );
	}

	/**
	 * A module whose file first ships mid-cycle is still offered, even though the site has already
	 * been through earlier alphas of the same release. This is what the per-slug record buys that a
	 * version window cannot.
	 */
	public function test_module_added_mid_cycle_is_still_offered() {
		$this->register_fake_modules( array( 'jptest-late' => '16.2' ) );

		$this->run_upgrade( '16.2-a.1', '16.2-a.2' );

		$this->assertContains( 'jptest-late', (array) \Jetpack_Options::get_option( 'active_modules' ) );
	}

	/**
	 * A site that never runs a prerelease gains no new state at all.
	 */
	public function test_release_only_site_never_writes_the_record() {
		$this->register_fake_modules( array( 'jptest-current' => '16.2' ) );

		$this->run_upgrade( '16.1', '16.2' );

		$this->assertContains( 'jptest-current', (array) \Jetpack_Options::get_option( 'active_modules' ) );
		$this->assertFalse(
			get_option( Jetpack::PRERELEASE_ACTIVATED_MODULES_OPTION, false ),
			'A site that never runs a prerelease gains no new state.'
		);
	}

	/**
	 * The empty starting record must not resurrect modules from earlier release lines that the
	 * site owner switched off long ago.
	 */
	public function test_older_modules_are_never_resurrected() {
		$this->register_fake_modules( array( 'jptest-old' => '16.1' ) );

		$this->run_upgrade( '16.2-a.1', '16.2-a.2' );

		$this->assertNotContains( 'jptest-old', (array) \Jetpack_Options::get_option( 'active_modules' ) );
	}

	/**
	 * The jetpack-mu-wpcom stopgap reports `ai` active on Atomic without it being in the option.
	 * Whatever branch activation takes, the record must never contain a module that is not really
	 * in the raw option — otherwise removing the stopgap would suppress it permanently.
	 */
	public function test_record_never_exceeds_the_raw_active_modules_option() {
		$this->register_fake_modules( array( 'jptest-current' => '16.2' ) );

		$stopgap = function ( $modules ) {
			$modules[] = 'jptest-current';
			return array_unique( $modules );
		};
		add_filter( 'jetpack_active_modules', $stopgap );

		$this->run_upgrade( '16.1', '16.2-a.1' );

		remove_filter( 'jetpack_active_modules', $stopgap );

		$record = get_option( Jetpack::PRERELEASE_ACTIVATED_MODULES_OPTION, array() );
		$raw    = (array) \Jetpack_Options::get_option( 'active_modules' );

		$this->assertSame(
			array(),
			array_values( array_diff( $record, $raw ) ),
			'Nothing may be recorded that is not genuinely in the raw active_modules option.'
		);
	}

	/**
	 * Pre-existing and surprising: activate_default_modules() seeds its working set from the
	 * FILTERED module list, and Modules::update_active() diffs that against the RAW option, so a
	 * module contributed only by `jetpack_active_modules` is written into the option as a side
	 * effect of activating something else. Characterized so a change to either method cannot alter
	 * it silently.
	 */
	public function test_filtered_active_modules_leak_into_the_stored_option() {
		\Jetpack_Options::update_option( 'active_modules', array() );

		$leak = function ( $modules ) {
			$modules[] = 'stats';
			return array_unique( $modules );
		};
		add_filter( 'jetpack_active_modules', $leak );

		Jetpack::update_active_modules( array_merge( Jetpack::get_active_modules(), array( 'sso' ) ) );

		remove_filter( 'jetpack_active_modules', $leak );

		$this->assertContains(
			'stats',
			(array) \Jetpack_Options::get_option( 'active_modules' ),
			'A module present only via jetpack_active_modules is persisted by update_active_modules().'
		);
	}
}
