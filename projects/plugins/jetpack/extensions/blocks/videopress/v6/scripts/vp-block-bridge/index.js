const rawScript = `
	function initWPBlockBridge() {
		// Allowed events emitted by the videopress API.
		const allowedVideoPressEvents = [
			'playing',
			'pause',
			'seeking',
			'resize',
			'volumechange',
			'ended',
		];

		window.addEventListener( 'message', ( ev ) => {
			const { data } = ev;
			const eventName = data.event;
			if ( ! allowedVideoPressEvents.includes( eventName ) ) {
				return;
			}
			
			// Rename event with the 'onVPBlock' prefix.
			const event = 'onVPBlock' + eventName[ 0 ].toUpperCase() + eventName.slice( 1 );

			// It preferrs to use the guid instead of the id.
			const guid = data.id;
			const videoPressEvent = data.event;

			// clean event data object
			delete data.event;
			delete data.id;

			// Emite custom event with the event data.
			const videoPressBlockEvent = new CustomEvent( event, {
				detail: {
					...data,
					videoPressEvent,
					guid,
				},
			} );

			top.dispatchEvent( videoPressBlockEvent );
		} );
	}

	initWPBlockBridge();
`;

export default URL.createObjectURL( new Blob( [ rawScript ], { type: 'text/javascript' } ) );
