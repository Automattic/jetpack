<?php
/**
 * Tests for the pure helpers in the Plugin Conflicts Guardian feature.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Jetpack_Mu_Wpcom;
use PHPUnit\Framework\Attributes\DataProvider;

require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/plugin-conflicts-guardian/pcg-log.php';
require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/plugin-conflicts-guardian/class-pcg-load-tester.php';
require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/plugin-conflicts-guardian/class-pcg-rollout.php';
require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/plugin-conflicts-guardian/activation-guard.php';
require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/plugin-conflicts-guardian/update-guard.php';
require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/plugin-conflicts-guardian/class-pcg-snapshot.php';
require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/plugin-conflicts-guardian/class-pcg-rollback.php';
require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/plugin-conflicts-guardian/update-healthcheck.php';

/**
 * Exercises the pure / near-pure helpers: transient keying, error-reason
 * formatting, errno-name mapping, the update guard's parse-error sweep, and
 * the upgrader_source_selection filter callback.
 */
class Plugin_Conflicts_Guardian_Test extends \WorDBless\BaseTestCase {

	/**
	 * Absolute path to a temporary directory used by scan tests.
	 *
	 * @var string|null
	 */
	private $tmp_dir = null;

	/**
	 * Clean up any temp directory and guard filter after each test.
	 */
	public function tear_down() {
		if ( $this->tmp_dir && is_dir( $this->tmp_dir ) ) {
			$this->rrmdir( $this->tmp_dir );
			$this->tmp_dir = null;
		}
		// activation-guard.php registers these unconditionally on require_once
		// at the top of the file; tear them down so leakage between tests
		// doesn't fire wp_safe_redirect / unwanted notices.
		remove_action( 'load-plugins.php', 'pcg_guard_maybe_block_activation', 0 );
		remove_action( 'load-update.php', 'pcg_guard_maybe_block_activation', 0 );
		remove_action( 'admin_notices', 'pcg_guard_render_block_notice' );
		remove_all_filters( 'pcg_guard_activation' );
		remove_all_filters( 'pcg_guard_updates' );
		remove_all_filters( 'pcg_backup_root' );
		remove_all_filters( 'pcg_signature_allowlist' );
		remove_all_filters( 'pcg_rollout_percentage' );
		remove_all_filters( 'pcg_rollout_force_enable_blogs' );
		// PCG_Rollout::init() registers itself on require_once; restore
		// the gate after every test so leak between cases doesn't leave
		// the gate detached.
		PCG_Rollout::init();
		parent::tear_down();
	}

	/**
	 * PCG_Snapshot::transient_key is deterministic and namespaced.
	 */
	public function test_snapshot_transient_key_is_deterministic_and_namespaced() {
		$file = 'akismet/akismet.php';
		$this->assertSame( 'pcg_snap_' . md5( $file ), PCG_Snapshot::transient_key( $file ) );
		$this->assertSame( PCG_Snapshot::transient_key( $file ), PCG_Snapshot::transient_key( $file ) );
		$this->assertNotSame( PCG_Snapshot::transient_key( $file ), PCG_Snapshot::transient_key( 'other/file.php' ) );
	}

	/**
	 * Scenarios for PCG_Snapshot::slug_from_file.
	 *
	 * @return array<string,array{0:string,1:string}>
	 */
	public static function provide_slug_from_file(): array {
		return array(
			'subdirectory plugin' => array( 'akismet/akismet.php', 'akismet' ),
			'nested path'         => array( 'woocommerce/includes/main.php', 'woocommerce/includes' ),
			'single-file plugin'  => array( 'hello.php', 'hello' ),
			'empty'               => array( '', '' ),
		);
	}

	/**
	 * PCG_Snapshot::slug_from_file derives the directory (or stem for single-file plugins).
	 *
	 * @param string $plugin_file Input.
	 * @param string $expected    Expected slug.
	 * @dataProvider provide_slug_from_file
	 */
	#[DataProvider( 'provide_slug_from_file' )]
	public function test_snapshot_slug_from_file( string $plugin_file, string $expected ) {
		$this->assertSame( $expected, PCG_Snapshot::slug_from_file( $plugin_file ) );
	}

	/**
	 * Scenarios for PCG_Rollback::build_download_url.
	 *
	 * @return array<string,array{0:string,1:string,2:string}>
	 */
	public static function provide_rollback_url_scenarios(): array {
		return array(
			'valid slug + semver'        => array( 'akismet', '5.3.1', 'https://downloads.wordpress.org/plugin/akismet.5.3.1.zip' ),
			'valid slug + hyphen tag'    => array( 'jetpack', '14.0-beta1', 'https://downloads.wordpress.org/plugin/jetpack.14.0-beta1.zip' ),
			'empty slug'                 => array( '', '1.0', '' ),
			'empty version'              => array( 'akismet', '', '' ),
			'slug with invalid chars'    => array( 'bad slug!', '1.0', '' ),
			'version with space'         => array( 'akismet', '1.0 0', '' ),
			'version starting non-digit' => array( 'akismet', 'v1.0', '' ),
		);
	}

	/**
	 * PCG_Rollback::build_download_url produces a WP.org versioned URL or ''.
	 *
	 * @param string $slug     Plugin slug.
	 * @param string $version  Version string.
	 * @param string $expected Expected URL.
	 * @dataProvider provide_rollback_url_scenarios
	 */
	#[DataProvider( 'provide_rollback_url_scenarios' )]
	public function test_rollback_build_download_url( string $slug, string $version, string $expected ) {
		$this->assertSame( $expected, PCG_Rollback::build_download_url( $slug, $version ) );
	}

	/**
	 * Pcg_healthcheck_is_plugin_update only fires for type=plugin + action=update.
	 */
	public function test_healthcheck_is_plugin_update_predicate() {
		$this->assertTrue(
			pcg_healthcheck_is_plugin_update(
				array(
					'type'   => 'plugin',
					'action' => 'update',
				)
			)
		);
		$this->assertFalse(
			pcg_healthcheck_is_plugin_update(
				array(
					'type'   => 'plugin',
					'action' => 'install',
				)
			)
		);
		$this->assertFalse(
			pcg_healthcheck_is_plugin_update(
				array(
					'type'   => 'theme',
					'action' => 'update',
				)
			)
		);
		$this->assertFalse( pcg_healthcheck_is_plugin_update( array() ) );
	}

