<?php
/*
!
 * Admin Page: Settings: Mail Delivery method wizard AJAX
 */

// stop direct access
if ( ! defined( 'ZEROBSCRM_PATH' ) ) {
	exit;
}

function jpcrm_maildelivery_common_SMTP_settings() {

	global $zbs;

	return array(

		// auth: tls, ssl, none

		'aws_ses'       => array(
			'name'        => 'Amazon AWS/SES',
			'host'        => '',
			'auth'        => 'tls',
			'port'        => 587,
			'userexample' => 'AKGAIR8K9UBGAZY5UMLA',
			'description' => __( 'As Amazon SES (Simple Email Service) settings vary, you will need to look at their documentation for specifics.', 'zero-bs-crm' ) . ' <a href="https://aws.amazon.com/premiumsupport/knowledge-center/ses-set-up-connect-smtp/" target="_blank">' . __( 'View docs', 'zero-bs-crm' ) . '</a>.',
		),
		'gmail'         => array(
			'name'        => 'Gmail/Google Workspace',
			'host'        => '',
			'auth'        => '',
			'port'        => '',
			'userexample' => 'you@yourdomain.com',
			'description' => sprintf( __( 'Gmail and Google Workspace now require an API connection via OAuth instead of SMTP settings. For more information on how to configure your CRM, <a href="%s" target="_blank">see our guide here</a>.', 'zero-bs-crm' ), $zbs->urls['oauthdocs'] ),
		),
		'sendgrid'      => array(
			'name'        => 'SendGrid',
			'host'        => 'smtp.sendgrid.net',
			'auth'        => 'tls', // StartTLS
			'port'        => 587,
			'userexample' => 'you@yourdomain.com',
		),
		'outlook'       => array(
			'name'        => 'Outlook.com',
			'host'        => 'smtp.live.com', // or smtp-mail.outlook.com
			'auth'        => 'tls', // StartTLS
			'port'        => 587,
			'userexample' => 'you@outlook.com',
		),
		'office365'     => array(
			'name'        => 'Office365.com',
			'host'        => 'smtp.office365.com',
			'auth'        => 'tls',
			'port'        => 587,
			'userexample' => 'you@office365.com',
		),
		'yahoo'         => array(
			'name'        => 'Yahoo Mail',
			'host'        => 'smtp.mail.yahoo.com',
			'auth'        => 'ssl',
			'port'        => 465,
			'userexample' => 'you@yahoo.com',
		),
		'yahooplus'     => array(
			'name'        => 'Yahoo Mail Plus',
			'host'        => 'plus.smtp.mail.yahoo.com',
			'auth'        => 'ssl',
			'port'        => 465,
			'userexample' => 'you@yahoo.com',
		),
		'yahoouk'       => array(
			'name'        => 'Yahoo Mail UK',
			'host'        => 'smtp.mail.yahoo.co.uk',
			'auth'        => 'ssl',
			'port'        => 465,
			'userexample' => 'you@yahoo.co.uk',
		),
		'aol'           => array(
			'name'        => 'AOL.com',
			'host'        => 'smtp.aol.com',
			'auth'        => 'tls',
			'port'        => 587,
			'userexample' => 'you@aol.com',
		),
		'att'           => array(
			'name'        => 'AT&T',
			'host'        => 'smtp.att.yahoo.com',
			'auth'        => 'ssl',
			'port'        => 465,
			'userexample' => 'you@att.com',
		),
		'hotmail'       => array(
			'name'        => 'Hotmail',
			'host'        => 'smtp.live.com', // or smtp-mail.outlook.com
			'auth'        => 'tls', // 'ssl',
			'port'        => 587, // 465,
			'userexample' => 'you@hotmail.com',
		),
		'oneandone'     => array(
			'name'        => '1 and 1 (US)',
			'host'        => 'smtp.1and1.com',
			'auth'        => 'tls',
			'port'        => 587,
			'userexample' => 'you@yourdomain.com',
		),
		'oneandoneuk'   => array(
			'name'        => '1 and 1 (UK)',
			'host'        => 'auth.smtp.1and1.co.uk',
			'auth'        => 'tls',
			'port'        => 587,
			'userexample' => 'you@yourdomain.co.uk',
		),
		'zoho'          => array(
			'name'        => 'Zoho',
			'host'        => 'smtp.zoho.com',
			'auth'        => 'ssl',
			'port'        => 465,
			'userexample' => 'you@zoho.com',
		),
		// https://help.mailgun.com/hc/en-us/articles/203380100-Where-can-I-find-my-API-key-and-SMTP-credentials-
		'mailgun'       => array(
			'name'        => 'MailGun',
			'host'        => 'smtp.mailgun.org',
			'auth'        => 'ssl',
			'port'        => 465,
			'userexample' => 'postmaster@YOUR_DOMAIN_NAME',
		),
		'oneandonecom'  => array(
			'name'        => 'OneAndOne.com',
			'host'        => 'smtp.1and1.com',
			'auth'        => 'tls',
			'port'        => 587,
			'userexample' => 'you@yourdomain.com',
		),
		'oneandonecouk' => array(
			'name'        => 'OneAndOne.co.uk',
			'host'        => 'auth.smtp.1and1.co.uk',
			'auth'        => 'tls',
			'port'        => 587,
			'userexample' => 'you@yourdomain.co.uk',
		),

	);
}

