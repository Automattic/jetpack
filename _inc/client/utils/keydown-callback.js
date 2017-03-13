// Helper function for keyboard-equivalents of onClick events

export default function( callback ) {
	return ( event ) => {
		if ( event.which === 13 || event.which === 32 ) {
			callback( event );
		}
	};
}
