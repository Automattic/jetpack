<?php
namespace Automattic\JetpackCRM;

if ( ! defined( 'ZEROBSCRM_PATH' ) ) exit;

class Transactions_Endpoint extends Client_Portal_Endpoint {

	public static function register_endpoint( $endpoints, $client_portal ) {
		if ( zeroBSCRM_getSetting( 'feat_transactions' ) > 0 ) {
			$new_endpoint = new Transactions_Endpoint( $client_portal );

			$new_endpoint->portal                       = $client_portal;
			$new_endpoint->slug                         = 'transactions';
			$new_endpoint->name                         = __('Transactions', 'zero-bs-crm');
			$new_endpoint->hide_from_menu               = false;
			$new_endpoint->menu_order                   = 4;
			$new_endpoint->icon                         = 'fa-shopping-cart';
			$new_endpoint->template_name                = 'transactions.php';
			$new_endpoint->add_rewrite_endpoint         = true;
			$new_endpoint->should_check_user_permission = true;

			$endpoints[] = $new_endpoint;
		}
		return $endpoints;
	}

}
