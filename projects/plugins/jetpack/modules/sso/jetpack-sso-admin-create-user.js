jQuery( document ).ready( function ( $ ) {
	var sendUserNotificationCheckbox = $( '#send_user_notification' );
	var userExternalContractorCheckbox = $( '#user_external_contractor' );
	var inviteUserWpcomCheckbox = $( '#invite_user_wpcom' );
	const customEmailMessageBlock = document.getElementById( 'custom_email_message_block' );

	if (
		inviteUserWpcomCheckbox &&
		sendUserNotificationCheckbox &&
		userExternalContractorCheckbox &&
		customEmailMessageBlock
	) {
		// Toggle Send User Notification checkbox enabled/disabled based on Invite User checkbox
		// Enable External Contractor checkbox if Invite User checkbox is checked
		// Show/hide the external email message field.
		inviteUserWpcomCheckbox.on( 'change', function () {
			sendUserNotificationCheckbox.prop( 'disabled', inviteUserWpcomCheckbox.prop( 'checked' ) );
			if ( inviteUserWpcomCheckbox.prop( 'checked' ) ) {
				sendUserNotificationCheckbox.prop( 'checked', false );
				userExternalContractorCheckbox.prop( 'disabled', false );
				customEmailMessageBlock.style.display = 'table';
			} else {
				userExternalContractorCheckbox.prop( 'disabled', true );
				userExternalContractorCheckbox.prop( 'checked', false );
				customEmailMessageBlock.style.display = 'none';
			}
		} );

		// On load, disable Send User Notification checkbox and show the custom email message if Invite User checkbox is checked
		if ( inviteUserWpcomCheckbox.prop( 'checked' ) ) {
			sendUserNotificationCheckbox.prop( 'disabled', true );
			sendUserNotificationCheckbox.prop( 'checked', false );
			customEmailMessageBlock.style.display = 'table';
		}

		// On load, disable External Contractor checkbox and hide the custom email message if Invite User checkbox is unchecked
		if ( ! inviteUserWpcomCheckbox.prop( 'checked' ) ) {
			userExternalContractorCheckbox.prop( 'disabled', true );
			customEmailMessageBlock.style.display = 'none';
		}
	}
} );
