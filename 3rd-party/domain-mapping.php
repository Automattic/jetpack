<?php

if ( Jetpack_Constants::is_defined( 'SUNRISE' ) ) :

	/**
	 * Class Jetpack_3rd_Party_Domain_Mapping
	 *
	 * This class contains methods that are used to provide compatibility between Jetpack sync and domain mapping plugins.
	 */
	class Jetpack_3rd_Party_Domain_Mapping {

		/**
		 * This method will test for a constant and function that are known to be used with Donncha's WordPress MU
		 * Domain Mapping plugin. If conditions are met, we hook the domain_mapping_siteurl() function to Jetpack sync
		 * filters for home_url and site_url callables.
		 *
		 * @return bool
		 */
		static function hook_wordpress_mu_domain_mapping() {
			if ( ! Jetpack_Constants::is_defined( 'DOMAIN_MAPPING' ) || function_exists( 'domain_mapping_siteurl' ) ) {
				return false;
			}

			add_filter( 'jetpack_sync_home_url', 'domain_mapping_siteurl' );
			add_filter( 'jetpack_sync_site_url', 'domain_mapping_siteurl' );

			return true;
		}

		/**
		 * This method will test for a class and method known to be used in WPMU Dev's domain mapping plugin. If the
		 * method exists, then we'll hook the swap_to_mapped_url() to our Jetpack sync fitlers for home_url and site_url.
		 *
		 * @return bool
		 */
		static function hook_wpmu_dev_domain_mapping() {
			if ( ! class_exists( 'domain_map' ) || ! method_exists( 'domain_map', 'utils' ) ) {
				return false;
			}

			$utils = domain_map::utils();
			add_filter( 'jetpack_sync_home_url', array( $utils, 'swap_to_mapped_url' ) );
			add_filter( 'jetpack_sync_site_url', array( $utils, 'swap_to_mapped_url' ) );

			return true;
		}
	}

	/**
	 * This function is called on the plugins_loaded action and will loop through the methods of
	 * Jetpack_3rd_Party_Domain_Mapping to try and hook a domain mapping plugin to the Jetpack sync
	 * filters for the home_url and site_url callables.
	 */
	function jetpack_domain_mapping_hook_compatible_plugins() {
		$methods = get_class_methods( 'Jetpack_3rd_Party_Domain_Mapping' );
		do {
			$method = array_pop( $methods );
			$hooked = call_user_func( 'Jetpack_3rd_Party_Domain_Mapping', $method );
		} while( ! $hooked && ! empty( $methods ) );
	}
	add_action( 'plugins_loaded', 'jetpack_domain_mapping_hook_compatible_plugins' );
endif;
