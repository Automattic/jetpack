document.addEventListener( 'DOMContentLoaded', function () {
	const sendUserNotificationCheckbox = document.getElementById( 'send_user_notification' );
	const userExternalContractorCheckbox = document.getElementById( 'user_external_contractor' );
	const inviteUserWpcomCheckbox = document.getElementById( 'invite_user_wpcom' );
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
		inviteUserWpcomCheckbox.addEventListener( 'change', function () {
			sendUserNotificationCheckbox.disabled = inviteUserWpcomCheckbox.checked;
			if ( inviteUserWpcomCheckbox.checked ) {
				sendUserNotificationCheckbox.checked = false;
				userExternalContractorCheckbox.disabled = false;
				customEmailMessageBlock.style.display = 'table';
			} else {
				userExternalContractorCheckbox.disabled = true;
				userExternalContractorCheckbox.checked = false;
				customEmailMessageBlock.style.display = 'none';
			}
		} );

		// On load, disable Send User Notification checkbox
		// and show the custom email message if Invite User checkbox is checked
		if ( inviteUserWpcomCheckbox.checked ) {
			sendUserNotificationCheckbox.disabled = true;
			sendUserNotificationCheckbox.checked = false;
			customEmailMessageBlock.style.display = 'table';
		}

		// On load, disable External Contractor checkbox
		// and hide the custom email message if Invite User checkbox is unchecked
		if ( ! inviteUserWpcomCheckbox.checked ) {
			userExternalContractorCheckbox.disabled = true;
			customEmailMessageBlock.style.display = 'none';
		}
	}
} );
