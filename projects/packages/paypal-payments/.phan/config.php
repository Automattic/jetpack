<?php
/**
 * This configuration will be read and overlaid on top of the
 * default configuration. Command-line arguments will be applied
 * after this file is read.
 *
 * @package automattic/jetpack-paypal-payments
 */

// Require base config.
require __DIR__ . '/../../../../.phan/config.base.php';

return make_phan_config(
	dirname( __DIR__ ),
	array(
		'+stubs'          => array( 'amp', 'wpcom' ),
		'parse_file_list' => array(
			__DIR__ . '/../../../plugins/jetpack/class.jetpack.php', // class Jetpack
			__DIR__ . '/../../../plugins/jetpack/_inc/lib/components.php', // class Jetpack_Components
			__DIR__ . '/../../../plugins/jetpack/_inc/lib/class-jetpack-currencies.php', // class Jetpack_Currencies
			__DIR__ . '/../../../plugins/jetpack/jetpack.php', // JETPACK__PLUGIN_DIR
			__DIR__ . '/../../../plugins/jetpack/functions.global.php', // function jetpack_is_frontend
		),
	)
);
