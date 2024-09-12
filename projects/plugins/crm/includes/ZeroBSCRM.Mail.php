<?php 
/*!
 * Jetpack CRM
 * https://jetpackcrm.com
 */

use Google\Client;
use Google\Service\Gmail;


/* ======================================================
  Integration funcs (e.g. drop down lists of smtpaccs)
   ====================================================== */

function zeroBSCRM_mailDelivery_accountDDL($selectedOption=-1,$id='zbs-mail-delivery-acc',$showProtocol=true,$withSemanticWrap=true){

	#} Retrieve
	$zbsSMTPAccs = zeroBSCRM_getMailDeliveryAccs(); 
	$defaultMailOptionIndex = zeroBSCRM_getMailDeliveryDefault();  

	if (count($zbsSMTPAccs) <= 0){

		// get wp defaults
		$defaultFromDeets = zeroBSCRM_wp_retrieveSendFrom();

		$defaultDetails = ''; if (is_array($defaultFromDeets)){

			if (isset($defaultFromDeets['name'])) $defaultDetails = $defaultFromDeets['name'];
			if (isset($defaultFromDeets['email'])){

				if (!empty($defaultDetails)) 
					$defaultDetails .= ' &#x3C;'.$defaultFromDeets['email'].'&#x3E;';
				else
					$defaultDetails = $defaultFromDeets['email'];

			}
		}

		if ($withSemanticWrap) echo '<div class="ui input">';

		// none
		?><select class="fluid" id="<?php echo esc_attr( $id ); ?>" name="<?php echo esc_attr( $id ); ?>"><option value="-1"><?php echo esc_html( $defaultDetails ); ?></option></select><?php


		if ($withSemanticWrap) echo '</div>';

	} else {

		// some

		/* Array
					(
						[wordpress-25apr-local] => Array
							(
								[mode] => wp_mail
								[fromemail] => wordpress@25apr.local
								[fromname] => Woody Hayday
								[replyto] => wordpress@25apr.local
								[cc] =>
								[bcc] =>
								[veri] => 1526038805
							)

						[wordpress-25apr-local--2] => Array
							(
								[mode] => wp_mail
								[fromemail] => wordpress@25apr.local
								[fromname] => Dave Davids
								[replyto] => wordpress@25apr.local
								[cc] =>
								[bcc] =>
								[veri] => 1526038823
							)

					) */

		// Debug echo '<pre>'; print_r($zbsSMTPAccs); echo '</pre>';

		if ($withSemanticWrap) echo '<div class="ui input">';

		?><select class="fluid" id="<?php echo esc_attr( $id ); ?>" name="<?php echo esc_attr( $id ); ?>"><?php foreach ($zbsSMTPAccs as $key => $acc){

				#} account name etc.
				$accStr = '';
				if (isset($acc['fromname'])) $accStr = $acc['fromname'];
				if (isset($acc['fromemail'])) {
				  if (!empty($accStr))
					$accStr .= ' &lt;'.$acc['fromemail'].'&gt;';
				  else
					$accStr .= $acc['fromemail'];
				}

				#} Mode label (if showing)
				if ($showProtocol){
					$accStrExtra = ' (wp_mail)';
					if (isset($acc['mode']) && $acc['mode'] == 'smtp') $accStrExtra = ' (SMTP)';
					$accStr .= $accStrExtra;
				}

				#} If default, add that
				if ($key == $defaultMailOptionIndex) $accStr .= ' [Default]';

			echo '<option value="'. esc_attr( $key ) .'"';
			if ($selectedOption == $key) echo ' selected="selected"';
			echo '>' . esc_html( $accStr ) . '</option>';

		} ?></select><?php

		if ($withSemanticWrap) echo '</div>';

	}

	if ($withSemanticWrap){

		?><script type="text/javascript">jQuery(function(){ jQuery('#<?php echo esc_html( $id ); ?>').dropdown();});</script><?php

	}


 }

/* ======================================================
  / Integration funcs (e.g. drop down lists of smtpaccs)
   ====================================================== */

/* ======================================================
  Mail Sending, defaults
   ====================================================== */

// here we return - biz name >ifnot> crmname >ifnot> blog_name
function zeroBSCRM_mailDelivery_defaultFromname(){
	$r = '';
	$business_name = zeroBSCRM_textExpose(zeroBSCRM_getSetting('businessname'));
	$r = sanitize_text_field($business_name);

	// crm name:
	if (empty($r)){
		$r = zeroBSCRM_getSetting('customheadertext');
	}
		
	if (empty($r)){
		$blog_name = zeroBSCRM_textExpose(get_bloginfo('name'));
		$r = sanitize_text_field($blog_name);
	}

	return $r;
}

function zeroBSCRM_mailDelivery_defaultEmail(){

	/* this can be expaned on later for now it gets the admin email 
	#WH can expand to default email account later */

	return get_bloginfo('admin_email');
}

/* ======================================================
  / Mail Sending, defaults
   ====================================================== */

