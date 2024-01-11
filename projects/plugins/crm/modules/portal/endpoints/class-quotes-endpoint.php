<?php
namespace Automattic\JetpackCRM;

if ( ! defined( 'ZEROBSCRM_PATH' ) ) exit;

class Quotes_Endpoint extends Client_Portal_Endpoint {

	public static function register_endpoint( $endpoints, $client_portal ) {
		if ( zeroBSCRM_getSetting( 'feat_quotes' ) > 0 ) {
			$new_endpoint = new Quotes_Endpoint( $client_portal );

			$new_endpoint->portal                       = $client_portal;
			$new_endpoint->slug                         = 'quotes';
			$new_endpoint->name                         = __('Quotes', 'zero-bs-crm');
			$new_endpoint->hide_from_menu               = false;
			$new_endpoint->menu_order                   = 3;
			$new_endpoint->icon                         = 'fa-clipboard';
			$new_endpoint->template_name                = 'quotes.php';
			$new_endpoint->add_rewrite_endpoint         = true;
			$new_endpoint->should_check_user_permission = true;

			$endpoints[] = $new_endpoint;
		}

		return $endpoints;
	}
}
