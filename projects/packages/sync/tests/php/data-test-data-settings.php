<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName

namespace Automattic\Jetpack\Sync;

/**
 * Data sets for the Test_Data_Settings tests.
 *
 * @package automattic/jetpack-sync
 */
class Data_Test_Data_Settings {
	/*
	 * For all expected outputs in the test data, the required modules and filters are added,
	 * as are the expected empty filter arrays for disabled modules.
	 */

	/**
	 * Returns an the test data for a scenario with some modules enabled and no custom filter settings.
	 *
	 * @return array The test input array.
	 */
	public static function data_test_1() {
		return array(
			'input'       => array(
				'jetpack_sync_modules' => array(
					'Automattic\\Jetpack\\Sync\\Modules\\Plugins',
				),
			),
			'output'      => array(
				'jetpack_sync_modules'                => array(
					'Automattic\\Jetpack\\Sync\\Modules\\Plugins',
					'Automattic\Jetpack\Sync\Modules\Callables',
					'Automattic\Jetpack\Sync\Modules\Constants',
					'Automattic\Jetpack\Sync\Modules\Full_Sync_Immediately',
					'Automattic\Jetpack\Sync\Modules\Options',
				),
				'jetpack_sync_options_whitelist'      => \Automattic\Jetpack\Sync\Defaults::$default_options_whitelist,
				'jetpack_sync_options_contentless'    => \Automattic\Jetpack\Sync\Defaults::$default_options_contentless,
				'jetpack_sync_constants_whitelist'    => \Automattic\Jetpack\Sync\Defaults::$default_constants_whitelist,
				'jetpack_sync_callable_whitelist'     => \Automattic\Jetpack\Sync\Defaults::$default_callable_whitelist,
				'jetpack_sync_multisite_callable_whitelist' => array(),
				'jetpack_sync_post_meta_whitelist'    => array(),
				'jetpack_sync_comment_meta_whitelist' => array(),
				'jetpack_sync_capabilities_whitelist' => array(),
				'jetpack_sync_known_importers'        => array(),
			),
			'set_filters' => array(
				'jetpack_sync_modules',
				'jetpack_sync_post_meta_whitelist',
				'jetpack_sync_comment_meta_whitelist',
				'jetpack_sync_capabilities_whitelist',
				'jetpack_sync_known_importers',
			),
		);
	}

	/**
	 * Returns an the test data for a scenario with some modules enabled and no custom filter settings.
	 * Same as data_test_1 to verify the same behaviour when a required module (Callables) is also provided as input.
	 *
	 * @return array The test input array.
	 */
	public static function data_test_1_2() {
		return array(
			'input'       => array(
				'jetpack_sync_modules' => array(
					'Automattic\Jetpack\Sync\Modules\Callables',
					'Automattic\\Jetpack\\Sync\\Modules\\Full_Sync',
					'Automattic\\Jetpack\\Sync\\Modules\\Options',
					'Automattic\\Jetpack\\Sync\\Modules\\Plugins',
				),
			),
			'output'      => array(
				'jetpack_sync_modules'                => array(
					'Automattic\\Jetpack\\Sync\\Modules\\Full_Sync',
					'Automattic\\Jetpack\\Sync\\Modules\\Options',
					'Automattic\\Jetpack\\Sync\\Modules\\Plugins',
					'Automattic\Jetpack\Sync\Modules\Callables',
					'Automattic\Jetpack\Sync\Modules\Full_Sync_Immediately',
					'Automattic\Jetpack\Sync\Modules\Constants',
				),
				'jetpack_sync_options_whitelist'      => \Automattic\Jetpack\Sync\Defaults::$default_options_whitelist,
				'jetpack_sync_options_contentless'    => \Automattic\Jetpack\Sync\Defaults::$default_options_contentless,
				'jetpack_sync_constants_whitelist'    => \Automattic\Jetpack\Sync\Defaults::$default_constants_whitelist,
				'jetpack_sync_callable_whitelist'     => \Automattic\Jetpack\Sync\Defaults::$default_callable_whitelist,
				'jetpack_sync_multisite_callable_whitelist' => array(),
				'jetpack_sync_post_meta_whitelist'    => array(),
				'jetpack_sync_comment_meta_whitelist' => array(),
				'jetpack_sync_capabilities_whitelist' => array(),
				'jetpack_sync_known_importers'        => array(),
			),
			'set_filters' => array(
				'jetpack_sync_modules',
				'jetpack_sync_post_meta_whitelist',
				'jetpack_sync_comment_meta_whitelist',
				'jetpack_sync_capabilities_whitelist',
				'jetpack_sync_known_importers',
			),
		);
	}