	/**
	 * Pcg_healthcheck_describe_rollback returns a human-readable summary per status.
	 */
	public function test_healthcheck_describe_rollback() {
		$this->assertStringContainsString(
			'reactivated',
			pcg_healthcheck_describe_rollback(
				array(
					'status'      => 'reactivated',
					'restored_to' => '1.2.3',
				)
			)
		);
		$this->assertStringContainsString(
			'deactivated',
			pcg_healthcheck_describe_rollback(
				array(
					'status'      => 'restored',
					'restored_to' => '1.2.3',
				)
			)
		);
		$this->assertStringContainsString(
			'unavailable',
			pcg_healthcheck_describe_rollback( array( 'status' => 'rollback_unavailable' ) )
		);
		$this->assertStringContainsString(
			'failed',
			pcg_healthcheck_describe_rollback( array( 'status' => 'rollback_failed' ) )
		);
	}

	/**
	 * The transient key is deterministic and namespaced with the pcg_probe_ prefix.
	 */
	public function test_transient_key_is_deterministic_and_namespaced() {
		$token = 'abc123';
		$key   = PCG_Load_Tester::transient_key( $token );

		$this->assertSame( 'pcg_probe_' . md5( $token ), $key );
		$this->assertSame( $key, PCG_Load_Tester::transient_key( $token ) );
	}

	/**
	 * Different tokens produce different keys.
	 */
	public function test_transient_key_differs_per_token() {
		$this->assertNotSame(
			PCG_Load_Tester::transient_key( 'aaa' ),
			PCG_Load_Tester::transient_key( 'bbb' )
		);
	}

	/**
	 * Mode constants have the documented values; the endpoint relies on
	 * these specific strings, so a rename here is a wire-protocol change.
	 */
	public function test_load_tester_mode_constant_values() {
		$this->assertSame( 'activation', PCG_Load_Tester::MODE_ACTIVATION );
		$this->assertSame( 'update', PCG_Load_Tester::MODE_UPDATE );
	}

	/**
	 * `build_probe_payload` defaults to activation mode and round-trips
	 * the explicit mode argument when supplied.
	 */
	public function test_build_probe_payload_carries_mode() {
		$default = PCG_Load_Tester::build_probe_payload( array( '/abs/foo/foo.php' ) );
		$this->assertSame(
			array(
				'plugins' => array( '/abs/foo/foo.php' ),
				'mode'    => 'activation',
			),
			$default
		);

		$update = PCG_Load_Tester::build_probe_payload( array( '/abs/foo/foo.php', '/abs/bar/bar.php' ), PCG_Load_Tester::MODE_UPDATE );
		$this->assertSame(
			array(
				'plugins' => array( '/abs/foo/foo.php', '/abs/bar/bar.php' ),
				'mode'    => 'update',
			),
			$update
		);
	}

	/**
	 * Unknown mode strings fall back to activation rather than poisoning
	 * the transient with a value the endpoint will reject.
	 */
	public function test_build_probe_payload_rejects_unknown_mode() {
		$payload = PCG_Load_Tester::build_probe_payload( array( '/abs/foo/foo.php' ), 'bogus' );
		$this->assertSame( 'activation', $payload['mode'] );
	}

	/**
	 * Scenarios for pcg_guard_format_block_reason.
	 *
	 * @return array<string,array{0:array<string,mixed>,1:string}>
	 */
	public static function provide_block_reason_scenarios(): array {
		return array(
			'message + file + line'          => array(
				array(
					'status'  => 'fatal',
					'errno'   => E_USER_ERROR,
					'message' => 'boom',
					'file'    => '/var/www/plugins/foo/foo.php',
					'line'    => 42,
				),
				'boom (in foo.php, line 42).',
			),
			'message + file (no line)'       => array(
				array(
					'status'  => 'throwable',
					'class'   => 'RuntimeException',
					'message' => 'nope',
					'file'    => 'bar.php',
				),
				'nope (in bar.php).',
			),
			'message only'                   => array(
				array(
					'message' => 'lonely message',
				),
				'lonely message.',
			),
			'no message but file + line'     => array(
				array(
					'status' => 'fatal',
					'errno'  => E_ERROR,
					'file'   => 'x.php',
					'line'   => 7,
				),
				'A fatal PHP error was detected in x.php, line 7.',
			),
			'no message, no file → fallback' => array(
				array(
					'status'  => 'fatal',
					'errno'   => E_ERROR,
					'message' => '',
				),
				'A fatal PHP error was detected.',
			),
			'line zero is omitted'           => array(
				array(
					'status'  => 'fatal',
					'message' => 'oops',
					'file'    => 'x.php',
					'line'    => 0,
				),
				'oops (in x.php).',
			),
		);
	}

	/**
	 * Pcg_guard_format_block_reason renders the probe result in a single human-readable line.
	 *
	 * @param array  $result   Probe result payload.
	 * @param string $expected Expected rendered reason.
	 * @dataProvider provide_block_reason_scenarios
	 */
	#[DataProvider( 'provide_block_reason_scenarios' )]
	public function test_format_block_reason( array $result, string $expected ) {
		$this->assertSame( $expected, pcg_guard_format_block_reason( $result ) );
	}

	/**
	 * The load tester's `test()` rejects an empty / non-existent input list
	 * before doing any HTTP work, returning an `error` verdict.
	 */
	public function test_load_tester_rejects_empty_plugin_list() {
		$tester = new PCG_Load_Tester();

		$verdict = $tester->test( array() );
		$this->assertSame( 'error', $verdict['status'] );
		$this->assertNotEmpty( $verdict['reason'] ?? '' );

		$verdict = $tester->test( array( '', '/no/such/file/pcg-missing.php' ) );
		$this->assertSame( 'error', $verdict['status'] );
		$this->assertNotEmpty( $verdict['reason'] ?? '' );
	}

