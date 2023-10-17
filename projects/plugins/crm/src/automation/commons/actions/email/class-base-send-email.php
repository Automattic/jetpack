<?php
/**
 * Jetpack CRM Automation Send_Email_To_Contact action.
 *
 * @package automattic/jetpack-crm
 * @since 6.2.0
 */

namespace Automattic\Jetpack\CRM\Automation\Actions;

use Automattic\Jetpack\CRM\Automation\Base_Action;

/**
 * Adds the Add_Contact_Log class.
 *
 * @since 6.2.0
 */
abstract class Base_Send_Email extends Base_Action {

	/**
	 * Sends email.
	 * Note that this is essentially an abstraction layer on top of legacy code.
	 *
	 * @since 6.2.0
	 *
	 * @param array $email_data Array with email data.
	 */
	public function send_email( $email_data ) {

		// default delivery method
		$delivery_method = -1;

		// determine delivery method from email template settings
		if ( empty( $email_data['template'] ) ) {
			// legacy non-type
			$email_type = -999;
		} else {
			$email_type      = $email_data['template'];
			$delivery_method = zeroBSCRM_mailTemplate_getMailDelMethod( $email_type );
			if ( empty( $delivery_method ) ) {
				$delivery_method = -1;
			}
		}

		$legacy_email_data = array(
			'toEmail'  => $email_data['to_email'],
			'toName'   => $email_data['to_name'],
			'subject'  => $email_data['subject'],
			'message'  => $email_data['headers'],
			'body'     => $email_data['body'],
			'textbody' => '',
			'options'  => array(
				'html' => 1,
			),
			'tracking' => array(
				'emailTypeID'     => $email_type,
				'targetObjID'     => $email_data['target_id'],
				'senderWPID'      => $email_data['sender_id'],
				'associatedObjID' => $email_data['assoc_obj_id'],
			),
		);

		// send email
		zeroBSCRM_mailDelivery_sendMessage( $delivery_method, $legacy_email_data );
	}
}