#} Send a mail via a specific mail delivery profile
// assumes some common-sense in calling, 
// e.g. if you call this with a textbody and no html, but in html mode, it won't fix that for you
// NOTE, if $mailDeliveryAccKey == -1, it'll just default to wpmail
function zeroBSCRM_mailDelivery_sendMessage($mailDeliveryAccKey='',$mail=-1){

	global $zbs;

	if ($mailDeliveryAccKey !== -1 && !empty($mailDeliveryAccKey) && is_array($mail)){

		// using key, send a mail!
		$mailSettings = zeroBSCRM_mailDelivery_retrieveACCByKey($mailDeliveryAccKey);

	} 

	// if passing -1 or failed to load
	//... also catches if trying to use a since deleted mail delivery acc
	if ($mailDeliveryAccKey == -1 || !is_array($mailSettings)){

		// see if a default is set
		$mailSettings = zeroBSCRM_mailDelivery_retrieveDefaultMDAcc();
		//echo 'Mail Setting Default:<pre>'; print_r($mailSettings); echo '</pre>';

		//... if not default to WP setup:
		if (!is_array($mailSettings)) $mailSettings = zeroBSCRM_mailDelivery_retrieveACCWPDefault();

	}

	// got settings?
	if (isset($mailSettings) && is_array($mailSettings)){

		#} Check settings (roughly)
		if (!isset($mailSettings) || !is_array($mailSettings) || !isset($mailSettings['fromemail'])){

			return array(false,'errorMsg'=>__('<span>#289</span>Could not load settings for this mail delivery option', 'zero-bs-crm'));

		}

		#} Check mail (roughly)
		if (!isset($mail) || !is_array($mail) || !isset($mail['toEmail'])){

			return array(false,'errorMsg'=>__('<span>#290</span>Could not load message for this mail delivery call', 'zero-bs-crm'));

		}

		/* comes in...
		// build send array
		$mailArray = array(
			'toEmail' => $sendToEmail,
			'toName' => '',
			'subject' => $subject,
			'headers' => -1,
			'body' => $body,
			'textbody' => $textbody,
			'bodyneedswrap' => -1, // pass incomplete html stuff to get wrapped in <html> template? - * NOT YET WRITTEN IN
			'options' => array(
				'html' => 1
			)
		);


	EXAMPLE: 10/05/18 wh

		$mailDeliveryIndxKey = -1;

		// build send array
		$mailArray = array(
			'toEmail' => $sendToEmail,
			'toName' => '',
			'subject' => $subject,
			'headers' => -1,
			'body' => $body,
			'textbody' => '',
			'options' => array(
				'html' => 1
			),
			'bodyneedswrap' => -1,
			'tracking' => array(
				// any of these, then it'll be tracked :) (auto-inserted pixel + saved in history db)
				'emailTypeID' => -1,
				'targetObjID' => -1,
				'senderWPID' => -1,
				'associatedObjID' => -1
				//don't need, is in main array, 'senderEmailAddress' => ?,
				//don't need, is in main array, emailSubject' =>
			),
			'overrideSendName' => ''
		);

		// sends to itself to test
		$sent = zeroBSCRM_mailDelivery_sendMessage($mailDeliveryIndxKey,$mailArray);


		*/

		// seems legit. Build email components
		$sendToEmail = '';
		$subject = '';
		$headers = array();
		$body = '';
		$textBody = '';
		$options = array(
			'html' => 1
		);
		
			// send to
			if (isset($mail['toEmail']) && !empty($mail['toEmail']) && zeroBSCRM_validateEmail($mail['toEmail'])) $sendToEmail = $mail['toEmail'];
		
			// subject can be empty
			if (isset($mail['subject'])) $subject = $mail['subject'];

			// body can't be...
			if (isset($mail['body']) && !empty($mail['body'])) $body = $mail['body'];
			if (isset($mail['textbody']) && !empty($mail['textbody'])) $textBody = $mail['textbody'];

			// options
			if (isset($mail['options']) && is_array($mail['options'])){

				// html? - rough
				if (isset($mail['options']['html']) && $mail['options']['html'] == "1") 
					$options['html'] = 1;
				if (isset($mail['options']['html']) && $mail['options']['html'] == "-1") 
					$options['html'] = -1;

			}

			// attachments
			$attachments = array();
			if (isset($mail['attachments']) && is_array($mail['attachments'])){

				// check through em + check file_exists, otherwise pass on
				if (count($mail['attachments']) > 0) foreach ($mail['attachments'] as $file){

					// here we switch as sometimes meaningful names given via array
					if (is_array($file)){
						
						if (file_exists($file[0])) $attachments[] = $file;

					} else {
						
						if (file_exists($file)) $attachments[] = $file;

					}

				}


			}

			// headers
			if (isset($mail['headers']) && is_array($mail['headers'])){

				// just copy em for now
				$headers = $mail['headers'];

			}

			// check headers & options (e.g. inject html...)

				// html mode
				if ($options['html'] == 1){

					$headerPresent = false;
					foreach ($headers as $h){
						if ($h == 'Content-Type: text/html; charset=UTF-8') { $headerPresent = true; break; }
					}
					if (!$headerPresent) $headers[] = 'Content-Type: text/html; charset=UTF-8';

				}

		// catch any overrides and put in place (currently only send name)
		if (isset($mail['overrideSendName']) && !empty($mail['overrideSendName'])) $mailSettings['fromname'] = $mail['overrideSendName'];

		// do final checks & send per mode

			#} Check mail (roughly)
			if (empty($body) || empty($sendToEmail) || !zeroBSCRM_validateEmail($sendToEmail)) {

				return array(false,'errorMsg'=>__('<span>#291</span>Could not process message details for this mail delivery call', 'zero-bs-crm'));

			}

		// Tracking Pixels?

			// first we check whether it's been globally turned off..
			$trackingEnabled = $zbs->settings->get('emailtracking');

			// proceed
			if (isset($mail['tracking']) && is_array($mail['tracking']) && count($mail['tracking']) > 0){

				// work out the tracking params
				$emailTypeID = -1; if (isset($mail['tracking']['emailTypeID'])) $emailTypeID = $mail['tracking']['emailTypeID'];
				$targetObjID = -1; if (isset($mail['tracking']['targetObjID'])) $targetObjID = $mail['tracking']['targetObjID'];
				$senderWPID = 0; if (isset($mail['tracking']['senderWPID'])) $senderWPID = $mail['tracking']['senderWPID'];
				$senderEmailAddress = $mailSettings['fromemail'];
				$associatedObjID = -1; if (isset($mail['tracking']['associatedObjID'])) $associatedObjID = $mail['tracking']['associatedObjID'];
				$emailSubject = ''; if (isset($mail['subject'])) $emailSubject = $mail['subject'];

				$thread = -1; if (isset($mail['thread'])) $thread = $mail['thread'];

				//v2.94.1 storing email content in the table
				$emailContent = ''; if (isset($mail['content'])) {

					// NOTE: we can apply wpeditor here because the only part of zbs using this 'content' addition is mikes emails
					//... but this does FORCE us to be using same wp_editor format unless we do a migration
					//... for now living with that [WH 18/10/18]
					$emailContent = wp_kses( $mail['content'], $zbs->acceptable_html ); // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase

				}

				// log the email (presend) + generate hash
				$trackingHash = zeroBSCRM_mailTracking_logEmail($emailTypeID,$targetObjID,$senderWPID,$senderEmailAddress,$associatedObjID,$emailSubject,true, $emailContent, $thread, $sendToEmail, 'sent', $mailDeliveryAccKey);

				if ($trackingEnabled == "1"){
					
					// inject the hash img (only if using tracking)
					$body = zeroBSCRM_mailTracking_addPixel($body,$trackingHash);

				}

			}

		// the subject sometimes comes with html entities because the way some placeholders are stored in the db (e.g. ##BIZ-NAME##). See PR #1640
		$decoded_subject = zeroBSCRM_textExpose($subject);
		// mode-checks & send
		switch ($mailSettings['mode']){


			case 'wp_mail':

				// WP mail needs to check from is in header (if someone's added, override :))

					// From (esp req for wpmail):
					$newHeaders = array();
					$headerPresent = false;
				foreach ( $headers as $h ) {
					if ( str_starts_with( $h, 'From:' ) ) {

							// replace it :)
							$newHeaders[] = 'From: '.$mailSettings['fromname'].' <'.$mailSettings['fromemail'].'>';

					} else {

							// just add to new arr
							$newHeaders[] = $h;
					}

				}

					// if no from, we need to add it!
					if (!$headerPresent) $newHeaders[] = 'From: '.$mailSettings['fromname'].' <'.$mailSettings['fromemail'].'>';

					// and overwrite it... (if nothing changed, doesn't matter :))
					$headers = $newHeaders;

					// Here we check $attachments, because these can optionally be passed as arrays with 'meaningful names' as second var
					// .. but no easy way to get wp_mail to use meaningful names
					// so just remove
					if (is_array($attachments) && count($attachments) > 0){
						$a = array();
						foreach ($attachments as $attachment){
							if (is_array($attachment)){

								// probs passed, just dump first val for now
								$a[] = $attachment[0];

							} else $a[] = $attachment;
						}
						$attachments = $a;
					}

					// sends to itself to test
					$sent = wp_mail( $sendToEmail, $decoded_subject, $body, $headers, $attachments );

					break;


			case 'smtp':

						#} go
						$sent = zeroBSCRM_mailDelivery_sendViaSMTP(
								
								#} SMTP Settings
								$mailSettings['host'],
								$mailSettings['port'],
								$mailSettings['user'],
								zeroBSCRM_mailDelivery_retKeyData($mailSettings['pass']),
								#'tls', #tls ssl - switched for option:
								$mailSettings['sec'],
								#} FROM
								$mailSettings['fromemail'],
								$mailSettings['fromname'],
								#} To
								$sendToEmail,'',
								#} Deets
								$decoded_subject,
								$textBody,
								$body,
								#} Following would return debug
								false,
								false,
								#} Attachments
								$attachments
						);

						break;

			// API (OAuth) as at 5.1, only google_mail
			case 'api':

				$zbs->load_oauth_handler();

				$sent = jpcrm_mail_delivery_send_via_gmail_oauth(
					array(
						// phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
						'connection_profile' => $mailSettings['oauth_provider'],
						// phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
						'send_from'          => $mailSettings['fromemail'],
						// phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
						'send_from_name'     => $mailSettings['fromname'],
						// phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
						'send_to'            => $sendToEmail,
						'send_to_name'       => '',
						'subject'            => $decoded_subject,
						// phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
						'msg_text'           => $textBody,
						'msg_html'           => $body,
						'attachments'        => $attachments,
						'debug'              => false,
						'return_debug'       => false,
					)
				);

				break;

			default:

				return array(false,'errorMsg'=>__('<span>#289</span>Mail Delivery mode not found', 'zero-bs-crm'));
				break;

		}


		// at this point $sent will be success bool :)

		// log?!? (leave to calling funcs.)
		// ... well if using tracking pixels, log that:
		// we still LOG here even if $trackingEnabled !== "1" ... because this just logs 'sent' not any pixelage
		if ($sent && isset($trackingHash)) {

			// log fact it sent
			zeroBSCRM_mailTracking_logSend($trackingHash);

		}


		// for now, just return
		return array($sent);

	} 

	return array(false,'errorMsg'=>__('<span>#297</span>No settings found for this mail delivery option', 'zero-bs-crm'));

}