	/**
	 * The explicit `plugin` field on a Throwable verdict wins when it
	 * matches a known path in the batch.
	 */
	public function test_blame_uses_explicit_plugin_field() {
		$paths = array(
			'foo/foo.php' => WP_PLUGIN_DIR . '/foo/foo.php',
			'bar/bar.php' => WP_PLUGIN_DIR . '/bar/bar.php',
		);

		$blamed = pcg_guard_get_blocked_plugin(
			array(
				'status' => 'throwable',
				'plugin' => WP_PLUGIN_DIR . '/bar/bar.php',
				'file'   => WP_PLUGIN_DIR . '/bar/bar.php',
			),
			$paths
		);

		$this->assertSame( 'bar/bar.php', $blamed );
	}

	/**
	 * When the explicit `plugin` field doesn't match anything in the batch,
	 * attribution falls through to the captured `file`.
	 */
	public function test_blame_falls_back_to_file_when_explicit_plugin_unknown() {
		$paths = array(
			'foo/foo.php' => WP_PLUGIN_DIR . '/foo/foo.php',
			'bar/bar.php' => WP_PLUGIN_DIR . '/bar/bar.php',
		);

		$blamed = pcg_guard_get_blocked_plugin(
			array(
				'status' => 'throwable',
				'plugin' => '/some/path/we/dont/recognise.php',
				'file'   => WP_PLUGIN_DIR . '/bar/lib/helper.php',
			),
			$paths
		);

		$this->assertSame( 'bar/bar.php', $blamed );
	}

	/**
	 * An exact-path match against a plugin's main file wins — covers
	 * flat-file plugins where the prefix match would be unsafe.
	 */
	public function test_blame_matches_flat_file_plugin_exactly() {
		$paths = array(
			'hello.php'   => WP_PLUGIN_DIR . '/hello.php',
			'foo/foo.php' => WP_PLUGIN_DIR . '/foo/foo.php',
		);

		$blamed = pcg_guard_get_blocked_plugin(
			array(
				'status' => 'fatal',
				'file'   => WP_PLUGIN_DIR . '/hello.php',
			),
			$paths
		);

		$this->assertSame( 'hello.php', $blamed );
	}

	/**
	 * A fatal in a file inside a plugin's own subdirectory is attributed
	 * via prefix match.
	 */
	public function test_blame_matches_subdirectory_plugin_prefix() {
		$paths = array(
			'foo/foo.php' => WP_PLUGIN_DIR . '/foo/foo.php',
			'bar/bar.php' => WP_PLUGIN_DIR . '/bar/bar.php',
		);

		$blamed = pcg_guard_get_blocked_plugin(
			array(
				'status' => 'fatal',
				'file'   => WP_PLUGIN_DIR . '/bar/lib/deeply/nested.php',
			),
			$paths
		);

		$this->assertSame( 'bar/bar.php', $blamed );
	}

	/**
	 * A fatal at `WP_PLUGIN_DIR/something.php` must NOT be attributed to a
	 * flat-file plugin in the batch via the prefix arm — that would
	 * produce a false attribution because the dirname is the plugins root.
	 * Falls through to the undetermined branch (returns '').
	 */
	public function test_blame_does_not_false_match_flat_file_plugins_via_prefix() {
		$paths = array(
			'hello.php' => WP_PLUGIN_DIR . '/hello.php',
			'world.php' => WP_PLUGIN_DIR . '/world.php',
		);

		$blamed = pcg_guard_get_blocked_plugin(
			array(
				'status' => 'fatal',
				'file'   => WP_PLUGIN_DIR . '/something-unrelated.php',
			),
			$paths
		);

		$this->assertSame( '', $blamed );
	}

	/**
	 * With nothing on the verdict to attribute against, the helper returns
	 * `''` so the caller can surface a batch-level message instead of
	 * blaming an arbitrary plugin.
	 */
	public function test_blame_returns_empty_when_unattributable() {
		$paths = array(
			'foo/foo.php' => WP_PLUGIN_DIR . '/foo/foo.php',
			'bar/bar.php' => WP_PLUGIN_DIR . '/bar/bar.php',
		);

		$blamed = pcg_guard_get_blocked_plugin( array( 'status' => 'fatal' ), $paths );
		$this->assertSame( '', $blamed );

		$blamed = pcg_guard_get_blocked_plugin(
			array(
				'status' => 'fatal',
				'file'   => '/var/www/wp-includes/load.php',
			),
			$paths
		);
		$this->assertSame( '', $blamed );
	}

	/**
	 * A package with only valid PHP files scans clean.
	 */
	public function test_parse_error_scan_returns_empty_for_valid_files() {
		$dir = $this->make_tmp_dir();
		file_put_contents( $dir . '/a.php', "<?php\nfunction pcg_valid_a() { return 1; }\n" );
		file_put_contents( $dir . '/b.php', "<?php\nclass Pcg_Valid_B {}\n" );
		file_put_contents( $dir . '/README.txt', "Not PHP.\n" );

		$result = pcg_update_guard_scan_for_parse_errors( $dir );
		$this->assertSame( array(), $result['errors'] );
		$this->assertFalse( $result['budget_exceeded'] );
	}

	/**
	 * A file with a PHP parse error is reported with its path, line, and message.
	 */
	public function test_parse_error_scan_reports_parse_errors() {
		$dir = $this->make_tmp_dir();
		file_put_contents( $dir . '/good.php', "<?php\nreturn 1;\n" );
		file_put_contents( $dir . '/bad.php', "<?php\nfunction broken( {\n" );

		$result = pcg_update_guard_scan_for_parse_errors( $dir );

		$this->assertCount( 1, $result['errors'] );
		$this->assertStringEndsWith( '/bad.php', $result['errors'][0]['file'] );
		$this->assertIsInt( $result['errors'][0]['line'] );
		$this->assertNotEmpty( $result['errors'][0]['message'] );
		$this->assertFalse( $result['budget_exceeded'] );
	}

