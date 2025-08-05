<?php
/**
 * Jetpack CRM
 * https://jetpackcrm.com
 *
 * Statement Tab functionality for contacts
 *
 * @package ZeroBSCRM
 */

// stop direct access
if ( ! defined( 'ZEROBSCRM_PATH' ) ) {
	exit( 0 );
}

/**
 * Add statement tab to contact vital tabs
 *
 * @param array $tabs Array of tabs.
 * @param int   $contact_id Contact ID.
 * @param array $contact Contact data.
 * @return array Modified tabs array.
 */
function jpcrm_add_statement_tab_to_contact( $tabs = array(), $contact_id = -1, $contact = array() ) {

	global $zbs;

	// Only add if invoices module is active and contact has invoices
	$feat_invs = zeroBSCRM_getSetting( 'feat_invs' );
	// phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
	$has_invoice = $zbs->DAL->contacts->contactHasInvoice( $contact_id );

	if ( ( $feat_invs === '1' || $feat_invs === 1 ) && $has_invoice ) {

		$tabs[] = array(
			'id'      => 'statement',
			'name'    => __( 'Invoice Statement', 'zero-bs-crm' ),
			'content' => jpcrm_render_statement_tab_content( $contact_id, $contact ),
		);

	}

	return $tabs;
}
add_filter( 'jetpack-crm-contact-vital-tabs', 'jpcrm_add_statement_tab_to_contact', 10, 3 );

/**
 * Render the statement tab content
 *
 * @param int   $contact_id Contact ID.
 * @param array $contact Contact data.
 * @return string HTML content.
 */
function jpcrm_render_statement_tab_content( $contact_id = -1, $contact = array() ) {

	if ( $contact_id <= 0 ) {
		return '';
	}

	// Get contact email for sending
	$contact_email = '';
	if ( isset( $contact['email'] ) ) {
		$contact_email = $contact['email'];
	} else {
		$contact_email = zeroBS_customerEmail( $contact_id );
	}

	// Get statement data
	$statement_data = jpcrm_get_statement_data( $contact_id );

	ob_start();
	?>
	<div class="zbs-statement-tab-content">
		
		<?php if ( $statement_data && ! empty( $statement_data['items'] ) ) : ?>
			
			<!-- Statement Preview -->
			<div class="ui segment">
				<h3><?php esc_html_e( 'Invoice Statement', 'zero-bs-crm' ); ?></h3>
				<p><?php esc_html_e( 'Preview of the statement that would be sent to the contact.', 'zero-bs-crm' ); ?></p>
			</div>
			
			<!-- Statement Content -->
			<div class="ui segment">
				<?php echo wp_kses_post( jpcrm_render_statement_html( $statement_data ) ); ?>
			</div>

			<!-- Statement Actions -->
			<div class="ui segment">
				<div class="ui center aligned basic segment">
					<div class="ui buttons">
						<a href="<?php echo esc_url( admin_url( 'admin-ajax.php?action=zbs_download_statement&cid=' . $contact_id . '&sec=' . wp_create_nonce( 'zbs-download-statement' ) ) ); ?>" class="ui button" target="_blank">
							<i class="download icon"></i> <?php esc_html_e( 'Download PDF', 'zero-bs-crm' ); ?>
						</a>
						<button class="ui button primary" onclick="zbsSendStatement(<?php echo esc_js( $contact_id ); ?>, '<?php echo esc_js( $contact_email ); ?>')">
							<i class="mail icon"></i> <?php esc_html_e( 'Email Statement', 'zero-bs-crm' ); ?>
						</button>
					</div>
				</div>
			</div>

		<?php else : ?>
			
			<!-- No Invoices Message -->
			<div class="ui segment">
				<div class="ui info message">
					<i class="info circle icon"></i>
					<?php esc_html_e( 'No invoices found for this contact.', 'zero-bs-crm' ); ?>
				</div>
			</div>

		<?php endif; ?>

	</div>

	<script type="text/javascript">
	function zbsSendStatement(cid, email) {
		// Use the existing send statement modal
		swal({
			title: '<i class="envelope outline icon"></i> ' + zeroBSCRMJS_globViewLang('sendstatement'),
			html: '<div style="font-size: 1.2em;padding: 0.3em;">' +
				zeroBSCRMJS_globViewLang('sendstatementaddr') +
				'<br /><div class="ui input"><input type="text" name="zbs-send-pdf-statement-to-email" id="zbs-send-pdf-statement-to-email" value="' +
				email +
				'" placeholder="' +
				zeroBSCRMJS_globViewLang('enteremail') +
				'" readonly style="background-color: #f9f9f9; color: #666;" /></div></div>',
			type: '',
			showCancelButton: true,
			confirmButtonColor: '#000',
			cancelButtonColor: '#fff',
			cancelButtonText: '<span style="color: #000">' + zeroBSCRMJS_globViewLang('cancel') + '</span>',
			confirmButtonText: zeroBSCRMJS_globViewLang('send'),
		}).then(function(result) {
			if (result.value) {
				var data = {
					action: 'zbs_invoice_send_statement',
					sec: window.zbs_root.zbsnonce,
					cid: cid,
					em: email,
				};
				jQuery.ajax({
					type: 'POST',
					url: ajaxurl,
					data: data,
					dataType: 'json',
					timeout: 20000,
					success: function() {
						swal(
							zeroBSCRMJS_globViewLang('sent'),
							zeroBSCRMJS_globViewLang('statementsent'),
							'success'
						);
					},
					error: function() {
						swal(
							zeroBSCRMJS_globViewLang('notsent'),
							zeroBSCRMJS_globViewLang('statementnotsent'),
							'warning'
						);
					},
				});
			}
		});
	}
	</script>
	<?php
	return ob_get_clean();
}