// [DREAMWORLD]: WH $arg'itizes this
function zeroBSCRM_mailDelivery_sendViaSMTP($smtpHost='',$smtpPort='',$smtpUser='',$smtpPass='',$smtpSecurity='tls',$sendFrom='',$sendFromName='',$toEmail='',$toName='',$subject='',$msgText='',$msgHTML='',$debugMail=false,$returnDebug=false,$attachments=false){ #,$ccEmails='',$bccEmails='',$replyToAddr='',$returnPath=''

	global $retDebugStr;

	if ($debugMail) $retDebugStr = '<h2>Debugging SMTP</h2>';

	#} was going to fallback to default "sendFrom", but these should not be fired without! - for now use brand name :)
	if (empty($sendFromName)) $sendFromName = 'Jetpack CRM';

	if (
	!empty($smtpHost) &&
	!empty($smtpUser) &&
	!empty($smtpPass) &&
	!empty($smtpPort)
	){

		global $zbsDebug; $zbsDebug['return'] = $returnDebug; $zbsDebug['debug'] = $debugMail;

			// here we set err handler to avoid any leaked php warnings knocking over the ui
			// https://stackoverflow.com/questions/1241728/can-i-try-catch-a-warning
			// $errno represents: https://www.tutorialrepublic.com/php-reference/php-error-levels.php
			set_error_handler(function($errno, $errstr, $errfile, $errline, array $errcontext) { 

					/* */global $retDebugStr,$zbsDebug;

					if ($zbsDebug['debug']){

						if ($zbsDebug['return'])
							$retDebugStr .= '===<br />PHP Level Warning '.$errno.': '.$errstr.' (L:'.$errline.' in '.$errfile.')<br />';
						else
							echo 'PHP Level Warning '. esc_html( $errno.': '.$errstr ) .' (L:'. esc_html( $errline.' in '.$errfile ).')<br />';

					}

					// make it more serious than a warning so it can be caught
					//trigger_error($errstr, E_ERROR);
					//return true;

					global $retDebugStr,$zbsDebug;
					//return array('details'=>true,'sent'=>false,'stage'=>-1,'debugs'=>array($retDebugStr));

					/* Don't execute PHP internal error handler */
					return true;
			 });

		if ($debugMail) $retDebugStr .= 'SMTP Details Present<br />';

		// Rather than use PHPMailer direct, we use the built into wp ver loadMailer();
		//https://developer.wordpress.org/reference/functions/wp_mail/
		// =============== CODE FROM wp_mail
		global $phpmailer;
 
		// (Re)create it, if it's gone missing
		if ( ! ( $phpmailer instanceof PHPMailer ) ) {

			// WP 5.5 updates PHP Mailer: 
			// https://make.wordpress.org/core/2020/07/01/external-library-updates-in-wordpress-5-5-call-for-testing/
			if (jpcrm_wordpress_version('>=','5.5')){

				require_once ABSPATH . WPINC . '/PHPMailer/PHPMailer.php';
				require_once ABSPATH . WPINC . '/PHPMailer/SMTP.php';
				require_once ABSPATH . WPINC . '/PHPMailer/Exception.php';
				$phpmailer = new PHPMailer\PHPMailer\PHPMailer();
			
			} else {
				
				// pre 5.5:
				require_once ABSPATH . WPINC . '/class-phpmailer.php';
				require_once ABSPATH . WPINC . '/class-smtp.php';
				$phpmailer = new PHPMailer( true );
				class_alias( phpmailerException::class, 'PHPMailerException' );

			}
		}

		// Empty out the values that may be set
		$phpmailer->clearAllRecipients();
		$phpmailer->clearAttachments();
		$phpmailer->clearCustomHeaders();
		$phpmailer->clearReplyTos();
		// =============== / CODE FROM wp_mail


		#https://webolio.wordpress.com/2008/03/02/phpmailer-and-smtp-on-1and1-shared-hosting/
		#} SMTP outbound is killed on 1and1, basically. Has to be on AWS
			
		#} SMTP Settings
		// changed $mail to $phpmailer: $mail = new PHPMailer();

		if ($debugMail) {
			if (!$returnDebug) echo '<pre>'; #} This is for the mail func debugger
			$retDebugStr .= 'Mailer loaded<br />'; #} This'll be output AFTER debugger natural echoes
		}
			
		/* MY ORIGINAL SETTINGS: */
		$phpmailer->IsSMTP();
		#THIS MEANS IT IGNORES SMTP!!!!:
		#$phpmailer->isSendMail();
		$phpmailer->SMTPAuth   = true;
		$phpmailer->SMTPSecure = $smtpSecurity;

		// Optionally allow OVERRIDE of this setting (checks ssl certs match)
		$ignoreSSLMismatch = zeroBSCRM_getSetting('mailignoresslmismatch');	
		if ($ignoreSSLMismatch == "1"){

			// https://stackoverflow.com/questions/30371910/phpmailer-generates-php-warning-stream-socket-enable-crypto-peer-certificate
			$phpmailer->SMTPOptions = array(
				'ssl' => array(
					'verify_peer' => false,
					'verify_peer_name' => false,
					'allow_self_signed' => true
				)
			);

		}
		
			#} Modified this to overcome peoples faulty certificates
			# http://stackoverflow.com/questions/30371910/phpmailer-generates-php-warning-stream-socket-enable-crypto-peer-certificate
			#if ($smtpSecurity == 'tls'){

					# just times out!
					#$phpmailer->Host = gethostbyname('tls://'.$smtpHost);
				
			#} else {
		
				$phpmailer->Host       = $smtpHost;
				
			#}
		
		
		$phpmailer->Username   = $smtpUser;
		$phpmailer->Password   = $smtpPass;

		#} Added from http://www.9lessons.info/2012/02/amazon-simple-email-service-smtp-using.html
		#$phpmailer->Mailer = "smtp";
		$phpmailer->Port = $smtpPort; #587;  // SMTP Port - 465 = SSL, 587 = TLS (USE SSL!)

		#gmail
		$phpmailer->IsHTML(true);
		#$phpmailer->SMTPDebug = 1; // debugging: 1 = errors and messages, 2 = messages only


		/* GMAIL EXAMPLE -http://stackoverflow.com/questions/13574166/phpmailer-send-gmail-smtp-timeout */
		#$phpmailer->IsSMTP(); // Use SMTP
		#$phpmailer->Host        = "smtp.gmail.com"; // Sets SMTP server
		#$phpmailer->SMTPDebug   = 2; // 2 to enable SMTP debug information
		#$phpmailer->SMTPAuth    = TRUE; // enable SMTP authentication
		#$phpmailer->SMTPSecure  = "tls"; //Secure conection
		#$phpmailer->Port        = 587; // set the SMTP port
		#$phpmailer->Username    = 'MyGmail@gmail.com'; // SMTP account username
		#$phpmailer->Password    = 'MyGmailPassword'; // SMTP account password
		//$phpmailer->Priority    = 1; // Highest priority - Email priority (1 = High, 3 = Normal, 5 = low)
		$phpmailer->CharSet     = 'UTF-8';
		$phpmailer->Encoding    = '8bit';
		#$phpmailer->Subject     = 'Test Email Using Gmail';
		$phpmailer->ContentType = 'text/html; charset=utf-8'; // see my answer here https://stackoverflow.com/questions/15880042/phpmailer-the-following-smtp-error-data-not-accepted/54887925#54887925
		#$phpmailer->From        = 'MyGmail@gmail.com';
		#$phpmailer->FromName    = 'GMail Test';
		$phpmailer->WordWrap    = 900; // RFC 2822 Compliant for Max 998 characters per line

		
		if ($debugMail) $retDebugStr .= 'Mailer settings overriden<br />';
			
		#} http://stackoverflow.com/questions/2896280/debugging-php-mail-and-or-phpmailer
		#} Updated to 5.2.16
		# https://github.com/PHPMailer/PHPMailer/wiki/Troubleshooting
		if ($debugMail) $phpmailer->SMTPDebug  = 2;

		#https://github.com/PHPMailer/PHPMailer/blob/master/docs/Note_for_SMTP_debugging.md
		if ($returnDebug) $phpmailer->Debugoutput = function($str, $level) {
			# brutal
			global $retDebugStr;
			#echo "debug level $level; message: $str";
			$retDebugStr .= $level.': message: '.$str."
					";

		};

		#} Set From & Subject
		$phpmailer->SetFrom($sendFrom, $sendFromName,false); //from (verified email address)
		$phpmailer->Subject = $subject; //subject

		#} Actual Message
		//NOTE: This func forces a text ver from the html (not useful if using altbody below):
		// $phpmailer->MsgHTML($msgHTML);
		// ... ->Body seems to be the correct opt
		$phpmailer->Body = $msgHTML;
		// or is it ? https://stackoverflow.com/questions/15880042/phpmailer-the-following-smtp-error-data-not-accepted

		// add fallback txt if set: https://stackoverflow.com/questions/22507176/send-html-and-plain-text-email-simultaneously-with-php-mailer
		if (isset($msgText) && !empty($msgText)) $phpmailer->AltBody = $msgText;

		#} Recipient(s)
		#} Currently stored as csv in defined ^^ so discern.... messy, improve.
		if ( str_contains( $toEmail, ',' ) && str_contains( $toName, ',' ) ) { // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
			$toEmail = explode(',',$toEmail);
			$toName = explode(',',$toName);
		}

		#} Legit?
		if (is_array($toEmail) && is_array($toName)){
			#} Multiple - this could be much smarter. re-adjust later
			$ind = 0; foreach ($toEmail as $em){
				$phpmailer->AddAddress($em, $toName[$ind]);
				$ind++;
			}

		} else #} Singular
			$phpmailer->AddAddress($toEmail, $toName);

		if ($debugMail) $retDebugStr .= 'Mail body prepped<br />';


		#} Attachments 
		// half-inched from https://core.trac.wordpress.org/browser/tags/4.9/src/wp-includes/pluggable.php#L460
		// then modified to allow diff names
		// https://stackoverflow.com/questions/16776073/phpmailer-sent-attachment-as-other-name
		if ( !empty( $attachments ) ) {
				foreach ( $attachments as $attachment ) {
						try {
							if (is_array($attachment)){

								if (count($attachment) == 2 ){

									// pass 2 vars, second will be desired end name
									$phpmailer->addAttachment($attachment[0],$attachment[1]);

								} else {

									// normal, using firs var..
									$phpmailer->addAttachment($attachment[0]);
								}

							} else {
								$phpmailer->addAttachment($attachment);
							}
						} catch ( PHPMailerException $e ) {
								continue;
						}
				}
		}


		// Set to use PHP's mail()
		// WH Note: Copied this from wp_mail, I wasn't using it in prospectrr setup, does this mean might be SERVER specific to 1and1
		// ... follow wp's lead here.
		//THIS WAS A CULPRIT (2.94.2 fix)
		// THIS should only be on for wp_mail stuff
		// $phpmailer->isMail();

		//debug echo '<pre>'; print_r(array($smtpHost,$smtpPort,$smtpUser,$smtpPass,$smtpSecurity,$sendFrom,$sendFromName,$toEmail,$toName,$subject,$msgText,$msgHTML,$debugMail,$returnDebug));echo '</pre>';

		try {

			// test:
			// https://stackoverflow.com/questions/15880042/phpmailer-the-following-smtp-error-data-not-accepted
			//$phpmailer->SMTPDebug = 2;

				#} Success?
				if ($phpmailer->Send()) {

					if ($debugMail) {
						$retDebugStr .= '<hr /><strong>Mail sent successfully</strong><hr />';
						if (!$returnDebug)
							echo $retDebugStr;
						else
							return 'success:'.$retDebugStr;
					}
					return true;#DEBUG array(true,$phpmailer->Host,$phpmailer->Username,$phpmailer->Password); #true;

				} else {

					#} Brutal
					#NO, frontend!
					#DEBUG
					#print_r(array(true,$phpmailer->Host,$phpmailer->Username,$phpmailer->Password,$phpmailer->Port));
					#exit("Mailer Error: " . $phpmailer->ErrorInfo);
					if ($debugMail) {
						$retDebugStr .= '<hr /><strong>Mail FAILED #exit-1</strong><br />';						
						if (!$returnDebug) {
							echo '</pre>'.$retDebugStr;
							echo "Mailer Error: " . $phpmailer->ErrorInfo;
							echo '<hr />';
						} else {
							return $retDebugStr.'===<br />Final Error<br />error:'.$phpmailer->ErrorInfo;
						}
					}
					return false;
				}

			} catch ( PHPMailerException $e ) {
				
					if ($debugMail) {

						$mail_error_data = array( 'to', 'subject', 'message', 'headers', 'attachments' );
						if (isset($toEmail)) 		$mail_error_data['to'] = $toEmail;
						if (isset($subject)) 		$mail_error_data['subject'] = $subject;
						// likely huge & not necessary below:
						//if (isset($message)) 		$mail_error_data['message'] = $message;
						if (isset($headers)) 		$mail_error_data['headers'] = $headers;
						if (isset($attachments)) 	$mail_error_data['attachments'] = $attachments;
						$mail_error_data['phpmailer_exception_code'] 	= esc_html($e->getCode());
						$mail_error_data['phpmailer_exception_msg'] 	= esc_html($e->getMessage());

						// append to the

						if (!$returnDebug) {
							echo '</pre>'.$retDebugStr;
							echo "Mailer Error: " . $phpmailer->ErrorInfo;
							echo "Mailer Error2: " . $e->getMessage();
							echo '<pre>'; print_r($mail_error_data); echo '</pre>';
							echo '<hr />';
						} else {
							return $retDebugStr.'---<pre>'.print_r($mail_error_data,1).'</pre>---<br />===<br />Final Error<br />error:'.$phpmailer->ErrorInfo;
						}
					}
					return false;

			} catch (Exception $e){

				// general exception

					if ($debugMail) {

						$mail_error_data = array( 'to', 'subject', 'message', 'headers', 'attachments' );
						if (isset($toEmail)) 		$mail_error_data['to'] = $toEmail;
						if (isset($subject)) 		$mail_error_data['subject'] = $subject;
						// likely huge & not necessary below:
						//if (isset($message)) 		$mail_error_data['message'] = $message;
						if (isset($headers)) 		$mail_error_data['headers'] = $headers;
						if (isset($attachments)) 	$mail_error_data['attachments'] = $attachments;
						$mail_error_data['phpmailer_exception_code'] 	= $e->getCode();
						$mail_error_data['phpmailer_exception_errinfo'] = $phpmailer->ErrorInfo;

						$retDebugStr .= '<hr /><strong>Mail FAILED #exit-3</strong><br />';
						if (!$returnDebug) {
							echo '</pre>'.$retDebugStr;
							echo "Mailer Error: " . $phpmailer->ErrorInfo;
							echo "Mailer Error2: " . $e->getMessage();
							echo '<pre>'; print_r($mail_error_data); echo '</pre>';
							echo '<hr />';
						} else {
							return $retDebugStr.'---<pre>'.print_r($mail_error_data,1).'</pre>---<br />===<br />Final Error<br />error:'.$e->getMessage();
						}
					}
					return false;
			} finally {

				restore_error_handler();
			}

	}
	return false;

}

