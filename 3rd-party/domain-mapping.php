<?php

use Automattic\Jetpack\Constants;

/**
 * Class Jetpack_3rd_Party_Domain_Mapping
 *
 * This class contains methods that are used to provide compatibility between Jetpack sync and domain mapping plugins.
 */
class Jetpack_3rd_Party_Domain_Mapping {

	/**
	 * @var Jetpack_3rd_Party_Domain_Mapping
	 **/
	private static $instance = null;

	/**
	 * An array of methods that are used to hook the Jetpack sync filters for home_url and site_url to a mapping plugin.
	 *
	 * @var array
	 */
	static $test_methods = array(
		'hook_wordpress_mu_domain_mapping',
		'hook_wpmu_dev_domain_mapping'
	);

	static function init() {
		if ( is_null( self::$instance ) ) {
			self::$instance = new Jetpack_3rd_Party_Domain_Mapping;
		}

		return self::$instance;
	}

	private function __construct() {
		add_action( 'plugins_loaded', array( $this, 'attempt_to_hook_domain_mapping_plugins' ) );
	}

	/**
	 * This function is called on the plugins_loaded action and will loop through the $test_methods
	 * to try and hook a domain mapping plugin to the Jetpack sync filters for the home_url and site_url callables.
	 */
	function attempt_to_hook_domain_mapping_plugins() {
		if ( ! Constants::is_defined( 'SUNRISE' ) ) {
			return;
		}

		$hooked = false;
		$count = count( self::$test_methods );
		for ( $i = 0; $i < $count && ! $hooked; $i++ ) {
			$hooked = call_user_func( array( $this, self::$test_methods[ $i ] ) );
		}
	}

	/**
	 * This method will test for a constant and function that are known to be used with Donncha's WordPress MU
	 * Domain Mapping plugin. If conditions are met, we hook the domain_mapping_siteurl() function to Jetpack sync
	 * filters for home_url and site_url callables.
	 *
	 * @return bool
	 */
	function hook_wordpress_mu_domain_mapping() {
		if ( ! Constants::is_defined( 'SUNRISE_LOADED' ) || ! $this->function_exists( 'domain_mapping_siteurl' ) ) {
			return false;
		}

		add_filter( 'jetpack_sync_home_url', 'domain_mapping_siteurl' );
		add_filter( 'jetpack_sync_site_url', 'domain_mapping_siteurl' );

		return true;
	}

	/**
	 * This method will test for a class and method known to be used in WPMU Dev's domain mapping plugin. If the
	 * method exists, then we'll hook the swap_to_mapped_url() to our Jetpack sync filters for home_url and site_url.
	 *
	 * @return bool
	 */
	function hook_wpmu_dev_domain_mapping() {
		if ( ! $this->class_exists( 'domain_map' ) || ! $this->method_exists( 'domain_map', 'utils' ) ) {
			return false;
		}

		$utils = $this->get_domain_mapping_utils_instance();
		add_filter( 'jetpack_sync_home_url', array( $utils, 'swap_to_mapped_url' ) );
		add_filter( 'jetpack_sync_site_url', array( $utils, 'swap_to_mapped_url' ) );

		return true;
	}

	/*
	 * Utility Methods
	 *
	 * These methods are very minimal, and in most cases, simply pass on arguments. Why create them you ask?
	 * So that we can test.
	 */

	public function method_exists( $class, $method ) {
		return method_exists( $class, $method );
	}

	public function class_exists( $class ) {
		return class_exists( $class );
	}

	public function function_exists( $function ) {
		return function_exists( $function );
	}

	public function get_domain_mapping_utils_instance() {
		return domain_map::utils();
	}
}

Jetpack_3rd_Party_Domain_Mapping::init();
