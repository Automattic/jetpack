jQuery( document ).ready( function ( $ ) {
	var sendUserNotificationCheckbox = $( '#send_user_notification' );
	var inviteUserWpcomCheckbox = $( '#invite_user_wpcom' );

	if ( inviteUserWpcomCheckbox && sendUserNotificationCheckbox ) {
		// Toggle Send User Notification checkbox enabled/disabled based on Invite User checkbox
		inviteUserWpcomCheckbox.on( 'change', function () {
			sendUserNotificationCheckbox.prop( 'disabled', inviteUserWpcomCheckbox.prop( 'checked' ) );
			if ( inviteUserWpcomCheckbox.prop( 'checked' ) ) {
				sendUserNotificationCheckbox.prop( 'checked', false );
			}
		} );

		// On load, disable Send User Notification checkbox if Invite User checkbox is checked
		if ( inviteUserWpcomCheckbox.prop( 'checked' ) ) {
			sendUserNotificationCheckbox.prop( 'disabled', true );
			sendUserNotificationCheckbox.prop( 'checked', false );
		}
	}
} );