/**
 * Language labels for JS
 */
function jpcrm_maildelivery_js_language_labels( $language_array = array() ) {

	global $zbs;

	// add our labels
	$language_array['pleaseEnter']      = __( 'Please enter a value', 'zero-bs-crm' );
	$language_array['pleaseEnterEmail'] = __( 'Please enter a valid email address', 'zero-bs-crm' );
	$language_array['thanks']           = __( 'Thank you', 'zero-bs-crm' );
	$language_array['defaultText']      = __( 'Default', 'zero-bs-crm' );

	// email delivery setup
	$language_array['settingsValidatedWPMail']       = __( 'Your Email Delivery option has been validated. A test email has been sent via wp_mail, the default WordPress mail provider, to: ', 'zero-bs-crm' );
	$language_array['settingsValidatedWPMailError']  = sprintf( __( 'There was an error sending a mail via wp_mail. Please go back and check your email address. If this persists please <a href="%s" target="_blank">contact support</a>.', 'zero-bs-crm' ), $zbs->urls['support'] );
	$language_array['settingsValidateSMTPProbing']   = __( 'Probing your mail server (this may take a few seconds)...', 'zero-bs-crm' );
	$language_array['settingsValidateSMTPPortCheck'] = __( 'Checking Ports are Open (this may take a few seconds)...', 'zero-bs-crm' );
	$language_array['settingsValidateSMTPAttempt']   = __( 'Attempting to send test email...', 'zero-bs-crm' );
	$language_array['settingsValidateSMTPSuccess']   = __( 'Test email sent...', 'zero-bs-crm' );

	$language_array['settingsValidatedSMTP']             = __( 'Your Email Delivery option has been validated. A test email has been sent via SMTP to the address below. Please check you received this email to ensure a complete test.', 'zero-bs-crm' ) . '<a href="#debug" id="zbs-mail-delivery-showdebug">' . __( 'debug output', 'zero-bs-crm' ) . '</a> (' . __( 'click to view', 'zero-bs-crm' ) . '.';
	$language_array['settingsValidatedSMTPProbeError']   = sprintf( __( 'Jetpack CRM has tested your settings, and also tried probing your mail server, but unfortunately it was not possible to confirm a test email was sent. Please go back and check your settings, and if this persists please <a href="%s" target="_blank">contact support</a>, optionally sending us the <a href="#debug" id="zbs-mail-delivery-showdebug">debug output</a> (click to view).', 'zero-bs-crm' ), $zbs->urls['support'] );
	$language_array['settingsValidatedSMTPGeneralError'] = sprintf( __( 'There was an error sending a mail via SMTP. Please go back and check your settings, and if this persists please <a href="%s" target="_blank">contact support</a>, optionally sending us the <a href="#debug" id="zbs-mail-delivery-showdebug">debug output</a> (click to view).', 'zero-bs-crm' ), $zbs->urls['support'] );

	$language_array['oauthConnection']             = __( 'Please select a valid OAuth connection', 'zero-bs-crm' );
	$language_array['settingsValidatedOAuth']      = __( 'Your Email Delivery option has been validated. A test email has been sent via API to: ', 'zero-bs-crm' );
	$language_array['settingsValidatedOAuthError'] = sprintf( __( 'There was an error sending a mail via API. Please go back and check your email address and connection settings. If this persists please <a href="%s" target="_blank">contact support</a>.', 'zero-bs-crm' ), $zbs->urls['support'] );

	// send test from list view
	$language_array['sendTestMail']        = __( 'Send a test email from', 'zero-bs-crm' );
	$language_array['sendTestButton']      = __( 'Send test', 'zero-bs-crm' );
	$language_array['sendTestWhere']       = __( 'Which email address should we send the test email to?', 'zero-bs-crm' );
	$language_array['sendTestFail']        = __( 'There was an error sending this test', 'zero-bs-crm' );
	$language_array['sendTestSent']        = __( 'Test Sent Successfully', 'zero-bs-crm' );
	$language_array['sendTestSentSuccess'] = __( 'Test email was successfully sent to', 'zero-bs-crm' );
	$language_array['sendTestSentFailed']  = __( 'Test email could not be sent (problem with this mail delivery method?)', 'zero-bs-crm' );

	// delete mail delivery method via list view
	$language_array['deleteMailDeliverySureTitle']          = __( 'Are you sure?', 'zero-bs-crm' );
	$language_array['deleteMailDeliverySureText']           = __( 'This will totally remove this mail delivery method from your Jetpack CRM.', 'zero-bs-crm' );
	$language_array['deleteMailDeliverySureConfirm']        = __( 'Yes, remove it!', 'zero-bs-crm' );
	$language_array['deleteMailDeliverySureDeletedTitle']   = __( 'Delivery Method Removed', 'zero-bs-crm' );
	$language_array['deleteMailDeliverySureDeletedText']    = __( 'Your mail delivery method has been successfully removed.', 'zero-bs-crm' );
	$language_array['deleteMailDeliverySureDeleteErrTitle'] = __( 'Delivery Method Not Removed', 'zero-bs-crm' );
	$language_array['deleteMailDeliverySureDeleteErrText']  = __( 'There was a general error removing this mail delivery method.', 'zero-bs-crm' );

	// set mail delivery method  as default via list view
	$language_array['defaultMailDeliverySureTitle']          = __( 'Are you sure?', 'zero-bs-crm' );
	$language_array['defaultMailDeliverySureText']           = __( 'Do you want to default to this mail delivery method?', 'zero-bs-crm' );
	$language_array['defaultMailDeliverySureConfirm']        = __( 'Set as Default', 'zero-bs-crm' );
	$language_array['defaultMailDeliverySureDeletedTitle']   = __( 'Default Saved', 'zero-bs-crm' );
	$language_array['defaultMailDeliverySureDeletedText']    = __( 'Your mail delivery method default has been successfully saved.', 'zero-bs-crm' );
	$language_array['defaultMailDeliverySureDeleteErrTitle'] = __( 'Default Not Updated', 'zero-bs-crm' );
	$language_array['defaultMailDeliverySureDeleteErrText']  = __( 'There was a general error when setting this mail delivery method default.', 'zero-bs-crm' );

	$language_array['likelytimeout'] = __( 'The Wizard timed out when trying to connect to your Mail Server. This probably means your server is blocking the SMTP port you have specified, please check with them that they have these ports open. If they will not open the ports, you may have to use wp_mail mode.', 'zero-bs-crm' );

	return $language_array;
}
add_filter( 'zbs_globaljs_lang', 'jpcrm_maildelivery_js_language_labels' );