	/**
	 * Returns an the test data for a scenario with some modules enabled and some custom filter settings.
	 *
	 * @return array The test input array.
	 */
	public static function data_test_2() {
		return array(
			'input'       => array(
				'jetpack_sync_modules'                => array(
					'Automattic\\Jetpack\\Sync\\Modules\\Constants',
					'Automattic\\Jetpack\\Sync\\Modules\\Network_Options',
					'Automattic\\Jetpack\\Sync\\Modules\\Terms',
					'Automattic\\Jetpack\\Sync\\Modules\\Callables',
					'Automattic\\Jetpack\\Sync\\Modules\\Comments',
					'Automattic\\Jetpack\\Sync\\Modules\\Stats',
					'Automattic\\Jetpack\\Sync\\Modules\\Full_Sync_Immediately',
					'Automattic\\Jetpack\\Sync\\Modules\\Term_Relationships',
				),
				'jetpack_sync_callable_whitelist'     => array(
					'test_input_2_callable' => array( 'Automattic\\Jetpack\\Sync\\Test_Input_2', 'test_method_input_2' ),
				),
				'jetpack_sync_comment_meta_whitelist' => array(
					'hc_avatar',
					'hc_foreign_user_id',
					'test_input_2_comment_meta',
					'test_input_2_comment_meta_b',
				),
			),
			'output'      => array(
				'jetpack_sync_modules'                => array(
					'Automattic\\Jetpack\\Sync\\Modules\\Constants',
					'Automattic\\Jetpack\\Sync\\Modules\\Network_Options',
					'Automattic\\Jetpack\\Sync\\Modules\\Options',
					'Automattic\\Jetpack\\Sync\\Modules\\Terms',
					'Automattic\\Jetpack\\Sync\\Modules\\Callables',
					'Automattic\\Jetpack\\Sync\\Modules\\Comments',
					'Automattic\\Jetpack\\Sync\\Modules\\Stats',
					'Automattic\\Jetpack\\Sync\\Modules\\Full_Sync_Immediately',
					'Automattic\\Jetpack\\Sync\\Modules\\Term_Relationships',
				),
				'jetpack_sync_options_whitelist'      => \Automattic\Jetpack\Sync\Defaults::$default_options_whitelist,
				'jetpack_sync_options_contentless'    => \Automattic\Jetpack\Sync\Defaults::$default_options_contentless,
				'jetpack_sync_constants_whitelist'    => \Automattic\Jetpack\Sync\Defaults::$default_constants_whitelist,
				'jetpack_sync_callable_whitelist'     => array(
					'site_url'                => array( 'Automattic\\Jetpack\\Connection\\Urls', 'site_url' ),
					'home_url'                => array( 'Automattic\\Jetpack\\Connection\\Urls', 'home_url' ),
					'get_plugins'             => array( 'Automattic\\Jetpack\\Sync\\Functions', 'get_plugins' ),
					'get_themes'              => array( 'Automattic\\Jetpack\\Sync\\Functions', 'get_themes' ),
					'paused_plugins'          => array( 'Automattic\\Jetpack\\Sync\\Functions', 'get_paused_plugins' ),
					'paused_themes'           => array( 'Automattic\\Jetpack\\Sync\\Functions', 'get_paused_themes' ),
					'timezone'                => array( 'Automattic\\Jetpack\\Sync\\Functions', 'get_timezone' ),
					'wp_get_environment_type' => 'wp_get_environment_type',
					'wp_max_upload_size'      => 'wp_max_upload_size',
					'wp_version'              => array( 'Automattic\\Jetpack\\Sync\\Functions', 'wp_version' ),
					'test_input_2_callable'   => array( 'Automattic\\Jetpack\\Sync\\Test_Input_2', 'test_method_input_2' ),
				),
				'jetpack_sync_multisite_callable_whitelist' => \Automattic\Jetpack\Sync\Defaults::$default_multisite_callable_whitelist,
				'jetpack_sync_post_meta_whitelist'    => array(),
				'jetpack_sync_comment_meta_whitelist' => array(
					'hc_avatar',
					'hc_foreign_user_id',
					'test_input_2_comment_meta',
					'test_input_2_comment_meta_b',
				),
				'jetpack_sync_capabilities_whitelist' => array(),
				'jetpack_sync_known_importers'        => array(),
			),
			'set_filters' => array(
				'jetpack_sync_modules',
				'jetpack_sync_callable_whitelist',
				'jetpack_sync_post_meta_whitelist',
				'jetpack_sync_comment_meta_whitelist',
				'jetpack_sync_capabilities_whitelist',
				'jetpack_sync_known_importers',
			),
		);
	}

