<?php
/**
 * Jetpack CRM
 * https://jetpackcrm.com
 *
 *
 *
 * @package automattic/jetpack-crm
 */

namespace Automattic\Jetpack_CRM\Modules\Inbox;

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
		require_once JPCRM_INBOX_MODULE_PATH . '/sync/class-inbox-message.php';
		require_once JPCRM_INBOX_MODULE_PATH . '/sync/services/interface-inbox-service.php';
		require_once JPCRM_INBOX_MODULE_PATH . '/sync/services/postie_plugin/class-postie-plugin-inbox-service.php';
		$postie_plugin_service = new Postie_Plugin_Inbox_Service();
		$postie_plugin_service->register();
	}

	/**
	 * Handles the 'jpcrm_inbox_messages_fetched' action.
	 *
	 * @since $$next-version$$
	 *
	 * @param Inbox_Message[] $messages The messages fetched, as an array of Inbox_Message objects.
	 */
	public function inbox_messages_fetched( $messages ) {
		if ( ! is_array( $messages ) ) {
			$messages = array( $messages );
		}

		foreach ( $messages as $message ) {
			// TODO: Just hacking (i.e. misusing) the database so it logs as a received email.
			zeroBSCRM_mailTracking_logEmail(
				-999,
				$message->get_sender_contact_id(),
				0,
				zeroBS_customerEmail( $message->get_sender_contact_id() ),
				-999,
				wp_kses( $message->get_subject(), 'post' ),
				true,
				wp_kses( $message->get_content(), 'post' ),
				-1,
				'',
				'received',
				''
			);
			zeroBS_addUpdateContactLog(
				$message->get_sender_contact_id(),
				-1,
				-1,
				array(
					'type'           => 'Email',
					'shortdesc'      => __( 'Email Received', 'zero-bs-crm' ),
					'longdesc'       => __( 'Email received with the subject: ', 'zero-bs-crm' ) . wp_kses( $message->get_subject(), 'post' ),
					'meta_assoc_src' => 'singlemail',
				)
			);
		}
	}
}
