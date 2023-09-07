<?php
/**
 * Jetpack CRM
 * https://jetpackcrm.com
 *
 *
 *
 * @package automattic/jetpack-crm
 */

namespace Automattic\Jetpack_CRM\Modules\Email;

// block direct access
defined( 'ZEROBSCRM_PATH' ) || exit;

/**
 * Inbox_Sync class
 */
class Inbox_Sync {

	/**
	 * Constructor.
	 *
	 * @since $$next-version$$
	 */
	public function __construct() {
		add_action( 'jpcrm_inbox_messages_fetched', array( $this, 'inbox_messages_fetched' ) );
		// This is a quick hack to always include the Postie Plugin service, this should be loaded in a more sophisticated way (e.g. including it to composer autoload list).
		require_once JPCRM_EMAIL_MODULE_PATH . '/sync/class-inbox-message.php';
		require_once JPCRM_EMAIL_MODULE_PATH . '/sync/services/interface-inbox-service.php';
		require_once JPCRM_EMAIL_MODULE_PATH . '/sync/services/postie_plugin/class-postie-plugin-inbox-service.php';
		$postie_plugin_service = new Postie_Plugin_Inbox_Service();
		$postie_plugin_service->register();
	}

	/**
	 * Handles the 'jpcrm_inbox_messages_fetched' action.
	 *
	 * @since $$next-version$$
	 *
	 * @param Inbox_Message[] $emails The emails fetched, as an array of Inbox_Message objects.
	 */
	public function inbox_messages_fetched( $emails ) {
		if ( ! is_array( $emails ) ) {
			$emails = array( $emails );
		}

		foreach ( $emails as $email ) {
			zeroBS_addUpdateLog(
				$email->get_sender_contact_id(),
				-1,
				-1,
				array(
					'type'      => __( 'Email Received', 'zero-bs-crm' ),
					'shortdesc' => $email->get_subject(),
					'longdesc'  => $email->get_content(),
				),
				'zerobs_customer'
			);
		}
	}
}
