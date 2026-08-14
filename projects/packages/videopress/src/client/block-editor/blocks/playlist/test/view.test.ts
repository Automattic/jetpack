import {
	formatDuration,
	initAllPlaylists,
	initPlaylist,
	qualityLabel,
	refreshPlaylistMetadata,
} from '../view';

const PLAYER_SELECTOR = '.videopress-playlist__player';
const ITEM_SELECTOR = '.videopress-playlist__item';

/**
 * Build a playlist block DOM matching the server-rendered markup.
 *
 * @param guids       - Video GUIDs, first one loaded in the player.
 * @param autoAdvance - Value for data-auto-advance.
 * @param loop        - Value for data-loop.
 * @return The block wrapper element, attached to the document.
 */
function buildPlaylist( guids: string[], autoAdvance = '1', loop = '0' ): HTMLElement {
	const block = document.createElement( 'figure' );
	block.className = 'wp-block-videopress-playlist';
	block.dataset.autoAdvance = autoAdvance;
	block.dataset.loop = loop;

	const items = guids
		.map(
			( guid, index ) =>
				`<li><button type="button" class="videopress-playlist__item${
					index === 0 ? ' is-current' : ''
				}" data-guid="${ guid }" data-src="https://videopress.com/embed/${ guid }?autoPlay=1" aria-current="${
					index === 0 ? 'true' : 'false'
				}"><span class="videopress-playlist__item-title">Video ${
					index + 1
				}</span><span class="videopress-playlist__item-badge"></span><span class="videopress-playlist__item-duration"></span></button></li>`
		)
		.join( '' );

	block.innerHTML =
		`<div class="videopress-playlist__player-wrapper"><iframe class="videopress-playlist__player" title="player" src="https://videopress.com/embed/${ guids[ 0 ] }?autoPlay=0" data-guid="${ guids[ 0 ] }"></iframe></div>` +
		`<ol class="videopress-playlist__items">${ items }</ol>`;

	document.body.appendChild( block );
	return block;
}

/**
 * Dispatch a player message event like the VideoPress embed does.
 *
 * @param guid   - GUID the message reports on.
 * @param origin - Message origin.
 * @param event  - Player event name.
 */
function postPlayerMessage(
	guid: string,
	origin = 'https://videopress.com',
	event = 'videopress_ended'
) {
	window.dispatchEvent( new MessageEvent( 'message', { data: { event, id: guid }, origin } ) );
}

