<?php
/**
 * Tests for auto-activating modules on prerelease versions of Jetpack.
 *
 * A module declaring `First Introduced: 16.2` is invisible to a site running `16.2-a.1`, because
 * version_compare() sorts a prerelease below its own release. These tests cover the rule that puts
 * it back in its release line, and the record that stops it being offered more than once.
 *
 * On precise headers, and why a release number is the better thing to write. Because the ceiling is
 * reduced to its release version, `First Introduced: 16.2-a.2` clears it on every alpha of 16.2 —
 * exactly as `16.2` does — so precision never delays availability. It changes only the floor: once
 * the site's recorded version reaches `16.2-a.2` the window itself excludes the module, so the
 * record is no longer what dedupes it. That costs the retry. A module offered but not actually
 * activated (`Auto Activate: public` on a non-public site, a conflicting plugin, a fatal) is never
 * recorded, so a release-numbered header offers it again next upgrade; a precise header does not,
 * and the module is stranded. This is not hypothetical: `modules/blocks.php` ships
 * `First Introduced: 13.9-a.8`.
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

		// Report a module active that is not in the option, the way the jetpack-mu-wpcom stopgap
		// does for `ai` on Atomic. Without this filter the test cannot tell an implementation that
		// reads the raw option from one that reads get_active_modules(), which is the entire point.
		$stopgap = function ( $modules ) {
			$modules[] = 'sso';
			return array_unique( $modules );
		};
		add_filter( 'jetpack_active_modules', $stopgap );

		Jetpack::record_prerelease_activated_modules( array( 'stats', 'sso' ) );

		remove_filter( 'jetpack_active_modules', $stopgap );

		$this->assertSame(
			array( 'stats' ),
			get_option( Jetpack::PRERELEASE_ACTIVATED_MODULES_OPTION ),
			'A module reported active only by a filter must not be recorded.'
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

		$this->assertNotContains( $autoload, array( 'yes', 'on' ), 'The record must not be autoloaded.' );
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
	private function register_fake_modules( array $modules, array $changed = array() ) {
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
			function ( $mod, $slug ) use ( $modules, $changed ) {
				if ( isset( $modules[ $slug ] ) ) {
					$mod['introduced'] = $modules[ $slug ];
				}
				if ( isset( $changed[ $slug ] ) ) {
					$mod['changed'] = $changed[ $slug ];
				}
				return $mod;
			},
			10,
			2
		);
	}

	/**
	 * The stored active_modules option, bypassing the `jetpack_active_modules` filter.
	 *
	 * The raw/filtered distinction is the whole point of this suite, so it gets a name.
	 *
	 * @return string[]
	 */
	private function raw_active_modules() {
		return (array) \Jetpack_Options::get_option( 'active_modules' );
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
		// Setting the constant is enough: is_development_version() derives the answer from it.
		Constants::set_constant( 'JETPACK__VERSION', $to );

		add_filter( 'jetpack_is_connection_ready', '__return_true', 1000 );

		\Jetpack_Options::update_option( 'version', $from . ':' . ( time() - 86400 ) );

		Jetpack::activate_new_modules( false );

		remove_filter( 'jetpack_is_connection_ready', '__return_true', 1000 );
	}

	/**
	 * The whole decision table in one place.
	 *
	 * Inputs: the version the site had recorded, the version now running, what the module's
	 * `First Introduced` header says, and what the record already held. Outputs: whether the
	 * module ends up in the raw `active_modules` option, and what the record holds afterwards
	 * (`false` meaning the option was never created).
	 *
	 * Reading the table beats reading the code: the floor is the recorded version raw, the ceiling
	 * is the running version reduced to its release, and the record is subtracted from whatever
	 * survives both.
	 *
	 * @dataProvider provide_activation_matrix
	 *
	 * @param string         $previous      Version recorded for the site before the upgrade.
	 * @param string         $current       Version now running.
	 * @param string         $introduced    The module's `First Introduced` header.
	 * @param string[]       $seed_record   Record contents before the upgrade.
	 * @param bool           $expect_active Whether the module should end up active.
	 * @param string[]|false $expect_record Record contents after, or false if no option.
	 */
	#[DataProvider( 'provide_activation_matrix' )]
	public function test_activation_matrix( $previous, $current, $introduced, $seed_record, $expect_active, $expect_record ) {
		if ( $seed_record ) {
			update_option( Jetpack::PRERELEASE_ACTIVATED_MODULES_OPTION, $seed_record, false );
		}

		$this->register_fake_modules( array( 'jptest' => $introduced ) );
		$this->run_upgrade( $previous, $current );

		$this->assertSame(
			$expect_active,
			in_array( 'jptest', $this->raw_active_modules(), true ),
			sprintf(
				'introduced %s, upgrading %s -> %s: expected the module %s',
				$introduced,
				$previous,
				$current,
				$expect_active ? 'active' : 'inactive'
			)
		);

		$record = get_option( Jetpack::PRERELEASE_ACTIVATED_MODULES_OPTION, false );

		if ( false === $expect_record ) {
			$this->assertFalse( $record, 'The record option should never have been created.' );
			return;
		}

		$this->assertIsArray( $record );
		sort( $record );
		$this->assertSame( $expect_record, $record );
	}

	/**
	 * Previous version, running version, module header, record before => active?, record after.
	 *
	 * @return array
	 */
	public static function provide_activation_matrix() {
		$none = array();
		$rec  = array( 'jptest' );

		return array(
			// A release-numbered module, which is what module authors should write.
			'alpha activates a release-numbered module' => array( '16.1', '16.2-a.1', '16.2', $none, true, $rec ),
			'a later alpha does the same'               => array( '16.1', '16.2-a.2', '16.2', $none, true, $rec ),
			'module added mid-cycle'                    => array( '16.2-a.1', '16.2-a.2', '16.2', $none, true, $rec ),
			'site skipped several alphas'               => array( '16.2-a.1', '16.2-a.5', '16.2', $none, true, $rec ),
			'fresh install on an alpha'                 => array( '1.1', '16.2-a.5', '16.2', $none, true, $rec ),

			// Out of range: the floor excludes older lines, the ceiling excludes future ones.
			'earlier release line is left alone'        => array( '16.2-a.1', '16.2-a.2', '16.1', $none, false, false ),
			'future release line is not offered yet'    => array( '16.1', '16.2-a.1', '16.3', $none, false, false ),
			'previous line dropped on the next line'    => array( '16.2', '16.3-a.1', '16.2', $none, false, false ),

			// Release versions behave exactly as before and write no record.
			'release-only site records nothing'         => array( '16.1', '16.2', '16.2', $none, true, false ),
			'point release behaves the same'            => array( '16.1', '16.2.1', '16.2', $none, true, false ),
			'later release, module already past'        => array( '16.2', '16.3', '16.2', $none, false, false ),

			// An existing record is what makes an opt-out stick.
			'opt-out survives the next alpha'           => array( '16.2-a.1', '16.2-a.2', '16.2', $rec, false, $rec ),
			'opt-out survives the final release'        => array( '16.2-a.9', '16.2', '16.2', $rec, false, $rec ),

			// A header naming an exact alpha. Same availability, but the floor then dedupes
			// instead of the record, which costs the retry - see the class docblock.
			'precise header, alpha that ships it'       => array( '16.2-a.1', '16.2-a.2', '16.2-a.2', $none, true, $rec ),
			'precise header, site already past it'      => array( '16.2-a.2', '16.2-a.3', '16.2-a.2', $none, false, false ),
			'precise header, release-only site'         => array( '16.1', '16.2', '16.2-a.2', $none, true, false ),

			// The upgrade gate itself.
			'same version is not an upgrade'            => array( '16.2-a.1', '16.2-a.1', '16.2', $none, false, false ),
			'downgrade is a no-op'                      => array( '16.3', '16.2-a.1', '16.2', $none, false, false ),
		);
	}

	/**
	 * Switching the module off must stick. Both the next alpha and the final release reopen a
	 * window that still contains the module, so only the record keeps it off.
	 *
	 * @dataProvider provide_upgrades_after_opt_out
	 *
	 * @param string $from Version recorded before the second upgrade.
	 * @param string $to   Version running for the second upgrade.
	 */
	#[DataProvider( 'provide_upgrades_after_opt_out' )]
	public function test_opt_out_survives_later_upgrades( $from, $to ) {
		$this->register_fake_modules( array( 'jptest-current' => '16.2' ) );
		$this->run_upgrade( '16.1', '16.2-a.1' );

		// Without this the test is vacuous: if the module never activated, "it is off" proves nothing.
		$this->assertContains(
			'jptest-current',
			$this->raw_active_modules(),
			'Precondition: the first alpha activated the module.'
		);

		Jetpack::deactivate_module( 'jptest-current' );

		$this->run_upgrade( $from, $to );

		$this->assertNotContains( 'jptest-current', $this->raw_active_modules() );
	}

	/**
	 * The two upgrades whose window still contains a module introduced in 16.2.
	 *
	 * @return array
	 */
	public static function provide_upgrades_after_opt_out() {
		return array(
			'next alpha'    => array( '16.2-a.1', '16.2-a.2' ),
			'final release' => array( '16.2-a.9', '16.2' ),
		);
	}

	/**
	 * The record subtraction runs at priority 100, after handle_deprecated_modules() appends
	 * replacement modules at 99. Running earlier would let a later filter put a recorded module
	 * back into the list, undoing the user's opt-out.
	 */
	public function test_a_module_appended_by_a_later_filter_still_respects_the_record() {
		update_option( Jetpack::PRERELEASE_ACTIVATED_MODULES_OPTION, array( 'jptest-late' ), false );
		$this->register_fake_modules(
			array(
				'jptest'      => '16.2',
				'jptest-late' => '16.2',
			)
		);

		// Stands in for handle_deprecated_modules(), which appends at priority 99.
		$appender = function ( $modules ) {
			$modules[] = 'jptest-late';
			return array_values( array_unique( $modules ) );
		};
		add_filter( 'jetpack_get_default_modules', $appender, 99 );

		$this->run_upgrade( '16.1', '16.2-a.1' );

		remove_filter( 'jetpack_get_default_modules', $appender, 99 );

		$raw = $this->raw_active_modules();
		$this->assertContains( 'jptest', $raw, 'The unrecorded module still activates.' );
		$this->assertNotContains(
			'jptest-late',
			$raw,
			'A recorded module appended by a later filter must still be suppressed.'
		);
	}

	/**
	 * A module deactivated by this upgrade because its `Changed:` header moved is handed to
	 * activate_default_modules() as $other_modules, which is merged in AFTER the filter. Being in
	 * the record must therefore not stop it coming back - otherwise the record would turn a
	 * routine reactivation into a permanent deactivation.
	 */
	public function test_reactivated_module_is_not_suppressed_by_the_record() {
		\Jetpack_Options::update_option( 'active_modules', array( 'jptest' ) );
		update_option( Jetpack::PRERELEASE_ACTIVATED_MODULES_OPTION, array( 'jptest' ), false );

		$this->register_fake_modules(
			array( 'jptest' => '16.2' ),
			array( 'jptest' => '99.0' )
		);

		$this->run_upgrade( '16.2-a.1', '16.2-a.2' );

		$this->assertContains(
			'jptest',
			$this->raw_active_modules(),
			'A module reactivated after a Changed: bump must survive being in the record.'
		);
	}

	/**
	 * Pre-existing and surprising: activate_default_modules() seeds its working set from the
	 * FILTERED module list, and Modules::update_active() diffs that against the RAW option, so a
	 * module contributed only by `jetpack_active_modules` is written into the option as a side
	 * effect of activating something else.
	 *
	 * Kept in this file, despite testing neither new method, because it is the behavior
	 * {@see Jetpack::record_prerelease_activated_modules()} exists to defend against: it is why
	 * the record intersects the raw option rather than trusting get_active_modules(). If this test
	 * ever fails, that design decision needs revisiting.
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
			$this->raw_active_modules(),
			'A module present only via jetpack_active_modules is persisted by update_active_modules().'
		);
	}
}
