const rawScript = `
	function initWPBlockBridge() {
		const videoPressIFrame = document.querySelector('iframe');
		const videoPressWindow = videoPressIFrame.contentWindow;

		// Allowed events emitted by the videopress API.
		const videoPressEventsMap = {
			'playing': {
				name: 'onVideoPressPlaying',
				type: 'event',
			},
			'pause': {
				name: 'onVideoPressPause',
				type: 'event',
			},
			'seeking': {
				name: 'onVideoPressSeeking',
				type: 'event',
			},
			'resize': {
				name: 'onVideoPressResize',
				type: 'event',
			},
			'volumechange': {
				name: 'onVideoPressVolumeChange',
				type: 'event',
			},
			'ended': {
				name: 'onVideoPressEnded',
				type: 'event',
			},
			'videopress_progress': {
				name: 'onVideoPressProgress',
				type: 'event',
			},
			'videopress_loading_state': {
				name: 'onVideoPressLoadingState',
				type: 'event',
			},

			'vpblock_action_play': {
				name: 'onVPBlockActionPlay',
				type: 'action',
				videoPressAction: 'videopress_action_play',
			},
			'vpblock_action_pause': {
				name: 'onVPBlockActionPause',
				type: 'action',
				videoPressAction: 'videopress_action_pause',
			},
		};

		const allowedVideoPressEvents = Object.keys( videoPressEventsMap );

		window.addEventListener( 'message', ( ev ) => {
			const { data } = ev;
			const eventName = data.event;
			if ( ! allowedVideoPressEvents.includes( eventName ) ) {
				return;
			}
			
			// Rename event with the 'onVideoPress' prefix.
			const vpEvent = videoPressEventsMap[ eventName ];
			const { name: vpEventName, type: vpEventType, videoPressAction } = vpEvent;

			// Dispatch event to top when it's an event
			if ( vpEventType === 'event' ) {
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

				window.parent.dispatchEvent( videoPressBlockEvent );
			}

			if ( vpEventType === 'action' ) {
				videoPressWindow.postMessage( {
					event: videoPressAction,
				}, '*' );
			}
		} );
	}

	initWPBlockBridge();
`;

export default URL.createObjectURL( new Blob( [ rawScript ], { type: 'text/javascript' } ) );