/**
 * JS Vars (get added to jpcrm_root var stack)
 */
function jpcrm_maildelivery_js_vars( $var_array = array() ) {

	$var_array['jpcrm_nonce']    = wp_create_nonce( 'wpzbs-ajax-nonce' );
	$var_array['current_url']    = admin_url( 'admin.php?page=zerobscrm-plugin-settings&tab=maildelivery' );
	$var_array['smtp_providers'] = jpcrm_maildelivery_common_SMTP_settings();

	return $var_array;
}
add_filter( 'zbs_globaljs_vars', 'jpcrm_maildelivery_js_vars' );

// } Attempts to validate wp mail settings, send test email,  & save's if validated
add_action( 'wp_ajax_zbs_maildelivery_validation_wp_mail', 'zeroBSCRM_AJAX_mailDelivery_validateWPMail' );
function zeroBSCRM_AJAX_mailDelivery_validateWPMail() {

	// } Check nonce
	check_ajax_referer( 'wpzbs-ajax-nonce', 'sec' );  // nonce to bounce out if not from right page

	// } Perms?
	if ( ! zeroBSCRM_permsMailCampaigns() ) {
		exit( '{permserror:1}' );
	}

	// } Retrieve...
	$sendFromName = '';
	if ( isset( $_POST['sendFromName'] ) ) {
		$sendFromName = sanitize_text_field( $_POST['sendFromName'] );
	}
	$sendFromEmail = '';
	if ( isset( $_POST['sendFromEmail'] ) ) {
		$sendFromEmail = sanitize_text_field( $_POST['sendFromEmail'] );
	}

	// } ... validate
	$res = array();
	if ( ! empty( $sendFromName ) ) {

		if ( ! empty( $sendFromEmail ) && zeroBSCRM_validateEmail( $sendFromEmail ) ) {

			// checks out, send a test :)

				$subject   = '[Jetpack CRM] Mail Delivery Routine';
				$headers   = array( 'Content-Type: text/html; charset=UTF-8' );
				$headers[] = 'From: ' . $sendFromName . ' <' . $sendFromEmail . '>';

				// See .mail-templating.php
				$body = zeroBSCRM_mailDelivery_generateTestHTML( true );

				// sends to itself to test
				$sent = wp_mail( $sendFromEmail, $subject, $body, $headers );

			if ( $sent ) {

				// } Save record.
				global $zbs;
				$existing_mail_delivery_methods = zeroBSCRM_getSetting( 'smtpaccs' );
				if ( ! is_array( $existing_mail_delivery_methods ) ) {
					$existing_mail_delivery_methods = array();
				}

					// } Build arr
					$settingsArr = array(

						'mode'      => 'wp_mail',
						'fromemail' => $sendFromEmail,
						'fromname'  => $sendFromName,
						'replyto'   => $sendFromEmail,
						'cc'        => '',
						'bcc'       => '',
						'veri'      => time(), // verified

					);
					$settingsKey = zeroBSCRM_mailDelivery_makeKey( $settingsArr );

					/*
						Switched to settings key mode
					// brutal add to arr (if email not present)
					$ind = -1; if (count($existing_mail_delivery_methods) > 0) foreach ($existing_mail_delivery_methods as $indx => $acc){

						if (isset($acc['fromemail']) && !empty($acc['fromemail']) && $acc['fromemail'] == $sendFromEmail) $ind = $indx;
					}
					if ($ind > -1){

						// replace
						$existing_mail_delivery_methods[$ind] = $settingsArr;

					} else {

						// new
						$existing_mail_delivery_methods[] = $settingsArr;

					} */
					if ( ! isset( $existing_mail_delivery_methods[ $settingsKey ] ) ) {
						$existing_mail_delivery_methods[ $settingsKey ] = $settingsArr;
					} else {
						exit( '{keyerror:1}' );
					}

					// } Update
					$zbs->settings->update( 'smtpaccs', $existing_mail_delivery_methods );

					// if ONLY 1 installed, set as default
					if ( count( $existing_mail_delivery_methods ) == 1 ) {
						$zbs->settings->update( 'smtpaccsdef', $settingsKey );
					}

					// fini
					$res['success'] = 1;

			} else {

					// send error
				if ( ! isset( $res['errors'] ) || ! is_array( $res['errors'] ) ) {
					$res['errors'] = array();
				}
					$res['errors']['senderror'] = 1;

			}
		} else {

			// no good email
			if ( ! isset( $res['errors'] ) || ! is_array( $res['errors'] ) ) {
				$res['errors'] = array();
			}
			$res['errors']['bademail'] = 1;

		}
	} else {

		// no name?
		if ( ! isset( $res['errors'] ) || ! is_array( $res['errors'] ) ) {
			$res['errors'] = array();
		}
		$res['errors']['nameempty'] = 1;

	}

	header( 'Content-Type: application/json' );
	echo json_encode( $res );
	exit();
}