	/**
	 * Returns the test data for a scenario with some modules enabled and some custom filter settings
	 * for disabled modules. Since the modules associated with the filters are disabled, the custom filter
	 * settings are not used. For required modules, the custom filter settings should still be used.
	 *
	 * @return array The test input array.
	 */
	public static function data_test_3() {
		return array(
			'input'       => array(
				'jetpack_sync_modules'                => array(
					'Automattic\\Jetpack\\Sync\\Modules\\Constants',
					'Automattic\\Jetpack\\Sync\\Modules\\Network_Options',
					'Automattic\\Jetpack\\Sync\\Modules\\Terms',
					'Automattic\\Jetpack\\Sync\\Modules\\Stats',
					'Automattic\\Jetpack\\Sync\\Modules\\Full_Sync_Immediately',
					'Automattic\\Jetpack\\Sync\\Modules\\Term_Relationships',
				),
				'jetpack_sync_callable_whitelist'     => array(
					'test_input_2_callable' => array( 'Automattic\\Jetpack\\Sync\\Test_Input_2', 'test_method_input_2' ),
				),
				'jetpack_sync_options_whitelist'      => array(
					'test_input_3_option_a',
				),
				'jetpack_sync_options_contentless'    => array(),
				'jetpack_sync_constants_whitelist'    => array(
					'DUMMY_CONSTANT',
				),
				'jetpack_sync_comment_meta_whitelist' => array(
					'test_input_2_comment_meta',
					'test_input_2_comment_meta_b',
				),
			),
			'output'      => array(
				'jetpack_sync_modules'                => array(
					'Automattic\\Jetpack\\Sync\\Modules\\Constants',
					'Automattic\\Jetpack\\Sync\\Modules\\Network_Options',
					'Automattic\\Jetpack\\Sync\\Modules\\Options',
					'Automattic\\Jetpack\\Sync\\Modules\\Terms',
					'Automattic\\Jetpack\\Sync\\Modules\\Stats',
					'Automattic\\Jetpack\\Sync\\Modules\\Full_Sync_Immediately',
					'Automattic\\Jetpack\\Sync\\Modules\\Term_Relationships',
					'Automattic\\Jetpack\\Sync\\Modules\\Callables',
				),
				'jetpack_sync_options_whitelist'      => array(
					'jetpack_sync_non_blocking',
					'jetpack_sync_non_public_post_stati',
					'jetpack_sync_settings_comment_meta_whitelist',
					'jetpack_sync_settings_post_meta_whitelist',
					'jetpack_sync_settings_post_types_blacklist',
					'jetpack_sync_settings_taxonomies_blacklist',
					'jetpack_sync_settings_dedicated_sync_enabled',
					'jetpack_connection_active_plugins',
					'blog_charset',
					'blog_public',
					'blogdescription',
					'blogname',
					'permalink_structure',
					'stylesheet',
					'time_format',
					'timezone_string',
					'test_input_3_option_a',
				),
				'jetpack_sync_options_contentless'    => array(),
				'jetpack_sync_constants_whitelist'    => array(
					'ABSPATH',
					'ALTERNATE_WP_CRON',
					'ATOMIC_CLIENT_ID',
					'AUTOMATIC_UPDATER_DISABLED',
					'DISABLE_WP_CRON',
					'DISALLOW_FILE_EDIT',
					'DISALLOW_FILE_MODS',
					'EMPTY_TRASH_DAYS',
					'FS_METHOD',
					'IS_PRESSABLE',
					'PHP_VERSION',
					'WP_ACCESSIBLE_HOSTS',
					'WP_AUTO_UPDATE_CORE',
					'WP_CONTENT_DIR',
					'WP_CRON_LOCK_TIMEOUT',
					'WP_DEBUG',
					'WP_HTTP_BLOCK_EXTERNAL',
					'WP_MAX_MEMORY_LIMIT',
					'WP_MEMORY_LIMIT',
					'WP_POST_REVISIONS',
					'DUMMY_CONSTANT',
				),
				'jetpack_sync_callable_whitelist'     => array(
					'site_url'                => array( 'Automattic\\Jetpack\\Connection\\Urls', 'site_url' ),
					'home_url'                => array( 'Automattic\\Jetpack\\Connection\\Urls', 'home_url' ),
					'get_plugins'             => array( 'Automattic\\Jetpack\\Sync\\Functions', 'get_plugins' ),
					'get_themes'              => array( 'Automattic\\Jetpack\\Sync\\Functions', 'get_themes' ),
					'paused_plugins'          => array( 'Automattic\\Jetpack\\Sync\\Functions', 'get_paused_plugins' ),
					'paused_themes'           => array( 'Automattic\\Jetpack\\Sync\\Functions', 'get_paused_themes' ),
					'timezone'                => array( 'Automattic\\Jetpack\\Sync\\Functions', 'get_timezone' ),
					'wp_get_environment_type' => 'wp_get_environment_type',
					'wp_max_upload_size'      => 'wp_max_upload_size',
					'wp_version'              => array( 'Automattic\\Jetpack\\Sync\\Functions', 'wp_version' ),
					'test_input_2_callable'   => array( 'Automattic\\Jetpack\\Sync\\Test_Input_2', 'test_method_input_2' ),
				),
				'jetpack_sync_multisite_callable_whitelist' => array(),
				'jetpack_sync_post_meta_whitelist'    => array(),
				'jetpack_sync_comment_meta_whitelist' => array(),
				'jetpack_sync_capabilities_whitelist' => array(),
				'jetpack_sync_known_importers'        => array(),
			),
			'set_filters' => array(
				'jetpack_sync_modules',
				'jetpack_sync_options_whitelist',
				'jetpack_sync_options_contentless',
				'jetpack_sync_callable_whitelist',
				'jetpack_sync_constants_whitelist',
				'jetpack_sync_post_meta_whitelist',
				'jetpack_sync_comment_meta_whitelist',
				'jetpack_sync_capabilities_whitelist',
				'jetpack_sync_known_importers',
			),
		);
	}

	/**
	 * Returns an the test data for a scenario with some modules enabled and a custom filter setting
	 * which adds items to the default setting.
	 *
	 * @return array The test input array.
	 */
	public static function data_test_4() {
		return array(
			'input'       => array(
				'jetpack_sync_modules'                => array(
					'Automattic\\Jetpack\\Sync\\Modules\\Constants',
					'Automattic\\Jetpack\\Sync\\Modules\\Network_Options',
					'Automattic\\Jetpack\\Sync\\Modules\\Terms',
					'Automattic\\Jetpack\\Sync\\Modules\\Stats',
					'Automattic\\Jetpack\\Sync\\Modules\\Comments',
					'Automattic\\Jetpack\\Sync\\Modules\\Full_Sync_Immediately',
					'Automattic\\Jetpack\\Sync\\Modules\\Term_Relationships',
				),
				'jetpack_sync_comment_meta_whitelist' => array_merge(
					\Automattic\Jetpack\Sync\Defaults::$comment_meta_whitelist,
					array( 'test_input_2_comment_meta', 'test_input_2_comment_meta_b' )
				),
			),
			'output'      => array(
				'jetpack_sync_modules'                => array(
					'Automattic\\Jetpack\\Sync\\Modules\\Constants',
					'Automattic\\Jetpack\\Sync\\Modules\\Network_Options',
					'Automattic\\Jetpack\\Sync\\Modules\\Options',
					'Automattic\\Jetpack\\Sync\\Modules\\Terms',
					'Automattic\\Jetpack\\Sync\\Modules\\Stats',
					'Automattic\\Jetpack\\Sync\\Modules\\Comments',
					'Automattic\\Jetpack\\Sync\\Modules\\Full_Sync_Immediately',
					'Automattic\\Jetpack\\Sync\\Modules\\Term_Relationships',
					'Automattic\\Jetpack\\Sync\\Modules\\Callables',
				),
				'jetpack_sync_options_whitelist'      => \Automattic\Jetpack\Sync\Defaults::$default_options_whitelist,
				'jetpack_sync_options_contentless'    => \Automattic\Jetpack\Sync\Defaults::$default_options_contentless,
				'jetpack_sync_constants_whitelist'    => \Automattic\Jetpack\Sync\Defaults::$default_constants_whitelist,
				'jetpack_sync_callable_whitelist'     => \Automattic\Jetpack\Sync\Defaults::$default_callable_whitelist,
				'jetpack_sync_multisite_callable_whitelist' => array(),
				'jetpack_sync_post_meta_whitelist'    => array(),
				'jetpack_sync_comment_meta_whitelist' => array_merge(
					\Automattic\Jetpack\Sync\Defaults::$comment_meta_whitelist,
					array( 'test_input_2_comment_meta', 'test_input_2_comment_meta_b' )
				),
				'jetpack_sync_capabilities_whitelist' => array(),
				'jetpack_sync_known_importers'        => array(),
			),
			'set_filters' => array(
				'jetpack_sync_modules',
				'jetpack_sync_post_meta_whitelist',
				'jetpack_sync_comment_meta_whitelist',
				'jetpack_sync_capabilities_whitelist',
				'jetpack_sync_known_importers',
			),
		);
	}