describe( 'playlist view script', () => {
	beforeAll( () => {
		// The jsdom test environment ships no fetch implementation to spy on.
		Object.defineProperty( global, 'fetch', { writable: true, value: jest.fn() } );
	} );

	beforeEach( () => {
		// Default: metadata lookups fail, so server-rendered labels stay put.
		( global.fetch as jest.Mock ).mockReset().mockResolvedValue( { ok: false } as Response );
	} );

	afterEach( () => {
		document.body.innerHTML = '';
	} );

	it( 'swaps the player to the clicked item and marks it current', () => {
		const block = buildPlaylist( [ 'aaaa1111', 'bbbb2222' ] );
		initPlaylist( block );

		const player = block.querySelector< HTMLIFrameElement >( PLAYER_SELECTOR );
		const items = block.querySelectorAll< HTMLButtonElement >( ITEM_SELECTOR );

		items[ 1 ].click();

		expect( player.src ).toBe( 'https://videopress.com/embed/bbbb2222?autoPlay=1' );
		expect( player.dataset.guid ).toBe( 'bbbb2222' );
		expect( items[ 1 ] ).toHaveClass( 'is-current' );
		expect( items[ 1 ] ).toHaveAttribute( 'aria-current', 'true' );
		expect( items[ 0 ] ).not.toHaveClass( 'is-current' );
		expect( items[ 0 ] ).toHaveAttribute( 'aria-current', 'false' );
	} );

	it( 'advances to the next video when the current one ends', () => {
		const block = buildPlaylist( [ 'aaaa1111', 'bbbb2222' ] );
		initPlaylist( block );

		postPlayerMessage( 'aaaa1111' );

		const player = block.querySelector< HTMLIFrameElement >( PLAYER_SELECTOR );
		expect( player.src ).toBe( 'https://videopress.com/embed/bbbb2222?autoPlay=1' );
	} );

	it( 'ignores ended messages from untrusted origins', () => {
		const block = buildPlaylist( [ 'aaaa1111', 'bbbb2222' ] );
		initPlaylist( block );

		postPlayerMessage( 'aaaa1111', 'https://evil.example' );

		const player = block.querySelector< HTMLIFrameElement >( PLAYER_SELECTOR );
		expect( player.dataset.guid ).toBe( 'aaaa1111' );
	} );

	it( 'ignores ended messages for videos other than the current one', () => {
		const block = buildPlaylist( [ 'aaaa1111', 'bbbb2222', 'cccc3333' ] );
		initPlaylist( block );

		postPlayerMessage( 'bbbb2222' );

		const player = block.querySelector< HTMLIFrameElement >( PLAYER_SELECTOR );
		expect( player.dataset.guid ).toBe( 'aaaa1111' );
	} );

	it( 'ignores non-ended player events', () => {
		const block = buildPlaylist( [ 'aaaa1111', 'bbbb2222' ] );
		initPlaylist( block );

		postPlayerMessage( 'aaaa1111', 'https://videopress.com', 'videopress_playing' );

		const player = block.querySelector< HTMLIFrameElement >( PLAYER_SELECTOR );
		expect( player.dataset.guid ).toBe( 'aaaa1111' );
	} );

	it( 'stops at the last video when looping is off', () => {
		const block = buildPlaylist( [ 'aaaa1111', 'bbbb2222' ] );
		initPlaylist( block );

		postPlayerMessage( 'aaaa1111' );
		postPlayerMessage( 'bbbb2222' );

		const player = block.querySelector< HTMLIFrameElement >( PLAYER_SELECTOR );
		expect( player.dataset.guid ).toBe( 'bbbb2222' );
	} );

	it( 'returns to the first video when looping is on', () => {
		const block = buildPlaylist( [ 'aaaa1111', 'bbbb2222' ], '1', '1' );
		initPlaylist( block );

		postPlayerMessage( 'aaaa1111' );
		postPlayerMessage( 'bbbb2222' );

		const player = block.querySelector< HTMLIFrameElement >( PLAYER_SELECTOR );
		expect( player.src ).toBe( 'https://videopress.com/embed/aaaa1111?autoPlay=1' );
	} );

	it( 'does not auto-advance when auto-advance is off, but clicks still work', () => {
		const block = buildPlaylist( [ 'aaaa1111', 'bbbb2222' ], '0' );
		initPlaylist( block );

		postPlayerMessage( 'aaaa1111' );

		const player = block.querySelector< HTMLIFrameElement >( PLAYER_SELECTOR );
		expect( player.dataset.guid ).toBe( 'aaaa1111' );

		block.querySelectorAll< HTMLButtonElement >( ITEM_SELECTOR )[ 1 ].click();
		expect( player.dataset.guid ).toBe( 'bbbb2222' );
	} );

	it( 'keeps two playlists on the same page independent', () => {
		const first = buildPlaylist( [ 'aaaa1111', 'bbbb2222' ] );
		const second = buildPlaylist( [ 'dddd4444', 'eeee5555' ] );
		initAllPlaylists();

		postPlayerMessage( 'aaaa1111' );

		expect( first.querySelector< HTMLIFrameElement >( PLAYER_SELECTOR ).dataset.guid ).toBe(
			'bbbb2222'
		);
		expect( second.querySelector< HTMLIFrameElement >( PLAYER_SELECTOR ).dataset.guid ).toBe(
			'dddd4444'
		);
	} );

	it( 'refreshes titles, durations, and quality badges from the video data', async () => {
		const block = buildPlaylist( [ 'aaaa1111', 'bbbb2222' ] );
		( global.fetch as jest.Mock ).mockImplementation( ( url: string ) =>
			Promise.resolve( {
				ok: true,
				json: () =>
					Promise.resolve(
						url.includes( 'aaaa1111' )
							? { title: 'Renamed on VideoPress', duration: 83000, height: 1080 }
							: { title: 'Second video', duration: 3723000, height: 2160 }
					),
			} )
		);

		await refreshPlaylistMetadata( block );

		const items = block.querySelectorAll< HTMLButtonElement >( ITEM_SELECTOR );
		expect( items[ 0 ].querySelector( '.videopress-playlist__item-title' ) ).toHaveTextContent(
			'Renamed on VideoPress'
		);
		expect( items[ 0 ].querySelector( '.videopress-playlist__item-duration' ) ).toHaveTextContent(
			'1:23'
		);
		expect( items[ 0 ].querySelector( '.videopress-playlist__item-badge' ) ).toHaveTextContent(
			'1080p'
		);
		expect( items[ 1 ].querySelector( '.videopress-playlist__item-duration' ) ).toHaveTextContent(
			'1:02:03'
		);
		expect( items[ 1 ].querySelector( '.videopress-playlist__item-badge' ) ).toHaveTextContent(
			'4K'
		);
	} );

	it( 'keeps server-rendered labels when the metadata lookup fails', async () => {
		const block = buildPlaylist( [ 'aaaa1111' ] );

		await refreshPlaylistMetadata( block );

		const item = block.querySelector< HTMLButtonElement >( ITEM_SELECTOR );
		expect( item.querySelector( '.videopress-playlist__item-title' ) ).toHaveTextContent(
			'Video 1'
		);
		expect( item.querySelector( '.videopress-playlist__item-badge' ) ).toHaveTextContent( '' );
		expect( item.querySelector( '.videopress-playlist__item-duration' ) ).toHaveTextContent( '' );
	} );

	it( 'requests metadata when a playlist initializes', () => {
		const block = buildPlaylist( [ 'aaaa1111', 'bbbb2222' ] );
		initPlaylist( block );

		expect( global.fetch ).toHaveBeenCalledWith(
			'https://public-api.wordpress.com/rest/v1.1/videos/aaaa1111'
		);
		expect( global.fetch ).toHaveBeenCalledWith(
			'https://public-api.wordpress.com/rest/v1.1/videos/bbbb2222'
		);
	} );

	it( 'bails on blocks without a player or items', () => {
		const empty = document.createElement( 'figure' );
		empty.className = 'wp-block-videopress-playlist';
		document.body.appendChild( empty );

		expect( () => initAllPlaylists() ).not.toThrow();
	} );
} );

describe( 'formatDuration', () => {
	it.each( [
		[ 83000, '1:23' ],
		[ 3723000, '1:02:03' ],
		[ 500, '0:01' ],
		[ 59499, '0:59' ],
		[ 3600000, '1:00:00' ],
	] )( 'formats %d ms as %s', ( ms, expected ) => {
		expect( formatDuration( ms ) ).toBe( expected );
	} );

	it.each( [ [ 0 ], [ -5 ], [ NaN ], [ Infinity ] ] )( 'returns an empty string for %p', ms => {
		expect( formatDuration( ms ) ).toBe( '' );
	} );
} );

describe( 'qualityLabel', () => {
	it.each( [
		[ 2160, '4K' ],
		[ 4320, '4K' ],
		[ 1080, '1080p' ],
		[ 720, '720p' ],
		[ 480, '480p' ],
	] )( 'labels height %d as %s', ( height, expected ) => {
		expect( qualityLabel( height ) ).toBe( expected );
	} );

	it.each( [ [ 0 ], [ -1 ], [ NaN ] ] )( 'returns an empty string for %p', height => {
		expect( qualityLabel( height ) ).toBe( '' );
	} );
} );