// } Attempts to validate mail delivery SMTP settings, send test email, & save's if validated
add_action( 'wp_ajax_zbs_maildelivery_validation_smtp', 'zeroBSCRM_AJAX_mailDelivery_validateSMTP' );
function zeroBSCRM_AJAX_mailDelivery_validateSMTP() {

	// } Check nonce
	check_ajax_referer( 'wpzbs-ajax-nonce', 'sec' );  // nonce to bounce out if not from right page

	// } Perms?
	if ( ! zeroBSCRM_permsMailCampaigns() ) {
		exit();
	}

	// } Retrieve...
	$sendFromName = '';
	if ( isset( $_POST['sendFromName'] ) ) {
		$sendFromName = sanitize_text_field( $_POST['sendFromName'] );
	}
	$sendFromEmail = '';
	if ( isset( $_POST['sendFromEmail'] ) ) {
		$sendFromEmail = sanitize_text_field( $_POST['sendFromEmail'] );
	}
	$smtpHost = '';
	if ( isset( $_POST['smtpHost'] ) ) {
		$smtpHost = sanitize_text_field( $_POST['smtpHost'] );
	}
	$smtpPort = '';
	if ( isset( $_POST['smtpPort'] ) ) {
		$smtpPort = sanitize_text_field( $_POST['smtpPort'] );
	}
	$smtpUser = '';
	if ( isset( $_POST['smtpUser'] ) ) {
		$smtpUser = sanitize_text_field( $_POST['smtpUser'] );
	}
	$smtpPass = '';
	if ( isset( $_POST['smtpPass'] ) ) {
		$smtpPass = sanitize_text_field( $_POST['smtpPass'] );
	}

	// } ... validate
	$res = array( 'debugs' => array() );
	if ( ! empty( $sendFromName ) ) {

		// has name

		if ( ! empty( $sendFromEmail ) && zeroBSCRM_validateEmail( $sendFromEmail ) ) {

			// let's try and probe SMTP :)
			$attemptedSend = zeroBSCRM_mailDelivery_checkSMTPDetails( $sendFromName, $sendFromEmail, $smtpHost, $smtpPort, $smtpUser, $smtpPass );

			if ( is_array( $attemptedSend ) && isset( $attemptedSend['sent'] ) && $attemptedSend['sent'] ) {

				// passed the test, but might have been a latter config, so need to use whichever was the lasting config from the above func!
				if ( isset( $attemptedSend['finset'] ) && is_array( $attemptedSend['finset'] ) ) {

						// no checks here. :o
						$smtpHost = $attemptedSend['finset']['host'];
						$smtpPort = $attemptedSend['finset']['port'];
						// these two won't be different..
						// $smtpUser = $attemptedSend['finset']['user'];
						// $smtpPass = $attemptedSend['finset']['pass'];
						$smtpSecurity = $attemptedSend['finset']['security'];

						// save it
						global $zbs;
						$existing_mail_delivery_methods = zeroBSCRM_getSetting( 'smtpaccs' );
					if ( ! is_array( $existing_mail_delivery_methods ) ) {
						$existing_mail_delivery_methods = array();
					}

						// load encryption lib
						$zbs->load_encryption();

						// encrypt password:
						$encrypted_password = $zbs->encryption->encrypt( $smtpPass, 'smtp' );

						// } Build arr
						$settingsArr = array(

							'mode'      => 'smtp',
							'fromemail' => $sendFromEmail,
							'fromname'  => $sendFromName,
							'host'      => $smtpHost,
							'port'      => $smtpPort,
							'user'      => $smtpUser,
							'pass'      => $encrypted_password,
							'sec'       => $smtpSecurity,
							'veri'      => time(), // verified

						);
						$settingsKey = zeroBSCRM_mailDelivery_makeKey( $settingsArr );

						if ( ! isset( $existing_mail_delivery_methods[ $settingsKey ] ) ) {
							$existing_mail_delivery_methods[ $settingsKey ] = $settingsArr;
						} else {
							exit( '{errors:[{keyerrors:1}]}' );
						}

						// } Update
						global $zbs;
						$zbs->settings->update( 'smtpaccs', $existing_mail_delivery_methods );

						// fini
						$res['success'] = 1;

						// add debugs to response (2.94.2 - help debugging)
						if ( isset( $attemptedSend['debugs'] ) && is_array( $attemptedSend['debugs'] ) ) {
							$res['debugs'] = array_merge( $res['debugs'], $attemptedSend['debugs'] );
						}
				} else {

						// send seemed to succeed, but func didn't give settings back?!?!
					if ( ! isset( $res['errors'] ) || ! is_array( $res['errors'] ) ) {
						$res['errors'] = array();
					}
						$res['errors']['settingspasserror'] = 1;

						// add debugs to response (2.94.2 - help debugging)
					if ( isset( $attemptedSend['debugs'] ) && is_array( $attemptedSend['debugs'] ) ) {
						$res['debugs'] = array_merge( $res['debugs'], $attemptedSend['debugs'] );
					}
				}
			} else {

					// send error
				if ( ! isset( $res['errors'] ) || ! is_array( $res['errors'] ) ) {
					$res['errors'] = array();
				}
					$res['errors']['senderror'] = 1;

					// add debugs to response (2.94.2 - help debugging)
				if ( isset( $attemptedSend['debugs'] ) && is_array( $attemptedSend['debugs'] ) ) {
					$res['debugs'] = array_merge( $res['debugs'], $attemptedSend['debugs'] );
				}
			}
		} else {

			// no good email
			if ( ! isset( $res['errors'] ) || ! is_array( $res['errors'] ) ) {
				$res['errors'] = array();
			}
			$res['errors']['bademail'] = 1;

		}
	} else {

		// no name?
		if ( ! isset( $res['errors'] ) || ! is_array( $res['errors'] ) ) {
			$res['errors'] = array();
		}
		$res['errors']['nameempty'] = 1;

	}

	header( 'Content-Type: application/json' );
	// requires zeroBSCRM_utf8ize for proper debug passing
	echo json_encode( zeroBSCRM_utf8ize( $res ) );
	exit();
}

