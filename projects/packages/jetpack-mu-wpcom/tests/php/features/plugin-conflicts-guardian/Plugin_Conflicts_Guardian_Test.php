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
// probe-endpoint.php registers a shutdown handler and reads $_GET on
// require; the entry function `pcg_maybe_handle_probe()` is the one
// that does that work, and it bails immediately when `$_GET['pcg_probe']`
// isn't set. Loading the file in tests is safe and gives us access to
// helpers like `pcg_probe_already_emitted()` for unit testing.
require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/plugin-conflicts-guardian/probe-endpoint.php';
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
	 * Build a fake `Requests::Response`-shaped object so `parse_response`
	 * can be exercised without a live HTTP loopback. Honours the marker
	 * header lookup via a case-insensitive array stub.
	 *
	 * @param int    $status_code      HTTP status code.
	 * @param string $body             Response body.
	 * @param bool   $endpoint_reached Whether to include the X-PCG-Probe marker header.
	 * @param int    $redirects        Number of redirects followed.
	 * @return object
	 */
	private function make_fake_response( int $status_code, string $body, bool $endpoint_reached = false, int $redirects = 0 ): object {
		$headers = $endpoint_reached ? array( 'x-pcg-probe' => '1' ) : array();
		return (object) array(
			'status_code' => $status_code,
			'body'        => $body,
			'redirects'   => $redirects,
			'headers'     => $headers,
		);
	}

	/**
	 * Call the protected `parse_response` via Reflection so the verdict
	 * policy can be unit-tested without firing real HTTP.
	 *
	 * @param object $response Fake response object.
	 * @return array
	 */
	private function invoke_parse_response( $response ): array {
		$tester = new PCG_Load_Tester();
		$ref    = new \ReflectionMethod( PCG_Load_Tester::class, 'parse_response' );
		return (array) $ref->invoke( $tester, $response );
	}

	/**
	 * HTTP 500 without a JSON body must NOT block. PCG's policy is to
	 * block only on a captured fatal (status=fatal from classify_shutdown
	 * or status=throwable from the require-time catch); a 500 with no
	 * verdict could be an upstream LB, edge proxy, intercepting plugin,
	 * or engine death we can't attribute, and historically dominated the
	 * false-positive bucket.
	 */
	public function test_parse_response_http_500_no_body_is_ok_inconclusive() {
		$result = $this->invoke_parse_response( $this->make_fake_response( 500, '' ) );
		$this->assertSame( 'ok-inconclusive', $result['status'] );
		$this->assertStringContainsString( 'HTTP 500', $result['reason'] );
	}

	/**
	 * HTTP 200 + X-PCG-Probe marker + non-JSON body: the endpoint ran but
	 * no verdict was written. Under the captured-fatal-only policy this
	 * is non-blocking — most often engine death or a mid-stream
	 * connection drop, not a fatal we can attribute.
	 */
	public function test_parse_response_marker_present_no_json_is_ok_inconclusive() {
		$result = $this->invoke_parse_response(
			$this->make_fake_response( 200, '<html>not json</html>', true )
		);
		$this->assertSame( 'ok-inconclusive', $result['status'] );
		$this->assertStringContainsString( 'no JSON verdict', $result['reason'] );
	}

	/**
	 * HTTP 200 without the marker means the loopback never reached the
	 * PCG endpoint — a cache or intercepting plugin answered. Stays as a
	 * non-blocking `error` (logged) so we can size how often the loopback
	 * is short-circuited in production.
	 */
	public function test_parse_response_no_marker_no_redirect_is_error() {
		$result = $this->invoke_parse_response(
			$this->make_fake_response( 200, '<html>cached page</html>', false, 0 )
		);
		$this->assertSame( 'error', $result['status'] );
	}

	/**
	 * A JSON verdict from the endpoint passes straight through —
	 * captured fatals must keep blocking.
	 */
	public function test_parse_response_passes_through_captured_fatal() {
		$body   = wp_json_encode(
			array(
				'status'  => 'fatal',
				'message' => 'Class "Foo\\Bar" not found',
				'file'    => '/abs/foo/foo.php',
				'plugin'  => '/abs/foo/foo.php',
			),
			JSON_UNESCAPED_SLASHES
		);
		$result = $this->invoke_parse_response( $this->make_fake_response( 200, (string) $body, true ) );
		$this->assertSame( 'fatal', $result['status'] );
		$this->assertSame( 'Class "Foo\\Bar" not found', $result['message'] );
	}

	/**
	 * `classify_shutdown` maps an engine-fatal `error_get_last()` array to
	 * status=fatal with the captured errno/message/file/line preserved so
	 * the activation guard can attribute the failure to the right plugin.
	 */
	public function test_classify_shutdown_emits_fatal_for_engine_error() {
		$verdict = PCG_Load_Tester::classify_shutdown(
			array(
				'type'    => E_ERROR,
				'message' => 'Uncaught Error: Class "Foo\\Bar" not found',
				'file'    => '/abs/foo/foo.php',
				'line'    => 42,
			)
		);
		$this->assertSame( 'fatal', $verdict['status'] );
		$this->assertSame( E_ERROR, $verdict['errno'] );
		$this->assertSame( '/abs/foo/foo.php', $verdict['file'] );
		$this->assertSame( 42, $verdict['line'] );
	}

	/**
	 * `classify_shutdown` returns status=ok-shutdown when there is no
	 * captured fatal — covers the clean-`exit`-during-init case that
	 * previously surfaced as "marker present, no JSON body" and got
	 * misclassified as a fatal.
	 */
	public function test_classify_shutdown_emits_ok_shutdown_when_no_fatal() {
		$verdict = PCG_Load_Tester::classify_shutdown( null );
		$this->assertSame( 'ok-shutdown', $verdict['status'] );
		$this->assertNotEmpty( $verdict['reason'] );
	}

	/**
	 * Notice/warning/deprecation errors are NOT fatals — they're routine
	 * non-blocking signals. Misclassifying them would re-introduce the
	 * old false-positive class the always-emit fix is meant to remove.
	 */
	/**
	 * `E_RECOVERABLE_ERROR` is in the fatal mask. It IS catchable by a
	 * custom `set_error_handler`, but the probe doesn't install one and
	 * the only way this errno reaches `error_get_last()` at shutdown is
	 * the uncaught path. Treating it as fatal is correct in probe
	 * context and matches PHP's own "unhandled = fatal" behaviour.
	 */
	public function test_classify_shutdown_treats_recoverable_error_as_fatal() {
		$verdict = PCG_Load_Tester::classify_shutdown(
			array(
				'type'    => E_RECOVERABLE_ERROR,
				'message' => 'Argument 1 passed to foo() must be array, null given',
				'file'    => '/abs/foo/foo.php',
				'line'    => 17,
			)
		);
		$this->assertSame( 'fatal', $verdict['status'] );
		$this->assertSame( E_RECOVERABLE_ERROR, $verdict['errno'] );
	}

	public function test_classify_shutdown_treats_non_fatal_errno_as_ok_shutdown() {
		foreach ( array( E_WARNING, E_NOTICE, E_USER_WARNING, E_DEPRECATED, E_USER_DEPRECATED ) as $type ) {
			$verdict = PCG_Load_Tester::classify_shutdown(
				array(
					'type'    => $type,
					'message' => 'noise',
					'file'    => '',
					'line'    => 0,
				)
			);
			$this->assertSame( 'ok-shutdown', $verdict['status'], "errno $type should NOT be classified as fatal" );
		}
	}

	/**
	 * `pcg_probe_already_emitted` is the re-entry guard shared by
	 * `pcg_probe_shutdown` and `pcg_probe_respond`. Verifies the
	 * contract that **only respond marks the flag**; the shutdown
	 * handler must check without marking. A prior implementation marked
	 * the flag in shutdown, which made the very next respond call bail
	 * silently and lose the verdict — this test guards against that
	 * regression.
	 *
	 * Runs in a separate process so the function's `static $emitted`
	 * starts at its fresh state for this test and can't be poisoned by
	 * any earlier test that exercises `pcg_probe_respond` (or by a
	 * future test that does). Without this, adding another consumer of
	 * the helper anywhere in the suite would silently flip the
	 * post-mark assertions to passing-for-the-wrong-reason.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[\PHPUnit\Framework\Attributes\RunInSeparateProcess]
	#[\PHPUnit\Framework\Attributes\PreserveGlobalState( false )]
	public function test_pcg_probe_already_emitted_only_marks_when_asked() {
		$this->assertFalse( pcg_probe_already_emitted(), 'fresh check should be false' );
		$this->assertFalse( pcg_probe_already_emitted(), 'check-only must not mark — second check still false' );

		$this->assertFalse( pcg_probe_already_emitted( true ), 'marking call returns false because flag was previously unset' );

		$this->assertTrue( pcg_probe_already_emitted(), 'post-mark check returns true' );
		$this->assertTrue( pcg_probe_already_emitted( true ), 'post-mark marking call returns true' );
	}

	/**
	 * `is_php_engine_error_class` matches built-in engine errors but
	 * not user-defined subclasses or hand-thrown exceptions. The strict
	 * gate keeps the sibling-load downgrade from silently allowing a
	 * plugin that hand-threw a RuntimeException with class-not-found-
	 * shaped wording.
	 */
	public function test_is_php_engine_error_class_recognises_engine_classes() {
		$this->assertTrue( PCG_Load_Tester::is_php_engine_error_class( 'Error' ) );
		$this->assertTrue( PCG_Load_Tester::is_php_engine_error_class( '\\TypeError' ) );
		$this->assertTrue( PCG_Load_Tester::is_php_engine_error_class( 'ParseError' ) );
		$this->assertTrue( PCG_Load_Tester::is_php_engine_error_class( 'DivisionByZeroError' ) );
		$this->assertFalse( PCG_Load_Tester::is_php_engine_error_class( 'RuntimeException' ) );
		$this->assertFalse( PCG_Load_Tester::is_php_engine_error_class( 'LogicException' ) );
		$this->assertFalse( PCG_Load_Tester::is_php_engine_error_class( 'MyCustomError' ) );
		$this->assertFalse( PCG_Load_Tester::is_php_engine_error_class( '' ) );
	}

	/**
	 * Sibling-load flake: captured fatal where the candidate's entry
	 * file loaded but a sibling under its own directory failed to
	 * require. `Failed opening required` with the captured `file`
	 * inside one of the candidate dirs is the canonical signature.
	 */
	public function test_is_sibling_load_flake_detects_failed_require_inside_candidate_dir() {
		$tester = new PCG_Load_Tester();
		$plugin = WP_PLUGIN_DIR . '/some-plugin/some-plugin.php';
		$result = array(
			'status'  => 'fatal',
			'message' => "Failed opening required '" . WP_PLUGIN_DIR . "/some-plugin/inc/missing.php' (include_path='.')",
			'file'    => WP_PLUGIN_DIR . '/some-plugin/some-plugin.php',
		);
		$this->assertTrue( $tester->is_sibling_load_flake( $result, array( $plugin ) ) );
	}

	/**
	 * `Class "Foo\Bar" not found` inside one of the candidate plugins'
	 * own directories also counts as a sibling-load flake — autoloader
	 * couldn't find a sibling class it should have been able to load.
	 */
	public function test_is_sibling_load_flake_detects_class_not_found_for_candidate() {
		$tester = new PCG_Load_Tester();
		$plugin = WP_PLUGIN_DIR . '/some-plugin/some-plugin.php';
		$result = array(
			'status'  => 'fatal',
			'message' => 'Uncaught Error: Class "SomePlugin\\Helper" not found',
			'file'    => WP_PLUGIN_DIR . '/some-plugin/includes/loader.php',
		);
		$this->assertTrue( $tester->is_sibling_load_flake( $result, array( $plugin ) ) );
	}

	/**
	 * A hand-thrown `\RuntimeException` whose message happens to match
	 * the class-not-found wording must NOT be downgraded — the plugin
	 * is asking to abort, and silently allowing the activation would
	 * deliver a half-loaded plugin.
	 */
	public function test_is_sibling_load_flake_rejects_non_engine_throwable() {
		$tester = new PCG_Load_Tester();
		$plugin = WP_PLUGIN_DIR . '/some-plugin/some-plugin.php';
		$result = array(
			'status'  => 'throwable',
			'class'   => 'RuntimeException',
			'message' => 'Class "SomePlugin\\Required" not found',
			'file'    => WP_PLUGIN_DIR . '/some-plugin/loader.php',
			'plugin'  => $plugin,
		);
		$this->assertFalse( $tester->is_sibling_load_flake( $result, array( $plugin ) ) );
	}

	/**
	 * Captured file outside any candidate plugin dir → not a sibling-
	 * load flake. A class-not-found in a third-party autoloader's path
	 * shouldn't be silenced by association.
	 */
	public function test_is_sibling_load_flake_rejects_when_file_outside_candidate() {
		$tester = new PCG_Load_Tester();
		$plugin = WP_PLUGIN_DIR . '/some-plugin/some-plugin.php';
		$result = array(
			'status'  => 'fatal',
			'message' => 'Uncaught Error: Class "SomePlugin\\Helper" not found',
			'file'    => '/some/random/place/autoloader.php',
		);
		$this->assertFalse( $tester->is_sibling_load_flake( $result, array( $plugin ) ) );
	}

	/**
	 * Flat-file plugins (e.g. `hello.php` at WP_PLUGIN_DIR root) must
	 * not act as a prefix that matches every other plugin's files —
	 * their dir is `WP_PLUGIN_DIR` itself, which would swallow the
	 * whole plugins tree.
	 */
	public function test_is_sibling_load_flake_skips_flat_file_plugin() {
		$tester = new PCG_Load_Tester();
		$flat   = WP_PLUGIN_DIR . '/hello.php';
		$result = array(
			'status'  => 'fatal',
			'message' => "Failed opening required '" . WP_PLUGIN_DIR . "/other-plugin/missing.php'",
			'file'    => WP_PLUGIN_DIR . '/other-plugin/main.php',
		);
		$this->assertFalse( $tester->is_sibling_load_flake( $result, array( $flat ) ) );
	}

	/**
	 * `Failed opening required` arm: when the captured `file` is OUTSIDE
	 * every candidate directory but the message itself names a path
	 * inside one of them, the message-body fallback must still classify
	 * the verdict as a sibling-load flake. This is the path where Plugin
	 * A's main file failed to `require` a file inside Plugin A's own
	 * subdirectory but PHP reported the caller's file (e.g. wrapped via
	 * an external loader). Without this fallback, the downgrade would
	 * miss it and we'd block on a known-flaky signature.
	 */
	public function test_is_sibling_load_flake_uses_message_fallback_for_failed_require() {
		$tester = new PCG_Load_Tester();
		$plugin = WP_PLUGIN_DIR . '/some-plugin/some-plugin.php';
		$result = array(
			'status'  => 'fatal',
			'message' => "Failed opening required '" . WP_PLUGIN_DIR . "/some-plugin/inc/missing.php' (include_path='.')",
			// File is outside every candidate dir — would-be Plugin Loader
			// or composer autoloader path, not the candidate itself.
			'file'    => '/var/www/html/wp-includes/some-loader.php',
		);
		$this->assertTrue(
			$tester->is_sibling_load_flake( $result, array( $plugin ) ),
			'Failed-opening-required arm should fall back to message-body path match when captured file is outside the candidate.'
		);
	}

	/**
	 * Class-not-found arm does NOT use the message-body fallback —
	 * autoloader stack traces and wrapped errors frequently include
	 * unrelated paths, and matching them silently downgrades real bugs.
	 * The arm requires the captured `file` to live inside a candidate.
	 */
	public function test_is_sibling_load_flake_does_not_use_message_fallback_for_class_not_found() {
		$tester = new PCG_Load_Tester();
		$plugin = WP_PLUGIN_DIR . '/some-plugin/some-plugin.php';
		$result = array(
			'status'  => 'fatal',
			// Message references the candidate dir, but the captured file
			// is in someone else's autoloader.
			'message' => 'Uncaught Error: Class "SomePlugin\\Helper" not found in ' . WP_PLUGIN_DIR . '/some-plugin/loader.php',
			'file'    => '/var/www/html/wp-includes/PHPMailer/SMTP.php',
		);
		$this->assertFalse(
			$tester->is_sibling_load_flake( $result, array( $plugin ) ),
			'Class-not-found arm must require captured file inside candidate; message-body fallback would over-match autoloader traces.'
		);
	}

	/**
	 * `is_anomalous_allow` flags `ok-shutdown` (PR 2's always-emit
	 * verdict) so the rate of silent-bootstrap-exit appears in
	 * `Probe anomaly allowed`. Sanity-checked here via Reflection.
	 */
	public function test_is_anomalous_allow_flags_ok_shutdown() {
		$tester = new PCG_Load_Tester();
		$ref    = new \ReflectionMethod( PCG_Load_Tester::class, 'is_anomalous_allow' );
		$this->assertTrue( $ref->invoke( $tester, array( 'status' => 'ok-shutdown' ) ) );
		$this->assertTrue( $ref->invoke( $tester, array( 'status' => 'ok-inconclusive' ) ) );
		$this->assertTrue( $ref->invoke( $tester, array( 'status' => 'error' ) ) );
		$this->assertFalse( $ref->invoke( $tester, array( 'status' => 'ok' ) ) );
		$this->assertFalse( $ref->invoke( $tester, array( 'status' => 'fatal' ) ) );
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
