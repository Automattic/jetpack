<?php
/**
 * This configuration will be read and overlaid on top of the
 * default configuration. Command-line arguments will be applied
 * after this file is read.
 *
 * @package automattic/jetpack-mu-wpcom
 */

// Require base config.
require __DIR__ . '/../../../../.phan/config.base.php';

return make_phan_config(
	dirname( __DIR__ ),
	array(
		'+stubs'                          => array( 'full-site-editing', 'photon-opencv', 'wpcom' ),
		'parse_file_list'                 => array(
			// Reference files to handle code checking for stuff from Jetpack-the-plugin or other in-monorepo plugins.
			// Wherever feasible we should really clean up this sort of thing instead of adding stuff here.
			//
			// DO NOT add references to files in other packages like this! Generally packages should be listed in composer.json 'require'.
			// If there are truly optional dependencies or circular dependencies that can't be cleaned up, one package may list the
			// other in 'require-dev' and `extra.dependencies.test-only' instead. See packages/config for an example.
			__DIR__ . '/../../../plugins/jetpack/jetpack.php',                              // JETPACK__PLUGIN_FILE
			__DIR__ . '/../../../plugins/jetpack/3rd-party/class.jetpack-amp-support.php',  // class Jetpack_AMP_Support
			__DIR__ . '/../../../plugins/jetpack/modules/custom-css/custom-css.php',        // class Jetpack_Custom_CSS_Enhancements
			__DIR__ . '/../../../plugins/jetpack/class-jetpack-stats-dashboard-widget.php', // class Jetpack_Stats_Dashboard_Widget
			__DIR__ . '/../../../plugins/jetpack/modules/masterbar/nudges/bootstrap.php',   // function Automattic\Jetpack\Dashboard_Customizations\register_css_nudge_control  phpcs:ignore Squiz.PHP.CommentedOutCode.Found
			__DIR__ . '/../../../plugins/wpcomsh/wpcomsh.php',                              // function wpcomsh_record_tracks_event
		),
		'exclude_analysis_directory_list' => array(
			'src/features/custom-css/csstidy/',
			// This file breaks analysis, Phan gets lost recursing in trying to figure out some types.
			// @todo Add type declarations so Phan won't have to do it itself. Or update to a modern less lib.
			'src/features/custom-css/custom-css/preprocessors/lessc.inc.php',
		),
	)
);