	/**
	 * Returns the test data for a scenario with some modules enabled and a custom filter settings which
	 * has an invalid item for an indexed filter array. Since the filter setting is invalid, it won't be used
	 * and the default value will be used instead.
	 *
	 * @return array The test input array.
	 */
	public static function data_test_5() {
		return array(
			'input'       => array(
				'jetpack_sync_modules'                => array(
					'Automattic\\Jetpack\\Sync\\Modules\\Constants',
					'Automattic\\Jetpack\\Sync\\Modules\\Network_Options',
					'Automattic\\Jetpack\\Sync\\Modules\\Terms',
					'Automattic\\Jetpack\\Sync\\Modules\\Stats',
					'Automattic\\Jetpack\\Sync\\Modules\\Comments',
					'Automattic\\Jetpack\\Sync\\Modules\\Full_Sync_Immediately',
					'Automattic\\Jetpack\\Sync\\Modules\\Term_Relationships',
				),
				'jetpack_sync_comment_meta_whitelist' => array(
					'this should be an index' => array(
						'some data'      => 1,
						'some more data' => 2,
					),
				),
			),
			'output'      => array(
				'jetpack_sync_modules'                => array(
					'Automattic\\Jetpack\\Sync\\Modules\\Constants',
					'Automattic\\Jetpack\\Sync\\Modules\\Network_Options',
					'Automattic\\Jetpack\\Sync\\Modules\\Options',
					'Automattic\\Jetpack\\Sync\\Modules\\Terms',
					'Automattic\\Jetpack\\Sync\\Modules\\Comments',
					'Automattic\\Jetpack\\Sync\\Modules\\Stats',
					'Automattic\\Jetpack\\Sync\\Modules\\Full_Sync_Immediately',
					'Automattic\\Jetpack\\Sync\\Modules\\Term_Relationships',
					'Automattic\\Jetpack\\Sync\\Modules\\Callables',
				),
				'jetpack_sync_options_whitelist'      => \Automattic\Jetpack\Sync\Defaults::$default_options_whitelist,
				'jetpack_sync_options_contentless'    => \Automattic\Jetpack\Sync\Defaults::$default_options_contentless,
				'jetpack_sync_constants_whitelist'    => \Automattic\Jetpack\Sync\Defaults::$default_constants_whitelist,
				'jetpack_sync_callable_whitelist'     => \Automattic\Jetpack\Sync\Defaults::$default_callable_whitelist,
				'jetpack_sync_multisite_callable_whitelist' => array(),
				'jetpack_sync_post_meta_whitelist'    => array(),
				'jetpack_sync_comment_meta_whitelist' => \Automattic\Jetpack\Sync\Defaults::$comment_meta_whitelist,
				'jetpack_sync_capabilities_whitelist' => array(),
				'jetpack_sync_known_importers'        => array(),
			),
			'set_filters' => array(
				'jetpack_sync_modules',
				'jetpack_sync_post_meta_whitelist',
				'jetpack_sync_capabilities_whitelist',
				'jetpack_sync_known_importers',
			),
		);
	}

	/**
	 * Returns an the test data for a scenario with some modules enabled and a custom filter settings which
	 * has an invalid item for an indexed filter array. Since the filter setting is invalid, it won't be used
	 * and the default value will be used instead.
	 *
	 * @return array The test input array.
	 */
	public static function data_test_6() {
		return array(
			'input'       => array(
				'jetpack_sync_modules'            => array(
					'Automattic\\Jetpack\\Sync\\Modules\\Constants',
					'Automattic\\Jetpack\\Sync\\Modules\\Network_Options',
					'Automattic\\Jetpack\\Sync\\Modules\\Terms',
					'Automattic\\Jetpack\\Sync\\Modules\\Stats',
					'Automattic\\Jetpack\\Sync\\Modules\\Callables',
					'Automattic\\Jetpack\\Sync\\Modules\\Comments',
					'Automattic\\Jetpack\\Sync\\Modules\\Full_Sync_Immediately',
					'Automattic\\Jetpack\\Sync\\Modules\\Term_Relationships',
				),
				'jetpack_sync_callable_whitelist' => array(
					'test_input_2_callable',
				),
				'jetpack_sync_multisite_callable_whitelist' => array(),
			),
			'output'      => array(
				'jetpack_sync_modules'                => array(
					'Automattic\\Jetpack\\Sync\\Modules\\Constants',
					'Automattic\\Jetpack\\Sync\\Modules\\Options',
					'Automattic\\Jetpack\\Sync\\Modules\\Network_Options',
					'Automattic\\Jetpack\\Sync\\Modules\\Terms',
					'Automattic\\Jetpack\\Sync\\Modules\\Stats',
					'Automattic\\Jetpack\\Sync\\Modules\\Callables',
					'Automattic\\Jetpack\\Sync\\Modules\\Comments',
					'Automattic\\Jetpack\\Sync\\Modules\\Full_Sync_Immediately',
					'Automattic\\Jetpack\\Sync\\Modules\\Term_Relationships',
				),
				'jetpack_sync_options_whitelist'      => \Automattic\Jetpack\Sync\Defaults::$default_options_whitelist,
				'jetpack_sync_options_contentless'    => \Automattic\Jetpack\Sync\Defaults::$default_options_contentless,
				'jetpack_sync_constants_whitelist'    => \Automattic\Jetpack\Sync\Defaults::$default_constants_whitelist,
				'jetpack_sync_callable_whitelist'     => \Automattic\Jetpack\Sync\Defaults::$default_callable_whitelist,
				'jetpack_sync_multisite_callable_whitelist' => array(),
				'jetpack_sync_post_meta_whitelist'    => array(),
				'jetpack_sync_comment_meta_whitelist' => \Automattic\Jetpack\Sync\Defaults::$comment_meta_whitelist,
				'jetpack_sync_capabilities_whitelist' => array(),
				'jetpack_sync_known_importers'        => array(),
			),
			'set_filters' => array(
				'jetpack_sync_modules',
				'jetpack_sync_multisite_callable_whitelist',
				'jetpack_sync_post_meta_whitelist',
				'jetpack_sync_capabilities_whitelist',
				'jetpack_sync_known_importers',
			),
		);
	}