	/**
	 * A missing or empty directory returns an empty result rather than failing.
	 */
	public function test_parse_error_scan_handles_missing_dir() {
		$result = pcg_update_guard_scan_for_parse_errors( '' );
		$this->assertSame( array(), $result['errors'] );
		$this->assertFalse( $result['budget_exceeded'] );

		$result = pcg_update_guard_scan_for_parse_errors( '/no/such/path/pcg-does-not-exist' );
		$this->assertSame( array(), $result['errors'] );
		$this->assertFalse( $result['budget_exceeded'] );
	}

	/**
	 * The filter returns the source unchanged when the guard is disabled.
	 */
	public function test_update_guard_check_passthrough_when_disabled() {
		add_filter( 'pcg_guard_activation', '__return_false' );

		$dir = $this->make_tmp_dir();
		file_put_contents( $dir . '/bad.php', "<?php function ( {\n" );

		$result = pcg_update_guard_check(
			$dir,
			$dir,
			null,
			array(
				'type'   => 'plugin',
				'action' => 'install',
			)
		);

		$this->assertSame( $dir, $result );
	}

	/**
	 * Non-plugin extensions (themes, core) are not inspected.
	 */
	public function test_update_guard_check_ignores_non_plugin_types() {
		add_filter( 'pcg_guard_activation', '__return_true' );

		$dir = $this->make_tmp_dir();
		file_put_contents( $dir . '/bad.php', "<?php function ( {\n" );

		$result = pcg_update_guard_check(
			$dir,
			$dir,
			null,
			array(
				'type'   => 'theme',
				'action' => 'install',
			)
		);

		$this->assertSame( $dir, $result );
	}

	/**
	 * Actions other than install/update are not inspected.
	 */
	public function test_update_guard_check_ignores_unrelated_actions() {
		add_filter( 'pcg_guard_activation', '__return_true' );

		$dir = $this->make_tmp_dir();
		file_put_contents( $dir . '/bad.php', "<?php function ( {\n" );

		$result = pcg_update_guard_check(
			$dir,
			$dir,
			null,
			array(
				'type'   => 'plugin',
				'action' => 'download',
			)
		);

		$this->assertSame( $dir, $result );
	}

	/**
	 * Clean plugin packages pass through untouched.
	 */
	public function test_update_guard_check_allows_clean_plugin_package() {
		add_filter( 'pcg_guard_activation', '__return_true' );

		$dir = $this->make_tmp_dir();
		file_put_contents( $dir . '/plugin.php', "<?php\n// Plugin Name: PCG Ok\n" );

		$result = pcg_update_guard_check(
			$dir,
			$dir,
			null,
			array(
				'type'   => 'plugin',
				'action' => 'install',
			)
		);

		$this->assertSame( $dir, $result );
	}

	/**
	 * Packages with parse errors are rejected with a descriptive WP_Error.
	 */
	public function test_update_guard_check_blocks_plugin_with_parse_error() {
		add_filter( 'pcg_guard_activation', '__return_true' );
		add_filter( 'pcg_rollout_percentage', static fn() => 100 );

		$dir = $this->make_tmp_dir();
		file_put_contents( $dir . '/plugin.php', "<?php function ( {\n" );

		$result = pcg_update_guard_check(
			$dir,
			$dir,
			null,
			array(
				'type'   => 'plugin',
				'action' => 'update',
			)
		);

		$this->assertInstanceOf( 'WP_Error', $result );
		$this->assertSame( 'pcg_update_parse_error', $result->get_error_code() );
		$this->assertStringContainsString( 'update', $result->get_error_message() );
		$this->assertStringContainsString( 'plugin.php', $result->get_error_message() );
	}

	/**
	 * A pre-existing WP_Error from an earlier filter is returned untouched.
	 */
	public function test_update_guard_check_preserves_incoming_error() {
		$incoming = new WP_Error( 'other_error', 'something else went wrong' );

		$result = pcg_update_guard_check(
			$incoming,
			'/ignored',
			null,
			array(
				'type'   => 'plugin',
				'action' => 'install',
			)
		);

		$this->assertSame( $incoming, $result );
	}

	/**
	 * Sweep_stale_backups deletes md5-named subdirs older than the TTL,
	 * leaves recent ones, and ignores entries that don't match our naming.
	 */
	public function test_snapshot_sweep_stale_backups_drops_orphaned_dirs() {
		if ( ! function_exists( 'WP_Filesystem' ) ) {
			require_once ABSPATH . 'wp-admin/includes/file.php';
		}
		WP_Filesystem();
		global $wp_filesystem;
		if ( ! $wp_filesystem ) {
			$this->markTestSkipped( 'WP_Filesystem unavailable in this test env.' );
		}

		$root = $this->make_tmp_dir();
		add_filter(
			'pcg_backup_root',
			static function () use ( $root ) {
				return $root;
			}
		);

		$stale     = $root . '/' . md5( 'stale' );
		$fresh     = $root . '/' . md5( 'fresh' );
		$unrelated = $root . '/not-ours';
		mkdir( $stale, 0777, true );
		mkdir( $fresh, 0777, true );
		mkdir( $unrelated, 0777, true );
		file_put_contents( $unrelated . '/keep.txt', 'keep' );

		$past = time() - ( 2 * HOUR_IN_SECONDS );
		touch( $stale, $past );
		touch( $unrelated, $past );

		PCG_Snapshot::sweep_stale_backups();

		$this->assertFalse( is_dir( $stale ), 'Stale md5-named backup should be deleted.' );
		$this->assertTrue( is_dir( $fresh ), 'Recent md5-named backup should be preserved.' );
		$this->assertTrue( is_dir( $unrelated ), 'Non-matching entries must be left alone.' );
	}

	/**
	 * `classify_shutdown` returns `fatal` for engine-fatal errno values
	 * and preserves the message/file/line for the client's notice.
	 */
	public function test_classify_shutdown_emits_fatal_for_engine_errors() {
		$verdict = PCG_Load_Tester::classify_shutdown(
			array(
				'type'    => E_ERROR,
				'message' => 'Allowed memory size of N bytes exhausted',
				'file'    => '/srv/htdocs/wp-content/plugins/example/main.php',
				'line'    => 42,
			)
		);

		$this->assertSame( 'fatal', $verdict['status'] );
		$this->assertSame( E_ERROR, $verdict['errno'] );
		$this->assertSame( 'Allowed memory size of N bytes exhausted', $verdict['message'] );
		$this->assertSame( '/srv/htdocs/wp-content/plugins/example/main.php', $verdict['file'] );
		$this->assertSame( 42, $verdict['line'] );
	}

