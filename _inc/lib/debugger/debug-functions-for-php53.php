<?php
/**
 * WP Site Health functionality temporarily stored in this file until all of Jetpack is PHP 5.3+
 *
 * @package Jetpack.
 */

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
			'test'  => function() use ( $test, $cxn_tests ) { // phpcs:ignore PHPCompatibility.FunctionDeclarations.NewClosure.Found
				$results = $cxn_tests->run_test( $test['name'] );
				// Test names are, by default, `test__some_string_of_text`. Let's convert to "Some String Of Text" for humans.
				$label = ucwords(
					str_replace(
						'_',
						' ',
						str_replace( 'test__', '', $test['name'] )
					)
				);
				$return = array(
					'label'       => $label,
					'status'      => 'good',
					'badge'       => array(
						'label' => __( 'Jetpack', 'jetpack' ),
						'color' => 'green',
					),
					'description' => sprintf(
						'<p>%s</p>',
						__( 'This test successfully passed!', 'jetpack' )
					),
					'actions'     => '',
					'test'        => 'jetpack_' . $test['name'],
				);
				if ( is_wp_error( $results ) ) {
					return;
				}
				if ( false === $results['pass'] ) {
					$return['label'] = $results['message'];
					$return['status']      = $results['severity'];
					$return['description'] = sprintf(
						'<p>%s</p>',
						$results['resolution']
					);
					if ( ! empty( $results['action'] ) ) {
						$return['actions'] = sprintf(
							'<a class="button button-primary" href="%1$s" target="_blank" rel="noopener noreferrer">%2$s <span class="screen-reader-text">%3$s</span><span aria-hidden="true" class="dashicons dashicons-external"></span></a>',
							esc_url( $results['action'] ),
							__( 'Resolve', 'jetpack' ),
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

