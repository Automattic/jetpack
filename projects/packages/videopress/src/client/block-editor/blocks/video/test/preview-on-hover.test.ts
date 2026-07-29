import { previewOnHoverEffect } from '../preview-on-hover';

describe( 'previewOnHoverEffect', () => {
	const customizeSet = jest.fn();
	const play = jest.fn();
	const pause = jest.fn();
	const seek = jest.fn();
	let onPlayerStatusChanged: ( oldStatus: string, newStatus: string ) => void;
	let overlay: Element;

	beforeEach( () => {
		jest.clearAllMocks();
		document.body.innerHTML = `
			<div class="wp-block-jetpack-videopress">
				<iframe></iframe>
				<script type="application/json">${ JSON.stringify( {
					previewAtTime: 15,
					previewLoopDuration: 5,
					autoplay: false,
					showControls: true,
				} ) }</script>
				<button class="jetpack-videopress-player__overlay"></button>
			</div>
		`;
		overlay = document.querySelector( '.jetpack-videopress-player__overlay' );

		const iframeApi = {
			status: {
				onPlayerStatusChanged: jest.fn( callback => {
					onPlayerStatusChanged = callback;
				} ),
				onTimeUpdate: jest.fn(),
			},
			controls: { play, pause, seek },
			customize: { set: customizeSet },
		};
		let ready: () => void;
		window.VideoPressIframeApi = jest.fn( ( _iframe, callback ) => {
			ready = callback;
			return iframeApi;
		} ) as unknown as Window[ 'VideoPressIframeApi' ];

		previewOnHoverEffect();
		ready();
	} );

	afterEach( () => {
		document.body.innerHTML = '';
	} );

	it( 'uses the public poster key and hides the title throughout preview mode', () => {
		onPlayerStatusChanged( 'ready', 'playing' );
		expect( customizeSet ).toHaveBeenLastCalledWith( {
			bigPlayButton: true,
			playPauseAnimation: false,
			controlBar: false,
			shareButton: false,
			showPoster: true,
			title: false,
		} );
		expect( seek ).toHaveBeenCalledWith( 15 );

		overlay.dispatchEvent( new MouseEvent( 'mouseenter' ) );
		expect( customizeSet ).toHaveBeenLastCalledWith( {
			playPauseAnimation: false,
			showPoster: false,
			title: false,
		} );
		expect( play ).toHaveBeenCalled();

		overlay.dispatchEvent( new MouseEvent( 'mouseleave' ) );
		expect( customizeSet ).toHaveBeenLastCalledWith( {
			playPauseAnimation: false,
			showPoster: true,
			title: false,
		} );
		expect( pause ).toHaveBeenCalled();
	} );

	it( 'restores the normal title and poster behavior after activation', () => {
		overlay.dispatchEvent( new MouseEvent( 'click' ) );

		expect( customizeSet ).toHaveBeenLastCalledWith( {
			bigPlayButton: false,
			playPauseAnimation: true,
			controlBar: true,
			shareButton: true,
			showPoster: false,
			title: true,
		} );
		expect( seek ).toHaveBeenCalledWith( 0 );
		expect( overlay.isConnected ).toBe( false );
	} );
} );
