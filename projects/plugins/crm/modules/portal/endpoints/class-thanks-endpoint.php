<?php
namespace Automattic\JetpackCRM;

if ( ! defined( 'ZEROBSCRM_PATH' ) ) exit;

class Thanks_Endpoint extends Client_Portal_Endpoint {

	public static function register_endpoint( $endpoints, $client_portal ) {
		$new_endpoint = new Thanks_Endpoint( $client_portal );

		$new_endpoint->portal                       = $client_portal;
		$new_endpoint->slug                         = 'thanks';
		$new_endpoint->name                         = __('Thank you', 'zero-bs-crm');
		$new_endpoint->hide_from_menu               = true;
		$new_endpoint->template_name                = 'thank-you.php';
		$new_endpoint->add_rewrite_endpoint         = true;
		$new_endpoint->should_check_user_permission = false;
		$new_endpoint->hide_from_settings_page      = true;

		$endpoints[] = $new_endpoint;
		return $endpoints;
	}
}