	/**
	 * Returns the test data for a scenario with some modules enabled and an empty array used for a
	 * required and a non-required filter setting. The required one should be populated with the minimum
	 * required Sync data settings, while the non-required should be empty.
	 *
	 * @return array The test input array.
	 */
	public static function data_test_7() {
		return array(
			'input'       => array(
				'jetpack_sync_modules'                => array(
					'Automattic\\Jetpack\\Sync\\Modules\\Constants',
					'Automattic\\Jetpack\\Sync\\Modules\\Network_Options',
					'Automattic\\Jetpack\\Sync\\Modules\\Terms',
					'Automattic\\Jetpack\\Sync\\Modules\\Stats',
					'Automattic\\Jetpack\\Sync\\Modules\\Comments',
					'Automattic\\Jetpack\\Sync\\Modules\\Full_Sync_Immediately',
					'Automattic\\Jetpack\\Sync\\Modules\\Term_Relationships',
				),
				'jetpack_sync_comment_meta_whitelist' => array(),
				'jetpack_sync_options_whitelist'      => array(),
			),
			'output'      => array(
				'jetpack_sync_modules'                => array(
					'Automattic\\Jetpack\\Sync\\Modules\\Constants',
					'Automattic\\Jetpack\\Sync\\Modules\\Options',
					'Automattic\\Jetpack\\Sync\\Modules\\Network_Options',
					'Automattic\\Jetpack\\Sync\\Modules\\Terms',
					'Automattic\\Jetpack\\Sync\\Modules\\Comments',
					'Automattic\\Jetpack\\Sync\\Modules\\Stats',
					'Automattic\\Jetpack\\Sync\\Modules\\Full_Sync_Immediately',
					'Automattic\\Jetpack\\Sync\\Modules\\Term_Relationships',
					'Automattic\\Jetpack\\Sync\\Modules\\Callables',
				),
				'jetpack_sync_options_whitelist'      => array(
					'jetpack_sync_non_blocking',
					'jetpack_sync_non_public_post_stati',
					'jetpack_sync_settings_comment_meta_whitelist',
					'jetpack_sync_settings_post_meta_whitelist',
					'jetpack_sync_settings_post_types_blacklist',
					'jetpack_sync_settings_taxonomies_blacklist',
					'jetpack_sync_settings_dedicated_sync_enabled',
					'jetpack_connection_active_plugins',
					'blog_charset',
					'blog_public',
					'blogdescription',
					'blogname',
					'permalink_structure',
					'stylesheet',
					'time_format',
					'timezone_string',
				),
				'jetpack_sync_options_contentless'    => \Automattic\Jetpack\Sync\Defaults::$default_options_contentless,
				'jetpack_sync_constants_whitelist'    => \Automattic\Jetpack\Sync\Defaults::$default_constants_whitelist,
				'jetpack_sync_callable_whitelist'     => \Automattic\Jetpack\Sync\Defaults::$default_callable_whitelist,
				'jetpack_sync_multisite_callable_whitelist' => array(),
				'jetpack_sync_post_meta_whitelist'    => array(),
				'jetpack_sync_comment_meta_whitelist' => array(),
				'jetpack_sync_capabilities_whitelist' => array(),
				'jetpack_sync_known_importers'        => array(),
			),
			'set_filters' => array(
				'jetpack_sync_modules',
				'jetpack_sync_options_whitelist',
				'jetpack_sync_post_meta_whitelist',
				'jetpack_sync_comment_meta_whitelist',
				'jetpack_sync_capabilities_whitelist',
				'jetpack_sync_known_importers',
			),
		);
	}

	/**
	 * Same with data_test_7 but without specifying jetpack_sync_modules. In this case, it's expected that all Sync modules are enabled and the custom filters are applied.
	 *
	 * @return array The test input array.
	 */
	public static function data_test_7_1() {
		return array(
			'input'       => array(
				'jetpack_sync_comment_meta_whitelist' => array(),
				'jetpack_sync_options_whitelist'      => array(),
			),
			'output'      => array(
				'jetpack_sync_modules'                => \Automattic\Jetpack\Sync\Modules::DEFAULT_SYNC_MODULES,
				'jetpack_sync_options_whitelist'      => array(
					'jetpack_sync_non_blocking',
					'jetpack_sync_non_public_post_stati',
					'jetpack_sync_settings_comment_meta_whitelist',
					'jetpack_sync_settings_post_meta_whitelist',
					'jetpack_sync_settings_post_types_blacklist',
					'jetpack_sync_settings_taxonomies_blacklist',
					'jetpack_sync_settings_dedicated_sync_enabled',
					'jetpack_connection_active_plugins',
					'blog_charset',
					'blog_public',
					'blogdescription',
					'blogname',
					'permalink_structure',
					'stylesheet',
					'time_format',
					'timezone_string',
				),
				'jetpack_sync_options_contentless'    => \Automattic\Jetpack\Sync\Defaults::$default_options_contentless,
				'jetpack_sync_constants_whitelist'    => \Automattic\Jetpack\Sync\Defaults::$default_constants_whitelist,
				'jetpack_sync_callable_whitelist'     => \Automattic\Jetpack\Sync\Defaults::$default_callable_whitelist,
				'jetpack_sync_multisite_callable_whitelist' => array(),
				'jetpack_sync_post_meta_whitelist'    => \Automattic\Jetpack\Sync\Defaults::$post_meta_whitelist,
				'jetpack_sync_comment_meta_whitelist' => array(),
				'jetpack_sync_capabilities_whitelist' => \Automattic\Jetpack\Sync\Defaults::$default_capabilities_whitelist,
				'jetpack_sync_known_importers'        => \Automattic\Jetpack\Sync\Defaults::$default_known_importers,
			),
			'set_filters' => array(
				'jetpack_sync_options_whitelist',
				'jetpack_sync_comment_meta_whitelist',
			),
		);
	}

