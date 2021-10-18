// Helper function for keyboard-equivalents of onClick events

/**
 * Helper function which triggers a callback on a keydown event, only
 * if the key pressed is space or enter - to mirror button functionality.
 *
 * @param {Function} callback - function to call after the keydown event
 * @returns {Function}        a function ready to be used as event handler
 */
export default function ( callback ) {
	return event => {
		if ( event.which === 13 || event.which === 32 ) {
			callback( event );
		}
	};
}
