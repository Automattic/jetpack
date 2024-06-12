<?php
/**
 * This configuration will be read and overlaid on top of the
 * default configuration. Command-line arguments will be applied
 * after this file is read.
 *
 * @package automattic/jetpack
 */

// Require base config.
require __DIR__ . '/../../../../.phan/config.base.php';

return make_phan_config(
	dirname( __DIR__ ),
	array(
		'exclude_file_regex'    => array( 'tests/lib/mocks' ),
		'parse_file_list'       => array(
			// Reference files to handle code checking for stuff from Jetpack-the-plugin or other in-monorepo plugins.
			// Wherever feasible we should really clean up this sort of thing instead of adding stuff here.
			//
			// DO NOT add references to files in other packages like this! Generally packages should be listed in composer.json 'require'.
			// If there are truly optional dependencies or circular dependencies that can't be cleaned up, one package may list the
			// other in 'require-dev' and `extra.dependencies.test-only' instead. See packages/config for an example.
			// --
			// class.color.php provides the definition of the Jetpack_Color class.
			__DIR__ . '/../../../plugins/jetpack/_inc/lib/class.color.php',
			// class.jetpack.php provides the definition of the Jetpack megaclass.
			__DIR__ . '/../../../plugins/jetpack/class.jetpack.php',
			// class.jetpack-gutenberg.php provides the definition of the Jetpack_Gutenberg class.
			__DIR__ . '/../../../plugins/jetpack/class.jetpack-gutenberg.php',
			// jetpack.php provides the definition of constants like JETPACK__PLUGIN_DIR and others.
			__DIR__ . '/../../../plugins/jetpack/jetpack.php',
			// photon-cdn.php provides the definition of the Jetpack_Photon_Static_Assets_CDN.
			__DIR__ . '/../../../plugins/jetpack/modules/photon-cdn.php',
		),
		'php_extensions_needed' => array( 'sqlite3', 'zip' ),
		'+stubs'                => array( 'woocommerce' ),
	)
);
