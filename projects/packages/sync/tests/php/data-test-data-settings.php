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
				),
				'jetpack_sync_options_whitelist'      => \Automattic\Jetpack\Sync\Defaults::$default_options_whitelist,
				'jetpack_sync_options_contentless'    => \Automattic\Jetpack\Sync\Defaults::$default_options_contentless,
				'jetpack_sync_constants_whitelist'    => array(),
				'jetpack_sync_callable_whitelist'     => array(
					'site_url'       => array( 'Automattic\\Jetpack\\Connection\\Urls', 'site_url' ),
					'home_url'       => array( 'Automattic\\Jetpack\\Connection\\Urls', 'home_url' ),
					'paused_plugins' => array( 'Automattic\\Jetpack\\Sync\\Functions', 'get_paused_plugins' ),
					'paused_themes'  => array( 'Automattic\\Jetpack\\Sync\\Functions', 'get_paused_themes' ),
				),
				'jetpack_sync_multisite_callable_whitelist' => array(),
				'jetpack_sync_post_meta_whitelist'    => array(),
				'jetpack_sync_comment_meta_whitelist' => array(),
				'jetpack_sync_capabilities_whitelist' => array(),
				'jetpack_sync_known_importers'        => array(),
			),
			'set_filters' => array(
				'jetpack_sync_modules',
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
					'Automattic\\Jetpack\\Sync\\Modules\\Terms',
					'Automattic\\Jetpack\\Sync\\Modules\\Callables',
					'Automattic\\Jetpack\\Sync\\Modules\\Comments',
					'Automattic\\Jetpack\\Sync\\Modules\\Stats',
					'Automattic\\Jetpack\\Sync\\Modules\\Full_Sync_Immediately',
					'Automattic\\Jetpack\\Sync\\Modules\\Term_Relationships',
				),
				'jetpack_sync_options_whitelist'      => array(),
				'jetpack_sync_options_contentless'    => array(),
				'jetpack_sync_constants_whitelist'    => \Automattic\Jetpack\Sync\Defaults::$default_constants_whitelist,
				'jetpack_sync_callable_whitelist'     => array(
					'site_url'              => array( 'Automattic\\Jetpack\\Connection\\Urls', 'site_url' ),
					'home_url'              => array( 'Automattic\\Jetpack\\Connection\\Urls', 'home_url' ),
					'paused_plugins'        => array( 'Automattic\\Jetpack\\Sync\\Functions', 'get_paused_plugins' ),
					'paused_themes'         => array( 'Automattic\\Jetpack\\Sync\\Functions', 'get_paused_themes' ),
					'test_input_2_callable' => array( 'Automattic\\Jetpack\\Sync\\Test_Input_2', 'test_method_input_2' ),
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
	 * Returns an the test data for a scenario with some modules enabled and some custom filter settings
	 * for disabled modules. Since the modules associated with the filters are disabled, the custom filter
	 * settings are not used.
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
				'jetpack_sync_comment_meta_whitelist' => array(
					'test_input_2_comment_meta',
					'test_input_2_comment_meta_b',
				),
			),
			'output'      => array(
				'jetpack_sync_modules'                => array(
					'Automattic\\Jetpack\\Sync\\Modules\\Constants',
					'Automattic\\Jetpack\\Sync\\Modules\\Network_Options',
					'Automattic\\Jetpack\\Sync\\Modules\\Terms',
					'Automattic\\Jetpack\\Sync\\Modules\\Stats',
					'Automattic\\Jetpack\\Sync\\Modules\\Full_Sync_Immediately',
					'Automattic\\Jetpack\\Sync\\Modules\\Term_Relationships',
					'Automattic\\Jetpack\\Sync\\Modules\\Callables',
				),
				'jetpack_sync_options_whitelist'      => array(),
				'jetpack_sync_options_contentless'    => array(),
				'jetpack_sync_constants_whitelist'    => \Automattic\Jetpack\Sync\Defaults::$default_constants_whitelist,
				'jetpack_sync_callable_whitelist'     => array(
					'site_url'       => array( 'Automattic\\Jetpack\\Connection\\Urls', 'site_url' ),
					'home_url'       => array( 'Automattic\\Jetpack\\Connection\\Urls', 'home_url' ),
					'paused_plugins' => array( 'Automattic\\Jetpack\\Sync\\Functions', 'get_paused_plugins' ),
					'paused_themes'  => array( 'Automattic\\Jetpack\\Sync\\Functions', 'get_paused_themes' ),
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
				'jetpack_sync_multisite_callable_whitelist',
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
					'Automattic\\Jetpack\\Sync\\Modules\\Terms',
					'Automattic\\Jetpack\\Sync\\Modules\\Stats',
					'Automattic\\Jetpack\\Sync\\Modules\\Comments',
					'Automattic\\Jetpack\\Sync\\Modules\\Full_Sync_Immediately',
					'Automattic\\Jetpack\\Sync\\Modules\\Term_Relationships',
					'Automattic\\Jetpack\\Sync\\Modules\\Callables',
				),
				'jetpack_sync_options_whitelist'      => array(),
				'jetpack_sync_options_contentless'    => array(),
				'jetpack_sync_constants_whitelist'    => \Automattic\Jetpack\Sync\Defaults::$default_constants_whitelist,
				'jetpack_sync_callable_whitelist'     => array(
					'site_url'       => array( 'Automattic\\Jetpack\\Connection\\Urls', 'site_url' ),
					'home_url'       => array( 'Automattic\\Jetpack\\Connection\\Urls', 'home_url' ),
					'paused_plugins' => array( 'Automattic\\Jetpack\\Sync\\Functions', 'get_paused_plugins' ),
					'paused_themes'  => array( 'Automattic\\Jetpack\\Sync\\Functions', 'get_paused_themes' ),
				),
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
				'jetpack_sync_options_whitelist',
				'jetpack_sync_options_contentless',
				'jetpack_sync_callable_whitelist',
				'jetpack_sync_multisite_callable_whitelist',
				'jetpack_sync_post_meta_whitelist',
				'jetpack_sync_comment_meta_whitelist',
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
					'Automattic\\Jetpack\\Sync\\Modules\\Terms',
					'Automattic\\Jetpack\\Sync\\Modules\\Comments',
					'Automattic\\Jetpack\\Sync\\Modules\\Stats',
					'Automattic\\Jetpack\\Sync\\Modules\\Full_Sync_Immediately',
					'Automattic\\Jetpack\\Sync\\Modules\\Term_Relationships',
					'Automattic\\Jetpack\\Sync\\Modules\\Callables',
				),
				'jetpack_sync_options_whitelist'      => array(),
				'jetpack_sync_options_contentless'    => array(),
				'jetpack_sync_constants_whitelist'    => \Automattic\Jetpack\Sync\Defaults::$default_constants_whitelist,
				'jetpack_sync_callable_whitelist'     => array(
					'site_url'       => array( 'Automattic\\Jetpack\\Connection\\Urls', 'site_url' ),
					'home_url'       => array( 'Automattic\\Jetpack\\Connection\\Urls', 'home_url' ),
					'paused_plugins' => array( 'Automattic\\Jetpack\\Sync\\Functions', 'get_paused_plugins' ),
					'paused_themes'  => array( 'Automattic\\Jetpack\\Sync\\Functions', 'get_paused_themes' ),
				),
				'jetpack_sync_multisite_callable_whitelist' => array(),
				'jetpack_sync_post_meta_whitelist'    => array(),
				'jetpack_sync_comment_meta_whitelist' => \Automattic\Jetpack\Sync\Defaults::$comment_meta_whitelist,
				'jetpack_sync_capabilities_whitelist' => array(),
				'jetpack_sync_known_importers'        => array(),
			),
			'set_filters' => array(
				'jetpack_sync_modules',
				'jetpack_sync_options_whitelist',
				'jetpack_sync_options_contentless',
				'jetpack_sync_callable_whitelist',
				'jetpack_sync_multisite_callable_whitelist',
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
					'Automattic\\Jetpack\\Sync\\Modules\\Network_Options',
					'Automattic\\Jetpack\\Sync\\Modules\\Terms',
					'Automattic\\Jetpack\\Sync\\Modules\\Stats',
					'Automattic\\Jetpack\\Sync\\Modules\\Callables',
					'Automattic\\Jetpack\\Sync\\Modules\\Comments',
					'Automattic\\Jetpack\\Sync\\Modules\\Full_Sync_Immediately',
					'Automattic\\Jetpack\\Sync\\Modules\\Term_Relationships',
				),
				'jetpack_sync_options_whitelist'      => array(),
				'jetpack_sync_options_contentless'    => array(),
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
				'jetpack_sync_options_whitelist',
				'jetpack_sync_options_contentless',
				'jetpack_sync_callable_whitelist',
				'jetpack_sync_multisite_callable_whitelist',
				'jetpack_sync_post_meta_whitelist',
				'jetpack_sync_capabilities_whitelist',
				'jetpack_sync_known_importers',
			),
		);
	}

	/**
	 * Returns an the test data for a scenario with some modules enabled and an empty array used for a
	 * filter setting.
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
			),
			'output'      => array(
				'jetpack_sync_modules'                => array(
					'Automattic\\Jetpack\\Sync\\Modules\\Constants',
					'Automattic\\Jetpack\\Sync\\Modules\\Network_Options',
					'Automattic\\Jetpack\\Sync\\Modules\\Terms',
					'Automattic\\Jetpack\\Sync\\Modules\\Comments',
					'Automattic\\Jetpack\\Sync\\Modules\\Stats',
					'Automattic\\Jetpack\\Sync\\Modules\\Full_Sync_Immediately',
					'Automattic\\Jetpack\\Sync\\Modules\\Term_Relationships',
					'Automattic\\Jetpack\\Sync\\Modules\\Callables',
				),
				'jetpack_sync_options_whitelist'      => array(),
				'jetpack_sync_options_contentless'    => array(),
				'jetpack_sync_constants_whitelist'    => \Automattic\Jetpack\Sync\Defaults::$default_constants_whitelist,
				'jetpack_sync_callable_whitelist'     => array(
					'site_url'       => array( 'Automattic\\Jetpack\\Connection\\Urls', 'site_url' ),
					'home_url'       => array( 'Automattic\\Jetpack\\Connection\\Urls', 'home_url' ),
					'paused_plugins' => array( 'Automattic\\Jetpack\\Sync\\Functions', 'get_paused_plugins' ),
					'paused_themes'  => array( 'Automattic\\Jetpack\\Sync\\Functions', 'get_paused_themes' ),
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
				'jetpack_sync_multisite_callable_whitelist',
				'jetpack_sync_post_meta_whitelist',
				'jetpack_sync_comment_meta_whitelist',
				'jetpack_sync_capabilities_whitelist',
				'jetpack_sync_known_importers',
			),
		);
	}

	/**
	 * Returns an the test data for a scenario with two inputs. The first input uses custom filters, and the
	 * second input uses defaults.
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

	/**
	 * Returns an the test data for a scenario with two inputs. The first input uses defaults, and the
	 * second input uses custom filters.
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
					'test_input_10_option_a',
					'test_input_10_option_b',
				),
				'jetpack_sync_constants_whitelist' => array(
					'ABSPATH',
				),
			),
			'output'      => array(
				'jetpack_sync_modules'                => array(
					'Automattic\\Jetpack\\Sync\\Modules\\Constants',
					'Automattic\\Jetpack\\Sync\\Modules\\Callables',
					'Automattic\\Jetpack\\Sync\\Modules\\Options',
				),
				'jetpack_sync_options_whitelist'      => array(
					'test_input_10_option_a',
					'test_input_10_option_b',
				),
				'jetpack_sync_options_contentless'    => \Automattic\Jetpack\Sync\Defaults::$default_options_contentless,
				'jetpack_sync_constants_whitelist'    => array(
					'ABSPATH',
					'test_input_10_constant_a',
					'test_input_10_constant_b',
				),
				'jetpack_sync_callable_whitelist'     => array(
					'test_input_10_callable' => array(
						'callable_class',
						'callable_method',
					),
					'site_url'               => array( 'Automattic\\Jetpack\\Connection\\Urls', 'site_url' ),
					'home_url'               => array( 'Automattic\\Jetpack\\Connection\\Urls', 'home_url' ),
					'paused_plugins'         => array( 'Automattic\\Jetpack\\Sync\\Functions', 'get_paused_plugins' ),
					'paused_themes'          => array( 'Automattic\\Jetpack\\Sync\\Functions', 'get_paused_themes' ),
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
				'jetpack_sync_options_contentless',
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
