<?php

if ( Jetpack_Constants::is_defined( 'SUNRISE' ) ) :
	function jetpack_domain_mapping_check_compatible_plugins() {
		// Once we've satisfied a condition for adding domain mapping compatibility, then bail
		$hooked = jetpack_domain_mapping_maybe_support_wordpress_mu_domain_mapping();

		if ( ! $hooked ) {
			jetpack_domain_mapping_maybe_add_wpmu_dev_domain_mapping_support();
		}
	}
	add_action( 'plugins_loaded', 'jetpack_domain_mapping_compatibility' );

	// Compatibility with Donncha's WordPress MU Domain Mapping plugin
	function jetpack_domain_mapping_maybe_support_wordpress_mu_domain_mapping() {
		if ( ! Jetpack_Constants::is_defined( 'DOMAIN_MAPPING' ) || function_exists( 'domain_mapping_siteurl' ) ) {
			return false;
		}

		add_filter( 'jetpack_sync_home_url', 'domain_mapping_siteurl' );
		add_filter( 'jetpack_sync_site_url', 'domain_mapping_siteurl' );

		return true;
	}


	// Compatibility with WPMU DEV's Domain Mapping plugin
	function jetpack_domain_mapping_maybe_add_wpmu_dev_domain_mapping_support() {
		if ( ! class_exists( 'domain_map' ) || ! method_exists( 'domain_map', 'utils' ) ) {
			return false;
		}

		$utils = domain_map::utils();
		add_filter( 'jetpack_sync_home_url', array( $utils, 'swap_to_mapped_url' ) );
		add_filter( 'jetpack_sync_site_url', array( $utils, 'swap_to_mapped_url' ) );
	}
endif;