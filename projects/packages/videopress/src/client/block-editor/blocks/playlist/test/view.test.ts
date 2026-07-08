import { screen } from '@testing-library/react';
import { initPlaylistBlocks } from '../view';

declare global {
	// The runtime matcher comes from @wordpress/jest-console via the shared
	// jest setup (tools/js-tools/jest/setup-console.js), but its declarations
	// aren't wired into this package's tsconfig — mirror the one matcher used.
	// eslint-disable-next-line @typescript-eslint/no-namespace
	namespace jest {
		// eslint-disable-next-line @typescript-eslint/no-unused-vars -- must match the upstream type parameter list to merge.
		interface Matchers< R, T > {
			toHaveErrored(): R;
		}
	}
}

type TestVideo = {
	guid: string;
	embedUrl: string;
	title: string;
};

const videoA: TestVideo = {
	guid: 'guidaaa1',
	embedUrl: 'https://videopress.com/embed/guidaaa1?resizeToParent=1&cover=1&autoPlay=0',
	title: 'First video',
};
const videoB: TestVideo = {
	guid: 'guidbbb2',
	embedUrl: 'https://videopress.com/embed/guidbbb2?resizeToParent=1&cover=1&autoPlay=0',
	title: 'Second video',
};
const videoC: TestVideo = {
	guid: 'guidccc3',
	embedUrl: 'https://videopress.com/embed/guidccc3?resizeToParent=1&cover=1&autoPlay=0',
	title: 'Third video',
};

/**
 * Build the server-rendered playlist markup (Playlist_Block::render shape)
 * and initialize the view script on it.
 *
 * @param {object}  options              - Options.
 * @param {Array}   options.videos       - The playlist videos, in order.
 * @param {boolean} options.autoplayNext - The autoplayNext config flag.
 * @param {string}  options.configJson   - Raw config JSON override (for malformed input).
 * @return {void}
 */
function renderPlaylist( {
	videos = [ videoA, videoB, videoC ],
	autoplayNext = true,
	configJson,
}: {
	videos?: TestVideo[];
	autoplayNext?: boolean;
	configJson?: string;
} = {} ): void {
	const config = configJson ?? JSON.stringify( { videos, autoplayNext } );
	const items = videos
		.map(
			( video, index ) =>
				`<li class="wp-block-videopress-playlist__item">` +
				`<button type="button" class="wp-block-videopress-playlist__item-button" data-vp-guid="${
					video.guid
				}"${ index === 0 ? ' aria-current="true"' : '' }>` +
				`<span class="wp-block-videopress-playlist__item-title">${ video.title }</span>` +
				`</button></li>`
		)
		.join( '' );

	document.body.innerHTML =
		`<figure class="wp-block-videopress-playlist wp-block-videopress-playlist--list">` +
		`<div class="wp-block-videopress-playlist__player">` +
		`<iframe title="${ videos[ 0 ].title }" aria-label="${ videos[ 0 ].title }" src="${ videos[ 0 ].embedUrl }" width="640" height="360" allowfullscreen data-resize-to-parent="true" allow="clipboard-write"></iframe>` +
		`</div>` +
		`<ol class="wp-block-videopress-playlist__items">${ items }</ol>` +
		`<script type="application/json" class="wp-block-videopress-playlist__config">${ config }</script>` +
		`</figure>`;

	initPlaylistBlocks();
}

/**
 * Get the block's main player iframe by its accessible title.
 *
 * @param {string} title - The expected iframe title.
 * @return {HTMLIFrameElement} The main player iframe.
 */
function getPlayerIframe( title: string ): HTMLIFrameElement {
	return screen.getByTitle( title ) as HTMLIFrameElement;
}

/**
 * Dispatch a window message event, optionally impersonating a source window.
 *
 * @param {object} options        - Options.
 * @param {object} options.data   - Event data payload.
 * @param {string} options.origin - Event origin.
 * @param {object} options.source - Event source window.
 * @return {void}
 */
function dispatchMessage( {
	data = { event: 'videopress_ended' },
	origin = 'https://videopress.com',
	source = null,
}: {
	data?: Record< string, unknown >;
	origin?: string;
	source?: unknown;
} = {} ): void {
	const event = new MessageEvent( 'message', { data, origin } );
	// MessageEvent's constructor only accepts real Window/MessagePort
	// sources, so impersonate via defineProperty (same trick as the
	// token-bridge tests).
	Object.defineProperty( event, 'source', { value: source } );
	window.dispatchEvent( event );
}

