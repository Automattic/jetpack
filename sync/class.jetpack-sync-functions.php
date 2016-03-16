<?php

class Jetpack_Sync_Functions {

	static $check_sum_id = 'function_check_sum';

	static function get_all() {
		$data['wp_version']                   = Jetpack::get_wp_version();
		$data['wp_max_upload_size']           = wp_max_upload_size();
		$data['featured_images_enabled']      = Jetpack::featured_images_enabled();
		$data['updates']                      = Jetpack::get_updates();
		$data['update_details']               = Jetpack::get_update_details();
		$data['is_main_network']              = Jetpack::is_multi_network();
		$data['is_multi_site']                = is_multisite();
		$data['main_network_site']            = network_site_url();
		$data['single_user_site']             = Jetpack::is_single_user_site();
		$data['has_file_system_write_access'] = Jetpack::file_system_write_access();
		$data['is_version_controlled']        = Jetpack::is_version_controlled();
		$data['content_width']                = Jetpack::get_content_width();

		if ( is_multisite() ) {
			$data['network_name']                        = Jetpack::network_name();
			$data['network_allow_new_registrations']     = Jetpack::network_allow_new_registrations();
			$data['network_add_new_users']               = Jetpack::network_add_new_users();
			$data['network_site_upload_space']           = Jetpack::network_site_upload_space();
			$data['network_upload_file_types']           = Jetpack::network_upload_file_types();
			$data['network_enable_administration_menus'] = Jetpack::network_enable_administration_menus();
		}
	}
}
