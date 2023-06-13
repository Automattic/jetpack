<?php
/**
 * Transaction List
 *
 * The list of transactions made by a user (all statuses)
 *
 * @author 		ZeroBSCRM
 * @package 	Templates/Portal/Transactions
 * @see			https://jetpackcrm.com/kb/
 * @version     3.0
 * 
 */

if ( ! defined( 'ABSPATH' ) ) exit; // Don't allow direct access

global $zbs;
$portal                  = $zbs->modules->portal;
$settings                = $zbs->settings->getAll();
$show_transaction_status = ( isset( $settings['portal_transactions_show_status'] ) && $settings['portal_transactions_show_status'] == '1' );

#} changed to this, so if people want to re-style then can remove_action
do_action( 'zbs_enqueue_scripts_and_styles' );

?>
<div class="alignwide zbs-site-main zbs-portal-grid">
	<nav class="zbs-portal-nav">
	<?php
		if( function_exists( 'zeroBSCRM_clientPortalgetEndpoint' ) ) {
			$tran_endpoint = zeroBSCRM_clientPortalgetEndpoint( 'transactions' );
		} else {
			$tran_endpoint = 'transactions';
		}
		$portal->render->portal_nav( $tran_endpoint );
	?>
	</nav>
	<div class='zbs-portal-content'>
		<?php
			global $zbs;
			$uid   = get_current_user_id();
			$uinfo = get_userdata( $uid );
			$cID   = zeroBS_getCustomerIDWithEmail($uinfo->user_email);

			if ( $cID > 0 || $uinfo->has_cap( 'admin_zerobs_transactions' ) ) {
				// TODO: use pagination while getting from the db.
				$customer_transactions = $zbs->DAL->transactions->getTransactions(
					array(
						'assignedContact' => $cID,
						'withAssigned'    => false,
						'sortByField'     => 'date',
						'sortOrder'       => 'DESC',
						'page'            => 0,
						'perPage'         => 100,
						'ignoreowner'     => true,
					)
				);
				// admin msg (upsell cpp) (checks perms itself, safe to run)
				$portal->render->admin_message();			
				if ( is_array( $customer_transactions ) && count( $customer_transactions ) > 0 ) {
					// titled v3.0
					?><h2><?php esc_html_e( 'Transactions', 'zero-bs-crm' ); ?></h2>
						<div class='zbs-entry-content zbs-responsive-table' style="position:relative;">
						<?php
							echo '<table class="table">';
							echo '<thead>';
							echo '<th>' . esc_html__( 'Transaction', 'zero-bs-crm' ) . '</th>';
							echo '<th>' . esc_html__( 'Transaction Date', 'zero-bs-crm' ) . '</th>';
							echo '<th>' . esc_html__( 'Title', 'zero-bs-crm' ) . '</th>';
							echo '<th>' . esc_html__( 'Total', 'zero-bs-crm' ) . '</th>';
							if ($show_transaction_status) {
								echo '<th>' . esc_html__('Status', 'zero-bs-crm') . '</th>';
							}
							echo '</thead>';
							
							foreach( $customer_transactions as $transaction ) {
								// Transaction Date
								$transaction_date = __( 'No date', 'zero-bs-crm' );
								if ( isset( $transaction['date_date'] ) && ! empty ( $transaction['date_date'] ) ) {
									$transaction_date = $transaction['date_date'];
								}
								// Transaction Ref
								$transaction_ref = '';
								if ( isset($transaction['ref'] ) && ! empty( $transaction['ref'] ) ) {
									$transaction_ref = $transaction['ref'];
								}
								// transactionTitle Title
								// Default value is set to '&nbsp;' to force rendering the cell. The css "empty-cells: show;" doesn't work in this type of table
								$transaction_title = '&nbsp;';
								if ( isset( $transaction['title'] ) && ! empty( $transaction['title'] ) ) {
									$transaction_title = $transaction['title'];
								}
								// Transaction Value
								$transaction_value = '';
								if ( isset( $transaction['total'] ) && ! empty( $transaction['total'] ) ) {
									$transaction_value = zeroBSCRM_formatCurrency( $transaction['total'] );
								}
								// Transaction Status
								$transaction_status = '';
								if ( isset( $transaction['status'] ) && ! empty( $transaction['status'] ) ) {
									$transaction_status = $transaction['status'];
								}

								echo '<tr>';
								echo '<td data-title="' . esc_attr__( 'Transaction', 'zero-bs-crm' ) . '">' . esc_html( $transaction_ref ) . '</td>';
								echo '<td data-title="' . esc_attr__( 'Transaction Date', 'zero-bs-crm' ) . '">' . esc_html( $transaction_date ) . '</td>';
								echo '<td data-title="' . esc_attr__( 'Title', 'zero-bs-crm' ) . '"><span class="name">' . esc_html( $transaction_title ) . '</span></td>';
								echo '<td data-title="' . esc_attr__( 'Total', 'zero-bs-crm' ) . '">' . esc_html( $transaction_value ) . '</td>';
								if ($show_transaction_status) {
									echo '<td data-title="' . esc_attr__( 'Status', 'zero-bs-crm') . '">' . esc_html( $transaction_status ) . '</td>';
								}
								echo '</tr>';
							}
							echo '</table>';
				} else {
					esc_html_e( 'You do not have any transactions yet.', 'zero-bs-crm'); 
				}
			}
			?></div>
    </div>
    <div class="zbs-portal-grid-footer"><?php $portal->render->portal_footer(); ?></div>
</div>