#} check SMTP Deets
function zeroBSCRM_mailDelivery_checkSMTPDetails($sendFromName='',$sendFromEmail='',$smtpHost='',$smtpPort='',$smtpUser='',$smtpPass=''){
	
	$ret = array('status' => false);

	#} Perms?
	if (!zeroBSCRM_permsMailCampaigns()){

		$ret['errors'] = 'perms';
		return $ret;
		
	}

	#} Check for empties once
	if (
			!empty($sendFromName) &&
			!empty($sendFromEmail) &&
			!empty($smtpHost) &&
			!empty($smtpPort) &&
			!empty($smtpUser) &&
			!empty($smtpPass)

		){

			$emailWasSent = false;

			#} Fill these into array
			$smtpSettings = array(
				'host' => $smtpHost,
				'user' => $smtpUser,
				'pass' => $smtpPass,
				'port' => 587,
				'security' => ''
			);

			#} check
			if (isset($smtpPort) && !empty($smtpPort)) $smtpSettings['port'] = (int)$smtpPort;

			#} rough switch (though it'll autoswitch below on fail)
			if ($smtpSettings['port'] == 465) $smtpSettings['security'] = 'ssl';


			#} This'll try as follows:
			#} - 1) Raw settings as provided by user/api call
			#} - 2) Check settings against common settings + if such (gmail etc.) then adopt typical settings + retest
			#} - 3) If no success, switch security models, (ssl/tls->tls/ssl->none)

			#} Fix for people with / or \ in their bloody passwords!


			#} Try send	
			if (
				isset($smtpSettings['host']) && !empty($smtpSettings['host']) && 
				isset($smtpSettings['user']) && !empty($smtpSettings['user']) && 
				isset($smtpSettings['pass']) && !empty($smtpSettings['pass']) && 
				isset($smtpSettings['port']) && !empty($smtpSettings['port']) 
			) {

				if (
					isset($sendFromName) && !empty($sendFromName) &&
					isset($sendFromEmail) && zeroBSCRM_validateEmail($sendFromEmail)
				){

					#} Some test text:
					$emTo = $sendFromEmail; // - here we send to itself :) VALIDATORTARGET;
					$emHTMLBody = zeroBSCRM_mailDelivery_generateTestHTML(true);
					$emTextBody = '';
					$emSubject = '[Jetpack CRM] '.__('Mail Delivery Routine',"zero-bs-crm");
					$commonSMTPSettings = jpcrm_maildelivery_common_SMTP_settings();

					if (
						isset($emHTMLBody) && !empty($emHTMLBody) &&
						isset($emTo) && zeroBSCRM_validateEmail($emTo)
					){

						$testCount = 0; $emailDebugs = array(); $emailSettingsTried = array();
						#} ===============================================
						#} ==== 1) Raw settings as provided by user/api call
						#} ===============================================

							#} Log this for later use :)
							$originalSec = $smtpSettings['security'];

						#} go
						$emailDebug = zeroBSCRM_mailDelivery_sendViaSMTP(
								#} SMTP Settings
								$smtpSettings['host'],$smtpSettings['port'],$smtpSettings['user'],$smtpSettings['pass'],
								#'tls', #tls ssl - switched for option:
								$smtpSettings['security'],
								#} FROM
								$sendFromEmail,$sendFromName,
								#} To
								$emTo,'',
								#} Deets
								$emSubject,$emTextBody,$emHTMLBody,
								#} Following returns debug
								true,true
						);

						#} add to debug list + log tried
						$emailDebugs[] = $emailDebug;
						$emailSettingsTried[] = json_encode($smtpSettings);

						#} Analysis of send

							$emailSentMsg = '';

							#success: or error:
						if ( str_starts_with( $emailDebug, 'error:' ) ) { // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase

								$emailWasSent = false;									
								$emailSentMsg = __('Your SMTP details do not allow mail to be sent. (A test email could not be successfully sent)',"zero-bs-crm");						

								#} various:
								if ($emailDebug == 'error:SMTP connect() failed.'){
										$emailSentMsg .= "
	".__('This error suggests that your Port & Security settings are not correct, or that you have the wrong value for SMTP Host.',"zero-bs-crm");
								}

						} elseif ( str_starts_with( $emailDebug, 'success:' ) ) { // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase

								$emailWasSent = true;								
								$emailSentMsg .= __("Success! Your SMTP details are correct. (A test email was successfully sent)","zero-bs-crm");

							}
							$testCount++;

							#} ===============================================
							#} ==== 2) Check settings against common settings + if such (gmail etc.) then adopt typical settings + retest
							#} ===============================================
							if (!$emailWasSent){

								#} slow down, joe
								sleep(1);

								$replacementHost = ''; $replacementPort = ''; $replacementSecurityMode = '';

								#} Check host
								foreach ($commonSMTPSettings as $commonSMTPKey => $commonSMTPSetting){

									if ($smtpSettings['host'] == $commonSMTPSetting['host']){

										#} Override port + security mode
										$replacementPort = $commonSMTPSetting['port'];
										$replacementSecurityMode = $commonSMTPSetting['auth'];

										#} got one!
										break;

									}

								}

								#} Try and catch common email addresses (e.g. @gmail.com)

								#} No luck?
								if (empty($replacementPort) && empty($replacementSecurityMode)){

									$mailProviderBreadcrumbs = array(
											'gmail' => array('gmail.com'),
											'outlook' => array('outlook.com'),
											'office365' => array('office365.com'),
											'yahoo' => array('yahoo.com'),
											'aol' => array('aol.com'),
											'hotmail' => array('hotmail.com')
									);

									#} dynamic :)
									foreach ($mailProviderBreadcrumbs as $settingKey => $needleArr){

										if (strpos('#'.$sendFromEmail, $needleArr[0]) > 0){

											#} Override port + security mode + host
											$replacementHost = $commonSMTPSettings[$settingKey]['host'];
											$replacementPort = $commonSMTPSettings[$settingKey]['port'];
											$replacementSecurityMode = $commonSMTPSettings[$settingKey]['auth'];

										}

									}
									
									#} extra - ehosts.com
									if (empty($replacementHost) && strpos('#'.$smtpSettings['host'],'ehosts.com') > 0){

											$replacementHost = $smtpSettings['host'];# leave as existing;
											$replacementPort = 465;
											$replacementSecurityMode = 'ssl';

									}

								}

								#} Override port + security mode
								if (!empty($replacementHost) || !empty($replacementPort) || !empty($replacementSecurityMode)){

									#} any? both?
									if (!empty($replacementHost)) $smtpSettings['host'] = $replacementHost;
									if (!empty($replacementPort)) $smtpSettings['port'] = $replacementPort;
									if (!empty($replacementSecurityMode)) $smtpSettings['security'] = $replacementSecurityMode; # tls, ssl, none

									#} If not already tried, try that!
									if (!in_array(json_encode($smtpSettings),$emailSettingsTried)){

											// Re-test
											$emailDebug = zeroBSCRM_mailDelivery_sendViaSMTP(

													#} SMTP Settings
													$smtpSettings['host'],$smtpSettings['port'],$smtpSettings['user'],$smtpSettings['pass'],
													#'tls', #tls ssl - switched for option:
													$smtpSettings['security'],
													#} FROM
													$sendFromEmail,$sendFromName,
													#} To
													$emTo,'',
													#} Deets
													$emSubject,$emTextBody,$emHTMLBody,
													#} Following returns debug
													true,true
											);

											#} add to debug list + save tried settings
											$emailDebugs[] = $emailDebug;
											$emailSettingsTried[] = json_encode($smtpSettings);

											#} Analysis of send - THIS ISN'T DRY!
											#success: or error:
								if ( str_starts_with( $emailDebug, 'error:' ) ) { // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase

												$emailWasSent = false;									
												$emailSentMsg = __('Your SMTP details do not allow mail to be sent. (A test email could not be successfully sent)',"zero-bs-crm");						

												#} various:
												if ($emailDebug == 'error:SMTP connect() failed.'){
														$emailSentMsg .= "
					".__('This error suggests that your Port & Security settings are not correct, or that you have the wrong value for SMTP Host.',"zero-bs-crm");
												}

								} elseif ( str_starts_with( $emailDebug, 'success:' ) ) { // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase

												$emailWasSent = true;								
												$emailSentMsg .= __("Success! Your SMTP details are correct. (A test email was successfully sent)","zero-bs-crm");

								}

											$testCount++;

									} // if not already tested

								} // if any to test

							}

							#} ===============================================
							#} ==== 3) If no success, switch security models, (ssl/tls->tls/ssl->none)
							#} ===============================================
							if (!$emailWasSent){

								#} slow down, joe
								sleep(1);

								#} Switch from existing
								switch ($smtpSettings['security']){

									case 'tls':
										#} TLS -> SSL
										$smtpSettings['port'] = 465;
										$smtpSettings['security'] = 'ssl';
										break;

									case 'ssl':
										#} SSL -> TLS
										$smtpSettings['port'] = 587;
										$smtpSettings['security'] = 'tls';
										break;

									case 'none':
										#} None -> TLS
										$smtpSettings['port'] = 587;
										$smtpSettings['security'] = 'tls';
										break;

									case '':
										#} None -> TLS
										$smtpSettings['port'] = 587;
										$smtpSettings['security'] = 'tls';
										break;

								}

								#} If not already tried, try that!
								if (!in_array(json_encode($smtpSettings),$emailSettingsTried)){

										// Re-test
										$emailDebug = zeroBSCRM_mailDelivery_sendViaSMTP(
												#} SMTP Settings
												$smtpSettings['host'],$smtpSettings['port'],$smtpSettings['user'],$smtpSettings['pass'],
												#'tls', #tls ssl - switched for option:
												$smtpSettings['security'],
												#} FROM
												$sendFromEmail,$sendFromName,
												#} To
												$emTo,'',
												#} Deets
												$emSubject,$emTextBody,$emHTMLBody,
												#} Following returns debug
												true,true
										);

										#} add to debug list + save tried settings
										$emailDebugs[] = $emailDebug;
										$emailSettingsTried[] = json_encode($smtpSettings);

										#} Analysis of send - THIS ISN'T DRY
										#success: or error:
							if ( str_starts_with( $emailDebug, 'error:' ) ) { // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase

											$emailWasSent = false;									
											$emailSentMsg = __('Your SMTP details do not allow mail to be sent. (A test email could not be successfully sent)',"zero-bs-crm");						

											#} various:
											if ($emailDebug == 'error:SMTP connect() failed.'){
													$emailSentMsg .= "
				".__('This error suggests that your Port & Security settings are not correct, or that you have the wrong value for SMTP Host.',"zero-bs-crm");
											}

							} elseif ( str_starts_with( $emailDebug, 'success:' ) ) { // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase

											$emailWasSent = true;								
											$emailSentMsg .= __("Success! Your SMTP details are correct. (A test email was successfully sent)","zero-bs-crm");

							}

										$testCount++;

								} // if not already tested

							}

							#} ===============================================
							#} ==== 4) If no success, and is 587, try without TLS
							#} ===============================================
							if (!$emailWasSent){

								#} slow down, joe
								sleep(1);

								#} TLS?
								if (isset($originalSec) && $originalSec == 'tls'){

										#} TLS -> none
										$smtpSettings['port'] = 587;
										$smtpSettings['security'] = '';

								}

								#} If not already tried, try that!
								if (!in_array(json_encode($smtpSettings),$emailSettingsTried)){

										// Re-test
										$emailDebug = zeroBSCRM_mailDelivery_sendViaSMTP(
												#} SMTP Settings
												$smtpSettings['host'],$smtpSettings['port'],$smtpSettings['user'],$smtpSettings['pass'],
												#'tls', #tls ssl - switched for option:
												$smtpSettings['security'],
												#} FROM
												$sendFromEmail,$sendFromName,
												#} To
												$emTo,'',
												#} Deets
												$emSubject,$emTextBody,$emHTMLBody,
												#} Following returns debug
												true,true
										);

										#} add to debug list + save tried settings
										$emailDebugs[] = $emailDebug;
										$emailSettingsTried[] = json_encode($smtpSettings);

										#} Analysis of send - THIS ISN'T DRY
										#success: or error:
							if ( str_starts_with( $emailDebug, 'error:' ) ) { // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase

											$emailWasSent = false;									
											$emailSentMsg = __('Your SMTP details do not allow mail to be sent. (A test email could not be successfully sent)',"zero-bs-crm");						

											#} various:
											if ($emailDebug == 'error:SMTP connect() failed.'){
													$emailSentMsg .= "
				".__('This error suggests that your Port & Security settings are not correct, or that you have the wrong value for SMTP Host.',"zero-bs-crm");
											}

							} elseif ( str_starts_with( $emailDebug, 'success:' ) ) { // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase

											$emailWasSent = true;								
											$emailSentMsg .= __("Success! Your SMTP details are correct. (A test email was successfully sent)","zero-bs-crm");

							}

										++$testCount; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
							} // if not already tested
						}
						#} Return

						#} SUPER ADMIN return full debug: 
						# $debugArr = array('details'=>true,'sent'=>$emailWasSent,'sentmsg'=>$emailSentMsg, 'tried'=>$testCount,'debugs'=>$emailDebugs,'settingsTried'=>$emailSettingsTried);
						#} Normal return:
						// from 2.94.2 return debugs
						$debugArr = array('details'=>true,'sent'=>$emailWasSent,'sentmsg'=>$emailSentMsg, 'tried'=>$testCount,'finset'=>$smtpSettings,'debugs'=>$emailDebugs);
						return $debugArr;

					} else {

						# rather than erroring, just send as response
						return array('details'=>true,'sent'=>false,'stage'=>3);
					}
				} else {

					# rather than erroring, just send as response
					return array('details'=>true,'sent'=>false,'stage'=>2);
				}
			} else {

				# rather than erroring, just send as response
				return array('details'=>true,'sent'=>false,'stage'=>1);
			}

	// / no empties
	} else {

		// smt empty
		$ret['errors'] = 'params';
		return $ret;
	}

}

