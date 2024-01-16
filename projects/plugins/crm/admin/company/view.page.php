<?php
/*
!
 * Single company view page
 */
defined( 'ZEROBSCRM_PATH' ) || exit;

global $zbs;

/**
 * Render the page
 */
function jpcrm_render_company_view_page( $id = -1 ) {

	if ( ! empty( $id ) && $id > 0 ) {

		global $zbs;

			$useQuotes            = false; // not yet $useQuotes = zeroBSCRM_getSetting('feat_quotes');
			$useInvoices          = zeroBSCRM_getSetting( 'feat_invs' );
			$useTrans             = zeroBSCRM_getSetting( 'feat_transactions' );
			$useTasks             = zeroBSCRM_getSetting( 'feat_calendar' );
			$second_address_label = zeroBSCRM_getSetting( 'secondaddresslabel' );
		if ( empty( $second_address_label ) ) {
			$second_address_label = __( 'Second Address', 'zero-bs-crm' );
		}

			$args = array(
				'withCustomFields'           => true,
				'withQuotes'                 => true,
				'withInvoices'               => true,
				'withTransactions'           => true,
				'withLogs'                   => true,
				// 'withLastLog'       => false,
				'withTags'                   => true,
				'withOwner'                  => true,
				'withValues'                 => true,
				'withContacts'               => true,
				'withExternalSourcesGrouped' => true,
			);

			// get tasks if using
			if ( $useTasks ) {
				$args['withTasks'] = true;
			}

			// Get screen options for user
			$screenOpts = $zbs->global_screen_options(); // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase

			// Retrieve company
			$company = $zbs->DAL->companies->getCompany( $id, $args );

			// if customer id provided, but no obj, don't load any further.
			// this matches the ghost-record treatment in the single edit.php class
			if ( ! is_array( $company ) ) {

				// brutal hide, then msg #ghostrecord
				?><style type="text/css">#zbs-edit-save, #zbs-nav-view, #zbs-nav-prev, #zbs-nav-next { display:none; }</style>
				<div id="zbs-edit-warnings-wrap">
				<?php
				echo zeroBSCRM_UI2_messageHTML( 'warning', 'Error Retrieving ' . jpcrm_label_company(), 'There does not appear to be a ' . jpcrm_label_company() . ' with this ID.', 'disabled warning sign', 'zbsCantLoadData' );
				?>
				</div>
				<?php
				return false;

			}

			// } Get actions
			$companyActions = zeroBS_company_actions( $id );

			// } PREP
			$companyEmail = '';
			if ( isset( $company['email'] ) ) {
				$companyEmail = $company['email'];
			}

			// external sources
			$company_external_source_count = 0;
			$company_has_external_sources  = ( is_array( $company['external_sources'] ) && count( $company['external_sources'] ) > 0 );
			if ( $company_has_external_sources ) {
				foreach ( $company['external_sources'] as $external_source_key => $external_source_group_sources ) {
					$company_external_source_count += count( $external_source_group_sources );
				}
			}

			// values - DAL3 we get them passed all nicely :)
			$company_total_value = 0;
			if ( isset( $company['total_value'] ) ) {
				$company_total_value = $company['total_value'];
			}
			$companyQuotesValue = 0;
			if ( isset( $company['quotes_total'] ) ) {
				$companyQuotesValue = $company['quotes_total'];
			}
			$company_invoices_value = 0;
			if ( isset( $company['invoices_total'] ) ) {
				$company_invoices_value = $company['invoices_total'];
			}
			$company_invoices_count = 0;
			if ( isset( $company['invoices_count'] ) ) {
				$company_invoices_count = $company['invoices_count'];
			}
			$company_invoice_count_inc_deleted = 0;
			if ( isset( $company['invoices_count_inc_deleted'] ) ) {
				$company_invoice_count_inc_deleted = $company['invoices_count_inc_deleted'];
			}
			$company_transactions_value = 0;
			if ( isset( $company['transactions_total'] ) ) {
				$company_transactions_value = $company['transactions_total'];
			}

			// pre dal 3 did this way
			if ( ! $zbs->isDAL3() ) {

				// calc'd each individually
				// never used (pre dal3) $companyTotalValue = zeroBS_companyTotalValue($id, $company['invoices'],$company['transactions'])
				// never used (pre dal3) $companyQuotesValue = zeroBS_companyQuotesValue($id, $company['quotes']);
				$company_invoices_value     = zeroBS_companyInvoicesValue( $id, $company['invoices'] );
				$company_transactions_value = zeroBS_companyTransactionsValue( $id, $company['transactions'] );

			}

			// put screen options out
			zeroBSCRM_screenOptionsPanel();

			?>

			<div class="ui divided grid" style="margin-top:-1em;">

			<div class="ten wide column" id="zbs-company-panel">

				<div class="ui segment grid">

				<?php
				// based on avatar/no avatar, subtle diff design here:
				// No avatars for co's yet (2.72) if ($avatarMode == 3 || empty($avatar)){

					// 1 column, no avatar card
				?>
					<div class="sixteen wide column zbs-view-card">
						<h3>
						<?php echo esc_html( zeroBS_companyName( '', $company, false, false ) ); ?>
						</h3>
						<p class="zbs-sentence">
							<?php echo zeroBSCRM_html_companyIntroSentence( $company ); ?>
						</p>
						<a class="ui button black" style="margin-top:0.8em" href="<?php echo jpcrm_esc_link( 'edit', $id, 'zerobs_company', false ); ?>">
								<?php esc_html_e( 'Edit ' . jpcrm_label_company(), 'zero-bs-crm' ); // phpcs:ignore WordPress.WP.I18n.NonSingularStringLiteralText ?>
						</a>


						<?php
						// https://codepen.io/kyleshockey/pen/bdeLrE
						/*
						nope, none here yet if (count($companyActions) > 0) { ?>
						<div class="action-wrap">
						<div class="ui green basic dropdown action-button"><?php _e(jpcrm_label_company().' Actions',"zero-bs-crm"); ?><i class="dropdown icon"></i>
							<div class="menu">
							<?php foreach ($companyActions as $actKey => $action){ ?>
								<div class="item zbs-company-action" id="zbs-company-action-<?php echo $actKey; ?>" data-action="<?php if (isset($action['url'])) echo 'url'; ?>" data-url="<?php if (isset($action['url'])) echo $action['url']; ?>">
								<?php

									// got ico?
									if (isset($action['ico'])) echo '<i class="'.$action['ico'].'"></i>';

									// got text?
									if (isset($action['label'])) echo $action['label'];

								?>
								</div>
							<?php } ?>
							</div>
						</div>
						</div>
						<?php }  */
						?>


					</div>
				</div>

			  

				<!-- company vitals -->
				<?php

				// prep
				$statusStr = '';
				if ( isset( $company ) && isset( $company['status'] ) && ! empty( $company['status'] ) ) {
					$statusStr = $company['status'];
				}

				// compiled addr str
				$addrStr = '';
				if ( isset( $company ) ) {
					$addrStr = zeroBS_companyAddr( $company['id'], $company, 'full', '<br />' );
				}
				$addr2Str = '';
				if ( isset( $company ) ) {
					$addr2Str = zeroBS_companySecondAddr( $company['id'], $company, 'full', '<br />' );
				}

				// tels?
				$tels = array();
				if ( isset( $company ) && isset( $company['maintel'] ) && ! empty( $company['maintel'] ) ) {
					$tels['maintel'] = $company['maintel'];
				}
				if ( isset( $company ) && isset( $company['sectel'] ) && ! empty( $company['sectel'] ) ) {
					$tels['sectel'] = $company['sectel'];
				}

				/*
				// socials
				global $zbsSocialAccountTypes;
				$zbsSocials = zeroBS_getCustomerSocialAccounts($id);
					// empty empties.. hmmm
					$zbsSocialsProper = array(); if (is_array($zbsSocials) && count($zbsSocials) > 0) foreach ($zbsSocials as $zbsSocialKey => $zbsSocialAcc) if (!empty($zbsSocialAcc)) $zbsSocialsProper[$zbsSocialKey] = $zbsSocialAcc;
					$zbsSocials = $zbsSocialsProper; unset($zbsSocialsProper);

				*/

				// retrieve any additional tabs peeps have prepared
				$companyVitalTabs = apply_filters( 'jetpack-crm-company-vital-tabs', array(), $id );

				?>

				<div id="zbs-vitals-box">
				<div class="ui top attached tabular menu">
					<div data-tab="vitals" class="
					<?php
					if ( ! isset( $activeVitalsTab ) ) {
						echo 'active ';
						$activeVitalsTab = 'vitals'; }
					?>
					item">
														<?php

															echo esc_html( jpcrm_label_company() . ' ' . __( 'Vitals', 'zero-bs-crm' ) );

														?>
						</div>
					<?php
					/*
					if (count($zbsSocialAccountTypes) > 0 && count($zbsSocials) > 0){ ?>
					<div data-tab="social" class="<?php if (!isset($activeVitalsTab)) { echo 'active '; $activeVitalsTab = 'social'; } ?>item"><?php _e('Social',"zero-bs-crm"); ?></div>
					<?php } */
					?>
					<?php
					// } Any integrated tabs - via filter jetpack-crm-contact-vital-tabs
					if ( is_array( $companyVitalTabs ) && count( $companyVitalTabs ) > 0 ) {
						$tabIndx = 1;
						foreach ( $companyVitalTabs as $tab ) {

							$tabName = __( 'Untitled Tab', 'zero-bs-crm' );
							$tabID   = 'zbs-company-tab-' . $tabIndx;

							if ( is_array( $tab ) && isset( $tab['name'] ) ) {
								$tabName = $tab['name'];
							}
							if ( is_array( $tab ) && isset( $tab['id'] ) ) {
								$tabID = $tab['id'];
							}

							?>
						<div data-tab="<?php echo esc_attr( $tabID ); ?>" class="item"><?php echo esc_html( $tabName ); ?></div>
							<?php

							++$tabIndx;

						}
					}
					?>
					<?php if ( ! empty( $statusStr ) ) { ?>
					<div class="right menu item">
						<?php esc_html_e( 'Status', 'zero-bs-crm' ); ?>: 
					<span class="ui green label"><?php echo esc_html( $statusStr ); ?></span>
					</div>
					<?php } ?>
				</div>

				<div class="ui bottom attached active tab segment" data-tab="vitals" id="zbs-company-view-vitals">
					<table class="ui fixed single line celled table">
						<tbody>
						<?php
						if ( $zbs->isDAL3() ) {
							if ( $useInvoices == '1' || $useTrans == '1' ) :
								?>
							<tr>
							<td class="zbs-view-vital-label"><strong><?php esc_html_e( 'Total Value', 'zero-bs-crm' ); ?><i class="circle info icon link" data-content="<?php esc_attr_e( 'Total Value is all transaction types and any unpaid invoices (excluding deleted status invoices).', 'zero-bs-crm' ); ?>" data-position="bottom center"></i></strong></td>
							<td><strong><?php echo esc_html( zeroBSCRM_formatCurrency( $company_total_value ) ); ?></strong></td>
							</tr>
							<?php endif; ?>
							<?php if ( $useQuotes == '1' ) : ?>
							<tr>
							<td class="zbs-view-vital-label"><?php esc_html_e( 'Quotes', 'zero-bs-crm' ); ?> <i class="circle info icon link" data-content="<?php esc_attr_e( 'Quotes: This shows the total sum of your quotes & count.', 'zero-bs-crm' ); ?>" data-position="bottom center"></i></td>
							<td>
								<?php
								if ( count( $company['quotes'] ) > 0 ) {
										echo esc_html( zeroBSCRM_formatCurrency( $companyQuotesValue ) . ' (' . count( $company['quotes'] ) . ')' );
								} else {
									esc_html_e( 'None', 'zero-bs-crm' );
								}
								?>
							</td>
							</tr>
								<?php
							endif;
						} // if dal3
						if ( $useInvoices == '1' ) :
							?>
						<tr class="zbs-view-vital-invoices">
							<td class="zbs-view-vital-label"><?php esc_html_e( 'Invoices', 'zero-bs-crm' ); ?> <i class="circle info icon link" data-content="<?php esc_attr_e( 'Invoices: This shows the total sum of your invoices & count (excluding deleted status invoices).', 'zero-bs-crm' ); ?>" data-position="bottom center"></i></td>
							<td>
							<?php
							if ( $company_invoices_count > 0 ) {
									echo esc_html( zeroBSCRM_formatCurrency( $company_invoices_value ) . ' (' . $company_invoices_count . ')' );
							} else {
								esc_html_e( 'None', 'zero-bs-crm' );
							}
							?>
							</td>
						</tr>
						<?php endif; ?>
							<?php if ( $useTrans == '1' ) : ?>
						<tr>
							<td class="zbs-view-vital-label"><?php esc_html_e( 'Transactions', 'zero-bs-crm' ); ?> <i class="circle info icon link" data-content="<?php esc_attr_e( 'Transactions Total & count: This shows the sum of your succeeded transactions (set in settings)', 'zero-bs-crm' ); ?>" data-position="bottom center"></i></td>
							<td>
								<?php
								if ( count( $company['transactions'] ) > 0 ) {
									echo esc_html( zeroBSCRM_formatCurrency( $company_transactions_value ) . ' (' . count( $company['transactions'] ) . ')' );
								} else {
									esc_html_e( 'None', 'zero-bs-crm' );
								}
								?>
							</td>
						</tr>
						<?php endif; ?>
						<tr class="wraplines">
							<td class="zbs-view-vital-label"><?php esc_html_e( 'Address Details', 'zero-bs-crm' ); ?></td>
													<td>
															<?php
															if ( ! empty( $addrStr ) && empty( $addr2Str ) ) {
																echo wp_kses( $addrStr, $zbs->acceptable_restricted_html );
															} elseif ( empty( $addrStr ) && ! empty( $addr2Str ) ) {
																echo wp_kses( $addr2Str, $zbs->acceptable_restricted_html );
															} elseif ( ! empty( $addrStr ) && ! empty( $addr2Str ) ) {
																?>
																<div class="ui grid">
																	<div class="eight wide column">
																		<h4 class="ui dividing header" style="margin-bottom: 0.6em;"><?php esc_html_e( 'Main address', 'zero-bs-crm' ); ?></h4>
																	<?php echo wp_kses( $addrStr, $zbs->acceptable_restricted_html ); ?>
																	</div>
																	<div class="eight wide column">
																		<h4 class="ui dividing header" style="margin-bottom: 0.6em;"><?php echo esc_html( $second_address_label ); ?></h4>
																	<?php echo wp_kses( $addr2Str, $zbs->acceptable_restricted_html ); ?>
																	</div>
																</div>
																<?php
															} else {
																esc_html_e( 'No Address on File', 'zero-bs-crm' );
															}
															?>
													</td>
						</tr>
						<tr>
							<td class="zbs-view-vital-label"><?php esc_html_e( 'Telephone Contacts', 'zero-bs-crm' ); ?></td>
							<td>
								<?php

								if ( count( $tels ) > 0 ) {

									// Click 2 call?
									$click2call = $zbs->settings->get( 'clicktocall' );

									?>
									<div class="ui horizontal list">
									<?php

									foreach ( $tels as $telKey => $telNo ) {
										?>
										<div class="item">
										<?php
										switch ( $telKey ) {

											case 'sectel':
												echo '<i class="large phone icon"></i>';
												break;
											case 'maintel':
												echo '<i class="large phone square icon"></i>';
												break;

										}
										?>
										<div class="content">
											<?php if ( $click2call == '1' ) { ?>
											<a class="ui small button" href="<?php echo esc_attr( zeroBSCRM_clickToCallPrefix() . $telNo ); ?>" title="<?php esc_attr_e( 'Call', 'zero-bs-crm' ) . ' ' . $telNo; ?>"><?php echo esc_html( $telNo ); ?></a>
											<?php } else { ?>
											<div class="header"><?php echo esc_html( $telNo ); ?></div>
											<?php } ?>
										</div>
										</div>
										<?php } ?>

									</div>
									<?php

								} else {
									esc_html_e( 'No phone number on File', 'zero-bs-crm' );
								}
								?>
									</td>
						</tr>
						<tr class="wraplines">
							<td class="zbs-view-vital-label"><?php esc_html_e( 'Contacts', 'zero-bs-crm' ); ?> <i class="circle info icon link" data-content="<?php esc_attr_e( 'Contacts at this ' . jpcrm_label_company(), 'zero-bs-crm' ); ?>" data-position="bottom center"></i></td>
							<td id="zbs-company-view-vitals-contacts">
								<?php

								// contacts at company
								$contactStr = zeroBSCRM_html_linkedCompanyContacts( $id, ( isset( $company['contacts'] ) ? $company['contacts'] : false ) );

								if ( ! empty( $contactStr ) ) {
									echo $contactStr;
								} else {
									esc_html_e( 'None', 'zero-bs-crm' );
								}

								?>
							</td>
						</tr>
						<tr class="zbs-view-vital-source">
							<td class="zbs-view-vital-label"><?php ( $company_external_source_count > 1 ? esc_html_e( 'Sources', 'zero-bs-crm' ) : esc_html_e( 'Source', 'zero-bs-crm' ) ); ?></td>
							<td>
							<?php

							if ( $company_has_external_sources ) {

								// Previously: zeroBS_getExternalSourceTitle
								jpcrm_render_external_sources_info( $company['external_sources'], $company['id'], ZBS_TYPE_COMPANY );

							} else {

								esc_html_e( 'Manually Added', 'zero-bs-crm' );

							}

							?>
							</td>
						</tr>
						</tbody>
					</table>

				</div>

					<?php
					// } Any integrated tabs - via filter jetpack-crm-contact-vital-tabs
					if ( is_array( $companyVitalTabs ) && count( $companyVitalTabs ) > 0 ) {
						$tabIndx = 1;
						foreach ( $companyVitalTabs as $tab ) {

							$tabID = 'zbs-company-tab-' . $tabIndx;
							if ( is_array( $tab ) && isset( $tab['id'] ) ) {
								$tabID = $tab['id'];
							}

							?>
						<div class="ui bottom attached tab segment" data-tab="<?php echo esc_attr( $tabID ); ?>" id="zbs-contact-view-vitals-<?php echo esc_attr( $tabID ); ?>">
							<?php
							// } Content
							if ( is_array( $tab ) && isset( $tab['contentaction'] ) ) {

								// calls the users function name, if they opted for that instead of content
								call_user_func( $tab['contentaction'], $id );

							} elseif ( is_array( $tab ) && isset( $tab['content'] ) ) {
								echo $tab['content'];
							}
							?>
						</div>
							<?php

							++$tabIndx;

						}
					}
					?>
										
				<!-- / company vitals -->
				</div>
		







					<h4 class="ui horizontal header divider">
					<i class="archive icon"></i>
					<?php esc_html_e( 'Documents', 'zero-bs-crm' ); ?>
					</h4>

					<div id="zbs-doc-menu">
					<div class="ui top attached tabular menu">
						<?php /* never, yet! if ($useQuotes == "1"){ ?><div data-tab="quotes" class="<?php if (!isset($activeTab)) { echo 'active '; $activeTab = 'quotes'; } ?>item"><?php _e('Quotes',"zero-bs-crm"); ?></div><?php } ?>*/ ?>
						<?php
						if ( $useInvoices == '1' ) {
							?>
							<div data-tab="invoices" class="
							<?php
							if ( ! isset( $activeTab ) ) {
									echo 'active ';
									$activeTab = 'invoices'; }
							?>
item"><?php esc_html_e( 'Invoices', 'zero-bs-crm' ); ?></div><?php } ?>                      
						<?php
						if ( $useTrans == '1' ) {
							?>
							<div data-tab="transactions" class="
							<?php
							if ( ! isset( $activeTab ) ) {
									echo 'active ';
									$activeTab = 'transactions'; }
							?>
item"><?php esc_html_e( 'Transactions', 'zero-bs-crm' ); ?></div><?php } ?>
						<div data-tab="files" class="
						<?php
						if ( ! isset( $activeTab ) ) {
							echo 'active ';
							$activeTab = 'files'; }
						?>
						item"><?php esc_html_e( 'Files', 'zero-bs-crm' ); ?></div>                    
						<?php
						if ( $useTasks == '1' ) {
							?>
							<div data-tab="tasks" class="
							<?php
							if ( ! isset( $activeTab ) ) {
									echo 'active ';
									$activeTab = 'tasks'; }
							?>
item"><?php esc_html_e( 'Tasks', 'zero-bs-crm' ); ?></div><?php } ?>
					</div>

					<?php if ( $useInvoices == '1' ) { ?>
					<div class="ui bottom attached 
						<?php
						if ( $activeTab == 'invoices' ) {
							echo 'active ';}
						?>
					tab segment" data-tab="invoices">
						<table class="ui celled table unstackable">
								<thead>
								<tr>
									<th><?php echo esc_html( $zbs->settings->get( 'reflabel' ) ); ?></th>
									<th><?php esc_html_e( 'Date', 'zero-bs-crm' ); ?></th>
									<th><?php esc_html_e( 'Amount', 'zero-bs-crm' ); ?></th>
									<th><?php esc_html_e( 'Status', 'zero-bs-crm' ); ?></th>
								</tr>
								</thead>
								<tbody>
								<?php
								// prep link to create a new invoice
								$new_invoice_url = jpcrm_esc_link( 'create', -1, ZBS_TYPE_INVOICE ) . '&zbsprefillco=' . $company['id'];

								if ( $company_invoice_count_inc_deleted > 0 ) {

									foreach ( $company['invoices'] as $invoice ) {
										// debugecho '<pre>'; print_r($invoice); echo '</pre><hr>';

										$id_ref_str = '';

										if ( isset( $invoice['id'] ) ) {
											$id_ref_str = '#' . $invoice['id'];
										}
										if ( isset( $invoice['id_override'] ) && ! empty( $invoice['id_override'] ) ) {
											if ( ! empty( $id_ref_str ) ) {
												$id_ref_str .= ' -';
											}
											$id_ref_str .= ' ' . $invoice['id_override'];
										}
										$invoice_date = '';
										if ( isset( $invoice['date_date'] ) ) {
											$invoice_date = $invoice['date_date'];
										}

										$invoice_url = jpcrm_esc_link( 'edit', $invoice['id'], ZBS_TYPE_INVOICE );

										$invoice_val = $invoice['total'];

										$invoice_status = $invoice['status_label'];

										echo '<tr>';
										echo '<td><a href="' . esc_url( $invoice_url ) . '">' . esc_html( $id_ref_str ) . '</a></td>';
										echo '<td>' . esc_html( $invoice_date ) . '</td>';
										echo '<td>' . esc_html( zeroBSCRM_formatCurrency( $invoice_val ) ) . '</td>';
										echo "<td><span class='" . esc_attr( zeroBSCRM_html_invoiceStatusLabel( $invoice ) ) . "'>" . esc_html( ucfirst( $invoice_status ) ) . '</span></td>';
										echo '</tr>';
									}
								} else {

									// empty, create?
									?>
									<tr>
										<td colspan="4">
											<div class="ui icon message" id="zbsNoInvoiceResults">
											<div class="content">
												<div class="header"><?php esc_html_e( 'No Invoices', 'zero-bs-crm' ); ?></div>
												<p>
												<?php
												// prefill doesn't yet exist for companies
												echo wp_kses( sprintf( __( 'This %1$s does not have any invoices yet. Do you want to <a href="%2$s">create one</a>?', 'zero-bs-crm' ), jpcrm_label_company(), esc_url( $new_invoice_url ) ), $zbs->acceptable_restricted_html );
												?>
												</p>
											</div>
											</div>
										</td>
									</tr>
									<?php

								}

								?>

								</tbody>
							</table>
							<?php if ( $company_invoice_count_inc_deleted > 0 ) : ?>
								<div style="text-align: right;">
								<a href="<?php echo esc_url( $new_invoice_url ); ?>" class="ui basic green button">
									<i class="plus square outline icon"></i>
									<?php esc_html_e( 'Add Invoice', 'zero-bs-crm' ); ?>
								</a>
								</div>
							<?php endif; ?>
					</div><?php } ?>
					<div class="ui bottom attached 
					<?php
					if ( $activeTab == 'transactions' ) {
						echo 'active ';}
					?>
					tab segment" data-tab="transactions">
							<?php

							// get columns from screen options
							$activeTransactionColumns = array( 'date', 'id', 'total', 'status' ); // default
							if (
							isset( $screenOpts ) && is_array( $screenOpts )
								&& isset( $screenOpts['tablecolumns'] ) && is_array( $screenOpts['tablecolumns'] )
								&& isset( $screenOpts['tablecolumns']['transactions'] )
								&& is_array( $screenOpts['tablecolumns']['transactions'] )
								&& count( $screenOpts['tablecolumns']['transactions'] ) > 0
							) {
								$activeTransactionColumns = $screenOpts['tablecolumns']['transactions'];
							}
							?>
						<table class="ui celled table unstackable">
								<thead>
								<tr>
								<?php

								// for now, pick out id so always on left
								if ( in_array( 'id', $activeTransactionColumns ) ) {
									echo '<th>' . esc_html( zeroBS_objDraw_transactionColumnHeader( 'id' ) ) . '</th>';
								}

								foreach ( $activeTransactionColumns as $col ) {

									// id pulled out above
									if ( $col != 'id' ) {
										echo '<th>' . esc_html( zeroBS_objDraw_transactionColumnHeader( $col ) ) . '</th>';
									}
								}
								?>
								</tr>
								</thead>
								<tbody>
									<?php

									// prep link to create a new transaction
									$new_transaction_url = jpcrm_esc_link( 'create', -1, ZBS_TYPE_TRANSACTION ) . '&zbsprefillco=' . $company['id'];

									if ( count( $company['transactions'] ) > 0 ) {

										foreach ( $company['transactions'] as $zbsTransaction ) {

											echo '<tr>';

											// ultimately these should be drawn by JS so they can use the same
											// 'generate obj html' funcs as list view
											// for now quickly generated in php for this freelance.

											// for now, pick out id so always on left
											if ( in_array( 'id', $activeTransactionColumns ) ) {
												echo '<td>' . wp_kses( zeroBS_objDraw_transactionColumnTD( 'id', $zbsTransaction ), $zbs->acceptable_restricted_html ) . '</td>';
											}

											foreach ( $activeTransactionColumns as $col ) {

												// id pulled out above
												if ( $col != 'id' ) {
													echo '<td>' . zeroBS_objDraw_transactionColumnTD( $col, $zbsTransaction ) . '</td>';
												}
											}

											echo '</tr>';
										}
									} else {

										// empty, create?
										?>
									<tr>
										<td colspan="<?php echo count( $activeTransactionColumns ); ?>">
											<div class="ui icon message" id="zbsNoTransactionResults">
											<div class="content">
												<div class="header"><?php esc_html_e( 'No Transactions', 'zero-bs-crm' ); ?></div>
												<p>
												<?php
												// prefill doesn't yet exist for companies
												echo wp_kses( sprintf( __( 'This %1$s does not have any transactions yet. Do you want to <a href="%2$s">create one</a>?', 'zero-bs-crm' ), jpcrm_label_company(), esc_url( $new_transaction_url ) ), $zbs->acceptable_restricted_html );
												?>
												</p>
											</div>
											</div>
										</td>
									</tr>
										<?php

									}

									?>

								</tbody>
							</table>
								<?php if ( count( $company['transactions'] ) > 0 ) : ?>
								<div style="text-align: right;">
								<a href="<?php echo esc_url( $new_transaction_url ); ?>" class="ui basic green button">
									<i class="plus square outline icon"></i>
									<?php esc_html_e( 'Add Transaction', 'zero-bs-crm' ); ?>
								</a>
								</div>
							<?php endif; ?>
					</div>

					<div class="ui bottom attached tab segment" data-tab="files">
						<table class="ui celled table unstackable" id="zbsFilesTable" style="margin-bottom:0;">
							<thead>
							<tr>
								<th><?php esc_html_e( 'Info', 'zero-bs-crm' ); ?></th>
								<th class="center aligned"><?php esc_html_e( 'View File', 'zero-bs-crm' ); ?></th>
								<th class="center aligned" style="min-width:230px"><?php esc_html_e( 'Actions', 'zero-bs-crm' ); ?></th>
							</tr>
							</thead>
							<tbody>
							<?php
							// $zbsFiles = zeroBSCRM_getCustomerFiles($id); $hasFiles = false;
							$zbsFiles = zeroBSCRM_files_getFiles( 'company', $id );
							$hasFiles = false;

							// prep link to create a new file
							$new_file_url = jpcrm_esc_link( 'edit', $id, 'zerobs_company', false ) . '#zerobs-company-files-head';

							// } Any files
							if ( is_array( $zbsFiles ) && count( $zbsFiles ) > 0 ) {

								$hasFiles = true;

								$fileLineIndx = 0; foreach ( $zbsFiles as $zbsFile ) {
									$file = zeroBSCRM_files_baseName( $zbsFile['file'], isset( $zbsFile['priv'] ) );
									?>
								<tr>
								<td>
									<h4><?php echo ! empty( $zbsFile['title'] ) ? esc_html( $zbsFile['title'] ) : esc_html__( 'Untitled', 'zero-bs-crm' ); ?></h4>
									<p>
									<?php echo ! empty( $zbsFile['desc'] ) ? esc_html( $zbsFile['desc'] ) : ''; ?>
									</p>
									<em>(<?php echo esc_html( $file ); ?>)</em>
								</td>

										<td class="center aligned">
											<?php
												echo '<a class="" href="' . esc_url( $zbsFile['url'] ) . '" target="_blank" class="ui button basic">' . esc_html__( 'View', 'zero-bs-crm' ) . '</a>';

											?>
										</td>

										<td class="center aligned">
											<?php
											$zbs_edit = admin_url( 'admin.php?page=' . $zbs->slugs['editfile'] ) . '&company=' . $id . '&fileid=' . $fileLineIndx;
											?>
										<a href="<?php echo esc_url( $zbs_edit ); ?>" target="_blank" class="ui button basic"><i class="edit icon"></i><?php esc_html_e( 'Edit', 'zero-bs-crm' ); ?></a>&nbsp;&nbsp;
										<button class="zbsDelFile ui button basic" data-type="company" data-delurl="<?php echo esc_attr( $zbsFile['url'] ); ?>"><i class="trash alternate icon"></i><?php esc_html_e( 'Delete', 'zero-bs-crm' ); ?></button>
										</td>
								</tr>
									<?php

									++$fileLineIndx;
								} //end of the files loop..
							}

							// put this out either way, so that if a user deletes all it can be reshown in ui

								// empty, create?
							?>
								<tr id="zbs-no-files-msg" style="display:
								<?php
								if ( ! $hasFiles ) {
									echo 'table-row';
								} else {
									echo 'none';
								}
								?>
								">
									<td colspan="4">
										<div class="ui icon message" id="zbsNoFileResults">
										<div class="content">
											<div class="header"><?php esc_html_e( 'No Files', 'zero-bs-crm' ); ?></div>
											<p>
											<?php
											echo wp_kses( sprintf( __( 'This %1$s does not have any files yet. Do you want to <a href="%2$s">upload one</a>?', 'zero-bs-crm' ), jpcrm_label_company(), esc_url( $new_file_url ) ), $zbs->acceptable_restricted_html );
											?>
											</p>
										</div>
										</div>
									</td>
								</tr>						</tbody>
						</table>
						<div id="zbsFileActionOutput" style="display:none"></div>
						</div>

						<?php if ( $useTasks == '1' ) { ?>
						<div class="ui bottom attached 
							<?php
							if ( $activeTab == 'tasks' ) {
								echo 'active ';}
							?>
						tab segment" data-tab="tasks">
							<table class="ui celled table unstackable">
								<thead>
									<tr>
									<th><?php esc_html_e( 'Date', 'zero-bs-crm' ); ?></th>
									<th><?php esc_html_e( 'Task', 'zero-bs-crm' ); ?></th>
									<th><?php esc_html_e( 'Status', 'zero-bs-crm' ); ?></th>
									<th><?php esc_html_e( 'View', 'zero-bs-crm' ); ?></th>
									</tr>
								</thead>
								<tbody>
									<?php
									// prep link to create a new task
									$new_task_url = jpcrm_esc_link( 'create', -1, ZBS_TYPE_TASK ) . '&zbsprefillco=' . $company['id'];

									if ( isset( $company['tasks'] ) && is_array( $company['tasks'] ) && count( $company['tasks'] ) > 0 ) {

										$lastTaskStart  = -1;
										$upcomingOutput = false;

										foreach ( $company['tasks'] as $task ) {

											// if the first task is upcoming, add a header
											if ( ! $upcomingOutput && $task['start'] > time() ) {

												// tried to use horizontal divider here, but there's a semantic bug
												// ... when using these in tables. https://semantic-ui.com/elements/divider.html
												// ... adding display:block to the td fixes, but then colspan doesn't work. Skipping for now
												echo '<tr><td colspan="4"><div class="ui horizontal divider">' . esc_html__( 'Upcoming Tasks', 'zero-bs-crm' ) . '</div></td></tr>';

												// shown
												$upcomingOutput = true;

											}

											// if there are tasks in future, and past, draw a line between
											if ( $lastTaskStart > 0 && $lastTaskStart > time() && $task['end'] < time() ) {

												// tried to use horizontal divider here, but there's a semantic bug
												// ... when using these in tables. https://semantic-ui.com/elements/divider.html
												// ... adding display:block to the td fixes, but then colspan doesn't work. Skipping for now
												echo '<tr><td colspan="4"><div class="ui horizontal divider">' . esc_html__( 'Past Tasks', 'zero-bs-crm' ) . '</div></td></tr>';

											}

											$taskURL   = jpcrm_esc_link( 'edit', $task['id'], ZBS_TYPE_TASK );
											$statusStr = __( 'Incomplete', 'zero-bs-crm' );
											if ( isset( $task['complete'] ) && $task['complete'] === 1 ) {
												$statusStr = __( 'Completed', 'zero-bs-crm' );
											}
											$status = "<span class='" . zeroBSCRM_html_taskStatusLabel( $task ) . "'>" . $statusStr . '</span>';

											echo '<tr>';
											echo '<td>' . esc_html( zeroBSCRM_html_taskDate( $task ) ) . '</td>';
											echo '<td>' . esc_html( $task['title'] ) . '</td>';
											echo '<td>' . esc_html( $status ) . '</td>';
											echo '<td style="text-align:center"><a href="' . esc_url( $taskURL ) . '">' . esc_html__( 'View', 'zero-bs-crm' ) . '</a></td>';
											echo '</tr>';

											$lastTaskStart = $task['start'];

										}
									} else {

										?>
									<tr>
										<td colspan="4">
											<div class="ui icon message" id="zbsNoTaskResults">
												<div class="content">
												<div class="header"><?php esc_html_e( 'No Tasks', 'zero-bs-crm' ); ?></div>
												<p>
													<?php
													// prefill doesn't yet exist for companies
													echo wp_kses( sprintf( __( 'This %1$s does not have any tasks yet. Do you want to <a href="%2$s">create one</a>?', 'zero-bs-crm' ), jpcrm_label_company(), esc_url( $new_task_url ) ), $zbs->acceptable_restricted_html );
													?>
												</p>
												</div>
											</div>
										</td>
										</tr>
										<?php

									}

									?>

								</tbody>
								</table>
								<?php if ( count( $company['tasks'] ) > 0 ) : ?>
								<div style="text-align: right;">
									<a href="<?php echo esc_url( $new_task_url ); ?>" class="ui basic green button">
									<i class="plus square outline icon"></i>
									<?php esc_html_e( 'Add Task', 'zero-bs-crm' ); ?>
									</a>
								</div>
								<?php endif; ?>
						</div><?php } ?>

				</div><!-- docs -->

				<?php

					$companyTags = zeroBSCRM_getCompanyTagsByID( $company['id'] );

				if ( count( $companyTags ) > 0 ) {

					?>
						<!-- TAGGED --><div class="zbs-view-tags">
						<h4 class="ui horizontal header divider">
							<i class="tag icon"></i>
						<?php esc_html_e( 'Tagged', 'zero-bs-crm' ); ?>
						</h4>
						<?php

						// output as links
						zeroBSCRM_html_linkedCompanyTags( $company['id'], $companyTags, 'ui medium olive button' );

						?>
						</div><!-- / TAGGED -->
						<?php
				}
				?>

			</div>

			<div class="six wide column" id="zbs-custom-quicklinks">

				<?php
					// } Metaboxes
					zeroBSCRM_do_meta_boxes( 'zerobs_view_company', 'side', $company );
				?>
			  
			</div>


			</div>
		  
				<script type="text/javascript">
				
				// Nonce
				var zbscrmjs_secToken = '<?php echo esc_js( wp_create_nonce( 'zbscrmjs-ajax-nonce' ) ); ?>';

				// moved to singleview.js
				var zbsViewSettings = {

					objid: <?php echo esc_html( $id ); ?>,
					objdbname: 'company' <?php // echo $this->objType; ?>

				};

				</script>
				<?php

				// PRIVATE hook (do not share with dev/docs PLEASE leave off.)
				do_action( 'zerobscrm_companyview_postscripts' );

	} // if ID
}

/*
	Custom Fields View Company Tab

*/
function zeroBSCRM_pages_admin_view_page_company_custom_fields( $arr = array(), $id = -1 ) {

	global $zbs;

	// Here we hide it if:
	// - Non admin
	// - No custom fields
	if ( $zbs->DAL->companies->hasCustomFields( $id, false ) || zeroBSCRM_isZBSAdminOrAdmin() ) {

		// this is just a check :)
		if ( ! is_array( $arr ) ) {
			$arr = array();
		}

		// Here we add the new tab
		$arr[] = array(
			'id'      => 'company-custom-fields-tab',
			'name'    => __( 'Custom Fields', 'zero-bs-crm' ),
			'content' => zeroBSCRM_pages_admin_display_custom_fields_table( $id, ZBS_TYPE_COMPANY ),
		);

	}

	return $arr;
}
add_filter( 'jetpack-crm-company-vital-tabs', 'zeroBSCRM_pages_admin_view_page_company_custom_fields', 10, 2 );
