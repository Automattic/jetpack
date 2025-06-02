<?php // phpcs:ignore Squiz.Commenting.FileComment.Missing
namespace Automattic\JetpackCRM;

defined( 'ZEROBSCRM_PATH' ) || exit( 0 );

/**
 * Payments endpoint
 */
class Payments_Endpoint extends Client_Portal_Endpoint {

	public static function register_endpoint( $endpoints, $client_portal ) { // phpcs:ignore Squiz.Commenting.FunctionComment.Missing
		$new_endpoint = new Payments_Endpoint( $client_portal );

		$new_endpoint->portal                       = $client_portal;
		$new_endpoint->slug                         = 'pn';
		$new_endpoint->name                         = __( 'Payments', 'zero-bs-crm' );
		$new_endpoint->hide_from_menu               = true;
		$new_endpoint->add_rewrite_endpoint         = true;
		$new_endpoint->should_check_user_permission = true;
		$new_endpoint->hide_from_settings_page      = true;

		$endpoints[] = $new_endpoint;
		return $endpoints;
	}

	public function pre_content_action() { // phpcs:ignore Squiz.Commenting.FunctionComment.Missing
		// Tnis is the legacy name.
		do_action( 'zerobscrm_portal_pn' );
		// And adding the new name as post-action (this one should be used with new payments.
		do_action( 'jpcrm_portal_payment' );
	}
}
