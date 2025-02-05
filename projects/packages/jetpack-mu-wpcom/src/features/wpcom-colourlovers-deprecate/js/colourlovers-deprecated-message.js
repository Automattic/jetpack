/* global wp, colourloversDeprecate */
const WARNING_NOTIFICATION_NAME = 'colourlover-warning';

/**
 * Creates a notification element for the Customizer.
 *
 * @param {string} message - The message to display in the notification.
 * @return {HTMLElement} The constructed notification container element.
 */
const createMainNotification = message => {
	// Outer container for the notification
	const notificationContainer = document.createElement( 'div' );
	notificationContainer.className = 'customize-control-notifications-container';

	// Unordered list for notifications
	const notificationList = document.createElement( 'ul' );

	// List item for the notification
	const notificationItem = document.createElement( 'li' );
	notificationItem.className = 'notice notice-warning';
	notificationItem.dataset.code = WARNING_NOTIFICATION_NAME;
	notificationItem.dataset.type = 'warning';

	// Notification message container
	const notificationMessage = document.createElement( 'div' );
	notificationMessage.className = 'notification-message';
	notificationMessage.textContent = message;

	// Assemble the notification structure
	notificationItem.appendChild( notificationMessage );
	notificationList.appendChild( notificationItem );
	notificationContainer.appendChild( notificationList );

	return notificationContainer;
};

// Wait for the Customizer to be ready
wp.customize.bind( 'ready', () => {
	const message = colourloversDeprecate.message;

	// Create the main notification container
	const mainNotification = createMainNotification( message );

	// Retrieve the original background image from the custom control
	const colourLoversBackground = wp.customize.control( 'colors-tool' ).origBackground;

	// Define the Customizer Notification object
	const notification = new wp.customize.Notification( WARNING_NOTIFICATION_NAME, {
		message,
		type: 'warning',
	} );

	// If the original background is set, monitor for changes
	wp.customize.bind( 'saved', () => {
		// Check if the background image has changed
		if ( colourLoversBackground !== wp.customize.control( 'background_image' ).setting() ) {
			mainNotification.style.display = 'none';
			wp.customize
				.section( 'colors_manager_tool' )
				.notifications.remove( WARNING_NOTIFICATION_NAME );
		}
	} );

	// Add the notification to the Customizer section
	wp.customize.section( 'colors_manager_tool' ).notifications.add( notification );

	// Insert the notification into the DOM
	document.querySelector( '#accordion-section-colors_manager_tool' )?.before( mainNotification );
} );