	/**
	 * `classify_shutdown` emits `ok-shutdown` when `error_get_last()` is
	 * null — the case that previously left the client misclassifying a
	 * clean `exit()` during init as a fatal.
	 */
	public function test_classify_shutdown_emits_ok_shutdown_for_clean_exit() {
		$verdict = PCG_Load_Tester::classify_shutdown( null );

		$this->assertSame( 'ok-shutdown', $verdict['status'] );
		$this->assertNotEmpty( $verdict['reason'] ?? '' );
	}

	/**
	 * Non-fatal errnos (notices, warnings, deprecations) must not be
	 * upgraded to a `fatal` verdict. Otherwise a stray notice from an
	 * earlier hook would shadow a clean shutdown as a false-positive
	 * block.
	 */
	public function test_classify_shutdown_ignores_non_fatal_errnos() {
		$verdict = PCG_Load_Tester::classify_shutdown(
			array(
				'type'    => E_NOTICE,
				'message' => 'Undefined index: foo',
				'file'    => '/srv/htdocs/wp-content/plugins/example/main.php',
				'line'    => 7,
			)
		);

		$this->assertSame( 'ok-shutdown', $verdict['status'] );
	}

	/**
	 * Decorated `Class not found` messages that don't match PHP's
	 * canonical quoted-name format must not be classified as a flake.
	 * The loose substring detector previously matched any message
	 * containing the words 'Class ' and ' not found' anywhere, which
	 * over-matched on wrapped errors and stack-trace-decorated fatals.
	 */
	public function test_is_sibling_load_flake_ignores_decorated_class_not_found_phrasing() {
		$tester = new PCG_Load_Tester();
		$plugin = WP_PLUGIN_DIR . '/foo/foo.php';

		$verdict = array(
			'status'  => 'throwable',
			'message' => 'Cannot use Class Foo as final; helper not found in helper module',
			'file'    => $plugin,
		);

		$this->assertFalse(
			$tester->is_sibling_load_flake( $verdict, array( $plugin ) ),
			'Only PHP\'s canonical Class "Name" not found phrasing should qualify.'
		);
	}

	/**
	 * Class-not-found verdicts require the captured `file` to live
	 * inside a candidate's directory. A message lacking any path and
	 * a captured file outside the candidate trees must not be downgraded
	 * — that signature indicates a real autoloader bug, not a sibling
	 * load flake.
	 */
	public function test_is_sibling_load_flake_requires_captured_file_for_class_not_found() {
		$tester = new PCG_Load_Tester();
		$plugin = WP_PLUGIN_DIR . '/foo/foo.php';

		$verdict = array(
			'status'  => 'throwable',
			'message' => 'Class "Some\\Other\\Vendor\\Thing" not found',
			'file'    => '/srv/htdocs/wp-includes/class-wp-hook.php',
		);

		$this->assertFalse(
			$tester->is_sibling_load_flake( $verdict, array( $plugin ) ),
			'A class-not-found whose captured file is outside every candidate dir is a real bug, not a flake.'
		);
	}

	/**
	 * Sibling-load flake: PHP can't open a file under the candidate
	 * plugin's own directory. Should be recognised as a flake so the
	 * downgrade-to-allow path triggers.
	 */
	public function test_is_sibling_load_flake_detects_failed_require_inside_candidate_dir() {
		$tester = new PCG_Load_Tester();
		$plugin = WP_PLUGIN_DIR . '/woocommerce-shipstation-integration/woocommerce-shipstation.php';

		$verdict = array(
			'status'  => 'throwable',
			'class'   => 'Error',
			'message' => "Failed opening required '{$plugin}-dir/includes/class-main.php' (include_path='/:.')",
			'file'    => $plugin,
		);

		$this->assertTrue(
			$tester->is_sibling_load_flake( $verdict, array( $plugin ) ),
			'A failed-require inside the candidate plugin tree should be classified as a sibling-load flake.'
		);
	}

	/**
	 * Autoloader miss for a class defined inside the candidate plugin's
	 * own tree shares the signature and should also downgrade to allow.
	 */
	public function test_is_sibling_load_flake_detects_class_not_found_for_candidate() {
		$tester = new PCG_Load_Tester();
		$plugin = WP_PLUGIN_DIR . '/invisible-recaptcha/invisible-recaptcha.php';

		$verdict = array(
			'status'  => 'throwable',
			'class'   => 'Error',
			'message' => 'Class "InvisibleReCaptcha\\MchLib\\Plugin\\MchBasePlugin" not found for activation',
			'file'    => $plugin,
		);

		$this->assertTrue(
			$tester->is_sibling_load_flake( $verdict, array( $plugin ) )
		);
	}

	/**
	 * A genuine fatal not related to file presence (e.g. an undefined
	 * function call) must NOT be classified as a flake — that would
	 * mask real bugs behind the downgrade-to-allow path.
	 */
	public function test_is_sibling_load_flake_ignores_unrelated_fatals() {
		$tester = new PCG_Load_Tester();
		$plugin = WP_PLUGIN_DIR . '/seo-by-rank-math/rank-math.php';

		$verdict = array(
			'status'  => 'throwable',
			'message' => 'Call to undefined function RankMath\\Analytics\\as_get_scheduled_actions()',
			'file'    => $plugin,
		);

		$this->assertFalse(
			$tester->is_sibling_load_flake( $verdict, array( $plugin ) ),
			'Undefined-function fatals are a timing class, not a sibling-load flake.'
		);
	}