// } quickly checks if ports are open (pre smtp check)
add_action( 'wp_ajax_zbs_maildelivery_validation_smtp_ports', 'zeroBSCRM_AJAX_mailDelivery_validateSMTPPorts' );
function zeroBSCRM_AJAX_mailDelivery_validateSMTPPorts() {

	// } Check nonce
	check_ajax_referer( 'wpzbs-ajax-nonce', 'sec' );  // nonce to bounce out if not from right page

	// } Perms?
	if ( ! zeroBSCRM_permsMailCampaigns() ) {
		exit();
	}

	// } Retrieve...
	$sendFromName = '';
	if ( isset( $_POST['sendFromName'] ) ) {
		$sendFromName = sanitize_text_field( $_POST['sendFromName'] );
	}
	$sendFromEmail = '';
	if ( isset( $_POST['sendFromEmail'] ) ) {
		$sendFromEmail = sanitize_text_field( $_POST['sendFromEmail'] );
	}
	$smtpHost = '';
	if ( isset( $_POST['smtpHost'] ) ) {
		$smtpHost = sanitize_text_field( $_POST['smtpHost'] );
	}
	$smtpPort = '';
	if ( isset( $_POST['smtpPort'] ) ) {
		$smtpPort = sanitize_text_field( $_POST['smtpPort'] );
	}
	$smtpUser = '';
	if ( isset( $_POST['smtpUser'] ) ) {
		$smtpUser = sanitize_text_field( $_POST['smtpUser'] );
	}
	$smtpPass = '';
	if ( isset( $_POST['smtpPass'] ) ) {
		$smtpPass = sanitize_text_field( $_POST['smtpPass'] );
	}

	// } ... validate
	$res  = array( 'debugs' => array() );
	$okay = false;
	if ( ! empty( $smtpPort ) ) {

		$okay = true;

		// has smtpPort

		// port check (local)
		/*
		leave to smtp wiz for now */
		/*
		$localPortCheck = zeroBSCRM_mailDelivery_checkPort($smtpPort,$smtpHost);
		if (!$localPortCheck[0]){
			$res['debugs'][] = __('Your server seems to be blocking outbound traffic for this port: '.$smtpPort.', it will not be possible to send mail while this port is blocked.','zero-bs-crm');
			$okay = false;
		} */
		// remote + local, one test :)
		$remotePortCheck = zeroBSCRM_mailDelivery_checkPort( $smtpPort, $smtpHost );
		if ( ! $remotePortCheck[0] ) {
			$res['debugs'][] = sprintf( __( 'The CRM cannot connect to %1$s on port %2$s. This may not matter, as it will try other ports for you below.', 'zero-bs-crm' ), $smtpHost, $smtpPort );
			$okay            = false;
		}
	}

	$res['open'] = $okay;
	header( 'Content-Type: application/json' );
	// requires zeroBSCRM_utf8ize for proper debug passing
	echo json_encode( zeroBSCRM_utf8ize( $res ) );
	exit();
}

