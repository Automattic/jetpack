<?php
/**
 * This configuration will be read and overlaid on top of the
 * default configuration. Command-line arguments will be applied
 * after this file is read.
 *
 * @package automattic/jetpack-videopress
 */

// Require base config.
require __DIR__ . '/../../../../.phan/config.base.php';

return make_phan_config(
	dirname( __DIR__ ),
	array(
		'+stubs'          => array( 'wpcom' ),
		'parse_file_list' => array(
			// Reference files to handle code checking for stuff from Jetpack-the-plugin or other in-monorepo plugins.
			// Wherever feasible we should really clean up this sort of thing instead of adding stuff here.
			//
			// DO NOT add references to files in other packages like this! Generally packages should be listed in composer.json 'require'.
			// If there are truly optional dependencies or circular dependencies that can't be cleaned up, one package may list the
			// other in 'require-dev' and `extra.dependencies.test-only' instead. See packages/config for an example.
			__DIR__ . '/../../../plugins/jetpack/jetpack.php',                                                                                               // JETPACK__PLUGIN_DIR, JETPACK__WPCOM_JSON_API_BASE
			__DIR__ . '/../../../plugins/jetpack/extensions/blocks/premium-content/_inc/subscription-service/class-abstract-token-subscription-service.php', // class Abstract_Token_Subscription_Service
			__DIR__ . '/../../../plugins/jetpack/class.jetpack.php',                                                                                         // class Jetpack
			__DIR__ . '/../../../plugins/jetpack/modules/memberships/class-jetpack-memberships.php',                                                         // class Jetpack_Memberships
			__DIR__ . '/../../../plugins/jetpack/modules/videopress/class.videopress-edit-attachment.php',                                                   // class VideoPress_Edit_Attachment
			__DIR__ . '/../../../plugins/jetpack/extensions/blocks/premium-content/_inc/subscription-service/interface-subscription-service.php',            // interface Subscription_Service
			__DIR__ . '/../../../plugins/jetpack/extensions/blocks/premium-content/_inc/subscription-service/include.php',                                   // function Automattic\Jetpack\Extensions\Premium_Content\subscription_service   phpcs:ignore Squiz.PHP.CommentedOutCode.Found
			__DIR__ . '/../../../plugins/jetpack/_inc/lib/core-api/load-wpcom-endpoints.php',                                                                // function wpcom_rest_api_v2_load_plugin
		),
	)
);
