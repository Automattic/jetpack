/* global wp, colourloversDeprecate */
wp.customize.bind( 'ready', function () {
	const message = colourloversDeprecate.message;

	wp.customize.section( 'colors_manager_tool', function ( section ) {
		if ( section.notifications ) {
			const notification = new wp.customize.Notification(
				'colourlover-warning', // Notification ID
				{
					message,
					type: 'warning',
				}
			);
			section.notifications.add( notification );
		}
	} );

	const panel = document.querySelector( '#accordion-section-colors_manager_tool' );

	if ( panel ) {
		// Create the outer container
		const notificationContainer = document.createElement( 'div' );
		notificationContainer.className = 'customize-control-notifications-container';

		// Create the unordered list
		const notificationList = document.createElement( 'ul' );

		// Create the list item for the notification
		const notificationItem = document.createElement( 'li' );
		notificationItem.className = 'notice notice-warning';
		notificationItem.dataset.code = 'colourlover-warning';
		notificationItem.dataset.type = 'warning';

		// Create the message container
		const notificationMessage = document.createElement( 'div' );
		notificationMessage.className = 'notification-message';
		notificationMessage.textContent = message;

		// Append the message to the list item
		notificationItem.appendChild( notificationMessage );

		// Append the list item to the unordered list
		notificationList.appendChild( notificationItem );

		// Append the unordered list to the outer container
		notificationContainer.appendChild( notificationList );

		// Insert the new notification structure into the panel
		panel.insertBefore( notificationContainer, panel.firstChild );
	}
} );