/*
* Attempts to validate OAuth mail settings, send test email,  & save's if validated
*/
add_action( 'wp_ajax_jpcrm_maildelivery_validation_api', 'jpcrm_ajax_mail_delivery_validate_api_oauth' );
function jpcrm_ajax_mail_delivery_validate_api_oauth() {

	global $zbs;

	// Check nonce
	check_ajax_referer( 'wpzbs-ajax-nonce', 'sec' );  // nonce to bounce out if not from right page

	// Permission check
	if ( ! zeroBSCRM_permsMailCampaigns() ) {
		exit( '{permserror:1}' );
	}

	// return
	$return = array(
		'errors' => array(),
	);

	// Retrieve parameters
	$send_from_name = '';
	if ( isset( $_POST['send_from_name'] ) ) {
		$send_from_name = sanitize_text_field( $_POST['send_from_name'] );
	}
	$send_from_email = '';
	if ( isset( $_POST['send_from_email'] ) ) {
		$send_from_email = sanitize_text_field( $_POST['send_from_email'] );
	}
	$oauth_provider = '';
	if ( isset( $_POST['oauth_provider'] ) ) {
		$oauth_provider = sanitize_text_field( $_POST['oauth_provider'] );
	}

	// Load OAuth
	$zbs->load_oauth_handler();

	// Validate provider
	if ( $zbs->oauth->legitimate_provider( $oauth_provider ) ) {

		// Validate name and email
		if ( ! empty( $send_from_name ) ) {

			if ( ! empty( $send_from_email ) && zeroBSCRM_validateEmail( $send_from_email ) ) {

				// checks out, send a test :)

				// build
				$subject = __( '[CRM] Mail Delivery Routine', 'zero-bs-crm' );

				##WLREMOVE
				$subject = '[Jetpack CRM] ' . __( 'Mail Delivery Routine', 'zero-bs-crm' );
				##/WLREMOVE

				// send email to themself!
				if ( jpcrm_mail_delivery_send_via_gmail_oauth(
					array(

						'connection_profile' => $oauth_provider,

						'send_from'          => $send_from_email,
						'send_from_name'     => $send_from_name,

						'send_to'            => $send_from_email,
						'send_to_name'       => $send_from_name,

						'subject'            => $subject,
						// 'msg_text'          => '',
						'msg_html'           => zeroBSCRM_mailDelivery_generateTestHTML( true ), // See .mail-templating.php
						'attachments'        => false,

						'debug'              => false,
						'return_debug'       => false,

					)
				) ) {

					// Success. Save record.

					// Retrieve existing
					$mail_delivery_methods = zeroBSCRM_getSetting( 'smtpaccs' );
					if ( ! is_array( $mail_delivery_methods ) ) {
						$mail_delivery_methods = array();
					}

					// Build new method
					$settingsArr = array(

						'mode'           => 'api',
						'oauth_provider' => $oauth_provider,
						'fromemail'      => $send_from_email,
						'fromname'       => $send_from_name,
						'replyto'        => $send_from_email,
						'cc'             => '',
						'bcc'            => '',
						'veri'           => time(), // verified

					);
					$settingsKey = zeroBSCRM_mailDelivery_makeKey( $settingsArr );

					if ( ! isset( $mail_delivery_methods[ $settingsKey ] ) ) {
						$mail_delivery_methods[ $settingsKey ] = $settingsArr;
					} else {
						$return['errors']['keyerror'] = 1;
					}

					// Update
					$zbs->settings->update( 'smtpaccs', $mail_delivery_methods );

					// if ONLY 1 installed, set as default
					if ( count( $mail_delivery_methods ) == 1 ) {
						$zbs->settings->update( 'smtpaccsdef', $settingsKey );
					}

					// fini
					$return['success'] = 1;

				} else {

						// send error
						$return['errors']['senderror'] = 1;

				}
			} else {

				// bad email
				$return['errors']['bademail'] = 1;

			}
		} else {

			// no name?
			$return['errors']['nameempty'] = 1;

		}
	} else {

			// invalid provider
			$return['errors']['invalid_provider'] = 1;

	}

	// if no errors, simplify return
	if ( count( $return['errors'] ) == 0 ) {
		unset( $return['errors'] );
	}

	// return
	header( 'Content-Type: application/json' );
	echo json_encode( $return );
	exit();
}