/* 
*		Sends an email via Google Mail OAuth 2.0 connection
*/
function jpcrm_mail_delivery_send_via_gmail_oauth( $args ){

		global $zbs;

		$attachments = false;
		$msg_text    = '';
		$msg_html    = '';

		// ============ LOAD ARGS =============
		$default_args = array(
			'connection_profile' => '',
			'send_from'          => '',
			'send_from_name'     => '',
			'send_to'            => '',
			'send_to_name'       => '',
			'subject'            => '',
			'msg_text'           => '',
			'msg_html'           => '',
			'attachments'        => false,
			'debug'              => false,
			'return_debug'       => false,

        ); foreach ($default_args as $argK => $argV){ $$argK = $argV; if (is_array($args) && isset($args[$argK])) {  if (is_array($args[$argK])){ $newData = $$argK; if (!is_array($newData)) $newData = array(); foreach ($args[$argK] as $subK => $subV){ $newData[$subK] = $subV; }$$argK = $newData;} else { $$argK = $args[$argK]; } } }
        // ============ / LOAD ARGS =============

    // declare debug string (to return if $return_debug)
		$debug_string = '';

		// Let's make sure we've loaded the Google API library:
    // https://developers.google.com/gmail/api/quickstart/php
		$zbs->autoload_libraries();

    // Load OAuth
    $zbs->load_oauth_handler();           

    // got a usable connection profile?
		if ( $zbs->oauth->connection_status( 'google_mail' ) ){

			if ( $debug ){
				$msg = 'Viable Gmail connection found.<br>';
				$debug_string .= $msg;
				echo $msg;
			}

			// Get the API client
			$client = $zbs->oauth->get_google_client( $connection_profile );

			try {

				// build service object
				$service = new Google_Service_Gmail( $client );

				if ( $debug ){
					$msg = 'Gmail client and service generated.<br>';
					$debug_string .= $msg;
					echo $msg;
				}

				// build message
				$raw_message = "From: {$send_from_name} <{$send_from}>\r\n";
				$raw_message .= "To: {$send_to_name} <{$send_to}>\r\n";
				$raw_message .= 'Subject: =?utf-8?B?' . base64_encode( $subject ) . "?=\r\n";
				$raw_message .= "MIME-Version: 1.0\r\n";

				// Set mixed boundary if the email has attachments
				$mixed_boundary = '';
				if ( is_array( $attachments ) && count( $attachments ) > 0 ) {
					$mixed_boundary = '=-mixed-' . uniqid();

					$raw_message .= 'Content-Type: multipart/mixed; boundary="' . $mixed_boundary . '"' . "\r\n";
					$raw_message .= "\r\n--{$mixed_boundary}\r\n";
				}

				// Generate alternative boundary
				$alt_boundary = '=-alt-' . uniqid(); // unique boundary for the alternative version
				$raw_message .= 'Content-Type: multipart/alternative; boundary="' . $alt_boundary . '"' . "\r\n";

				// First the PLAIN text version (RFC 2046)
				if ( ! empty( $msg_text ) ) {
					$raw_message .= "\r\n--{$alt_boundary}\r\n"; // start alt boundary
					$raw_message .= "Content-Type: text/plain; charset=UTF-8\r\n\r\n";
					$raw_message .= $msg_text . "\r\n";
				}

				$raw_message .= "\r\n--{$alt_boundary}\r\n"; // start or next alt boundary
				$raw_message .= "Content-Type: text/html; charset=UTF-8\r\n\r\n";
				$raw_message .= $msg_html . "\r\n";

				$raw_message .= "\r\n--{$alt_boundary}--\r\n"; // end alt boundary

				if ( is_array( $attachments ) && count( $attachments ) > 0 ) {
					$raw_message .= "\r\n--{$mixed_boundary}\r\n"; // start mixed boundary

					foreach ( $attachments as $file_path ) {

						// Process attachment
						if ( is_array( $file_path ) ) {
							$file_path = ( count( $file_path ) > 0 ? $file_path[0] : '' );
						}

						if ( ! empty( $file_path ) ) {

							$array     = explode( '/', $file_path );
							$mime_type = jpcrm_get_mimetype( $file_path );
							$filename  = $array[ count( $array ) - 1 ];

							$raw_message .= "\r\n--{$mixed_boundary}\r\n";
							$raw_message .= 'Content-Type: ' . $mime_type . '; name="' . $filename . '";' . "\r\n";
							$raw_message .= 'Content-ID: <' . $filename . '>' . "\r\n";
							$raw_message .= 'Content-Description: ' . $filename . ';' . "\r\n";
							$raw_message .= 'Content-Disposition: attachment; filename="' . $filename . '"; size=' . filesize( $file_path ) . ';' . "\r\n";
							$raw_message .= 'Content-Transfer-Encoding: base64' . "\r\n\r\n";
							// phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents
							$file_content = file_get_contents( $file_path );
							// phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_encode
							$raw_message .= chunk_split( base64_encode( $file_content ), 76, "\n" ) . "\r\n";
						}
					}
					$raw_message .= "\r\n--{$mixed_boundary}--\r\n"; // end mixed boundary
				}

				// The message needs to be encoded in Base64URL
				$encoded_message = strtr(
					// phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_encode
					base64_encode( $raw_message ),
					array(
						'+' => '-',
						'/' => '_',
					)
				);

				// build message object
				$msg = new Google_Service_Gmail_Message();
				$msg->setRaw( $encoded_message );

				// The special value **me** can be used to indicate the authenticated user.
				$service->users_messages->send( "me", $msg );

				if ( $debug ){
					$msg = 'Gmail sent.<br>';
					$debug_string .= $msg;
					echo $msg;
				}

				if ( $return_debug ){
					return 'success:' . $debug_string;
				}

				return true;

			} catch ( Google\Service\Exception $e ){

				if ( $debug ){
					$msg = 'Error: Google\Service\Exception:<br>'.$e->getMessage().'!<br>';
					$debug_string .= $msg;
					echo $msg;
				}

			}

		} else {

				// config not in go state
				if ( $debug ){
					$msg = 'Gmail config not in ready state.';
					$debug_string .= $msg;
					echo $msg;
				}

		}

		if ( $return_debug ){
			return 'fail:' . $debug_string;
		}

		return false;

}

