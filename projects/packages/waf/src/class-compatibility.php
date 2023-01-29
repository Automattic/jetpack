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
		add_filter( 'default_option_' . Waf_Rules_Manager::AUTOMATIC_RULES_ENABLED_OPTION_NAME, __CLASS__ . '::default_option_waf_automatic_rules', 10, 3 );
		add_filter( 'default_option_' . Waf_Initializer::NEEDS_UPDATE_OPTION_NAME, __CLASS__ . '::default_option_waf_needs_update', 10, 3 );
		add_filter( 'option_' . Waf_Rules_Manager::IP_ALLOW_LIST_OPTION_NAME, __CLASS__ . '::merge_brute_force_allow_list', 10, 2 );
	}

	/**
	 * Provides a default value for sites that installed the WAF
	 * before the automatic rules option was introduced.
	 *
	 * @since 0.9.0
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
	 * to determine whether or not to run automatic rules.
	 *
	 * @since 0.9.0
	 *
	 * @return bool The default value for automatic rules.
	 */
	public static function get_default_automatic_rules_option() {
		return Waf_Runner::is_enabled();
	}

	/**
	 * Provides a default value for sites that installed the WAF
	 * before the NEEDS_UPDATE_OPTION_NAME option was added.
	 *
	 * @since 0.8.0
	 *
	 * @param mixed  $default         The default value to return if the option does not exist in the database.
	 * @param string $option          Option name.
	 * @param bool   $passed_default  Was get_option() passed a default value.
	 *
	 * @return mixed The default value to return if the option does not exist in the database.
	 */
	public static function default_option_waf_needs_update( $default, $option, $passed_default ) {
		// Allow get_option() to override this default value
		if ( $passed_default ) {
			return $default;
		}

		// If the option hasn't been added yet, the WAF needs to be updated.
		return true;
	}

	/**
	 * Migrate the brute force protection IP allow list option to the WAF option.
	 *
	 * @since $$next-version$$
	 *
	 * @param string $waf_allow_list The current value of the WAF IP allow list option.
	 *
	 * @return string The merged IP allow list.
	 */
	private static function migrate_brute_force_protection_ip_allow_list( $waf_allow_list ) {
		$brute_force_allow_list = get_option( 'jetpack_protect_whitelist', array() );
		if ( false !== $brute_force_allow_list ) {
			$brute_force_allow_list = array_map(
				function ( $ip_object ) {
					if ( $ip_object->range ) {
							return $ip_object->range_low . '-' . $ip_object->range_high;
					}

					return $ip_object->ip_address;
				},
				$brute_force_allow_list
			);
			$delete_option          = true;

			if ( ! empty( $brute_force_allow_list ) ) {
				"$waf_allow_list\n" . explode( '\n', $brute_force_allow_list );
				$delete_option = update_option( Waf_Rules_Manager::IP_ALLOW_LIST_OPTION_NAME, $waf_allow_list );
			}

			if ( $delete_option ) {
				delete_option( 'jetpack_protect_whitelist' );
			}
		}

		return $waf_allow_list;
	}

	/**
	 * Merge the deprecated IP allow list from the brute force protection module with the existing option value.
	 *
	 * @since $$next-version$$
	 *
	 * @param array  $value  The current value of the option.
	 * @param string $option The option name.
	 *
	 * @return array The merged IP allow list.
	 */
	public static function merge_brute_force_allow_list( $value, $option ) {
		return self::migrate_brute_force_protection_ip_allow_list( $value );
	}

}
