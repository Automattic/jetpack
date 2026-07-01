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
require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/plugin-conflicts-guardian/force-override.php';
// probe-endpoint.php registers a shutdown handler and reads $_GET on
// require; the entry function `pcg_maybe_handle_probe()` is the one
// that does that work, and it bails immediately when `$_GET['pcg_probe']`
// isn't set. Loading the file in tests is safe and gives us access to
// helpers like `pcg_probe_already_emitted()` for unit testing.
require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/plugin-conflicts-guardian/probe-endpoint.php';
require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/plugin-conflicts-guardian/probe-confirm-bootstrap.php';
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
		remove_all_filters( 'pcg_rollout_percentage' );
		// PCG_Rollout::init() registers itself on require_once. We tear
		// the gate callbacks down by name (not via remove_all_filters,
		// which would also drop any test-local pcg_guard_* filters set
		// up above) and then re-add via init() so every test starts
		// with exactly one copy of the gate at priority 100. Without
		// this, calling init() unconditionally in tear_down would stack
		// the same callback N times across the suite — harmless
		// functionally but wasteful and noisy in some test envs.
		remove_filter( 'pcg_guard_activation', array( 'PCG_Rollout', 'gate' ), 100 );
		remove_filter( 'pcg_guard_updates', array( 'PCG_Rollout', 'gate' ), 100 );
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
				'confirm' => false,
			),
			$default
		);

		$update = PCG_Load_Tester::build_probe_payload( array( '/abs/foo/foo.php', '/abs/bar/bar.php' ), PCG_Load_Tester::MODE_UPDATE );
		$this->assertSame(
			array(
				'plugins' => array( '/abs/foo/foo.php', '/abs/bar/bar.php' ),
				'mode'    => 'update',
				'confirm' => false,
			),
			$update
		);
	}

	/**
	 * `build_probe_payload` carries the `confirm` flag so the early
	 * bootstrap and probe endpoint can branch on confirmation-mode.
	 */
	public function test_build_probe_payload_carries_confirm_flag() {
		$payload = PCG_Load_Tester::build_probe_payload( array( '/abs/foo/foo.php' ), PCG_Load_Tester::MODE_ACTIVATION, true );
		$this->assertTrue( $payload['confirm'] );
	}

	/**
	 * `prepare_probe` adds `pcg_confirm=1` to the loopback URL when
	 * `$is_confirm` is true, so the early-bootstrap hook and the probe
	 * endpoint can both detect the confirmation path.
	 */
	public function test_prepare_probe_includes_pcg_confirm_query_when_confirming() {
		$tester = new PCG_Load_Tester();
		$ref    = new \ReflectionMethod( PCG_Load_Tester::class, 'prepare_probe' );
		$probe  = $ref->invoke( $tester, array( '/abs/foo/foo.php' ), 'https://example.test/', false, PCG_Load_Tester::MODE_ACTIVATION, true );

		$this->assertStringContainsString( 'pcg_confirm=1', (string) $probe['request']['url'] );
		$this->assertStringContainsString( 'pcg_probe=1', (string) $probe['request']['url'] );

		// Non-confirm probes must NOT carry the flag — that would route
		// the request through the early-bootstrap injection path
		// inadvertently.
		$normal = $ref->invoke( $tester, array( '/abs/foo/foo.php' ), 'https://example.test/', false );
		$this->assertStringNotContainsString( 'pcg_confirm', (string) $normal['request']['url'] );
	}

	/**
	 * `downgrade_after_confirmation` rewrites the captured-fatal verdict
	 * as `ok-inconclusive` while preserving the original `plugin`,
	 * `message`, and `file` so logstash can still attribute the
	 * downgrade to a specific candidate.
	 */
	public function test_downgrade_after_confirmation_preserves_attribution() {
		$tester  = new PCG_Load_Tester();
		$ref     = new \ReflectionMethod( PCG_Load_Tester::class, 'downgrade_after_confirmation' );
		$verdict = array(
			'status'  => 'fatal',
			'plugin'  => '/abs/foo/foo.php',
			'message' => 'Class "Foo\\Bar" not found',
			'file'    => '/abs/foo/inc/missing.php',
		);
		$out     = $ref->invoke( $tester, $verdict, array( 'status' => 'ok' ) );

		$this->assertSame( 'ok-inconclusive', $out['status'] );
		$this->assertSame( '/abs/foo/foo.php', $out['plugin'] );
		$this->assertSame( 'Class "Foo\\Bar" not found', $out['message'] );
		$this->assertSame( '/abs/foo/inc/missing.php', $out['file'] );
		$this->assertNotEmpty( $out['reason'] );
	}

	/**
	 * Downgrade omits the `plugin` key when the original verdict didn't
	 * carry one (e.g. shutdown-classify fatal without explicit
	 * attribution).
	 */
	public function test_downgrade_after_confirmation_omits_plugin_when_unset() {
		$tester  = new PCG_Load_Tester();
		$ref     = new \ReflectionMethod( PCG_Load_Tester::class, 'downgrade_after_confirmation' );
		$verdict = array(
			'status'  => 'fatal',
			'message' => 'engine death',
			'file'    => '/abs/foo/foo.php',
		);
		$out     = $ref->invoke( $tester, $verdict, array( 'status' => 'ok' ) );

		$this->assertSame( 'ok-inconclusive', $out['status'] );
		$this->assertArrayNotHasKey( 'plugin', $out );
	}

	/**
	 * When the `pre_option_active_plugins` filter passes `false` (meaning
	 * "let WP read the option"), the injector must read the alloptions
	 * cache directly instead of calling `get_option` — otherwise it
	 * would re-enter the same filter and recurse forever.
	 */
	public function test_confirm_inject_active_plugins_merges_without_recursion() {
		// Seed the alloptions cache so wp_load_alloptions() returns the
		// existing active-plugin list.
		update_option( 'active_plugins', array( 'akismet/akismet.php' ) );
		wp_cache_delete( 'alloptions', 'options' );

		$plugin_mains = array( WP_PLUGIN_DIR . '/woocommerce/woocommerce.php' );

		// Counter to detect recursion: every time the filter fires, bump.
		// If the injector calls get_option, the filter re-fires.
		$fire_count = 0;
		$counter    = static function ( $value ) use ( &$fire_count ) {
			++$fire_count;
			return $value;
		};
		add_filter( 'pre_option_active_plugins', $counter, 1 );

		$merged = pcg_confirm_inject_active_plugins( false, $plugin_mains );

		remove_filter( 'pre_option_active_plugins', $counter, 1 );
		delete_option( 'active_plugins' );

		$this->assertContains( 'akismet/akismet.php', $merged );
		$this->assertContains( 'woocommerce/woocommerce.php', $merged );
		// Injector itself must not have re-fired the filter while
		// resolving existing active plugins.
		$this->assertSame( 0, $fire_count, 'pcg_confirm_inject_active_plugins must not call get_option on active_plugins' );
	}

	/**
	 * When the filter already has a list (someone hooked at higher
	 * priority), the injector merges onto that list rather than the DB
	 * value, so other filters compose cleanly.
	 */
	public function test_confirm_inject_active_plugins_respects_filtered_value() {
		$merged = pcg_confirm_inject_active_plugins(
			array( 'a/a.php', 'b/b.php' ),
			array( WP_PLUGIN_DIR . '/c/c.php' )
		);
		$this->assertSame( array( 'a/a.php', 'b/b.php', 'c/c.php' ), $merged );
	}

	/**
	 * Duplicate basenames (a candidate already in active_plugins) appear
	 * only once in the merged list.
	 */
	public function test_confirm_inject_active_plugins_dedupes_candidates() {
		$merged = pcg_confirm_inject_active_plugins(
			array( 'foo/foo.php' ),
			array( WP_PLUGIN_DIR . '/foo/foo.php' )
		);
		$this->assertSame( array( 'foo/foo.php' ), $merged );
	}

	/**
	 * Scenarios for `pcg_confirm_validate_request` bail paths.
	 *
	 * @return array<string,array{0:array<string,string>}>
	 */
	public static function provide_confirm_validate_bail_requests(): array {
		$valid_token = str_repeat( 'a', 32 );
		return array(
			'empty request'         => array( array() ),
			'pcg_probe missing'     => array(
				array(
					'pcg_confirm' => '1',
					'token'       => $valid_token,
				),
			),
			'pcg_confirm missing'   => array(
				array(
					'pcg_probe' => '1',
					'token'     => $valid_token,
				),
			),
			'pcg_probe wrong value' => array(
				array(
					'pcg_probe'   => '0',
					'pcg_confirm' => '1',
					'token'       => $valid_token,
				),
			),
			'token wrong length'    => array(
				array(
					'pcg_probe'   => '1',
					'pcg_confirm' => '1',
					'token'       => 'short',
				),
			),
			'token disallowed char' => array(
				array(
					'pcg_probe'   => '1',
					'pcg_confirm' => '1',
					'token'       => str_repeat( 'a', 31 ) . '!',
				),
			),
			'token missing'         => array(
				array(
					'pcg_probe'   => '1',
					'pcg_confirm' => '1',
				),
			),
		);
	}

	/**
	 * `pcg_confirm_validate_request` returns an empty array — and therefore
	 * `pcg_confirm_maybe_register_hook` would not register the filter — for
	 * malformed requests: missing flags, wrong values, or tokens that don't
	 * match the `wp_generate_password( 32, false )` shape.
	 *
	 * @param array $request Faux $_GET payload.
	 * @dataProvider provide_confirm_validate_bail_requests
	 */
	#[DataProvider( 'provide_confirm_validate_bail_requests' )]
	public function test_confirm_validate_request_bails_on_malformed_input( array $request ) {
		$this->assertSame( array(), pcg_confirm_validate_request( $request ) );
	}

	/**
	 * Even with valid flags and a well-formed token, missing transient
	 * (token never set, or expired) keeps the validator on the bail path.
	 */
	public function test_confirm_validate_request_bails_when_transient_missing() {
		$this->assertSame(
			array(),
			pcg_confirm_validate_request(
				array(
					'pcg_probe'   => '1',
					'pcg_confirm' => '1',
					'token'       => str_repeat( 'a', 32 ),
				)
			)
		);
	}

	/**
	 * A transient written by a pre-confirmation-feature deploy (no
	 * `confirm` key, or `confirm => false`) must bail — strict `true ===`
	 * keeps mixed-version deploys on the safe side, so the probe endpoint
	 * still manually requires the candidate as before.
	 */
	public function test_confirm_validate_request_bails_when_payload_confirm_flag_unset() {
		$token = str_repeat( 'b', 32 );
		set_transient(
			PCG_Load_Tester::transient_key( $token ),
			array(
				'plugins' => array( '/abs/foo/foo.php' ),
				'mode'    => 'activation',
			),
			60
		);
		$out = pcg_confirm_validate_request(
			array(
				'pcg_probe'   => '1',
				'pcg_confirm' => '1',
				'token'       => $token,
			)
		);
		delete_transient( PCG_Load_Tester::transient_key( $token ) );
		$this->assertSame( array(), $out );
	}

	/**
	 * Happy path: flags + format + matching transient with `confirm =>
	 * true` returns the candidate list ready for the
	 * `pre_option_active_plugins` injection.
	 */
	public function test_confirm_validate_request_returns_plugins_on_valid_payload() {
		$token = str_repeat( 'c', 32 );
		set_transient(
			PCG_Load_Tester::transient_key( $token ),
			PCG_Load_Tester::build_probe_payload(
				array( '/abs/foo/foo.php', '/abs/bar/bar.php' ),
				PCG_Load_Tester::MODE_ACTIVATION,
				true
			),
			60
		);
		$out = pcg_confirm_validate_request(
			array(
				'pcg_probe'   => '1',
				'pcg_confirm' => '1',
				'token'       => $token,
			)
		);
		delete_transient( PCG_Load_Tester::transient_key( $token ) );
		$this->assertSame( array( '/abs/foo/foo.php', '/abs/bar/bar.php' ), $out );
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

		// Mark: returns false on the marking call (flag was just set).
		$this->assertFalse( pcg_probe_already_emitted( true ), 'marking call returns false because flag was previously unset' );

		// Subsequent reads (with or without mark arg) see the flag.
		$this->assertTrue( pcg_probe_already_emitted(), 'post-mark check returns true' );
		$this->assertTrue( pcg_probe_already_emitted( true ), 'post-mark marking call returns true' );
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
		add_filter( 'pcg_guard_updates', '__return_false' );

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
		add_filter( 'pcg_guard_updates', '__return_true' );
		add_filter( 'pcg_rollout_percentage', static fn() => 100 );

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
		add_filter( 'pcg_guard_updates', '__return_true' );
		add_filter( 'pcg_rollout_percentage', static fn() => 100 );

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
		add_filter( 'pcg_guard_updates', '__return_true' );
		add_filter( 'pcg_rollout_percentage', static fn() => 100 );

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
		add_filter( 'pcg_guard_updates', '__return_true' );
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
	 * Bucketing must be deterministic — the same blog ID stays in the
	 * same bucket across calls. (Ramping from 10% to 50% should
	 * strictly add blogs, never reshuffle them.)
	 */
	public function test_rollout_blog_bucket_is_deterministic() {
		$this->assertSame(
			PCG_Rollout::blog_bucket( 7777 ),
			PCG_Rollout::blog_bucket( 7777 )
		);
		$this->assertNotSame(
			PCG_Rollout::blog_bucket( 1 ),
			PCG_Rollout::blog_bucket( 2 )
		);
	}

	/**
	 * Bucket is always in [0, 100). On 32-bit PHP `crc32` returns a
	 * signed int and `abs(PHP_INT_MIN)` overflows — taking the modulo
	 * before `abs()` is the 32-bit-safe ordering.
	 */
	public function test_rollout_blog_bucket_is_non_negative() {
		foreach ( array( 1, 2, 100, 999999, 2147483647 ) as $blog_id ) {
			$bucket = PCG_Rollout::blog_bucket( $blog_id );
			$this->assertGreaterThanOrEqual( 0, $bucket, "blog_id=$blog_id" );
			$this->assertLessThan( 100, $bucket, "blog_id=$blog_id" );
		}
	}

	/**
	 * The gate wired through `pcg_guard_activation` / `pcg_guard_updates`
	 * returns false when the rollout would exclude the current blog,
	 * regardless of any earlier filter that said true.
	 */
	public function test_rollout_gate_narrows_pcg_guard_filters() {
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
}
