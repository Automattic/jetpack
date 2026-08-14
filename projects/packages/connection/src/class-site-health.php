<?php
/**
 * WordPress Site Health integration for the Jetpack Connection package.
 *
 * @package automattic/jetpack-connection
 */

namespace Automattic\Jetpack\Connection;

/**
 * Integrates connection health tests into WordPress Site Health.
 *
 * This class defers to the Jetpack plugin's own debugger integration when it
 * is present (old Jetpack versions). When no legacy integration is detected,
 * it registers the connection health tests directly.
 *
 * @since 8.5.0
 */
class Site_Health {

	/**
	 * Whether the class has been initialized.
	 *
	 * @var bool
	 */
	private static $initialized = false;

	/**
	 * Initialize Site Health integration.
	 *
	 * Should be called once, typically from the package's actions.php via a plugins_loaded hook.
	 *
	 * @since 8.5.0
	 */
	public static function init() {
		if ( self::$initialized ) {
			return;
		}
		self::$initialized = true;

		add_action( 'admin_init', array( __CLASS__, 'maybe_register_site_health' ), 1 );
	}

	/**
	 * Conditionally register Site Health hooks.
	 *
	 * Checks whether the legacy Jetpack debugger has already registered its
	 * Site Health hooks. If so, we defer to avoid duplicate tests.
	 *
	 * @since 8.5.0
	 */
	public static function maybe_register_site_health() {
		// Defer to the old Jetpack plugin's debugger if it has already registered
		// its Site Health filter. Old Jetpack versions add this filter during plugin
		// loading, so by admin_init it is already present.
		if ( has_filter( 'site_status_tests', 'jetpack_debugger_site_status_tests' ) ) {
			return;
		}

		add_filter( 'site_status_tests', array( __CLASS__, 'register_site_health_tests' ) );
		add_action( 'wp_ajax_health-check-jetpack-connection-health', array( __CLASS__, 'ajax_local_testing_suite' ) );
	}

	/**
	 * Register connection tests with WordPress Site Health.
	 *
	 * @since 8.5.0
	 *
	 * @param array $core_tests Array of tests from Core's Site Health.
	 *
	 * @return array Modified array of tests.
	 */
	public static function register_site_health_tests( $core_tests ) {
		$cxn_tests = new Connection_Health_Tests();
		$tests     = $cxn_tests->list_tests( 'direct' );

		foreach ( $tests as $test ) {
			$core_tests['direct'][ $test['name'] ] = array(
				'label' => __( 'Jetpack: ', 'jetpack-connection' ) . $test['name'],
				'test'  => self::make_site_health_callback( $test, $cxn_tests ),
			);
		}

		$core_tests['async']['jetpack_connection_test_suite'] = array(
			'label' => __( 'Jetpack Connection Tests', 'jetpack-connection' ),
			'test'  => 'jetpack-connection-health',
		);

		return $core_tests;
	}

	/**
	 * Human-readable headings for the built-in connection tests.
	 *
	 * Used when a test result carries no label of its own, so Site Health does not
	 * derive a title from the method name (e.g. "Wpcom Connection Test").
	 *
	 * A heading here has to read sensibly for a pass, a fail, and a skip alike, so
	 * these name what was tested rather than stating an outcome. Results that want
	 * to state an outcome set their own label, which takes precedence.
	 *
	 * @since $$next-version$$
	 *
	 * @return array Map of test name => label.
	 */
	private static function get_default_test_labels() {
		return array(
			'test__blog_token_if_exists'           => __( 'Site token', 'jetpack-connection' ),
			'test__check_if_connected'             => __( 'WordPress.com connection', 'jetpack-connection' ),
			'test__master_user_exists_on_site'     => __( 'Connection owner', 'jetpack-connection' ),
			'test__master_user_can_manage_options' => __( 'Connection owner permissions', 'jetpack-connection' ),
			'test__outbound_http'                  => __( 'Outbound HTTP requests', 'jetpack-connection' ),
			'test__outbound_https'                 => __( 'Outbound HTTPS requests', 'jetpack-connection' ),
			'test__identity_crisis'                => __( 'Site address', 'jetpack-connection' ),
			'test__connection_token_health'        => __( 'Connection tokens', 'jetpack-connection' ),
			'test__wpcom_connection_test'          => __( 'Requests from WordPress.com', 'jetpack-connection' ),
			// Only registered when the jetpack_debugger_run_self_test filter returns true.
			'test__wpcom_self_test'                => __( 'Site XML-RPC endpoint', 'jetpack-connection' ),
			'test__server_port_value'              => __( 'Server port', 'jetpack-connection' ),
			'test__xml_parser_available'           => __( 'PHP XML support', 'jetpack-connection' ),
		);
	}

