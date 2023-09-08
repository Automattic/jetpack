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
 * Postie_Plugin_Inbox_Service class.
 *
 * This class implements the Inbox_Service interface to provide functionalities
 * specific to the Postie plugin. It hooks into the 'postie_post_before' filter
 * to perform custom operations before a post is published by Postie.
 */
class Postie_Plugin_Inbox_Service implements Inbox_Service {

	/**
	 * Registers the service by hooking into WordPress actions and filters.
	 *
	 * @return void
	 */
	public function register() {
		add_filter( 'postie_post_before', array( $this, 'postie_before_post_function' ), 10, 2 );
	}

	/**
	 * Function to be called before a post is published by Postie.
	 *
	 * This function gets the author's email from the post, finds the associated contact ID,
	 * and then fires a custom action 'jpcrm_inbox_messages_fetched' to further handle the inbox message.
	 *
	 * @param array $post     The post data array.
	 *
	 * @return string  An empty string to block Postie from making a blog post.
	 */
	public function postie_before_post_function( $post ) {
		$contact_id = (int) zeroBS_getCustomerIDWithEmail( $post['email_author'] );

		if ( $contact_id <= 0 ) {
			return '';
		}

		$message_timestamp = ( new \DateTime( $post['post_date_gmt'], new \DateTimeZone( 'UTC' ) ) )->getTimestamp();
		$inbox_message     = new Inbox_Message( $contact_id, $post['post_title'], $post['post_content'], 'email', $message_timestamp );
		do_action( 'jpcrm_inbox_messages_fetched', array( $inbox_message ) );
		return '';
	}

}