/**
 * Render statement HTML
 *
 * @param array $statement_data Statement data array.
 * @return string HTML output.
 */
function jpcrm_render_statement_html( $statement_data ) {

	$html = '';

	// Header
	$html .= '<div class="ui two column stackable grid">';
	$html .= '<div class="column">';
	$html .= '<div class="ui segment">';
	$html .= '<h4 class="ui header">' . esc_html( $statement_data['contact']['name'] ) . '</h4>';
	if ( ! empty( $statement_data['contact']['address'] ) ) {
		$html .= '<p>' . wp_kses_post( implode( '<br>', $statement_data['contact']['address'] ) ) . '</p>';
	}
	$html .= '</div>';
	$html .= '</div>';
	$html .= '<div class="column">';
	$html .= '<div class="ui segment">';
	$html .= '<h4 class="ui header">' . esc_html( $statement_data['business']['name'] ) . '</h4>';
	if ( ! empty( $statement_data['business']['address'] ) ) {
		$html .= '<p>' . wp_kses_post( implode( '<br>', $statement_data['business']['address'] ) ) . '</p>';
	}
	$html .= '<p><strong>' . esc_html__( 'Statement Date', 'zero-bs-crm' ) . ':</strong> ' . esc_html( $statement_data['statement_date'] ) . '</p>';
	$html .= '</div>';
	$html .= '</div>';
	$html .= '</div>';

	// Statement table
	if ( ! empty( $statement_data['items'] ) ) {
		$html .= '<div class="ui segment">';
		$html .= '<table class="ui celled table">';
		$html .= '<thead><tr>';
		$html .= '<th>' . esc_html__( 'Date', 'zero-bs-crm' ) . '</th>';
		$html .= '<th>' . esc_html__( 'Reference', 'zero-bs-crm' ) . '</th>';
		$html .= '<th>' . esc_html__( 'Due Date', 'zero-bs-crm' ) . '</th>';
		$html .= '<th class="right aligned">' . esc_html__( 'Amount', 'zero-bs-crm' ) . '</th>';
		$html .= '<th class="right aligned">' . esc_html__( 'Payments', 'zero-bs-crm' ) . '</th>';
		$html .= '<th class="right aligned">' . esc_html__( 'Balance', 'zero-bs-crm' ) . '</th>';
		$html .= '</tr></thead>';
		$html .= '<tbody>';

		foreach ( $statement_data['items'] as $item ) {
			$html .= '<tr>';
			$html .= '<td>' . esc_html( $item['date'] ) . '</td>';
			$html .= '<td>' . esc_html( $item['reference'] ) . '</td>';
			$html .= '<td>' . esc_html( $item['due_date'] ) . '</td>';
			$html .= '<td class="right aligned">' . zeroBSCRM_formatCurrency( $item['amount'] ) . '</td>';
			$html .= '<td class="right aligned">' . zeroBSCRM_formatCurrency( $item['payments'] ) . '</td>';
			$html .= '<td class="right aligned">' . zeroBSCRM_formatCurrency( $item['balance'] ) . '</td>';
			$html .= '</tr>';
		}

		$html .= '</tbody>';
		$html .= '</table>';
		$html .= '</div>';

		// Total balance due
		$html .= '<div class="ui segment">';
		$html .= '<div class="ui grid">';
		$html .= '<div class="sixteen wide column right aligned">';
		$html .= '<h3 class="ui header">' . esc_html__( 'BALANCE DUE', 'zero-bs-crm' ) . ': ' . zeroBSCRM_formatCurrency( $statement_data['total_balance_due'] ) . '</h3>';
		$html .= '</div>';
		$html .= '</div>';
		$html .= '</div>';
	}

	return $html;
}

/**
 * AJAX handler for downloading statement
 */
function jpcrm_ajax_download_statement() {

	// Check nonce
	check_ajax_referer( 'zbs-download-statement', 'sec' );

	// Check permissions
	if ( ! zeroBSCRM_permsInvoices() ) {
		wp_die( esc_html__( 'Insufficient permissions', 'zero-bs-crm' ) );
	}

	$contact_id = isset( $_GET['cid'] ) ? (int) $_GET['cid'] : 0;

	if ( $contact_id <= 0 ) {
		wp_die( esc_html__( 'Invalid contact ID', 'zero-bs-crm' ) );
	}

	// Generate and download the statement
	zeroBSCRM_invoicing_generateStatementPDF( $contact_id, true );

	exit;
}
add_action( 'wp_ajax_zbs_download_statement', 'jpcrm_ajax_download_statement' );