	/**
	 * Get the heading for a test whose result carries no label of its own.
	 *
	 * Falls back to deriving a title from the method name, which is the last resort
	 * for tests other plugins register through the jetpack_connection_tests_loaded
	 * action and which therefore cannot appear in the map.
	 *
	 * @since $$next-version$$
	 *
	 * @param string $test_name Test name, e.g. "test__blog_token_if_exists".
	 *
	 * @return string The heading to display.
	 */
	private static function get_default_test_label( $test_name ) {
		$labels = self::get_default_test_labels();

		if ( isset( $labels[ $test_name ] ) ) {
			return $labels[ $test_name ];
		}

		return ucwords(
			str_replace(
				'_',
				' ',
				str_replace( 'test__', '', $test_name )
			)
		);
	}

	/**
	 * Create a closure for a Site Health direct test.
	 *
	 * @since 8.5.0
	 *
	 * @param array                   $test      Test definition array.
	 * @param Connection_Health_Tests $cxn_tests Test suite instance.
	 *
	 * @return callable The Site Health test callback.
	 */
	private static function make_site_health_callback( $test, $cxn_tests ) {
		$default_label = self::get_default_test_label( $test['name'] );

		return function () use ( $test, $cxn_tests, $default_label ) {
			$results = $cxn_tests->run_test( $test['name'] );
			if ( is_wp_error( $results ) ) {
				return;
			}

			$label = $results['label'] ? $results['label'] : $default_label;

			if ( $results['long_description'] ) {
				$description = $results['long_description'];
			} elseif ( $results['short_description'] ) {
				$description = sprintf(
					'<p>%s</p>',
					$results['short_description']
				);
			} else {
				$description = sprintf(
					'<p>%s</p>',
					__( 'This test successfully passed!', 'jetpack-connection' )
				);
			}

			$badge_label = $cxn_tests->get_site_health_badge_label();

			$return = array(
				'label'       => $label,
				'status'      => 'good',
				'badge'       => array(
					'label' => $badge_label,
					'color' => 'green',
				),
				'description' => $description,
				'actions'     => '',
				'test'        => 'jetpack_' . $test['name'],
			);

			if ( false === $results['pass'] ) {
				$return['status'] = $results['severity'];
				if ( ! empty( $results['action'] ) ) {
					$return['actions'] = sprintf(
						'<a href="%1$s" target="_blank" rel="noopener noreferrer">%2$s <span class="screen-reader-text">%3$s</span><span aria-hidden="true" class="dashicons dashicons-external"></span></a>',
						esc_url( $results['action'] ),
						$results['action_label'],
						/* translators: accessibility text */
						__( '(opens in a new tab)', 'jetpack-connection' )
					);
				}
			}

			return $return;
		};
	}

	/**
	 * AJAX handler for async Site Health tests.
	 *
	 * @since 8.5.0
	 */
	public static function ajax_local_testing_suite() {
		check_ajax_referer( 'health-check-site-status' );
		if ( ! current_user_can( 'manage_options' ) ) {
			// @phan-suppress-next-line PhanTypeMismatchArgumentProbablyReal
			wp_send_json_error( null, null, JSON_UNESCAPED_SLASHES );
		}
		$tests = new Connection_Health_Tests();
		// @phan-suppress-next-line PhanTypeMismatchArgumentProbablyReal
		wp_send_json_success( $tests->output_results_for_core_async_site_health(), null, JSON_UNESCAPED_SLASHES );
	}
}