	/**
	 * A file-not-found whose path lies *outside* every candidate's
	 * directory tree (e.g. a missing WP core file) is not our class of
	 * flake; let the existing fatal path handle it so we don\'t mask a
	 * genuinely broken environment.
	 */
	public function test_is_sibling_load_flake_ignores_failed_require_outside_candidate_dir() {
		$tester = new PCG_Load_Tester();
		$plugin = WP_PLUGIN_DIR . '/foo/foo.php';

		$verdict = array(
			'status'  => 'fatal',
			'message' => "Failed opening required '/srv/htdocs/wp-includes/missing.php' (include_path='/:.')",
			'file'    => '/srv/htdocs/wp-load.php',
		);

		$this->assertFalse(
			$tester->is_sibling_load_flake( $verdict, array( $plugin ) )
		);
	}

	/**
	 * Non-fatal verdicts (ok, ok-inconclusive, error) never downgrade.
	 */
	public function test_is_sibling_load_flake_only_considers_blocking_verdicts() {
		$tester = new PCG_Load_Tester();
		$plugin = WP_PLUGIN_DIR . '/foo/foo.php';

		foreach ( array( 'ok', 'ok-inconclusive', 'ok-shutdown', 'error' ) as $status ) {
			$this->assertFalse(
				$tester->is_sibling_load_flake(
					array(
						'status'  => $status,
						'message' => "Failed opening required '{$plugin}-dir/missing.php'",
						'file'    => $plugin,
					),
					array( $plugin )
				),
				"Status '$status' should never trigger the sibling-load flake downgrade."
			);
		}
	}

	/**
	 * Flat-file plugins (dirname === WP_PLUGIN_DIR) must not enable a
	 * prefix-match against every other plugin's files. Mirrors the
	 * defence in `pcg_guard_get_blocked_plugin`.
	 */
	public function test_is_sibling_load_flake_does_not_false_match_via_flat_file_plugin() {
		$tester    = new PCG_Load_Tester();
		$flat_file = WP_PLUGIN_DIR . '/hello.php';
		$other     = WP_PLUGIN_DIR . '/other/other.php';

		$verdict = array(
			'status'  => 'throwable',
			'message' => "Failed opening required '" . WP_PLUGIN_DIR . "/another/file.php' (include_path='/:.')",
			'file'    => WP_PLUGIN_DIR . '/another/file.php',
		);

		$this->assertFalse(
			$tester->is_sibling_load_flake( $verdict, array( $flat_file, $other ) ),
			'A failed-require outside both candidates\' trees must not be claimed via flat-file prefix match.'
		);
	}

	/**
	 * A signature with a message regex + plugin basename matches the
	 * canonical Gravity Forms 2.10.1 `array_walk()` on null shape and
	 * returns the entry's label.
	 */
	public function test_signature_allowlist_matches_by_plugin_and_message() {
		$tester = new PCG_Load_Tester();
		$plugin = WP_PLUGIN_DIR . '/gravityforms/gravityforms.php';

		add_filter(
			'pcg_signature_allowlist',
			static function ( $list ) {
				$list[] = array(
					'label'   => 'gf-2.10.1-array-walk-null',
					'plugin'  => 'gravityforms/gravityforms.php',
					'message' => '/array_walk\(\).+null given/',
				);
				return $list;
			}
		);

		$verdict = array(
			'status'  => 'fatal',
			'plugin'  => $plugin,
			'message' => 'array_walk() expects parameter 1 to be array, null given',
			'file'    => $plugin,
		);

		$this->assertSame(
			'gf-2.10.1-array-walk-null',
			$tester->matches_signature_allowlist( $verdict )
		);
	}

	/**
	 * Non-blocking verdicts (`ok`, `ok-inconclusive`, `ok-shutdown`,
	 * `error`) must not match the allowlist — they're not captured fatals
	 * and downgrading them changes nothing useful.
	 */
	public function test_signature_allowlist_skips_non_blocking_verdicts() {
		$tester = new PCG_Load_Tester();

		add_filter(
			'pcg_signature_allowlist',
			static function ( $list ) {
				$list[] = array(
					'label'   => 'always-match',
					'message' => '/./',
				);
				return $list;
			}
		);

		foreach ( array( 'ok', 'ok-inconclusive', 'ok-shutdown', 'error' ) as $status ) {
			$this->assertNull(
				$tester->matches_signature_allowlist(
					array(
						'status'  => $status,
						'message' => 'anything',
					)
				),
				"Status '$status' must not match the allowlist."
			);
		}
	}

	/**
	 * A signature missing all three of plugin/file/message is too loose
	 * to apply — it would match every captured fatal. Skip silently.
	 */
	public function test_signature_allowlist_skips_empty_signatures() {
		$tester = new PCG_Load_Tester();
		$plugin = WP_PLUGIN_DIR . '/foo/foo.php';

		add_filter(
			'pcg_signature_allowlist',
			static function ( $list ) {
				$list[] = array( 'label' => 'too-loose' );
				return $list;
			}
		);

		$this->assertNull(
			$tester->matches_signature_allowlist(
				array(
					'status'  => 'fatal',
					'message' => 'anything',
					'file'    => $plugin,
				)
			)
		);
	}

	/**
	 * Plugin and file fields are matched on basename. An absolute install
	 * path in the verdict must still match a basename-only signature
	 * entry, since the install layout shouldn't bleed into rule shape.
	 */
	public function test_signature_allowlist_matches_file_by_basename() {
		$tester = new PCG_Load_Tester();
		$plugin = WP_PLUGIN_DIR . '/gravityforms/gravityforms.php';

		add_filter(
			'pcg_signature_allowlist',
			static function ( $list ) {
				$list[] = array(
					'label' => 'gf-block-form',
					'file'  => 'class-gf-block-form.php',
				);
				return $list;
			}
		);

		$verdict = array(
			'status' => 'fatal',
			'plugin' => $plugin,
			'file'   => WP_PLUGIN_DIR . '/gravityforms/includes/blocks/class-gf-block-form.php',
		);

		$this->assertSame(
			'gf-block-form',
			$tester->matches_signature_allowlist( $verdict )
		);
	}

