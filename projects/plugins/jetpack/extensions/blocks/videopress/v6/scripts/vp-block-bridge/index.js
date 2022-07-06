const rawScript = `
	function initWPBlockBridge() {
		// Allowed events emitted by the videopress API.
		const videoPressEventsMap = {
			'playing': 'onVideoPressPlaying',
			'pause': 'onVideoPressPause',
			'seeking': 'onVideoPressSeeking',
			'resize': 'onVideoPressResize',
			'volumechange': 'onVideoPressVolumeChange',
			'ended': 'onVideoPressEnded',
			'videopress_progress': 'onVideoPressProgress',
			'videopress_loading_state': 'onVideoPressLoadingState',
		};

		const allowedVideoPressEvents = Object.keys( videoPressEventsMap );

		window.addEventListener( 'message', ( ev ) => {
			const { data } = ev;
			const eventName = data.event;
			if ( ! allowedVideoPressEvents.includes( eventName ) ) {
				return;
			}
			
			// Rename event with the 'onVideoPress' prefix.
			const vpEventName = videoPressEventsMap[ eventName ];

			// It preferrs to use the guid instead of the id.
			const guid = data.id;
			const originalEventName = data.event;

			// clean event data object
			delete data.event;
			delete data.id;

			// Emite custom event with the event data.
			const videoPressBlockEvent = new CustomEvent( vpEventName, {
				detail: {
					...data,
					originalEventName,
					guid,
				},
			} );

			top.dispatchEvent( videoPressBlockEvent );
		} );
	}

	initWPBlockBridge();
`;

export default URL.createObjectURL( new Blob( [ rawScript ], { type: 'text/javascript' } ) );
