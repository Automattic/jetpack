<?php
/**
 * Class used to manage backwards-compatibility of the package.
 *
 * @since 0.8.0
 *
 * @package automattic/jetpack-waf
 */

namespace Automattic\Jetpack\Waf;

/**
 * Defines methods for ensuring backwards compatibility.
 */
class Waf_Compatibility {

	/**
	 * Add compatibilty hooks
	 *
	 * @since 0.8.0
	 *
	 * @return void
	 */
	public static function add_compatibility_hooks() {
		add_filter( 'default_option_' . Waf_Runner::AUTOMATIC_RULES_ENABLED_OPTION_NAME, __CLASS__ . '::default_option_waf_automatic_rules', 10, 3 );
	}

	/**
	 * Provides a default value for sites that installed the WAF
	 * before the automatic rules option was introduced.
	 *
	 * @since 0.8.0
	 *
	 * @param mixed  $default         The default value to return if the option does not exist in the database.
	 * @param string $option          Option name.
	 * @param bool   $passed_default  Was get_option() passed a default value.
	 *
	 * @return mixed The default value to return if the option does not exist in the database.
	 */
	public static function default_option_waf_automatic_rules( $default, $option, $passed_default ) {
		// Allow get_option() to override this default value
		if ( $passed_default ) {
			return $default;
		}

		return self::get_default_automatic_rules_option();
	}

	/**
	 * If the option is not available, use the WAF module status
	 * to determine whether or not to run automatic rules
	 */
	public static function get_default_automatic_rules_option() {
		return Waf_Runner::is_enabled();
	}

	/**
	 * Move the rules directory out of the plugin directory and into the WAF content directory.
	 *
	 * @since 0.8.0
	 *
	 * @throws \Exception If the rules directory cannot be moved.
	 * @return void
	 */
	public static function migrate_rules() {
		Waf_Constants::initialize_constants();
		Waf_Runner::initialize_filesystem();
		Waf_Runner::create_waf_directory();

		global $wp_filesystem;

		if ( $wp_filesystem->exists( __DIR__ . '/../rules' ) ) {
			// Copy the existing rule files into the WAF content directory.
			$dir_copied = $wp_filesystem->copy( __DIR__ . '/../rules', Waf_Runner::get_waf_file_path( 'rules' ) );
			if ( is_wp_error( $dir_copied ) ) {
				throw new \Exception( 'Failed copying rules directory to: ' . Waf_Runner::get_waf_file_path( 'rules' ) );
			}

			// Delete the old rules directory.
			$wp_filesystem->delete( __DIR__ . '/../rules', true );
		}
	}

}
