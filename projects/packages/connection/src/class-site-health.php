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
		return function () use ( $test, $cxn_tests ) {
			$results = $cxn_tests->run_test( $test['name'] );
			if ( is_wp_error( $results ) ) {
				return;
			}

			$label = $results['label'] ?
				$results['label'] :
				ucwords(
					str_replace(
						'_',
						' ',
						str_replace( 'test__', '', $test['name'] )
					)
				);

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
