<?php
namespace Automattic\JetpackCRM;

if ( ! defined( 'ZEROBSCRM_PATH' ) ) exit;

class Dashboard_Endpoint extends Client_Portal_Endpoint {

	public static function register_endpoint( $endpoints, $client_portal ) {
		$new_endpoint = new Dashboard_Endpoint( $client_portal );

		$new_endpoint->portal                       = $client_portal;
		$new_endpoint->slug                         = 'dashboard';
		$new_endpoint->name                         = __('Dashboard', 'zero-bs-crm');
		$new_endpoint->hide_from_menu               = false;
		$new_endpoint->menu_order                   = 0;
		$new_endpoint->icon                         = 'fa-dashboard';
		$new_endpoint->template_name                = 'dashboard.php';
		$new_endpoint->add_rewrite_endpoint         = true;
		$new_endpoint->should_check_user_permission = true;

		$endpoints[] = $new_endpoint;
		return $endpoints;
	}
}
