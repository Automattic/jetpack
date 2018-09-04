<?php

class Jetpack_Sync_Module_Attachments extends Jetpack_Sync_Module {
	function name() {
		return 'attachments';
	}

	public function init_listeners( $callable ) {
		add_action( 'edit_attachment', array( $this, 'send_attachment_info' ) );
		// Once we don't have to support 4.3 we can start using add_action( 'attachment_updated', $handler, 10, 3 ); instead
		add_action( 'add_attachment', array( $this, 'send_attachment_info' ) );
		add_action( 'attachment_updated', array( $this, 'process_update'), 10, 3 );
		add_action( 'jetpack_sync_save_update_attachment', $callable, 10, 2 );
		add_action( 'jetpack_sync_save_add_attachment', $callable, 10, 2 );
		add_action( 'jetpack_sync_save_attach_attachment', $callable, 10, 2 );
	}

	function send_attachment_info( $attachment_id ) {
		$attachment = get_post( $attachment_id );
		if ( 'add_attachment' === current_filter() ) {
			/**
			 * Fires when the client needs to sync an new attachment
			 *
			 * @since 4.2.0
			 *
			 * @param int The attachment ID
			 * @param object The attachment
			 */
			do_action( 'jetpack_sync_save_add_attachment', $attachment_id, $attachment );
		} else {
			/**
			 * Fires when the client needs to sync an updated attachment
			 *
			 * @since 4.9.0
			 *
			 * @param int The attachment ID
			 * @param object The attachment
			 *
			 * Previously this action was synced using jetpack_sync_save_add_attachment action.
			 */
			do_action( 'jetpack_sync_save_update_attachment', $attachment_id, $attachment );
		}

	}

	function process_update( $attachment_id, $attachment_after, $attachment_before ) {
		// Check whether attachment was added to a post for the first time
		if ( 0 === $attachment_before->post_parent && 0 !== $attachment_after->post_parent ) {
			/**
			 * Fires when an existing attachment is added to a post for the first time
			 *
			 * @since 6.5.0
			 *
			 * @param int The attachment ID
			 * @param object The attachment
			 */
			do_action( 'jetpack_sync_save_attach_attachment', $attachment_id, $attachment_after );
		}
	}
}