	/**
	 * Same with data_test_7 but with empty jetpack_sync_modules. In this case, it's expected that the minimum required Sync modules are enabled and the custom filters are applied.
	 *
	 * @return array The test input array.
	 */
	public static function data_test_7_2() {
		return array(
			'input'       => array(
				'jetpack_sync_modules'                => array(),
				'jetpack_sync_comment_meta_whitelist' => array(),
				'jetpack_sync_options_whitelist'      => array(),
			),
			'output'      => array(
				'jetpack_sync_modules'                => array(
					'Automattic\Jetpack\Sync\Modules\Callables',
					'Automattic\Jetpack\Sync\Modules\Constants',
					'Automattic\Jetpack\Sync\Modules\Full_Sync_Immediately',
					'Automattic\Jetpack\Sync\Modules\Options',
				),
				'jetpack_sync_options_whitelist'      => array(
					'jetpack_sync_non_blocking',
					'jetpack_sync_non_public_post_stati',
					'jetpack_sync_settings_comment_meta_whitelist',
					'jetpack_sync_settings_post_meta_whitelist',
					'jetpack_sync_settings_post_types_blacklist',
					'jetpack_sync_settings_taxonomies_blacklist',
					'jetpack_sync_settings_dedicated_sync_enabled',
					'jetpack_connection_active_plugins',
					'blog_charset',
					'blog_public',
					'blogdescription',
					'blogname',
					'permalink_structure',
					'stylesheet',
					'time_format',
					'timezone_string',
				),
				'jetpack_sync_options_contentless'    => \Automattic\Jetpack\Sync\Defaults::$default_options_contentless,
				'jetpack_sync_constants_whitelist'    => \Automattic\Jetpack\Sync\Defaults::$default_constants_whitelist,
				'jetpack_sync_callable_whitelist'     => \Automattic\Jetpack\Sync\Defaults::$default_callable_whitelist,
				'jetpack_sync_multisite_callable_whitelist' => array(),
				'jetpack_sync_post_meta_whitelist'    => array(),
				'jetpack_sync_comment_meta_whitelist' => array(),
				'jetpack_sync_capabilities_whitelist' => array(),
				'jetpack_sync_known_importers'        => array(),
			),
			'set_filters' => array(
				'jetpack_sync_modules',
				'jetpack_sync_options_whitelist',
				'jetpack_sync_comment_meta_whitelist',
				'jetpack_sync_post_meta_whitelist',
				'jetpack_sync_capabilities_whitelist',
				'jetpack_sync_known_importers',
			),
		);
	}

	/**
	 * Returns the test data for a scenario with two inputs. The first input uses custom filters,
	 *  and the second input uses defaults.
	 *
	 * @return array The test input array.
	 */
	public static function data_test_8() {
		return array(
			'input_1'     => array(
				'jetpack_sync_modules'                => array(
					'Automattic\\Jetpack\\Sync\\Modules\\Comments',
					'Automattic\\Jetpack\\Sync\\Modules\\Full_Sync_Immediately',
					'Automattic\\Jetpack\\Sync\\Modules\\Options',
					'Automattic\\Jetpack\\Sync\\Modules\\Plugins',
				),
				'jetpack_sync_comment_meta_whitelist' => array_merge(
					\Automattic\Jetpack\Sync\Defaults::$comment_meta_whitelist,
					array( 'test_input_2_comment_meta', 'test_input_2_comment_meta_b' )
				),
			),
			'input_2'     => array(),
			'output'      => array(
				'jetpack_sync_modules'                => \Automattic\Jetpack\Sync\Modules::DEFAULT_SYNC_MODULES,
				'jetpack_sync_options_whitelist'      => \Automattic\Jetpack\Sync\Defaults::$default_options_whitelist,
				'jetpack_sync_options_contentless'    => \Automattic\Jetpack\Sync\Defaults::$default_options_contentless,
				'jetpack_sync_constants_whitelist'    => \Automattic\Jetpack\Sync\Defaults::$default_constants_whitelist,
				'jetpack_sync_callable_whitelist'     => \Automattic\Jetpack\Sync\Defaults::$default_callable_whitelist,
				'jetpack_sync_multisite_callable_whitelist' => \Automattic\Jetpack\Sync\Defaults::$default_multisite_callable_whitelist,
				'jetpack_sync_post_meta_whitelist'    => \Automattic\Jetpack\Sync\Defaults::$post_meta_whitelist,
				'jetpack_sync_comment_meta_whitelist' => array_merge(
					\Automattic\Jetpack\Sync\Defaults::$comment_meta_whitelist,
					array( 'test_input_2_comment_meta', 'test_input_2_comment_meta_b' )
				),
				'jetpack_sync_capabilities_whitelist' => \Automattic\Jetpack\Sync\Defaults::$default_capabilities_whitelist,
				'jetpack_sync_known_importers'        => \Automattic\Jetpack\Sync\Defaults::$default_known_importers,
			),
			'set_filters' => array(
				'jetpack_sync_modules',
				'jetpack_sync_post_meta_whitelist',
				'jetpack_sync_comment_meta_whitelist',
				'jetpack_sync_capabilities_whitelist',
				'jetpack_sync_known_importers',
			),
		);
	}