describe( 'playlist block view', () => {
	afterEach( () => {
		document.body.innerHTML = '';
	} );

	it( 'parses and removes the JSON config script', () => {
		renderPlaylist();

		// eslint-disable-next-line testing-library/no-node-access -- the config script is role-less; no query applies.
		expect( document.querySelector( '.wp-block-videopress-playlist__config' ) ).toBeNull();
	} );

	it( 'swaps the main player and moves aria-current when a row is clicked', () => {
		renderPlaylist();

		const buttons = screen.getAllByRole( 'button' );
		buttons[ 1 ].click();

		const iframe = getPlayerIframe( 'Second video' );
		const src = new URL( iframe.src );
		expect( src.pathname ).toBe( '/embed/guidbbb2' );
		// The swapped-in player starts immediately…
		expect( src.searchParams.get( 'autoPlay' ) ).toBe( '1' );
		// …and keeps the rest of the server-built query untouched.
		expect( src.searchParams.get( 'resizeToParent' ) ).toBe( '1' );
		expect( iframe ).toHaveAttribute( 'aria-label', 'Second video' );

		expect( buttons[ 1 ] ).toHaveAttribute( 'aria-current', 'true' );
		expect( buttons[ 0 ] ).not.toHaveAttribute( 'aria-current' );
	} );

	it( 'advances through the playlist on videopress_ended from the active player', () => {
		renderPlaylist();

		dispatchMessage( { source: getPlayerIframe( 'First video' ).contentWindow } );

		let buttons = screen.getAllByRole( 'button' );
		expect( getPlayerIframe( 'Second video' ) ).toBeInTheDocument();
		expect( buttons[ 1 ] ).toHaveAttribute( 'aria-current', 'true' );
		expect( buttons[ 0 ] ).not.toHaveAttribute( 'aria-current' );

		// The listener follows the freshly swapped-in iframe.
		dispatchMessage( { source: getPlayerIframe( 'Second video' ).contentWindow } );

		buttons = screen.getAllByRole( 'button' );
		expect( getPlayerIframe( 'Third video' ) ).toBeInTheDocument();
		expect( buttons[ 2 ] ).toHaveAttribute( 'aria-current', 'true' );
	} );

	it( 'stops at the last video instead of wrapping around', () => {
		renderPlaylist();

		const buttons = screen.getAllByRole( 'button' );
		buttons[ 2 ].click();

		dispatchMessage( { source: getPlayerIframe( 'Third video' ).contentWindow } );

		expect( getPlayerIframe( 'Third video' ) ).toBeInTheDocument();
		expect( buttons[ 2 ] ).toHaveAttribute( 'aria-current', 'true' );
	} );

	it( 'rejects videopress_ended from untrusted origins', () => {
		renderPlaylist();

		dispatchMessage( {
			origin: 'https://evil.com',
			source: getPlayerIframe( 'First video' ).contentWindow,
		} );

		expect( getPlayerIframe( 'First video' ) ).toBeInTheDocument();
		expect( screen.getAllByRole( 'button' )[ 0 ] ).toHaveAttribute( 'aria-current', 'true' );
	} );

	it( 'rejects videopress_ended from windows other than the active player', () => {
		renderPlaylist();

		dispatchMessage( { source: {} } );

		expect( getPlayerIframe( 'First video' ) ).toBeInTheDocument();
		expect( screen.getAllByRole( 'button' )[ 0 ] ).toHaveAttribute( 'aria-current', 'true' );
	} );

	it( 'ignores other player events from the active player', () => {
		renderPlaylist();

		dispatchMessage( {
			data: { event: 'videopress_pause' },
			source: getPlayerIframe( 'First video' ).contentWindow,
		} );

		expect( getPlayerIframe( 'First video' ) ).toBeInTheDocument();
	} );

	it( 'does not auto-advance when autoplayNext is off', () => {
		renderPlaylist( { autoplayNext: false } );

		dispatchMessage( { source: getPlayerIframe( 'First video' ).contentWindow } );

		expect( getPlayerIframe( 'First video' ) ).toBeInTheDocument();
		expect( screen.getAllByRole( 'button' )[ 0 ] ).toHaveAttribute( 'aria-current', 'true' );

		// Manual clicks still swap the player.
		screen.getAllByRole( 'button' )[ 1 ].click();
		expect( getPlayerIframe( 'Second video' ) ).toBeInTheDocument();
	} );

	it( 'leaves the block static when the config JSON is malformed', () => {
		renderPlaylist( { configJson: '{ not json' } );

		expect( console ).toHaveErrored();

		// The block still shows the server-rendered first video, and clicking
		// does nothing rather than crashing.
		screen.getAllByRole( 'button' )[ 1 ].click();
		expect( getPlayerIframe( 'First video' ) ).toBeInTheDocument();
	} );
} );
