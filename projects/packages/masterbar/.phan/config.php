<?php
/**
 * This configuration will be read and overlaid on top of the
 * default configuration. Command-line arguments will be applied
 * after this file is read.
 *
 * @package automattic/jetpack-masterbar
 */

// Require base config.
require __DIR__ . '/../../../../.phan/config.base.php';

// We need to load the wpcom and amp stubs too.
return make_phan_config(
	dirname( __DIR__ ),
	array(
		'+stubs'          => array( 'wpcom', 'amp' ),
		'parse_file_list' => array(

			/*
			Reference files to handle code checking for stuff from Jetpack-the-plugin or other in-monorepo plugins.
			 * Wherever feasible we should really clean up this sort of thing instead of adding stuff here.
			 *
			 * DO NOT add references to files in other packages like this! Generally packages should be listed in composer.json 'require'.
			 * If there are truly optional dependencies or circular dependencies that can't be cleaned up, one package may list the
			 * other in 'require-dev' and `extra.dependencies.test-only' instead. See packages/config for an example.
			 */
			__DIR__ . '/../../../plugins/jetpack/3rd-party/class.jetpack-amp-support.php',
			__DIR__ . '/../../../plugins/jetpack/modules/custom-css/custom-css.php',
			__DIR__ . '/../../../plugins/jetpack/modules/notes.php',
			__DIR__ . '/../../../plugins/jetpack/modules/scan/class-admin-bar-notice.php',
			__DIR__ . '/../../../plugins/jetpack/modules/stats.php',
			__DIR__ . '/../../../plugins/wpcomsh/feature-plugins/masterbar.php',           // function wpcomsh_is_site_sticker_active
			__DIR__ . '/../../../plugins/wpcomsh/private-site/private-site.php',           // function site_is_private
		),
	)
);