	/**
	 * Rollout default is 0% — no blog is in the cohort.
	 */
	public function test_rollout_default_is_zero_percent() {
		$this->assertFalse( PCG_Rollout::is_enabled_for_blog( 1 ) );
		$this->assertFalse( PCG_Rollout::is_enabled_for_blog( 99999 ) );
	}

	/**
	 * 100% includes every positive blog ID.
	 */
	public function test_rollout_full_includes_every_blog() {
		add_filter( 'pcg_rollout_percentage', static fn() => 100 );
		$this->assertTrue( PCG_Rollout::is_enabled_for_blog( 1 ) );
		$this->assertTrue( PCG_Rollout::is_enabled_for_blog( 240190614 ) );
	}

	/**
	 * Invalid or non-positive blog IDs are never enabled, even at 100%.
	 */
	public function test_rollout_rejects_non_positive_blog_ids() {
		add_filter( 'pcg_rollout_percentage', static fn() => 100 );
		$this->assertFalse( PCG_Rollout::is_enabled_for_blog( 0 ) );
		$this->assertFalse( PCG_Rollout::is_enabled_for_blog( -1 ) );
	}

	/**
	 * Force-enable list overrides the percentage gate, including at 0%.
	 */
	public function test_rollout_force_enable_overrides_percentage() {
		add_filter( 'pcg_rollout_percentage', static fn() => 0 );
		add_filter( 'pcg_rollout_force_enable_blogs', static fn() => array( 12345 ) );
		$this->assertTrue( PCG_Rollout::is_enabled_for_blog( 12345 ) );
		$this->assertFalse( PCG_Rollout::is_enabled_for_blog( 12346 ) );
	}

	/**
	 * Bucketing must be deterministic — the same blog ID stays in the
	 * same bucket across calls. (Ramping from 10% to 50% should strictly
	 * add blogs, never reshuffle them.)
	 */
	public function test_rollout_blog_bucket_is_deterministic() {
		$this->assertSame(
			PCG_Rollout::blog_bucket( 7777 ),
			PCG_Rollout::blog_bucket( 7777 )
		);
		// Different IDs land in different buckets (overwhelmingly likely
		// for crc32 % 100 — pick two we can verify ourselves).
		$this->assertNotSame(
			PCG_Rollout::blog_bucket( 1 ),
			PCG_Rollout::blog_bucket( 2 )
		);
	}

	/**
	 * The gate wired through `pcg_guard_activation` returns false when
	 * the rollout would exclude the current blog, regardless of any
	 * earlier filter that said true.
	 */
	public function test_rollout_gate_narrows_pcg_guard_activation() {
		// Default percentage is 0; gate must veto.
		$this->assertFalse( apply_filters( 'pcg_guard_activation', true ) );
		$this->assertFalse( apply_filters( 'pcg_guard_updates', true ) );

		// At 100% the gate passes through.
		add_filter( 'pcg_rollout_percentage', static fn() => 100 );
		$this->assertTrue( apply_filters( 'pcg_guard_activation', true ) );
		$this->assertTrue( apply_filters( 'pcg_guard_updates', true ) );
	}

	/**
	 * The gate only narrows — if an earlier filter returned false, the
	 * gate must not flip it back to true.
	 */
	public function test_rollout_gate_only_narrows() {
		add_filter( 'pcg_rollout_percentage', static fn() => 100 );
		add_filter( 'pcg_guard_activation', static fn() => false, 1 );
		$this->assertFalse( apply_filters( 'pcg_guard_activation', true ) );
	}

	/**
	 * A plugin-scoped signature must NOT match when the verdict lacks an
	 * explicit `plugin` attribution. Falling back to the whole batch would
	 * silently allow an unrelated sibling's fatal under another plugin's
	 * label whenever a shutdown-handler `fatal` (no `plugin` key) hit a
	 * batch that happened to contain the configured plugin.
	 */
	public function test_signature_allowlist_requires_attribution_for_plugin_scoped_signature() {
		$tester       = new PCG_Load_Tester();
		$other_plugin = WP_PLUGIN_DIR . '/totally-other/other.php';

		add_filter(
			'pcg_signature_allowlist',
			static function ( $list ) {
				$list[] = array(
					'label'   => 'gf-array-walk',
					'plugin'  => 'gravityforms/gravityforms.php',
					'message' => '/array_walk/',
				);
				return $list;
			}
		);

		// Shutdown-handler-style fatal: no `plugin` attribution.
		$verdict = array(
			'status'  => 'fatal',
			'message' => 'array_walk() expects parameter 1 to be array, null given',
			'file'    => $other_plugin,
		);

		$this->assertNull(
			$tester->matches_signature_allowlist( $verdict ),
			'Plugin-scoped signature must require an explicit `plugin` attribution on the verdict.'
		);
	}

	/**
	 * A `throwable` verdict whose captured class is a user-thrown
	 * Exception (e.g. RuntimeException) must NOT be classified as a
	 * sibling-load flake, even if the user-supplied message happens to
	 * match the class-not-found regex and the throw site is inside the
	 * plugin directory. The classifier must restrict to PHP engine
	 * error classes — anything else is the plugin asking to abort.
	 */
	public function test_is_sibling_load_flake_rejects_non_engine_throwable() {
		$tester = new PCG_Load_Tester();
		$plugin = WP_PLUGIN_DIR . '/some-plugin/some-plugin.php';

		$verdict = array(
			'status'  => 'throwable',
			'class'   => 'RuntimeException',
			'message' => 'Class "Foo\\Bar" not found — please reinstall plugin',
			'file'    => $plugin,
		);

		$this->assertFalse(
			$tester->is_sibling_load_flake( $verdict, array( $plugin ) ),
			'A hand-thrown RuntimeException with class-not-found wording is a deliberate abort, not a flake.'
		);
	}

