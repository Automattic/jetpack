<?php
/**
 * Jetpack CRM
 * https://jetpackcrm.com
 *
 * Statement Tab functionality for contacts
 *
 * @package ZeroBSCRM
 */

// Stop direct access.
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

	// Only add if invoices module is active and contact has invoices.
	$feat_invs = zeroBSCRM_getSetting( 'feat_invs' );
	// phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
	$has_invoice = $zbs->DAL->contacts->contactHasInvoice( $contact_id );

	if ( ( '1' === $feat_invs || 1 === $feat_invs ) && $has_invoice ) {

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

	// Get contact email for sending.
	$contact_email = '';
	if ( isset( $contact['email'] ) ) {
		$contact_email = $contact['email'];
	} else {
		$contact_email = zeroBS_customerEmail( $contact_id );
	}

	// Get statement data.
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
						<button class="ui button primary" onclick="zbsSendStatement(<?php echo (int) $contact_id; ?>, '<?php echo esc_js( $contact_email ); ?>')">
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
				'" style="width: 100%;" /></div></div>',
			type: '',
			showCancelButton: true,
			confirmButtonColor: '#000',
			cancelButtonColor: '#fff',
			cancelButtonText: '<span style="color: #000">' + zeroBSCRMJS_globViewLang('cancel') + '</span>',
			confirmButtonText: zeroBSCRMJS_globViewLang('send'),
		}).then(function(result) {
			if (result.value) {
				// Get the email from the input field
				var emailToSend = jQuery('#zbs-send-pdf-statement-to-email').val();
				var data = {
					action: 'zbs_invoice_send_statement',
					sec: window.zbs_root.zbsnonce,
					cid: cid,
					em: emailToSend,
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
							zeroBSCRMJS_globViewLang('statementsent') + ' ' + emailToSend,
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

	// Header.
	$html .= '<div class="ui two column stackable grid">';
	$html .= '<div class="column">';
	$html .= '<div class="ui segment">';
	if ( ! empty( $statement_data['contact']['name'] ) ) {
		$html .= '<h4 class="ui header">' . esc_html( $statement_data['contact']['name'] ) . '</h4>';
	}
	if ( ! empty( $statement_data['contact']['address'] ) ) {
		$html .= '<p>' . wp_kses_post( implode( '<br>', $statement_data['contact']['address'] ) ) . '</p>';
	}
	$html .= '</div></div>';
	$html .= '<div class="column">';
	$html .= '<div class="ui segment">';
	if ( ! empty( $statement_data['business']['name'] ) ) {
		$html .= '<h4 class="ui header">' . esc_html( $statement_data['business']['name'] ) . '</h4>';
	}
	if ( ! empty( $statement_data['business']['address'] ) ) {
		$html .= '<p>' . wp_kses_post( implode( '<br>', $statement_data['business']['address'] ) ) . '</p>';
	}
	$html .= '<p><strong>' . esc_html__( 'Statement Date', 'zero-bs-crm' ) . ':</strong> ' . esc_html( $statement_data['statement_date'] ) . '</p>';
	$html .= '</div></div></div>';

	// Statement table.
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

		// Total balance due.
		$html .= '<div class="ui segment">';
		$html .= '<div class="ui grid">';
		$html .= '<div class="sixteen wide column right aligned">';
		$html .= '<h3 class="ui header">' . esc_html__( 'BALANCE DUE', 'zero-bs-crm' ) . ': ' . zeroBSCRM_formatCurrency( $statement_data['total_balance_due'] ) . '</h3>';
		$html .= '</div></div></div>';
	}

	return $html;
}

/**
 * AJAX handler for downloading statement
 *
 * @return never Function exits via wp_die/exit and never returns.
 */
function jpcrm_ajax_download_statement() {

	// Check nonce.
	check_ajax_referer( 'zbs-download-statement', 'sec' );

	// Check permissions.
	if ( ! zeroBSCRM_permsInvoices() ) {
		wp_die( esc_html__( 'Insufficient permissions', 'zero-bs-crm' ) );
	}

	$contact_id = isset( $_GET['cid'] ) ? (int) $_GET['cid'] : 0;

	if ( $contact_id <= 0 ) {
		wp_die( esc_html__( 'Invalid contact ID', 'zero-bs-crm' ) );
	}

	// Generate and download the statement.
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

	// Get contact details.
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

	// Get invoices for this contact.
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

	// Get business info.
	$business_name    = zeroBSCRM_getSetting( 'businessname' );
	$business_address = array();
	$address_fields   = array( 'addr1', 'addr2', 'city', 'county', 'postcode' );
	foreach ( $address_fields as $field ) {
		$value = zeroBSCRM_getSetting( 'business' . $field );
		if ( ! empty( $value ) ) {
			$business_address[] = $value;
		}
	}

	// Process invoices and calculate totals.
	$statement_items   = array();
	$total_balance_due = 0;

	if ( is_array( $invoices ) ) {
		foreach ( $invoices as $invoice ) {
			$total    = isset( $invoice['total'] ) ? (float) $invoice['total'] : 0;
			$payments = 0;
			$balance  = $total;

			// Calculate payments based on transaction status settings.
			if ( isset( $invoice['transactions'] ) && is_array( $invoice['transactions'] ) ) {
				// phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
				$transaction_statuses_to_include = $zbs->DAL->transactions->getTransactionStatusesToInclude();

				foreach ( $invoice['transactions'] as $transaction ) {
					$should_include_transaction = false;

					if ( 'all' === $transaction_statuses_to_include ) {
						$should_include_transaction = true;
					} elseif ( is_array( $transaction_statuses_to_include ) && isset( $transaction['status'] ) ) {
						$should_include_transaction = in_array( $transaction['status'], $transaction_statuses_to_include, true );
					}

					// Only process transactions that are completed (status_bool = 1) AND have the correct status.
					if ( isset( $transaction['status_bool'] ) && 1 === $transaction['status_bool'] &&
						isset( $transaction['total'] ) && 0 < $transaction['total'] && $should_include_transaction ) {

						if ( 'credit' === $transaction['type_accounting'] ) {
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
			// Only override if we have no valid transactions or all transactions are excluded.
			if ( isset( $invoice['status'] ) && 'Paid' === $invoice['status'] ) {
				// If we have no valid transactions (payments = 0), then assume fully paid.
				if ( 0 === $payments ) {
					$balance  = 0;
					$payments = $total;
				}
				// Otherwise use the calculated payments and balance from valid transactions.
			}

			$statement_items[] = array(
				'date'      => $invoice['date_date'] ?? '',
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

/**
 * Add statement tab to company vital tabs
 *
 * @param array $tabs Array of tabs.
 * @param int   $company_id Company ID.
 * @param array $company Company data.
 * @return array Modified tabs array.
 */
function jpcrm_add_statement_tab_to_company( $tabs = array(), $company_id = -1, $company = array() ) {

	// Only add if invoices module is active and company has invoices.
	$feat_invs = zeroBSCRM_getSetting( 'feat_invs' );

	// Check if company has invoices by looking at the invoices_count.
	$has_invoice = false;
	if ( isset( $company['invoices_count'] ) && 0 < $company['invoices_count'] ) {
		$has_invoice = true;
	}

	if ( ( '1' === $feat_invs || 1 === $feat_invs ) && $has_invoice ) {

		$tabs[] = array(
			'id'      => 'statement',
			'name'    => __( 'Invoice Statement', 'zero-bs-crm' ),
			'content' => jpcrm_render_company_statement_tab_content( $company_id, $company ),
		);

	}

	return $tabs;
}
add_filter( 'jetpack-crm-company-vital-tabs', 'jpcrm_add_statement_tab_to_company', 10, 3 );

/**
 * Render the company statement tab content
 *
 * @param int   $company_id Company ID.
 * @param array $company Company data.
 * @return string HTML content.
 */
function jpcrm_render_company_statement_tab_content( $company_id = -1, $company = array() ) {

	if ( $company_id <= 0 ) {
		return '';
	}

	// Get company email for sending.
	$company_email = '';
	if ( isset( $company['email'] ) ) {
		$company_email = $company['email'];
	} else {
		$company_email = zeroBS_companyEmail( $company_id );
	}

	// Get statement data.
	$statement_data = jpcrm_get_company_statement_data( $company_id );

	ob_start();
	?>
	<div class="zbs-statement-tab-content">
		
		<?php if ( $statement_data && ! empty( $statement_data['items'] ) ) : ?>
			
			<!-- Statement Preview -->
			<div class="ui segment">
				<h3><?php esc_html_e( 'Invoice Statement', 'zero-bs-crm' ); ?></h3>
				<p><?php esc_html_e( 'Preview of the statement that would be sent to the company.', 'zero-bs-crm' ); ?></p>
			</div>
			
			<!-- Statement Content -->
			<div class="ui segment">
				<?php echo wp_kses_post( jpcrm_render_company_statement_html( $statement_data ) ); ?>
			</div>

			<!-- Statement Actions -->
			<div class="ui segment">
				<div class="ui center aligned basic segment">
					<div class="ui buttons">
						<a href="<?php echo esc_url( admin_url( 'admin-ajax.php?action=zbs_download_company_statement&cid=' . $company_id . '&sec=' . wp_create_nonce( 'zbs-download-company-statement' ) ) ); ?>" class="ui button" target="_blank">
							<i class="download icon"></i> <?php esc_html_e( 'Download PDF', 'zero-bs-crm' ); ?>
						</a>
						<button class="ui button primary" onclick="zbsSendCompanyStatement(<?php echo (int) $company_id; ?>, '<?php echo esc_js( $company_email ); ?>')">
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
					<?php esc_html_e( 'No invoices found for this company.', 'zero-bs-crm' ); ?>
				</div>
			</div>

		<?php endif; ?>

	</div>

	<script type="text/javascript">
	function zbsSendCompanyStatement(cid, email) {
		// Use the existing send statement modal
		swal({
			title: '<i class="envelope outline icon"></i> ' + zeroBSCRMJS_globViewLang('sendstatement'),
			html: '<div style="font-size: 1.2em;padding: 0.3em;">' +
				zeroBSCRMJS_globViewLang('sendstatementaddr') +
				'<br /><div class="ui input"><input type="text" name="zbs-send-pdf-company-statement-to-email" id="zbs-send-pdf-company-statement-to-email" value="' +
				email +
				'" placeholder="' +
				zeroBSCRMJS_globViewLang('enteremail') +
				'" style="width: 100%;" /></div></div>',
			type: '',
			showCancelButton: true,
			confirmButtonColor: '#000',
			cancelButtonColor: '#fff',
			cancelButtonText: '<span style="color: #000">' + zeroBSCRMJS_globViewLang('cancel') + '</span>',
			confirmButtonText: zeroBSCRMJS_globViewLang('send'),
		}).then(function(result) {
			if (result.value) {
				// Get the email from the input field
				var emailToSend = jQuery('#zbs-send-pdf-company-statement-to-email').val();
				var data = {
					action: 'zbs_company_send_statement',
					sec: window.zbs_root.zbsnonce,
					cid: cid,
					em: emailToSend,
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
							zeroBSCRMJS_globViewLang('statementsent') + ' ' + emailToSend,
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
 * Render company statement HTML
 *
 * @param array $statement_data Statement data array.
 * @return string HTML output.
 */
function jpcrm_render_company_statement_html( $statement_data ) {

	$html = '';

	// Header.
	$html .= '<div class="ui two column stackable grid">';
	$html .= '<div class="column">';
	$html .= '<div class="ui segment">';
	if ( ! empty( $statement_data['company']['name'] ) ) {
		$html .= '<h4 class="ui header">' . esc_html( $statement_data['company']['name'] ) . '</h4>';
	}
	if ( ! empty( $statement_data['company']['address'] ) ) {
		$html .= '<p>' . wp_kses_post( implode( '<br>', $statement_data['company']['address'] ) ) . '</p>';
	}
	$html .= '</div></div>';
	$html .= '<div class="column">';
	$html .= '<div class="ui segment">';
	if ( ! empty( $statement_data['business']['name'] ) ) {
		$html .= '<h4 class="ui header">' . esc_html( $statement_data['business']['name'] ) . '</h4>';
	}
	if ( ! empty( $statement_data['business']['address'] ) ) {
		$html .= '<p>' . wp_kses_post( implode( '<br>', $statement_data['business']['address'] ) ) . '</p>';
	}
	$html .= '<p><strong>' . esc_html__( 'Statement Date', 'zero-bs-crm' ) . ':</strong> ' . esc_html( $statement_data['statement_date'] ) . '</p>';
	$html .= '</div></div></div>';

	// Statement table.
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

		// Total balance due.
		$html .= '<div class="ui segment">';
		$html .= '<div class="ui grid">';
		$html .= '<div class="sixteen wide column right aligned">';
		$html .= '<h3 class="ui header">' . esc_html__( 'BALANCE DUE', 'zero-bs-crm' ) . ': ' . zeroBSCRM_formatCurrency( $statement_data['total_balance_due'] ) . '</h3>';
		$html .= '</div></div></div>';
	}

	return $html;
}

/**
 * AJAX handler for downloading company statement
 *
 * @return never
 */
function jpcrm_ajax_download_company_statement() {

	// Check nonce.
	check_ajax_referer( 'zbs-download-company-statement', 'sec' );

	// Check permissions.
	if ( ! zeroBSCRM_permsInvoices() ) {
		wp_die( esc_html__( 'Insufficient permissions', 'zero-bs-crm' ) );
	}

	$company_id = isset( $_GET['cid'] ) ? (int) $_GET['cid'] : 0;

	if ( $company_id <= 0 ) {
		wp_die( esc_html__( 'Invalid company ID', 'zero-bs-crm' ) );
	}

	// Generate and download the statement.
	zeroBSCRM_invoicing_generateCompanyStatementPDF( $company_id, true );

	exit;
}
add_action( 'wp_ajax_zbs_download_company_statement', 'jpcrm_ajax_download_company_statement' );

/**
 * Get statement data for a company
 *
 * @param int $company_id Company ID.
 * @return array|false Statement data array or false on failure.
 */
function jpcrm_get_company_statement_data( $company_id ) {

	global $zbs;

	if ( $company_id <= 0 ) {
		return false;
	}

	// Get company details.
	// phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
	$company = $zbs->DAL->companies->getCompany(
		$company_id,
		array(
			'withCustomFields' => true,
			'withQuotes'       => false,
			'withInvoices'     => false,
			'withTransactions' => false,
			'withLogs'         => false,
			'withLastLog'      => false,
			'withTags'         => false,
			'withContacts'     => false,
			'withOwner'        => false,
			'withValues'       => false,
		)
	);

	if ( ! $company ) {
		return false;
	}

	// Get invoices for this company.
	// phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
	$invoices = $zbs->DAL->invoices->getInvoices(
		array(
			'assignedContact'  => false,
			'assignedCompany'  => $company_id,
			'withLineItems'    => true,
			'withCustomFields' => true,
			'withTransactions' => true,
			'withTags'         => false,
			'sortByField'      => 'ID',
			'sortOrder'        => 'ASC',
		)
	);

	// Get business info.
	$business_name    = zeroBSCRM_getSetting( 'businessname' );
	$business_address = array();
	$address_fields   = array( 'addr1', 'addr2', 'city', 'county', 'postcode' );
	foreach ( $address_fields as $field ) {
		$value = zeroBSCRM_getSetting( 'business' . $field );
		if ( ! empty( $value ) ) {
			$business_address[] = $value;
		}
	}

	// Process invoices and calculate totals.
	$statement_items   = array();
	$total_balance_due = 0;

	if ( is_array( $invoices ) ) {
		foreach ( $invoices as $invoice ) {
			$total    = isset( $invoice['total'] ) ? (float) $invoice['total'] : 0;
			$payments = 0;
			$balance  = $total;

			// Calculate payments based on transaction status settings.
			if ( isset( $invoice['transactions'] ) && is_array( $invoice['transactions'] ) ) {
				// phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
				$transaction_statuses_to_include = $zbs->DAL->transactions->getTransactionStatusesToInclude();

				foreach ( $invoice['transactions'] as $transaction ) {
					$should_include_transaction = false;

					if ( 'all' === $transaction_statuses_to_include ) {
						$should_include_transaction = true;
					} elseif ( is_array( $transaction_statuses_to_include ) && isset( $transaction['status'] ) ) {
						$should_include_transaction = in_array( $transaction['status'], $transaction_statuses_to_include, true );
					}

					// Only process transactions that are completed (status_bool = 1) AND have the correct status.
					if ( isset( $transaction['status_bool'] ) && 1 === $transaction['status_bool'] &&
						isset( $transaction['total'] ) && 0 < $transaction['total'] && $should_include_transaction ) {

						if ( 'credit' === $transaction['type_accounting'] ) {
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
			// Only override if we have no valid transactions or all transactions are excluded.
			if ( isset( $invoice['status'] ) && 'Paid' === $invoice['status'] ) {
				// If we have no valid transactions (payments = 0), then assume fully paid.
				if ( 0 === $payments ) {
					$balance  = 0;
					$payments = $total;
				}
				// Otherwise use the calculated payments and balance from valid transactions.
			}

			$statement_items[] = array(
				'date'      => $invoice['date_date'] ?? '',
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
		'company'           => array(
			'name'    => $company['name'],
			'address' => array_filter(
				array(
					$company['addr1'],
					$company['addr2'],
					$company['city'],
					$company['county'],
					$company['postcode'],
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