	/**
	 * Returns the test data for a scenario with two inputs. The first input uses defaults,
	 * and the second one uses custom filters.
	 *
	 * @return array The test input array.
	 */
	public static function data_test_9() {
		return array(
			'input_1'     => array(),
			'input_2'     => array(
				'jetpack_sync_modules'                => array(
					'Automattic\\Jetpack\\Sync\\Modules\\Comments',
					'Automattic\\Jetpack\\Sync\\Modules\\Full_Sync_Immediately',
					'Automattic\\Jetpack\\Sync\\Modules\\Options',
					'Automattic\\Jetpack\\Sync\\Modules\\Plugins',
				),
				'jetpack_sync_comment_meta_whitelist' => array_merge(
					\Automattic\Jetpack\Sync\Defaults::$comment_meta_whitelist,
					array( 'test_input_2_comment_meta', 'test_input_2_comment_meta_b' )
				),
			),
			'output'      => array(
				'jetpack_sync_modules'                => \Automattic\Jetpack\Sync\Modules::DEFAULT_SYNC_MODULES,
				'jetpack_sync_options_whitelist'      => \Automattic\Jetpack\Sync\Defaults::$default_options_whitelist,
				'jetpack_sync_options_contentless'    => \Automattic\Jetpack\Sync\Defaults::$default_options_contentless,
				'jetpack_sync_constants_whitelist'    => \Automattic\Jetpack\Sync\Defaults::$default_constants_whitelist,
				'jetpack_sync_callable_whitelist'     => \Automattic\Jetpack\Sync\Defaults::$default_callable_whitelist,
				'jetpack_sync_multisite_callable_whitelist' => \Automattic\Jetpack\Sync\Defaults::$default_multisite_callable_whitelist,
				'jetpack_sync_post_meta_whitelist'    => \Automattic\Jetpack\Sync\Defaults::$post_meta_whitelist,
				'jetpack_sync_comment_meta_whitelist' => array_merge(
					\Automattic\Jetpack\Sync\Defaults::$comment_meta_whitelist,
					array( 'test_input_2_comment_meta', 'test_input_2_comment_meta_b' )
				),
				'jetpack_sync_capabilities_whitelist' => \Automattic\Jetpack\Sync\Defaults::$default_capabilities_whitelist,
				'jetpack_sync_known_importers'        => \Automattic\Jetpack\Sync\Defaults::$default_known_importers,
			),
			'set_filters' => array(
				'jetpack_sync_modules',
				'jetpack_sync_post_meta_whitelist',
				'jetpack_sync_comment_meta_whitelist',
				'jetpack_sync_capabilities_whitelist',
				'jetpack_sync_known_importers',
			),
		);
	}

	/**
	 * Returns the test data for a scenario with two inputs. The first input uses custom filters for a MUST-sync module (callables), and the second one uses defaults.
	 *
	 * @return array The test input array.
	 */
	public static function data_test_9_2() {
		return array(
			'input_1'     => array(
				'jetpack_sync_modules'             => array(
					'Automattic\\Jetpack\\Sync\\Modules\\Callables',
					'Automattic\\Jetpack\\Sync\\Modules\\Options',
				),
				'jetpack_sync_callable_whitelist'  => array(
					'get_plugins' => array( 'Automattic\\Jetpack\\Sync\\Functions', 'get_plugins' ),
					'get_themes'  => array( 'Automattic\\Jetpack\\Sync\\Functions', 'get_themes' ),
					'wp_version'  => array( 'Automattic\\Jetpack\\Sync\\Functions', 'wp_version' ),
				),
				'jetpack_sync_options_contentless' => array(),
				'jetpack_sync_options_whitelist'   => array(
					'active_plugins',
					'stylesheet',
				),
			),
			'input_2'     => array(),
			'output'      => array(
				'jetpack_sync_modules'                => \Automattic\Jetpack\Sync\Modules::DEFAULT_SYNC_MODULES,
				'jetpack_sync_options_whitelist'      => \Automattic\Jetpack\Sync\Defaults::$default_options_whitelist,
				'jetpack_sync_options_contentless'    => \Automattic\Jetpack\Sync\Defaults::$default_options_contentless,
				'jetpack_sync_constants_whitelist'    => \Automattic\Jetpack\Sync\Defaults::$default_constants_whitelist,
				'jetpack_sync_callable_whitelist'     => \Automattic\Jetpack\Sync\Defaults::$default_callable_whitelist,
				'jetpack_sync_multisite_callable_whitelist' => \Automattic\Jetpack\Sync\Defaults::$default_multisite_callable_whitelist,
				'jetpack_sync_post_meta_whitelist'    => \Automattic\Jetpack\Sync\Defaults::$post_meta_whitelist,
				'jetpack_sync_comment_meta_whitelist' => \Automattic\Jetpack\Sync\Defaults::$comment_meta_whitelist,
				'jetpack_sync_capabilities_whitelist' => \Automattic\Jetpack\Sync\Defaults::$default_capabilities_whitelist,
				'jetpack_sync_known_importers'        => \Automattic\Jetpack\Sync\Defaults::$default_known_importers,
			),
			'set_filters' => array(
				'jetpack_sync_modules',
				'jetpack_sync_options_whitelist',
				'jetpack_sync_options_contentless',
				'jetpack_sync_callable_whitelist',
				'jetpack_sync_post_meta_whitelist',
				'jetpack_sync_comment_meta_whitelist',
				'jetpack_sync_capabilities_whitelist',
				'jetpack_sync_known_importers',
			),
		);
	}

