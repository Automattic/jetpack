jQuery( document ).ready( function ( $ ) {
	const sendUserNotificationCheckbox = $( '#send_user_notification' );
	const userExternalContractorCheckbox = $( '#user_external_contractor' );
	const inviteUserWpcomCheckbox = $( '#invite_user_wpcom' );

	if ( inviteUserWpcomCheckbox && sendUserNotificationCheckbox && userExternalContractorCheckbox ) {
		// Toggle Send User Notification checkbox enabled/disabled based on Invite User checkbox
		// Enable External Contractor checkbox if Invite User checkbox is checked
		inviteUserWpcomCheckbox.on( 'change', function () {
			sendUserNotificationCheckbox.prop( 'disabled', inviteUserWpcomCheckbox.prop( 'checked' ) );
			if ( inviteUserWpcomCheckbox.prop( 'checked' ) ) {
				sendUserNotificationCheckbox.prop( 'checked', false );
				userExternalContractorCheckbox.prop( 'disabled', false );
			} else {
				userExternalContractorCheckbox.prop( 'disabled', true );
				userExternalContractorCheckbox.prop( 'checked', false );
			}
		} );

		// On load, disable Send User Notification checkbox if Invite User checkbox is checked
		if ( inviteUserWpcomCheckbox.prop( 'checked' ) ) {
			sendUserNotificationCheckbox.prop( 'disabled', true );
			sendUserNotificationCheckbox.prop( 'checked', false );
		}

		// On load, disable External Contractor checkbox if Invite User checkbox is unchecked
		if ( ! inviteUserWpcomCheckbox.prop( 'checked' ) ) {
			userExternalContractorCheckbox.prop( 'disabled', true );
		}
	}
} );