function zeroBSCRM_mailDelivery_retrieveACCByKey($key=-1){

	if ($key !== -1){

		global $zbs;
		$existingZBSSMTPAccs = zeroBSCRM_getSetting('smtpaccs');	

		if (!is_array($existingZBSSMTPAccs)) return false;
		if (isset($existingZBSSMTPAccs[$key])) return $existingZBSSMTPAccs[$key];

	}
	return false;
}

// returns a typed 'settings' array based on default WP setup :/
function zeroBSCRM_mailDelivery_retrieveACCWPDefault(){


		$sendFromEmail = zeroBSCRM_mailDelivery_defaultEmail();
		$sendFromName = zeroBSCRM_mailDelivery_defaultFromname();

		return array(

					'mode' => 'wp_mail',
					'fromemail' => $sendFromEmail,
					'fromname' => $sendFromName,
					'replyto' => $sendFromEmail,
					'cc' => '',
					'bcc' => '',
					'veri' => time() // verified?!

				);
}

function zeroBSCRM_mailDelivery_retrieveDefaultMDAcc(){

		// see if a default is set
		$defaultKey = zeroBSCRM_getMailDeliveryDefault();
		if (!empty($defaultKey)){

			// using key, get settings
			$mailSettings = zeroBSCRM_mailDelivery_retrieveACCByKey($defaultKey);

			if (is_array($mailSettings)) return $mailSettings;

		}

		return false;
}