/**
 * Get statement data for a contact
 *
 * @param int $contact_id Contact ID.
 * @return array|false Statement data array or false on failure.
 */
function jpcrm_get_statement_data( $contact_id ) {

	global $zbs;

	if ( $contact_id <= 0 ) {
		return false;
	}

	// Get contact details
	// phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
	$contact = $zbs->DAL->contacts->getContact(
		$contact_id,
		array(
			'withCustomFields' => true,
			'withQuotes'       => false,
			'withInvoices'     => false,
			'withTransactions' => false,
			'withLogs'         => false,
			'withLastLog'      => false,
			'withTags'         => false,
			'withCompanies'    => false,
			'withOwner'        => false,
			'withValues'       => false,
		)
	);

	if ( ! $contact ) {
		return false;
	}

	// Get invoices for this contact
	// phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
	$invoices = $zbs->DAL->invoices->getInvoices(
		array(
			'assignedContact'  => $contact_id,
			'assignedCompany'  => false,
			'withLineItems'    => true,
			'withCustomFields' => true,
			'withTransactions' => true,
			'withTags'         => false,
			'sortByField'      => 'ID',
			'sortOrder'        => 'ASC',
		)
	);

	// Get business info
	$business_name    = zeroBSCRM_getSetting( 'businessname' );
	$business_address = array();
	$address_fields   = array( 'addr1', 'addr2', 'city', 'county', 'postcode' );
	foreach ( $address_fields as $field ) {
		$value = zeroBSCRM_getSetting( 'business' . $field );
		if ( ! empty( $value ) ) {
			$business_address[] = $value;
		}
	}

	// Process invoices and calculate totals
	$statement_items   = array();
	$total_balance_due = 0;

	if ( is_array( $invoices ) ) {
		foreach ( $invoices as $invoice ) {
			$total    = isset( $invoice['total'] ) ? (float) $invoice['total'] : 0;
			$payments = 0;
			$balance  = $total;

			// Calculate payments based on transaction status settings
			if ( isset( $invoice['transactions'] ) && is_array( $invoice['transactions'] ) ) {
				// phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
				$transaction_statuses_to_include = $zbs->DAL->transactions->getTransactionStatusesToInclude();

				foreach ( $invoice['transactions'] as $transaction ) {
					$should_include_transaction = false;

					if ( $transaction_statuses_to_include === 'all' ) {
						$should_include_transaction = true;
					} elseif ( is_array( $transaction_statuses_to_include ) && isset( $transaction['status'] ) ) {
						$should_include_transaction = in_array( $transaction['status'], $transaction_statuses_to_include, true );
					}

					// Only process transactions that are completed (status_bool = 1) AND have the correct status
					if ( isset( $transaction['status_bool'] ) && $transaction['status_bool'] === 1 &&
						isset( $transaction['total'] ) && $transaction['total'] > 0 && $should_include_transaction ) {

						if ( $transaction['type_accounting'] === 'credit' ) {
							$balance  += $transaction['total'];
							$payments += $transaction['total'];
						} else {
							$balance  -= $transaction['total'];
							$payments += $transaction['total'];
						}
					}
				}
			}

			// If invoice is marked as paid, we should still respect transaction status settings
			// Only override if we have no valid transactions or all transactions are excluded
			if ( isset( $invoice['status'] ) && $invoice['status'] === 'Paid' ) {
				// If we have no valid transactions (payments = 0), then assume fully paid
				if ( $payments === 0 ) {
					$balance  = 0;
					$payments = $total;
				}
				// Otherwise use the calculated payments and balance from valid transactions
			}

			$statement_items[] = array(
				'date'      => isset( $invoice['date_date'] ) ? $invoice['date_date'] : '',
				'reference' => isset( $invoice['id_override'] ) && ! empty( $invoice['id_override'] ) ? $invoice['id_override'] : $invoice['id'],
				'due_date'  => isset( $invoice['due_date'] ) && $invoice['due_date'] > 0 ? $invoice['due_date_date'] : __( 'No due date', 'zero-bs-crm' ),
				'amount'    => $total,
				'payments'  => $payments,
				'balance'   => $balance,
			);

			if ( $balance > 0 ) {
				$total_balance_due += $balance;
			}
		}
	}

	return array(
		'contact'           => array(
			'name'    => trim( $contact['fname'] . ' ' . $contact['lname'] ),
			'address' => array_filter(
				array(
					$contact['addr1'],
					$contact['addr2'],
					$contact['city'],
					$contact['county'],
					$contact['postcode'],
				)
			),
		),
		'business'          => array(
			'name'    => $business_name,
			'address' => $business_address,
		),
		'statement_date'    => zeroBSCRM_locale_utsToDate( time() ),
		'items'             => $statement_items,
		'total_balance_due' => $total_balance_due,
	);
}
