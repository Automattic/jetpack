<?php
namespace Automattic\JetpackCRM;

if ( ! defined( 'ZEROBSCRM_PATH' ) ) exit;

class Cancel_Endpoint extends Client_Portal_Endpoint {

	public static function register_endpoint( $endpoints, $client_portal ) {
		$new_endpoint = new Cancel_Endpoint( $client_portal );

		$new_endpoint->portal                       = $client_portal;
		$new_endpoint->slug                         = 'cancel';
		$new_endpoint->name                         = __('Payment Cancelled', 'zero-bs-crm');
		$new_endpoint->hide_from_menu               = true;
		$new_endpoint->template_name                = 'cancelled.php';
		$new_endpoint->add_rewrite_endpoint         = true;
		$new_endpoint->should_check_user_permission = false;
		$new_endpoint->hide_from_settings_page      = true;

		$endpoints[] = $new_endpoint;
		return $endpoints;
	}
}