	/**
	 * Returns an the test data for a scenario with two inputs. Both inputs set custom filters
	 *
	 * @return array The test input array.
	 */
	public static function data_test_10() {
		return array(
			'input_1'     => array(
				'jetpack_sync_modules'             => array(
					'Automattic\\Jetpack\\Sync\\Modules\\Constants',
					'Automattic\\Jetpack\\Sync\\Modules\\Callables',
				),
				'jetpack_sync_callable_whitelist'  => array(
					'test_input_10_callable' => array(
						'callable_class',
						'callable_method',
					),
				),
				'jetpack_sync_constants_whitelist' => array(
					'test_input_10_constant_a',
					'test_input_10_constant_b',
				),
				'jetpack_sync_options_whitelist'   => array(
					'test_input_10_option_a',
				),
			),
			'input_2'     => array(
				'jetpack_sync_modules'             => array(
					'Automattic\\Jetpack\\Sync\\Modules\\Constants',
					'Automattic\\Jetpack\\Sync\\Modules\\Options',
					'Automattic\\Jetpack\\Sync\\Modules\\Callables',
				),
				'jetpack_sync_callable_whitelist'  => array(),
				'jetpack_sync_multisite_callable_whitelist' => array(
					'test_input_10_multisite_callable' => array(
						'callable_class',
						'callable_method',
					),
				),
				'jetpack_sync_options_whitelist'   => array(
					'test_input_10_option_b',
					'test_input_10_option_c',
				),
				'jetpack_sync_constants_whitelist' => array(
					'ABSPATH',
				),
			),
			'output'      => array(
				'jetpack_sync_modules'                => array(
					'Automattic\\Jetpack\\Sync\\Modules\\Constants',
					'Automattic\\Jetpack\\Sync\\Modules\\Callables',
					'Automattic\\Jetpack\\Sync\\Modules\\Full_Sync_Immediately',
					'Automattic\\Jetpack\\Sync\\Modules\\Options',
				),
				'jetpack_sync_options_whitelist'      => array(
					'jetpack_sync_non_blocking',
					'jetpack_sync_non_public_post_stati',
					'jetpack_sync_settings_comment_meta_whitelist',
					'jetpack_sync_settings_post_meta_whitelist',
					'jetpack_sync_settings_post_types_blacklist',
					'jetpack_sync_settings_taxonomies_blacklist',
					'jetpack_sync_settings_dedicated_sync_enabled',
					'jetpack_connection_active_plugins',
					'blog_charset',
					'blog_public',
					'blogdescription',
					'blogname',
					'permalink_structure',
					'stylesheet',
					'time_format',
					'timezone_string',
					'test_input_10_option_a',
					'test_input_10_option_b',
					'test_input_10_option_c',
				),
				'jetpack_sync_options_contentless'    => \Automattic\Jetpack\Sync\Defaults::$default_options_contentless,
				'jetpack_sync_constants_whitelist'    => array(
					'ABSPATH',
					'ALTERNATE_WP_CRON',
					'ATOMIC_CLIENT_ID',
					'AUTOMATIC_UPDATER_DISABLED',
					'DISABLE_WP_CRON',
					'DISALLOW_FILE_EDIT',
					'DISALLOW_FILE_MODS',
					'EMPTY_TRASH_DAYS',
					'FS_METHOD',
					'IS_PRESSABLE',
					'PHP_VERSION',
					'WP_ACCESSIBLE_HOSTS',
					'WP_AUTO_UPDATE_CORE',
					'WP_CONTENT_DIR',
					'WP_CRON_LOCK_TIMEOUT',
					'WP_DEBUG',
					'WP_HTTP_BLOCK_EXTERNAL',
					'WP_MAX_MEMORY_LIMIT',
					'WP_MEMORY_LIMIT',
					'WP_POST_REVISIONS',
					'test_input_10_constant_a',
					'test_input_10_constant_b',
				),
				'jetpack_sync_callable_whitelist'     => array(
					'test_input_10_callable'  => array(
						'callable_class',
						'callable_method',
					),
					'site_url'                => array( 'Automattic\\Jetpack\\Connection\\Urls', 'site_url' ),
					'home_url'                => array( 'Automattic\\Jetpack\\Connection\\Urls', 'home_url' ),
					'get_plugins'             => array( 'Automattic\\Jetpack\\Sync\\Functions', 'get_plugins' ),
					'get_themes'              => array( 'Automattic\\Jetpack\\Sync\\Functions', 'get_themes' ),
					'paused_plugins'          => array( 'Automattic\\Jetpack\\Sync\\Functions', 'get_paused_plugins' ),
					'paused_themes'           => array( 'Automattic\\Jetpack\\Sync\\Functions', 'get_paused_themes' ),
					'timezone'                => array( 'Automattic\\Jetpack\\Sync\\Functions', 'get_timezone' ),
					'wp_get_environment_type' => 'wp_get_environment_type',
					'wp_max_upload_size'      => 'wp_max_upload_size',
					'wp_version'              => array( 'Automattic\\Jetpack\\Sync\\Functions', 'wp_version' ),
				),
				'jetpack_sync_multisite_callable_whitelist' => array(
					'test_input_10_multisite_callable' => array(
						'callable_class',
						'callable_method',
					),
				),
				'jetpack_sync_post_meta_whitelist'    => array(),
				'jetpack_sync_comment_meta_whitelist' => array(),
				'jetpack_sync_capabilities_whitelist' => array(),
				'jetpack_sync_known_importers'        => array(),
			),
			'set_filters' => array(
				'jetpack_sync_modules',
				'jetpack_sync_options_whitelist',
				'jetpack_sync_constants_whitelist',
				'jetpack_sync_callable_whitelist',
				'jetpack_sync_multisite_callable_whitelist',
				'jetpack_sync_post_meta_whitelist',
				'jetpack_sync_comment_meta_whitelist',
				'jetpack_sync_capabilities_whitelist',
				'jetpack_sync_known_importers',
			),
		);
	}
}
