<?php
namespace Automattic\JetpackCRM;

if ( ! defined( 'ZEROBSCRM_PATH' ) ) exit;

class Invoices_Endpoint extends Client_Portal_Endpoint {

	public static function register_endpoint( $endpoints, $client_portal ) {
		if ( zeroBSCRM_getSetting( 'feat_invs' ) > 0 ) {
			$new_endpoint = new Invoices_Endpoint( $client_portal );

			$new_endpoint->portal                       = $client_portal;
			$new_endpoint->slug                         = $client_portal->get_endpoint( ZBS_TYPE_INVOICE );
			$new_endpoint->name                         = __('Invoices', 'zero-bs-crm');
			$new_endpoint->hide_from_menu               = false;
			$new_endpoint->menu_order                   = 2;
			$new_endpoint->icon                         = 'fa-file-text-o';
			$new_endpoint->add_rewrite_endpoint         = true;

			$endpoints[] = $new_endpoint;
		}

		return $endpoints;
	}

	// Handle dual-mode endpoint properties invoices vs. single invoice
	public function before_endpoint_actions() {

		// We should call invoices if no param is given, single invoice otherwise
		if ( empty( $this->param_value ) ) {
			$this->template_name                = 'invoices.php';
			$this->should_check_user_permission = true;
		} else {
			global $zbs;

			$this->template_name                = 'single-invoice.php';
			$this->should_check_user_permission = $zbs->settings->get( 'easyaccesslinks' ) === 0;
		}

	}

	/**
	 * Single Endpoint rendering function
	 */
	function single_invoice_html_output( $invoice_id = -1, $invoice_hash = '' ) {
		echo zeroBSCRM_invoice_generatePortalInvoiceHTML( $invoice_id, $invoice_hash  );
	}

	#} New functions here. Used as NAMED in WooSync. Please do not rename and not tell me as need to update WooSync if so
	#} 1. The invoice list function 
	/**
	* 
	* @param $link and $endpoint as they will differ between Portal and WooCommerce My Account
	* 
	*/
	function list_invoices_html_output($link = '', $endpoint = ''){
		global $wpdb;

		$uid = get_current_user_id();
		$uinfo = get_userdata( $uid );
		$cID = zeroBS_getCustomerIDWithEmail($uinfo->user_email);
		$is_invoice_admin = $uinfo->has_cap( 'admin_zerobs_invoices' );

		// if the current is a valid contact or a WP user with permissions to view invoices...
		if( $cID > 0 || $is_invoice_admin ){

			// this allows the current admin to see all invoices even if they're a contact
			if ( $is_invoice_admin ) {
				$cID = -1;
				$this->portal->render->portal_viewing_as_admin_banner( __( 'Admins will see all invoices below, but clients will only see invoices assigned to them.', 'zero-bs-crm' ) );
			}

			// get invoices
			$customer_invoices = zeroBS_getInvoicesForCustomer($cID,true,100,0,false);

			// if there are more than zero invoices...
			if(count($customer_invoices) > 0){

				global $zbs;
				?><?php

				// capture output buffer: this isn't ideal but since other extensions modify this table with existing hooks, it's the best we can do.
				ob_start();
				foreach($customer_invoices as $cinv){

					//invstatus check
					$inv_status = $cinv['status'];

					// id
					$idStr = '#'.$cinv['id'];
					if (isset($cinv['id_override']) && !empty($cinv['id_override'])) $idStr = $cinv['id_override'];

					// skip drafts if not an admin with invoice access
					if ( $inv_status === 'Draft' && ! $is_invoice_admin ) { // phpcs:ignore Generic.WhiteSpace.ScopeIndent.IncorrectExact
						continue;
					}

					if (!isset($cinv['due_date']) || empty($cinv['due_date']) || $cinv['due_date'] == -1)
						//no due date;
						$due_date_str = __("No due date", "zero-bs-crm");
					else
						$due_date_str = $cinv['due_date_date'];
					
					// view on portal (hashed?)
					$invoiceURL = zeroBSCRM_portal_linkObj($cinv['id'],ZBS_TYPE_INVOICE); //zeroBS_portal_link('invoices',$invoiceID);

					$idLinkStart = ''; $idLinkEnd = '';
					if (!empty($invoiceURL)){
						$idLinkStart = '<a href="'. $invoiceURL .'">'; $idLinkEnd = '</a>';
					}

					echo '<tr>';
						echo '<td data-title="' . esc_attr( $zbs->settings->get('reflabel') ) . '">'. $idLinkStart . esc_html( $idStr ) . ' '. esc_html__('(view)', 'zero-bs-crm') . $idLinkEnd.'</td>';
						echo '<td data-title="' . esc_attr__('Date',"zero-bs-crm") . '">' . esc_html( $cinv['date_date'] ) . '</td>';
						echo '<td data-title="' . esc_attr__('Due date',"zero-bs-crm") . '">' . esc_html( $due_date_str ) . '</td>';
						echo '<td data-title="' . esc_attr__('Total',"zero-bs-crm") . '">' . esc_html( zeroBSCRM_formatCurrency($cinv['total']) ) . '</td>';
						echo '<td data-title="' . esc_attr__('Status',"zero-bs-crm") . '"><span class="status '. esc_attr( $inv_status ) .'">' . esc_html( $cinv['status'] ) . '</span></td>';

						do_action('zbs-extra-invoice-body-table', $cinv['id']);

					//	echo '<td class="tools"><a href="account/invoices/274119/pdf" class="pdf_download" target="_blank"><i class="fa fa-file-pdf-o"></i></a></td>';
					echo '</tr>';
				}
				$invoices_to_show = ob_get_contents();
				ob_end_clean();

				if ( !empty( $invoices_to_show ) ) {
					// there are invoices to show to this user, so build table
					echo '<table class="table zbs-invoice-list">';
						echo '<thead>';
							echo '<th>' . esc_html( $zbs->settings->get('reflabel') ) . '</th>';
							echo '<th>' . esc_html__('Date','zero-bs-crm') . '</th>';
							echo '<th>' . esc_html__('Due date','zero-bs-crm') . '</th>';
							echo '<th>' . esc_html__('Total','zero-bs-crm') . '</th>';
							echo '<th>' . esc_html__('Status','zero-bs-crm') . '</th>';
							do_action('zbs-extra-invoice-header-table');
						echo '</thead>';
						echo $invoices_to_show;
					echo '</table>';
				}
				else {
					// no invoices to show...might have drafts but no admin perms
					esc_html_e( 'You do not have any invoices yet.', 'zero-bs-crm' );
				}
			}else{
				// invoice object count for current user is 0
				esc_html_e( 'You do not have any invoices yet.', 'zero-bs-crm' );
			}
		}else{
			// not a valid contact or invoice admin user
			esc_html_e( 'You do not have any invoices yet.', 'zero-bs-crm' );
		}
	} 
}
