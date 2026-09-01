<?php
/**
 *
 * Plugin Name: WordPress.com Features
 * Description: Test plugin for the jetpack-mu-wpcom package
 * Version: 2.13.0
 * Author: Automattic
 * License: GPLv2 or later
 * Text Domain: jetpack-mu-wpcom-plugin
 *
 * @package automattic/jetpack-mu-wpcom-plugin
 */

/**
 * Conditionally load the jetpack-mu-wpcom package.
 *
 * JETPACK_MU_WPCOM_LOAD_VIA_BETA_PLUGIN=true will load the package via the Jetpack Beta Tester plugin, not wpcomsh.
 */
if ( defined( 'JETPACK_MU_WPCOM_LOAD_VIA_BETA_PLUGIN' ) && JETPACK_MU_WPCOM_LOAD_VIA_BETA_PLUGIN ) {
	/*
	 * Autoloader check: This ensures the plugin doesn't fatal if activated before
	 * `composer install` has been run. This is a common oversight during development
	 * setup. The admin notice helps developers quickly identify the issue.
	 */
	$jetpack_autoloader = __DIR__ . '/vendor/autoload.php';
	if ( is_readable( $jetpack_autoloader ) ) {
		require_once $jetpack_autoloader;
		if ( class_exists( 'Automattic\Jetpack\Jetpack_Mu_Wpcom' ) ) {
			Automattic\Jetpack\Jetpack_Mu_Wpcom::init();
		}
	} else {
		if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
			error_log( // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
				__( 'Error loading autoloader file for WordPress.com Features plugin', 'jetpack-mu-wpcom-plugin' )
			);
		}

		add_action(
			'admin_notices',
			function () {
				if ( get_current_screen()->id !== 'plugins' ) {
					return;
				}

				$message = sprintf(
					wp_kses(
						/* translators: Placeholder is a link to a support document. */
						__( 'Your installation of WordPress.com Features is incomplete. If you installed WordPress.com Features from GitHub, please refer to <a href="%1$s" target="_blank" rel="noopener noreferrer">this document</a> to set up your development environment. WordPress.com Features must have Composer dependencies installed and built via the build command.', 'jetpack-mu-wpcom-plugin' ),
						array(
							'a' => array(
								'href'   => array(),
								'target' => array(),
								'rel'    => array(),
							),
						)
					),
					'https://github.com/Automattic/jetpack/blob/trunk/docs/development-environment.md#building-your-project'
				);
				wp_admin_notice(
					$message,
					array(
						'type'        => 'error',
						'dismissible' => true,
					)
				);
			}
		);
	}
}