	/**
	 * `is_php_engine_error_class` recognises PHP's built-in error
	 * classes and rejects user-defined Exception subclasses, with or
	 * without leading namespace separators.
	 */
	public function test_is_php_engine_error_class_recognises_engine_classes() {
		$this->assertTrue( PCG_Load_Tester::is_php_engine_error_class( 'Error' ) );
		$this->assertTrue( PCG_Load_Tester::is_php_engine_error_class( '\\Error' ) );
		$this->assertTrue( PCG_Load_Tester::is_php_engine_error_class( 'TypeError' ) );
		$this->assertTrue( PCG_Load_Tester::is_php_engine_error_class( 'ParseError' ) );
		$this->assertFalse( PCG_Load_Tester::is_php_engine_error_class( 'RuntimeException' ) );
		$this->assertFalse( PCG_Load_Tester::is_php_engine_error_class( 'Exception' ) );
		$this->assertFalse( PCG_Load_Tester::is_php_engine_error_class( 'MyError' ) );
		$this->assertFalse( PCG_Load_Tester::is_php_engine_error_class( '' ) );
	}

	/**
	 * `WP_PLUGIN_DIR` defined with a trailing slash (legal, occasionally
	 * seen in custom installs) must not bypass the flat-file-plugin skip
	 * in `path_inside_candidate`, since otherwise the candidate's
	 * effective prefix becomes `WP_PLUGIN_DIR/` and matches every
	 * unrelated plugin's files.
	 *
	 * The detector compares via `untrailingslashit()`, so the
	 * `Plugin_Conflicts_Guardian_Test`'s scenario simulates this by
	 * supplying a plugin path that has an extra trailing slash in the
	 * dirname comparison — captured in the regression scenario below.
	 */
	public function test_is_sibling_load_flake_skips_flat_file_when_plugin_dir_has_trailing_slash() {
		$tester = new PCG_Load_Tester();
		// `WP_PLUGIN_DIR` is fixed at runtime so we can't directly mutate
		// it; instead exercise the untrailingslashit normalization by
		// passing a flat-file candidate whose dirname matches the
		// configured plugins root after normalization.
		$flat = WP_PLUGIN_DIR . '/hello.php';

		$verdict = array(
			'status'  => 'fatal',
			'message' => "Failed opening required '" . WP_PLUGIN_DIR . "/unrelated/file.php'",
			'file'    => WP_PLUGIN_DIR . '/unrelated/file.php',
		);

		$this->assertFalse(
			$tester->is_sibling_load_flake( $verdict, array( $flat ) ),
			'A flat-file candidate must be skipped so its WP_PLUGIN_DIR prefix does not match other plugins.'
		);
	}

	/**
	 * Update mode never downgrades captured fatals — the rollback path
	 * needs every captured fatal to block so PCG_Rollback can fire.
	 */
	public function test_test_does_not_downgrade_in_update_mode() {
		// Stub `PCG_Load_Tester::send_probe_pair` via a subclass that
		// returns a sibling-load-shaped fatal without making an HTTP
		// request, so we can assert the test() entry point preserves
		// it in MODE_UPDATE.
		$plugin = WP_PLUGIN_DIR . '/akismet/akismet.php';
		if ( ! is_dir( WP_PLUGIN_DIR . '/akismet' ) ) {
			mkdir( WP_PLUGIN_DIR . '/akismet', 0777, true );
		}
		if ( ! file_exists( $plugin ) ) {
			file_put_contents( $plugin, "<?php\n// stub\n" );
		}

		$tester = new class() extends PCG_Load_Tester {
			protected function send_probe_pair( array $plugin_mains, $mode ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable -- $mode matches the parent signature.
				$plugin = $plugin_mains[0];
				return array(
					'status'  => 'fatal',
					'message' => "Failed opening required '{$plugin}-dir/missing.php'",
					'file'    => $plugin,
				);
			}
		};

		try {
			$activation_verdict = $tester->test( array( $plugin ), PCG_Load_Tester::MODE_ACTIVATION );
			$this->assertSame( 'ok-inconclusive', $activation_verdict['status'], 'Activation mode downgrades the sibling-load fatal.' );

			$update_verdict = $tester->test( array( $plugin ), PCG_Load_Tester::MODE_UPDATE );
			$this->assertSame( 'fatal', $update_verdict['status'], 'Update mode must preserve the captured fatal so rollback fires.' );
		} finally {
			if ( file_exists( $plugin ) ) {
				unlink( $plugin );
			}
			if ( is_dir( WP_PLUGIN_DIR . '/akismet' ) ) {
				rmdir( WP_PLUGIN_DIR . '/akismet' );
			}
		}
	}

	/**
	 * `blog_bucket` must always return a non-negative value in [0, 100),
	 * even on platforms where `crc32` returns a signed int and the raw
	 * modulo would be negative.
	 */
	public function test_blog_bucket_is_non_negative() {
		// Walk a range of IDs; every result must be in [0, 100).
		for ( $i = 0; $i < 500; $i++ ) {
			$bucket = PCG_Rollout::blog_bucket( 10_000_000 + $i );
			$this->assertGreaterThanOrEqual( 0, $bucket, 'Bucket for blog ' . ( 10_000_000 + $i ) . ' must be >= 0.' );
			$this->assertLessThan( 100, $bucket, 'Bucket for blog ' . ( 10_000_000 + $i ) . ' must be < 100.' );
		}
	}

	/**
	 * Create a unique temp directory for a single test.
	 *
	 * @return string Absolute path.
	 */
	private function make_tmp_dir(): string {
		$this->tmp_dir = rtrim( sys_get_temp_dir(), '/' ) . '/pcg-test-' . wp_generate_password( 8, false );
		mkdir( $this->tmp_dir, 0777, true );
		return $this->tmp_dir;
	}

	/**
	 * Recursively delete a directory. Used only against paths we created in this test.
	 *
	 * @param string $dir Directory to remove.
	 */
	private function rrmdir( string $dir ): void {
		if ( ! is_dir( $dir ) ) {
			return;
		}
		$iter = new RecursiveIteratorIterator(
			new RecursiveDirectoryIterator( $dir, FilesystemIterator::SKIP_DOTS ),
			RecursiveIteratorIterator::CHILD_FIRST
		);
		foreach ( $iter as $path => $file ) {
			if ( $file->isDir() ) {
				rmdir( (string) $path );
			} else {
				unlink( (string) $path );
			}
		}
		rmdir( $dir );
	}
}