// } Attempts to send a test email from a stored mail delivery method
add_action( 'wp_ajax_zbs_maildelivery_test', 'zeroBSCRM_AJAX_mailDelivery_testEmail' );
function zeroBSCRM_AJAX_mailDelivery_testEmail() {

	// } Check nonce
	check_ajax_referer( 'wpzbs-ajax-nonce', 'sec' );  // nonce to bounce out if not from right page

	// } Perms?
	if ( ! zeroBSCRM_permsMailCampaigns() ) {
		exit();
	}

	// } Starting
	$res = array();

	// } Retrive deets
	$mailDeliveryIndxKey = -1;
	if ( isset( $_POST['indx'] ) ) {
		$mailDeliveryIndxKey = sanitize_text_field( $_POST['indx'] );
	}
	$sendToEmail = '';
	if ( isset( $_POST['em'] ) ) {
		$sendToEmail = sanitize_text_field( $_POST['em'] );
	}

	// validate the email
	if ( ! zeroBSCRM_validateEmail( $sendToEmail ) ) {
		$r['message'] = 'Not a valid email';
		echo json_encode( $r );
		die();
	}

	// } Check id + perms + em
	if ( $mailDeliveryIndxKey <= -1 || empty( $mailDeliveryIndxKey ) || empty( $sendToEmail ) ) {
		die();
	}

	// load acc
	// no need, now done in zeroBSCRM_mailDelivery_sendMessage $mailDeliveryDetails = zeroBSCRM_mailDelivery_retrieveACCByKey($mailDeliveryIndxKey);

	$subject = 'Mail Delivery Routine Test';
	##WLREMOVE
		$subject = '[Jetpack CRM] ' . $subject;
	##/WLREMOVE

	// this'll get set by zeroBSCRM_mailDelivery_sendMessage - $headers = array('Content-Type: text/html; charset=UTF-8');
	// this'll get set by zeroBSCRM_mailDelivery_sendMessage - $headers[] = 'From: '.$sendFromName.' <'.$sendFromEmail.'>';

	// See .mail-templating.php
	$body = zeroBSCRM_mailDelivery_generateTestHTML( true );

	// build send array
	$mailArray = array(
		'toEmail'  => $sendToEmail,
		'toName'   => '',
		'subject'  => $subject,
		'headers'  => -1,
		'body'     => $body,
		'textbody' => '',
		'options'  => array(
			'html' => 1,
		),
	);

	// sends to itself to test
	$sent = zeroBSCRM_mailDelivery_sendMessage( $mailDeliveryIndxKey, $mailArray );
	if ( is_array( $sent ) && $sent[0] ) {

		// fini
		zeroBSCRM_sendJSONSuccess( $res );

	} else {

		// error
		if ( ! isset( $res['errors'] ) || ! is_array( $res['errors'] ) ) {
			$res['errors'] = array();
		}
		$res['errors']['sendfail'] = 1;
		zeroBSCRM_sendJSONError( $res );

	}
}