// makes a simple array key for this index, comparing to existing :)
// some kind of semi-lazy permalink gen... lol @ self (though works)
function zeroBSCRM_mailDelivery_makeKey($accDeets=array()){

	if (is_array($accDeets)){

		$str = '';

		// should always be set
		if (isset($accDeets['fromemail'])) $str = $accDeets['fromemail'];
		if (empty($str) && isset($accDeets['fromname'])) $str .= ':'.$accDeets['fromname'];

		if (!empty($str)){

			// quick replaces
			$str = str_replace('@','-',strtolower($str));
			$str = str_replace('.','-',$str);
			$str = str_replace(':','-',$str);
			$str = str_replace(' ','-',$str);
			$str = str_replace('--','-',$str);

			// compare
			global $zbs;
			$existingZBSSMTPAccs = zeroBSCRM_getSetting('smtpaccs');	

			// check + append
			if (isset($existingZBSSMTPAccs[$str])){

				$extraNo = 1; $testStr = $str;
				while (isset($existingZBSSMTPAccs[$testStr]) && $extraNo < 50){
					$extraNo++;
					$testStr = $str.'--'.$extraNo; 
				}

				// any luck?
				if ($extraNo < 50) return $testStr;

			} else {
				
				// all good, return
				return $str;

			}


		}

	}
	return false;
}

