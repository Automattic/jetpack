<?php
/**
 * WP Site Health functionality temporarily stored in this file until all of Jetpack is PHP 5.3+
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Sync\Modules;
/**
 * Test runner for Core's Site Health module.
 *
 * @since 7.3.0
 */
function jetpack_debugger_ajax_local_testing_suite() {
	check_ajax_referer( 'health-check-site-status' );
	if ( ! current_user_can( 'jetpack_manage_modules' ) ) {
		wp_send_json_error();
	}
	$tests = new Jetpack_Cxn_Tests();
	wp_send_json_success( $tests->output_results_for_core_async_site_health() );
}
/**
 * Adds the Jetpack Local Testing Suite to the Core Site Health system.
 *
 * @since 7.3.0
 *
 * @param array $core_tests Array of tests from Core's Site Health.
 *
 * @return array $core_tests Array of tests for Core's Site Health.
 */
function jetpack_debugger_site_status_tests( $core_tests ) {
	$cxn_tests = new Jetpack_Cxn_Tests();
	$tests     = $cxn_tests->list_tests( 'direct' );
	foreach ( $tests as $test ) {

		$core_tests['direct'][ $test['name'] ] = array(
			'label' => __( 'Jetpack: ', 'jetpack' ) . $test['name'],
			/**
			 * Callable for Core's Site Health system to execute.
			 *
			 * @param array $test A Jetpack Testing Suite test array.
			 * @param Jetpack_Cxn_Tests $cxn_tests An instance of the Jetpack Test Suite.
			 *
			 * @return array {
			 *      A results array to match the format expected by WordPress Core.
			 *
			 *      @type string $label Name for the test.
			 *      @type string $status 'critical', 'recommended', or 'good'.
			 *      @type array $badge Array for Site Health status. Keys label and color.
			 *      @type string $description Description of the test result.
			 *      @type string $action HTML to a link to resolve issue.
			 *      @type string $test Unique test identifier.
			 *  }
			 */
			'test'  => function () use ( $test, $cxn_tests ) {
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
						__( 'This test successfully passed!', 'jetpack' )
					);
				}

				$return = array(
					'label'       => $label,
					'status'      => 'good',
					'badge'       => array(
						'label' => __( 'Jetpack', 'jetpack' ),
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
							__( '(opens in a new tab)', 'jetpack' )
						);
					}
				}

				return $return;
			},
		);
	}
	$core_tests['async']['jetpack_test_suite'] = array(
		'label' => __( 'Jetpack Tests', 'jetpack' ),
		'test'  => 'jetpack_local_testing_suite',
	);

	return $core_tests;
}

/**
 * Loads site health scripts if we are on the site health page.
 *
 * @param string $hook The current admin page hook.
 */
function jetpack_debugger_enqueue_site_health_scripts( $hook ) {
	$full_sync_module = Modules::get_module( 'full-sync' );
	$progress_percent = $full_sync_module ? $full_sync_module->get_sync_progress_percentage() : false;

	$ajax_nonce = wp_create_nonce( 'jetpack-site-health' );

	if ( 'site-health.php' === $hook ) {
		$wp_scripts = wp_scripts();
		wp_enqueue_script( 'jquery-ui-progressbar' );
		wp_enqueue_script(
			'jetpack_debug_site_health_script',
			plugins_url( 'jetpack-debugger-site-health.js', __FILE__ ),
			array( 'jquery-ui-progressbar' ),
			JETPACK__VERSION,
			false
		);
		wp_enqueue_style(
			'jetpack_debug_site_health_styles',
			plugins_url( 'jetpack-debugger-site-health.css', __FILE__ ),
			false,
			JETPACK__VERSION,
			false
		);
		/* WordPress is not bundled with jquery UI styles - we need to grab them from the Google API. */
		wp_enqueue_style(
			'jetpack-jquery-ui-styles',
			'https://code.jquery.com/ui/' . $wp_scripts->registered['jquery-ui-core']->ver . '/themes/smoothness/jquery-ui.min.css',
			false,
			JETPACK__VERSION,
			false
		);
		wp_localize_script(
			'jetpack_debug_site_health_script',
			'jetpackSiteHealth',
			array(
				'ajaxUrl'             => admin_url( 'admin-ajax.php' ),
				'syncProgressHeading' => __( 'Jetpack is performing a sync of your site', 'jetpack' ),
				'progressPercent'     => $progress_percent,
				'fullSyncNonce'       => $ajax_nonce,
			)
		);
	}
}

/**
 * Responds to ajax calls from the site health page. Echos a full sync percantage to update progress bar.
 */
function jetpack_debugger_sync_progress_ajax() {
	$full_sync_module = Modules::get_module( 'full-sync' );
	$progress_percent = $full_sync_module ? $full_sync_module->get_sync_progress_percentage() : null;
	if ( ! $progress_percent ) {
		echo 'done';
		wp_die();
	}
	echo (int) $progress_percent;
	wp_die();
}

/**
 * Responds to ajax calls from the site health page. Triggers a Full Sync
 */
function jetpack_debugger_full_sync_start() {
	check_ajax_referer( 'jetpack-site-health', 'site-health-nonce' );
	$full_sync_module = Modules::get_module( 'full-sync' );
	$full_sync_module->start();
	echo 'requested';
	wp_die();
}