// } Attempts to remove a delivery route
add_action( 'wp_ajax_zbs_maildelivery_remove', 'zeroBSCRM_AJAX_mailDelivery_removeMailDelivery' );
function zeroBSCRM_AJAX_mailDelivery_removeMailDelivery() {

	// } Check nonce
	check_ajax_referer( 'wpzbs-ajax-nonce', 'sec' );  // nonce to bounce out if not from right page

	// } Perms?
	if ( ! zeroBSCRM_permsMailCampaigns() ) {
		exit();
	}

	// } Starting
	$res = array();

	// } Retrive deets
	$mailDeliveryIndxKey = -1;
	if ( isset( $_POST['indx'] ) ) {
		$mailDeliveryIndxKey = sanitize_text_field( $_POST['indx'] );
	}

	// } Check id + perms + em
	if ( $mailDeliveryIndxKey <= -1 || empty( $mailDeliveryIndxKey ) ) {
		die();
	}

	global $zbs;
	$currentMailDeliveryAccs = zeroBSCRM_getSetting( 'smtpaccs' );
	if ( is_array( $currentMailDeliveryAccs ) ) {

		// unset this one if exists
		if ( isset( $currentMailDeliveryAccs[ $mailDeliveryIndxKey ] ) ) {
			unset( $currentMailDeliveryAccs[ $mailDeliveryIndxKey ] );
		}

		// kill default (if was set, set it to another, or empty)
		$existingDefault = $zbs->settings->get( 'smtpaccsdef' );
		if ( $existingDefault == $mailDeliveryIndxKey ) {

			if ( count( $currentMailDeliveryAccs ) > 0 ) {
				// has others, so choose first one :)
				$keys = array_keys( $currentMailDeliveryAccs );
				$key  = '';
				if ( isset( $keys[0] ) ) {
					$key = $keys[0];
				}
				$zbs->settings->update( 'smtpaccsdef', $key );
			} else { // just unset default, is empty
				$zbs->settings->update( 'smtpaccsdef', '' );
			}
		}

		// update
		$zbs->settings->update( 'smtpaccs', $currentMailDeliveryAccs );

		// fini - lazy nocheck
		$res['success'] = 1;

	} else {

		// brutal force array
		$zbs->settings->update( 'smtpaccs', array() );

		// kill default (none left)
		$zbs->settings->update( 'smtpaccsdef', '' );

		// fini - lazy nocheck
		$res['success'] = 1;

	}

	if ( ! isset( $res['success'] ) ) {

		// error
		if ( ! isset( $res['errors'] ) || ! is_array( $res['errors'] ) ) {
			$res['errors'] = array();
		}
		$res['errors']['sendfail'] = 1;

	}

	header( 'Content-Type: application/json' );
	echo json_encode( $res );
	exit();
}

// } Attempts to set a delivery route default
add_action( 'wp_ajax_zbs_maildelivery_setdefault', 'zeroBSCRM_AJAX_mailDelivery_setMailDeliveryAsDefault' );
function zeroBSCRM_AJAX_mailDelivery_setMailDeliveryAsDefault() {

	// } Check nonce
	check_ajax_referer( 'wpzbs-ajax-nonce', 'sec' );  // nonce to bounce out if not from right page

	// } Perms?
	if ( ! zeroBSCRM_permsMailCampaigns() ) {
		exit();
	}

	// } Starting
	$res = array();

	// } Retrive deets
	$mailDeliveryIndxKey = -1;
	if ( isset( $_POST['indx'] ) ) {
		$mailDeliveryIndxKey = sanitize_text_field( $_POST['indx'] );
	}

	// } Check id + perms + em
	if ( $mailDeliveryIndxKey <= -1 || empty( $mailDeliveryIndxKey ) ) {
		die();
	}

	// brutal setting
	global $zbs;
	$zbs->settings->update( 'smtpaccsdef', $mailDeliveryIndxKey );

	// fini - lazy nocheck
	$res['success'] = 1;

	header( 'Content-Type: application/json' );
	echo json_encode( $res );
	exit();
}