// unencrypts password, but isn't obvious about it... lol?!
function zeroBSCRM_mailDelivery_retKeyData( $str = '' ){

	global $zbs;

	// load encryption lib
	$zbs->load_encryption();

	// decrypt password:
	return $zbs->encryption->decrypt( $str, 'smtp' );

}

// port check
function zeroBSCRM_mailDelivery_checkPort($port=false,$host='portquiz.net'){
	
	//$host = 'portquiz.net';
	$errno = '';
	$errstr = '';

	if (empty($host)) $host = 'portquiz.net';

	$connection = @fsockopen($host, $port, $errno, $errstr, 5);

	if (is_resource($connection)){
		fclose($connection);
		return array(true,$errno,$errstr);
	}

	return array(false,$errno,$errstr);

}

/* ======================================================
  Page/Shortcode stuff
   ====================================================== */
function zeroBSCRM_mailDelivery_unsubPage(){

	// this catches unsubs (managed mc2)
	do_action('zerobscrm_catch_unsubs');

} 
add_shortcode('jetpackcrm_unsubscribe', 'zeroBSCRM_mailDelivery_unsubPage');
add_shortcode('zerobscrm_unsubscribe', 'zeroBSCRM_mailDelivery_unsubPage');
/* ======================================================
  / Page/Shortcode stuff
   ====================================================== */
