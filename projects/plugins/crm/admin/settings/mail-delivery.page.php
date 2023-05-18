<?php
/*
!
 * Admin Page: Settings: Mail delivery setup
 */

// stop direct access
if ( ! defined( 'ZEROBSCRM_PATH' ) ) {
	exit;
}

global $zbs;  // } Req

// check if running locally (Then smtp may not work, e.g. firewalls + pain)
$runningLocally = zeroBSCRM_isLocal( true );

?><div id="zbs-mail-delivery-wrap">
<?php

	// } SMTP Configured?
	$zbsSMTPAccs            = zeroBSCRM_getMailDeliveryAccs();
	$defaultMailOptionIndex = zeroBSCRM_getMailDeliveryDefault();

	// TEMP DELETES ACCS: global $zbs->settings; $zbs->settings->update('smtpaccs',array());

	// } Defaults
	$defaultFromDeets = zeroBSCRM_wp_retrieveSendFrom();

	// Temp print_r($defaultFromDeets);

if ( count( $zbsSMTPAccs ) <= 0 ) {

	// } ====================================
	// } No settings yet :)
	?>
		<h1 class="ui header blue zbs-non-wizard" style="margin-top: 0;"><?php esc_html_e( 'Mail Delivery', 'zero-bs-crm' ); ?></h1>

		<div class="ui icon big message zbs-non-wizard">
			<i class="wordpress icon"></i>
			<div class="content">
				<div class="header">
				<?php esc_html_e( 'Jetpack CRM is using the default WordPress email delivery', 'zero-bs-crm' ); ?>
				</div>
				<hr />
				<p><?php esc_html_e( 'By default Jetpack CRM is configured to use wp_mail to send out all emails. This means your emails will go out from the basic wordpress@yourdomain.com style sender. This isn\'t great for deliverability, or your branding.', 'zero-bs-crm' ); ?></p>
				<div>
				<?php
				esc_html_e( 'Currently mail is sent from', 'zero-bs-crm' );
				echo ' <div class="ui large teal horizontal label">' . esc_html( $defaultFromDeets['name'] ) . ' (' . esc_html( $defaultFromDeets['email'] ) . ')</div><br />' . esc_html__( 'Do you want to set up a different Mail Delivery option?', 'zero-bs-crm' );
				?>
				</div>
				<div style="padding:2em 0 1em 2em">
					<button type="button" id="zbs-mail-delivery-start-wizard" class="ui huge primary button"><?php esc_html_e( 'Start Wizard', 'zero-bs-crm' ); ?></button>
				</div>
			</div>
		</div>


		<?php
		// } ====================================

} else {

	// } ====================================
	// } Has settings, dump them out :)
	// debug
	// echo '<pre>'; print_r($zbsSMTPAccs); echo '</pre>';
	// $key = zeroBSCRM_mailDelivery_makeKey($zbsSMTPAccs[0]); echo 'key:'.$key.'!';

	?>
		<div id="zbs-mail-delivery-account-list-wrap">
		<h1 class="ui header blue zbs-non-wizard" style="margin-top: 0;"><?php esc_html_e( 'Mail Delivery', 'zero-bs-crm' ); ?></h1>
		<table class="ui celled table zbs-non-wizard">
			<thead>
			<tr>
				<th><?php esc_html_e( 'Outbound Account', 'zero-bs-crm' ); ?></th>
				<th style="text-align:center">Actions</th>
			</tr>
			</thead>
			<tbody>
		<?php
			$detailMode = false;
		$accIndx        = 0;
		if ( count( $zbsSMTPAccs ) > 1 ) {
			$detailMode = true;
		}
		foreach ( $zbsSMTPAccs as $accKey => $acc ) {

			// reset
			$isDefault = false;

			?>
				<tr id="zbs-mail-delivery-<?php echo esc_attr( $accKey ); ?>">
					<td class="zbs-mail-delivery-item-details">
					<?php

					if ( count( $zbsSMTPAccs ) == 1 && $accIndx == 0 ) {
						$isDefault = true;
					} elseif ( $accKey == $defaultMailOptionIndex ) {

							$isDefault = true;
					}

					if ( $isDefault ) {

						?>
						<div class="ui ribbon label zbs-default"><?php esc_html_e( 'Default', 'zero-bs-crm' ); ?></div>
						<?php
					}

					// } account name etc.
					$accStr = '';
					if ( isset( $acc['fromname'] ) ) {
						$accStr = $acc['fromname'];
					}
					if ( isset( $acc['fromemail'] ) ) {
						if ( ! empty( $accStr ) ) {
							$accStr .= ' &lt;' . $acc['fromemail'] . '&gt;';
						} else {
							$accStr .= $acc['fromemail'];
						}
					}
					echo esc_html( $accStr );

					// } Mode label
					?>
						&nbsp;&nbsp;<div class="ui purple horizontal label">
						<?php
						$modeStr = 'wp_mail';
						if ( isset( $acc['mode'] ) ) {

							switch ( $acc['mode'] ) {

								case 'smtp':
									$modeStr = 'SMTP';
									break;
								case 'api':
									$modeStr = 'API';
									break;
							}
						}
						echo esc_html( $modeStr );
						?>
							</div>
							<?php

							// Detail
							$detailStr = '';
							if ( isset( $acc['host'] ) && ! empty( $acc['host'] ) ) {
								$detailStr = $acc['host'];
							}
							if ( $detailMode ) {
								echo '<div class="zbs-mail-delivery-detail">' . esc_html( $detailStr ) . '</div>';
							}

							// if API, show connected state
							if ( $modeStr == 'API' && isset( $acc['oauth_provider'] ) ) {

								// Load OAuth
								$zbs->load_oauth_handler();

								echo '<div style="margin:1em;text-align:center">' . $zbs->oauth->connection_status_string( $acc['oauth_provider'] ) . '</div>';

							}

							?>
						</td>
					<td style="text-align:center">
						<button type="button" class="ui tiny green button zbs-test-mail-delivery" data-from="<?php echo esc_attr( $acc['fromemail'] ); ?>" data-indx="<?php echo esc_attr( $accKey ); ?>"><i class="icon mail"></i> Send Test</button>&nbsp;
						<button type="button" class="ui tiny orange button zbs-remove-mail-delivery" data-indx="<?php echo esc_attr( $accKey ); ?>"><i class="remove circle icon"></i> Remove</button>&nbsp;
						<button type="button" class="ui tiny teal button zbs-default-mail-delivery
						<?php
						if ( $isDefault ) {
							echo ' disabled';}
						?>
							" data-indx="<?php echo esc_attr( $accKey ); ?>"><i class="check circle outline icon"></i> Set as Default</button>
					</td>
				</tr>
				<?php ++$accIndx; } ?>
			</tbody>
			<tfoot>
			<tr><th colspan="2">
					<div class="ui right floated">
						<button type="button" id="zbs-mail-delivery-start-wizard" class="ui primary button right floated"><i class="add circle icon"></i> <?php esc_html_e( 'Add Another', 'zero-bs-crm' ); ?></button>
					</div>
				</th>
			</tr></tfoot>
		</table>
		</div>
		<?php

		// } ====================================

}

	/* Wizard? */

	// } Default
	$smtpAcc = array(
		'sendfromname'  => '',
		'sendfromemail' => '',
	);

	// } Never run, so autofill with wp defaults?
	if ( count( $zbsSMTPAccs ) == 0 ) {

		// should these be the active user, really?
		$smtpAcc['sendfromname']  = $defaultFromDeets['name'];
		$smtpAcc['sendfromemail'] = $defaultFromDeets['email'];

	}

	?>
	<div id="zbs-mail-delivery-wizard-wrap" class="hidden">


		<!--<h1 class="ui header blue" style="margin-top: 0;"><?php esc_html_e( 'Mail Delivery Setup', 'zero-bs-crm' ); ?></h1>-->


		<div class="ui three top attached steps">
			<div class="active step zbs-top-step-1">
				<i class="address card outline icon"></i>
				<div class="content">
					<div class="title"><?php esc_html_e( 'Sender Details', 'zero-bs-crm' ); ?></div>
					<div class="description"><?php esc_html_e( 'Who are you?', 'zero-bs-crm' ); ?></div>
				</div>
			</div>
			<div class="disabled step zbs-top-step-2">
				<i class="server icon"></i>
				<div class="content">
					<div class="title"><?php esc_html_e( 'Mail Server', 'zero-bs-crm' ); ?></div>
					<div class="description"><?php esc_html_e( 'Your Mail Server Settings', 'zero-bs-crm' ); ?></div>
				</div>
			</div>
			<div class="disabled step zbs-top-step-3">
				<i class="open envelope outline icon"></i>
				<div class="content">
					<div class="title"><?php esc_html_e( 'Confirmation', 'zero-bs-crm' ); ?></div>
					<div class="description"><?php esc_html_e( 'Test &amp; Verify', 'zero-bs-crm' ); ?></div>
				</div>
			</div>
		</div>
		<div class="ui attached segment borderless" id="zbs-mail-delivery-wizard-steps-wrap">


			<!-- Step 1: -->
			<div id="zbs-mail-delivery-wizard-step-1-wrap" class="zbs-step">

				<h1 class="ui header"><?php esc_html_e( 'Sender Details', 'zero-bs-crm' ); ?> <i class="address card outline icon"></i></h1>

				<div class="ui very padded segment borderless">
					<p>
						<?php esc_html_e( 'Enter your "Send From" details below. For best brand impact we recommend using a same-domain email address, although any email you have SMTP details for will work.', 'zero-bs-crm' ); ?>
						<?php ##WLREMOVE ?>
						<a href="<?php echo esc_url( $zbs->urls['kbsmtpsetup'] ); ?>"><?php esc_html_e( 'See the Guide', 'zero-bs-crm' ); ?></a>
						<?php ##/WLREMOVE ?>
					</p>
				</div>

				<div class="ui segment">
					<div class="ui form">
						<div class="field">
							<label><?php esc_html_e( 'Send From Name', 'zero-bs-crm' ); ?>:</label>
							<input id="zbs-mail-delivery-wizard-sendfromname" placeholder="<?php esc_attr_e( 'e.g. Mike Mikeson', 'zero-bs-crm' ); ?>" type="text" value="<?php echo esc_attr( $smtpAcc['sendfromname'] ); ?>">
							<div class="ui pointing label hidden" id="zbs-mail-delivery-wizard-sendfromname-error"></div>
						</div>
						<div class="field">
							<label><?php esc_html_e( 'Send From Email', 'zero-bs-crm' ); ?>:</label>
							<input id="zbs-mail-delivery-wizard-sendfromemail" placeholder="<?php esc_attr_e( 'e.g. your@domain.com', 'zero-bs-crm' ); ?>" type="text" value="<?php echo esc_attr( $smtpAcc['sendfromemail'] ); ?>">
							<div class="ui pointing label hidden" id="zbs-mail-delivery-wizard-sendfromemail-error"></div>
						</div>
						<div class="ui zbsclear">
							<button type="button" class="ui button positive right floated" id="zbs-mail-delivery-wizard-step-1-submit"><?php esc_html_e( 'Next', 'zero-bs-crm' ); ?></button>
						</div>

					</div>
				</div>

			</div>
			<!-- / Step 1 -->

			<!-- Step 2: -->
			<div id="zbs-mail-delivery-wizard-step-2-wrap" class="hidden zbs-step">

				<h1 class="ui header"><?php esc_html_e( 'Mail Server', 'zero-bs-crm' ); ?> <i class="server icon"></i></h1>

				<div class="ui very padded segment borderless">
					<p>
						<?php esc_html_e( 'The CRM can send out emails via your default server settings, API, or via an SMTP server (mail server). If you would like to reliably send emails from a custom domain, we recommend using SMTP or an API connection.', 'zero-bs-crm' ); ?>
						<?php ##WLREMOVE ?>
						<a href="<?php echo esc_url( $zbs->urls['kbsmtpsetup'] ); ?>"><?php esc_html_e( 'See the Guide', 'zero-bs-crm' ); ?></a>
						<?php ##/WLREMOVE ?>
					</p>
				</div>

				<div class="ui segment">
					<div class="ui form">

						<div class="ui grid">
							<div class="five wide column">

								<div class="field">
									<div class="ui radio checkbox" id="zbs-mail-delivery-wizard-step-2-servertype-wpmail">
										<input type="radio" name="servertype" checked="checked" tabindex="0" class="hidden">
										<label><?php esc_html_e( 'Default WordPress Mail (wp_mail)', 'zero-bs-crm' ); ?></label>
									</div>
								</div>

							</div>
							<div class="five wide column">

								<div class="field">
									<div class="ui radio checkbox" id="jpcrm-mail-delivery-wizard-step-2-servertype-oauth">
										<input type="radio" name="servertype" tabindex="1" class="hidden">
										<label><?php esc_html_e( 'API (OAuth)', 'zero-bs-crm' ); ?></label>
									</div>
								</div>
								
							</div>
							<div class="five wide column">

								<div class="field">
									<div class="ui radio checkbox" id="zbs-mail-delivery-wizard-step-2-servertype-smtp">
										<input type="radio" name="servertype" tabindex="2" class="hidden">
										<label><?php esc_html_e( 'Custom Mail Server (SMTP)', 'zero-bs-crm' ); ?></label>
									</div>
								</div>
								
							</div>
						</div>

						<div class="ui divider"></div>

						<?php

							// Load OAuth
							$zbs->load_oauth_handler();

							// here we only show settings where OAuth is enabled (requires PHP 7.3)
						if ( $zbs->oauth->enabled() ) {

							$oauth_settings_page_url   = jpcrm_esc_link( $zbs->slugs['settings'] . '&tab=oauth' );
							$oauth_available_providers = array();
							$oauth_possible_providers  = array( 'google_mail' );

							// check each profile to see if valid connection
							foreach ( $oauth_possible_providers as $provider_key ) {

								// got valid connection?
								if ( $zbs->oauth->connection_status( $provider_key ) ) {

									$oauth_available_providers[ $provider_key ] = array(
										'provider' => $zbs->oauth->get_provider( $provider_key ),
										'config'   => $zbs->oauth->get_provider_config( $provider_key ),
									);

								}
							}

							?>
							<div class="hidden" id="jpcrm-mail-delivery-wizard-step-2-api" style="padding:1em">
								<div class="field">
									<label for="oauth_connections"><?php echo wp_kses( sprintf( __( 'Select <a href="%s" target="_blank">OAuth Connection</a>', 'zero-bs-crm' ), esc_url( $oauth_settings_page_url ) ), $zbs->acceptable_restricted_html ); ?></label>
									<select id="oauth_connections">
									<?php

										// got connection?
									if ( count( $oauth_available_providers ) > 0 ) {

										?>
												<option value="-1" selected="selected" disabled="disabled"><?php esc_html_e( 'Select an OAuth Connection', 'zero-bs-crm' ); ?></option>
												<option value="-1" disabled="disabled">=================</option>
											<?php
											foreach ( $oauth_available_providers as $oauth_profile_key => $oauth_profile ) {

												$oauth_profile_detail = '';
												if ( isset( $oauth_profile['config']['meta'] ) && isset( $oauth_profile['config']['meta']['email'] ) ) {
													if ( ! empty( $oauth_profile['config']['meta']['email'] ) ) {
														$oauth_profile_detail = ' (' . $oauth_profile['config']['meta']['email'] . ')';
													}
												}

												echo '<option value="' . esc_attr( $oauth_profile_key ) . '">' . esc_html( $oauth_profile['provider']['name'] . $oauth_profile_detail ) . '</option>';

											}
									} else {

											// no available connections,
										?>
												<option value="-1" selected="selected" disabled="disabled"><?php esc_html_e( 'No active OAuth connections', 'zero-bs-crm' ); ?></option>
												<?php

									}
									?>
									</select>
									<div class="ui pointing label hidden" id="zbs-mail-delivery-wizard-oauth-error"></div>
								</div> <!-- .field -->
							</div>
							<?php
						} else {

							// OAuth is disabled (probably <PHP 7.3)
							?>
							<div class="hidden" id="jpcrm-mail-delivery-wizard-step-2-api" style="padding:1em">
								<div class="field">
									<?php echo wp_kses( sprintf( __( 'Currently your system does not support OAuth API connections. <a href="%s" target="_blank">Read More</a>', 'zero-bs-crm' ), esc_url( $zbs->urls['kb-oauth-requirements'] ) ), $zbs->acceptable_restricted_html ); ?>
									<select id="oauth_connections" style="display:none"></select>
								</div> <!-- .field -->
							</div>
							<?php

						}
						?>



						<div class="hidden" id="zbs-mail-delivery-wizard-step-2-prefill-smtp" style="padding:1em">
							<div class="field">
								<label for="smtpCommonProviders"><?php esc_html_e( 'Quick-fill SMTP Details:', 'zero-bs-crm' ); ?></label>
								<select id="smtpCommonProviders">
									<option value="-1" selected="selected" disabled="disabled"><?php esc_html_e( 'Select a common provider:', 'zero-bs-crm' ); ?></option>
									<option value="-1" disabled="disabled">=================</option>
									<?php
									// Hard typed: <option value="ses1" data-host="email-smtp.us-east-1.amazonaws.com" data-auth="tls" data-port="587" data-example="AKGAIR8K9UBGAZY5UMLA">AWS SES US East (N. Virginia)</option><option value="ses3" data-host="email-smtp.us-west-2.amazonaws.com" data-auth="tls" data-port="587" data-example="AKGAIR8K9UBGAZY5UMLA">AWS SES US West (Oregon)</option><option value="ses2" data-host="email-smtp.eu-west-1.amazonaws.com" data-auth="tls" data-port="587" data-example="AKGAIR8K9UBGAZY5UMLA">AWS SES EU (Ireland)</option><option value="sendgrid" data-host="smtp.sendgrid.net" data-auth="tls" data-port="587" data-example="you@yourdomain.com">SendGrid</option><option value="gmail" data-host="smtp.gmail.com" data-auth="ssl" data-port="465" data-example="you@gmail.com">GMail</option><option value="outlook" data-host="smtp.live.com" data-auth="tls" data-port="587" data-example="you@outlook.com">Outlook.com</option><option value="office365" data-host="smtp.office365.com" data-auth="tls" data-port="587" data-example="you@office365.com">Office365.com</option><option value="yahoo" data-host="smtp.mail.yahoo.com" data-auth="ssl" data-port="465" data-example="you@yahoo.com">Yahoo Mail</option><option value="yahooplus" data-host="plus.smtp.mail.yahoo.com" data-auth="ssl" data-port="465" data-example="you@yahoo.com">Yahoo Mail Plus</option><option value="yahoouk" data-host="smtp.mail.yahoo.co.uk" data-auth="ssl" data-port="465" data-example="you@yahoo.co.uk">Yahoo Mail UK</option><option value="aol" data-host="smtp.aol.com" data-auth="tls" data-port="587" data-example="you@aol.com">AOL.com</option><option value="att" data-host="smtp.att.yahoo.com" data-auth="ssl" data-port="465" data-example="you@att.com">AT&amp;T</option><option value="hotmail" data-host="smtp.live.com" data-auth="tls" data-port="587" data-example="you@hotmail.com">Hotmail</option><option value="oneandone" data-host="smtp.1and1.com" data-auth="tls" data-port="587" data-example="you@yourdomain.com">1 and 1</option><option value="zoho" data-host="smtp.zoho.com" data-auth="ssl" data-port="465" data-example="you@zoho.com">Zoho</option><option value="mailgun" data-host="smtp.mailgun.org" data-auth="ssl" data-port="465" data-example="postmaster@YOUR_DOMAIN_NAME">MailGun</option><option value="oneandonecom" data-host="smtp.1and1.com" data-auth="tls" data-port="587" data-example="you@yourdomain.com">OneAndOne.com</option><option value="oneandonecouk" data-host="auth.smtp.1and1.co.uk" data-auth="tls" data-port="587" data-example="you@yourdomain.co.uk">OneAndOne.co.uk</option>

									// } This allows easy update though :)
									$commonSMTPSettings = jpcrm_maildelivery_common_SMTP_settings();
									foreach ( $commonSMTPSettings as $settingPerm => $settingArr ) {

										echo sprintf(
											'<option value="%s">%s</option>',
											esc_attr( $settingPerm ),
											esc_html( $settingArr['name'] )
										);

									}

									?>
								</select>
							</div> <!-- .field -->
							<div id="jpcrm-maildelivery-description"></div>
						</div>

						<div class="ui zbstrans segment hidden" id="zbs-mail-delivery-wizard-step-2-smtp-wrap">

							<!-- SMTP DEETS -->
							<div class="ui grid">
								<div class="eight wide column">

									<div class="required field">
										<label for="zbs-mail-delivery-wizard-step-2-smtp-host"><?php esc_html_e( 'SMTP Address', 'zero-bs-crm' ); ?></label>
										<input type="text" placeholder="e.g. pro.turbo-smtp.com" id="zbs-mail-delivery-wizard-step-2-smtp-host" class="mailInp" value="" />
										<div class="ui pointing label hidden" id="zbs-mail-delivery-wizard-smtphost-error"></div>
									</div> <!-- .field -->
									<div class="required field">
										<label for="zbs-mail-delivery-wizard-step-2-smtp-port"><?php esc_html_e( 'SMTP Port', 'zero-bs-crm' ); ?></label>
										<div class="seven wide field">
											<input type="text" placeholder="e.g. 587 or 465" id="zbs-mail-delivery-wizard-step-2-smtp-port" class="mailInp" value="587" />
										</div>
										<div class="ui pointing label hidden" id="zbs-mail-delivery-wizard-smtpport-error"></div>
									</div> <!-- .field -->

									<!--
									<div class="ui toggle checkbox">
										<input type="checkbox" name="public">
										<label>Use SSL Authentication</label>
									</div>
									-->
								</div>
								<div class="eight wide column">


									<div class="required field">
										<label for="zbs-mail-delivery-wizard-step-2-smtp-user"><?php esc_html_e( 'Username', 'zero-bs-crm' ); ?></label>
										<input type="text" placeholder="e.g. mike or mike@yourdomain.com" id="zbs-mail-delivery-wizard-step-2-smtp-user" class="mailInp" value="" autocomplete="new-smtpuser-<?php echo esc_attr( time() ); ?>" />
										<div class="ui pointing label hidden" id="zbs-mail-delivery-wizard-smtpuser-error"></div>
									</div> <!-- .field -->

									<div class="required field">
										<label for="zbs-mail-delivery-wizard-step-2-smtp-pass"><?php esc_html_e( 'Password', 'zero-bs-crm' ); ?></label>
										<input type="text" placeholder="" id="zbs-mail-delivery-wizard-step-2-smtp-pass" class="mailInp" value="" autocomplete="new-password-<?php echo esc_attr( time() ); ?>" />
										<div class="ui pointing label hidden" id="zbs-mail-delivery-wizard-smtppass-error"></div>
									</div> <!-- .field -->

								</div>
							</div>
							<!-- / SMTP DEETS -->


						</div>

						<div class="ui divider hidden jpcrm-mail-delivery-wizard-step-2-spacer"></div>

						<div class="ui zbsclear">
							<button type="button" class="ui button" id="zbs-mail-delivery-wizard-step-2-back"><?php esc_html_e( 'Back', 'zero-bs-crm' ); ?></button>
							<button type="button" class="ui button positive right floated" id="zbs-mail-delivery-wizard-step-2-submit"><?php esc_html_e( 'Validate Settings', 'zero-bs-crm' ); ?></button>
						</div>
					</div> <!-- / segment -->

					<div class="ui very padded segment borderless">
						<p><?php esc_html_e( 'After this step Jetpack CRM will probe your server and attempt to send a test email in order to validate your settings.', 'zero-bs-crm' ); ?></p>
					</div>

				</div>

			</div>
			<!-- / Step 2 -->



			<!-- Step 3: -->
			<div id="zbs-mail-delivery-wizard-step-3-wrap" class="hidden zbs-step">

				<h1 class="ui header"><?php esc_html_e( 'Confirmation', 'zero-bs-crm' ); ?> <i class="open envelope outline icon"></i></h1>


				<div class="ui segment" id="zbs-mail-delivery-wizard-validate-console-wrap">

					<div class="ui padded zbsbigico segment loading borderless" id="zbs-mail-delivery-wizard-validate-console-ico">&nbsp;</div>

					<div class="ui padded segment borderless" id="zbs-mail-delivery-wizard-validate-console"><?php esc_html_e( 'Attempting to connect to mail server...', 'zero-bs-crm' ); ?></div>

					<div class="ui padded segment borderless hidden" id="zbs-mail-delivery-wizard-admdebug"></div>

					<div class="ui zbsclear">
						<button type="button" class="ui hidden button" id="zbs-mail-delivery-wizard-step-3-back"><?php esc_html_e( 'Back', 'zero-bs-crm' ); ?></button>
						<button type="button" class="ui button positive right floated disabled" id="zbs-mail-delivery-wizard-step-3-submit"><?php esc_html_e( 'Finish', 'zero-bs-crm' ); ?></button>
					</div>

				</div>
			</div>

		<!-- / Step 3 -->
	</div>



</div>

<?php
if ( $runningLocally ) {

	?>
	<div class="ui message"><div class="header"><div class="ui yellow label"><?php esc_html_e( 'Local Machine?', 'zero-bs-crm' ); ?></div></div><p><?php esc_html_e( 'It appears you are running Jetpack CRM locally, this may cause SMTP delivery methods to behave unexpectedly.<br />(e.g. your computer may block outgoing SMTP traffic via firewall or anti-virus software).<br />Jetpack CRM may require external web hosting to properly send via SMTP.', 'zero-bs-crm' ); ?></p></div>
	<?php

}
?>


	<style type="text/css">

		/*
			see scss
		*/

	</style>

<?php wp_enqueue_script( 'jpcrm-admin-maildelivery', plugins_url( '/js/jpcrm-admin-maildelivery' . wp_scripts_get_suffix() . '.js', ZBS_ROOTFILE ), array(), $zbs->version ); ?>
</div>
