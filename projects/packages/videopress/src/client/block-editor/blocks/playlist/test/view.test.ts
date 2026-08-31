import { hydratePlaylistMetadata, initPlaylistBlock } from '../view';

// Live metadata the mocked videos API returns, keyed by GUID.
let mockLiveMetadata: Record< string, { title?: string; poster?: string } > = {};
// GUIDs whose metadata is only returned when the request carries a metadata_token.
let mockPrivateGuids: string[] = [];
// Token the mocked get-media-token resolves with; null simulates an unauthorized viewer.
let mockPlaybackToken: string | null = null;

jest.mock( '../../../../lib/get-media-token', () => ( {
	__esModule: true,
	default: jest.fn( () => Promise.resolve( { token: mockPlaybackToken } ) ),
} ) );

beforeEach( () => {
	jest.clearAllMocks();
	mockLiveMetadata = {};
	mockPrivateGuids = [];
	mockPlaybackToken = null;
	delete ( window as { videopressAjax?: unknown } ).videopressAjax;
	const fetchMock = jest.fn( ( url: string ) => {
		const [ path, query = '' ] = String( url ).split( '?' );
		const guid = path.split( '/' ).pop();
		const metadata = guid ? mockLiveMetadata[ guid ] : undefined;
		const needsToken = guid ? mockPrivateGuids.includes( guid ) : false;
		if ( ! metadata ) {
			return Promise.resolve( { ok: false, status: 404 } as Response );
		}
		if ( needsToken && ! query.includes( 'metadata_token=' ) ) {
			// Private video, unauthenticated request.
			return Promise.resolve( { ok: false, status: 403 } as Response );
		}
		return Promise.resolve( {
			ok: true,
			// A fresh object per call, like a real response.json().
			json: () => Promise.resolve( { ...metadata } ),
		} as Response );
	} );
	( global as { fetch: unknown } ).fetch = fetchMock;
} );

const EMBED_A = 'https://videopress.com/embed/aaaaaaaa?cover=1&preloadContent=metadata&autoPlay=1';
const EMBED_B = 'https://videopress.com/embed/bbbbbbbb?cover=1&preloadContent=metadata&autoPlay=1';
const EMBED_C = 'https://videopress.com/embed/cccccccc?cover=1&preloadContent=metadata&autoPlay=1';

/**
 * Render a playlist block's front-end markup and initialize it.
 *
 * @param autoplayNext - Value of the wrapper's data-autoplay-next flag.
 * @param loop         - Value of the wrapper's data-loop flag.
 * @return The block root element.
 */
function setUpPlaylist( autoplayNext = true, loop = false ): HTMLElement {
	document.body.innerHTML = `
		<figure class="wp-block-videopress-playlist videopress-playlist is-layout-side-rail" data-autoplay-next="${
			autoplayNext ? '1' : '0'
		}" data-loop="${ loop ? '1' : '0' }">
			<div class="videopress-playlist__stage">
				<iframe class="videopress-playlist__iframe" src="${ EMBED_A.replace(
					'autoPlay=1',
					'autoPlay=0'
				) }" title="First"></iframe>
			</div>
			<div class="videopress-playlist__list">
				<div class="videopress-playlist__list-header">
					<span class="videopress-playlist__list-progress">1 / 3 · 25:00 total</span>
				</div>
				<ol class="videopress-playlist__entries">
					<li><button type="button" class="videopress-playlist__select is-current" aria-current="true"
						data-guid="aaaaaaaa" data-embed-url="${ EMBED_A }" data-title="First"
						data-position="1 of 3" data-details="1080p · 12:04" data-progress="1 / 3 · 25:00 total">
						<span class="videopress-playlist__entry-thumb"><span class="videopress-playlist__entry-lock"><span class="videopress-playlist__entry-lock-label">Private video</span></span></span>
						<span class="videopress-playlist__entry-title">First</span>
					</button></li>
					<li><button type="button" class="videopress-playlist__select"
						data-guid="bbbbbbbb" data-embed-url="${ EMBED_B }" data-title="Second"
						data-position="2 of 3" data-details="4K · 6:41" data-progress="2 / 3 · 25:00 total">
						<span class="videopress-playlist__entry-thumb"><span class="videopress-playlist__entry-lock"><span class="videopress-playlist__entry-lock-label">Private video</span></span></span>
						<span class="videopress-playlist__entry-title">Second</span>
					</button></li>
					<li><button type="button" class="videopress-playlist__select"
						data-guid="cccccccc" data-embed-url="${ EMBED_C }" data-title="Third"
						data-position="3 of 3" data-details="720p · 6:15" data-progress="3 / 3 · 25:00 total">
						<span class="videopress-playlist__entry-thumb"><span class="videopress-playlist__entry-lock"><span class="videopress-playlist__entry-lock-label">Private video</span></span></span>
						<span class="videopress-playlist__entry-title">Third</span>
					</button></li>
				</ol>
			</div>
		</figure>
	`;

	const root = document.querySelector< HTMLElement >( '.wp-block-videopress-playlist' );
	initPlaylistBlock( root );
	return root;
}

/**
 * Dispatch a player message event on the window.
 *
 * @param origin - Message origin.
 * @param data   - Message payload.
 */
function postPlayerMessage( origin: string, data: Record< string, unknown > ) {
	window.dispatchEvent( new MessageEvent( 'message', { origin, data } ) );
}

describe( 'initPlaylistBlock', () => {
	it( 'loads the clicked entry into the player and moves the current markers', () => {
		const root = setUpPlaylist();
		const entries = root.querySelectorAll< HTMLButtonElement >( '.videopress-playlist__select' );

		entries[ 1 ].click();

		const iframe = root.querySelector< HTMLIFrameElement >( '.videopress-playlist__iframe' );
		expect( iframe.src ).toBe( EMBED_B );
		expect( entries[ 1 ] ).toHaveClass( 'is-current' );
		expect( entries[ 1 ] ).toHaveAttribute( 'aria-current', 'true' );
		expect( entries[ 0 ] ).not.toHaveClass( 'is-current' );
		expect( entries[ 0 ] ).not.toHaveAttribute( 'aria-current' );
	} );

	it( 'updates the progress counter', () => {
		const root = setUpPlaylist();

		root.querySelectorAll< HTMLButtonElement >( '.videopress-playlist__select' )[ 2 ].click();

		expect( root.querySelector( '.videopress-playlist__list-progress' ) ).toHaveTextContent(
			'3 / 3 · 25:00 total'
		);
	} );

	it( 'advances to the next entry when the current video ends', () => {
		const root = setUpPlaylist();

		postPlayerMessage( 'https://videopress.com', { event: 'videopress_ended', id: 'aaaaaaaa' } );

		const iframe = root.querySelector< HTMLIFrameElement >( '.videopress-playlist__iframe' );
		expect( iframe.src ).toBe( EMBED_B );
	} );

	it( 'ignores ended events for videos other than the current one', () => {
		const root = setUpPlaylist();
		const iframe = root.querySelector< HTMLIFrameElement >( '.videopress-playlist__iframe' );
		const initialSrc = iframe.src;

		postPlayerMessage( 'https://videopress.com', { event: 'videopress_ended', id: 'cccccccc' } );

		expect( iframe.src ).toBe( initialSrc );
	} );

	it( 'ignores ended events from untrusted origins', () => {
		const root = setUpPlaylist();
		const iframe = root.querySelector< HTMLIFrameElement >( '.videopress-playlist__iframe' );
		const initialSrc = iframe.src;

		postPlayerMessage( 'https://evil.example.com', {
			event: 'videopress_ended',
			id: 'aaaaaaaa',
		} );

		expect( iframe.src ).toBe( initialSrc );
	} );

	it( 'stops after the last entry instead of looping', () => {
		const root = setUpPlaylist();
		const entries = root.querySelectorAll< HTMLButtonElement >( '.videopress-playlist__select' );
		const iframe = root.querySelector< HTMLIFrameElement >( '.videopress-playlist__iframe' );

		entries[ 2 ].click();
		postPlayerMessage( 'https://videopress.com', { event: 'videopress_ended', id: 'cccccccc' } );

		expect( iframe.src ).toBe( EMBED_C );
		expect( entries[ 2 ] ).toHaveClass( 'is-current' );
	} );

	it( 'loops back to the first entry when looping is on', () => {
		const root = setUpPlaylist( true, true );
		const entries = root.querySelectorAll< HTMLButtonElement >( '.videopress-playlist__select' );
		const iframe = root.querySelector< HTMLIFrameElement >( '.videopress-playlist__iframe' );

		entries[ 2 ].click();
		postPlayerMessage( 'https://videopress.com', { event: 'videopress_ended', id: 'cccccccc' } );

		expect( iframe.src ).toBe( EMBED_A );
		expect( entries[ 0 ] ).toHaveClass( 'is-current' );
	} );

	it( 'does not auto-advance when autoplay next is off', () => {
		const root = setUpPlaylist( false );
		const iframe = root.querySelector< HTMLIFrameElement >( '.videopress-playlist__iframe' );
		const initialSrc = iframe.src;

		postPlayerMessage( 'https://videopress.com', { event: 'videopress_ended', id: 'aaaaaaaa' } );

		expect( iframe.src ).toBe( initialSrc );
	} );

	it( 'does nothing on a block without playable entries', () => {
		document.body.innerHTML = `
			<figure class="wp-block-videopress-playlist" data-autoplay-next="1">
				<iframe class="videopress-playlist__iframe" src="about:blank" title="Empty"></iframe>
				<ol class="videopress-playlist__entries"></ol>
			</figure>
		`;
		const root = document.querySelector< HTMLElement >( '.wp-block-videopress-playlist' );

		expect( () => initPlaylistBlock( root ) ).not.toThrow();

		postPlayerMessage( 'https://videopress.com', { event: 'videopress_ended', id: 'aaaaaaaa' } );
		expect( root.querySelector< HTMLIFrameElement >( '.videopress-playlist__iframe' ).src ).toBe(
			'about:blank'
		);
	} );

	it( 'hydrates titles and posters from live video data', async () => {
		const root = setUpPlaylist();
		mockLiveMetadata = {
			aaaaaaaa: { title: 'Live first', poster: 'https://example.com/first.jpg' },
			bbbbbbbb: { title: 'Live second' },
		};

		await hydratePlaylistMetadata( root );

		const entries = root.querySelectorAll< HTMLButtonElement >( '.videopress-playlist__select' );
		expect( entries[ 0 ].querySelector( '.videopress-playlist__entry-title' ) ).toHaveTextContent(
			'Live first'
		);
		expect( entries[ 0 ].dataset.title ).toBe( 'Live first' );
		expect( entries[ 0 ].querySelector( '.videopress-playlist__entry-thumb img' ) ).toHaveAttribute(
			'src',
			'https://example.com/first.jpg'
		);

		expect( entries[ 1 ].querySelector( '.videopress-playlist__entry-title' ) ).toHaveTextContent(
			'Live second'
		);
		expect( entries[ 1 ].querySelector( 'img' ) ).toBeNull();

		// Unreachable video data keeps the server-rendered fallback.
		expect( entries[ 2 ].querySelector( '.videopress-playlist__entry-title' ) ).toHaveTextContent(
			'Third'
		);
	} );

	it( 'retries private videos with a playback token when the token bridge is configured', async () => {
		window.videopressAjax = { ajaxUrl: '/wp-admin/admin-ajax.php', bridgeUrl: '', post_id: '12' };
		mockPlaybackToken = 'jwt-token';
		mockPrivateGuids = [ 'aaaaaaaa' ];
		mockLiveMetadata = {
			aaaaaaaa: { title: 'Private first', poster: 'https://example.com/private.jpg' },
		};

		const root = setUpPlaylist();
		await hydratePlaylistMetadata( root );

		const entry = root.querySelector< HTMLButtonElement >( '.videopress-playlist__select' );
		expect( entry.querySelector( '.videopress-playlist__entry-title' ) ).toHaveTextContent(
			'Private first'
		);
		// The poster's bare file URL is refused by the file host — it must carry the token too.
		expect( entry.querySelector( '.videopress-playlist__entry-thumb img' ) ).toHaveAttribute(
			'src',
			'https://example.com/private.jpg?metadata_token=jwt-token'
		);
		expect( global.fetch ).toHaveBeenCalledWith(
			'https://public-api.wordpress.com/rest/v1.1/videos/aaaaaaaa?metadata_token=jwt-token'
		);
		expect( root.querySelector( '.videopress-playlist__select' ) ).not.toHaveClass( 'is-locked' );
	} );

	it( 'locks the thumbnail and titles the entry from the lock label when no playback token is available', async () => {
		window.videopressAjax = { ajaxUrl: '/wp-admin/admin-ajax.php', bridgeUrl: '', post_id: '12' };
		mockPlaybackToken = null;
		mockPrivateGuids = [ 'aaaaaaaa' ];
		mockLiveMetadata = { aaaaaaaa: { title: 'Private first' } };

		const root = setUpPlaylist();
		await hydratePlaylistMetadata( root );

		const entry = root.querySelector< HTMLButtonElement >( '.videopress-playlist__select' );
		expect( entry ).toHaveClass( 'is-locked' );
		expect( entry.querySelector( '.videopress-playlist__entry-title' ) ).toHaveTextContent(
			'Private video'
		);
		expect( entry.dataset.title ).toBe( 'Private video' );
	} );

	it( 'locks the thumbnail without a token retry when the token bridge is not configured', async () => {
		mockPrivateGuids = [ 'aaaaaaaa' ];
		mockLiveMetadata = { aaaaaaaa: { title: 'Private first' } };
		const getMediaToken = jest.requireMock( '../../../../lib/get-media-token' ).default;

		const root = setUpPlaylist();
		await hydratePlaylistMetadata( root );

		expect( getMediaToken ).not.toHaveBeenCalled();
		expect( root.querySelector( '.videopress-playlist__entry-title' ) ).toHaveTextContent(
			'Private video'
		);
		expect( root.querySelector( '.videopress-playlist__select' ) ).toHaveClass( 'is-locked' );
	} );

	it( 'does not lock entries whose video data is merely unreachable', async () => {
		window.videopressAjax = { ajaxUrl: '/wp-admin/admin-ajax.php', bridgeUrl: '', post_id: '12' };
		mockPlaybackToken = 'jwt-token';

		// No metadata at all: the mock responds 404, not an authorization failure.
		const root = setUpPlaylist();
		await hydratePlaylistMetadata( root );

		expect( root.querySelector( '.videopress-playlist__select' ) ).not.toHaveClass( 'is-locked' );
	} );

	it( 'shows the more-videos fade only while entries hide below the scroll', () => {
		const root = setUpPlaylist();
		const list = root.querySelector< HTMLElement >( '.videopress-playlist__list' );
		const entriesContainer = root.querySelector< HTMLElement >( '.videopress-playlist__entries' );

		// jsdom has no layout; give the list a scrollable geometry.
		Object.defineProperty( entriesContainer, 'scrollHeight', { configurable: true, value: 400 } );
		Object.defineProperty( entriesContainer, 'clientHeight', { configurable: true, value: 200 } );

		entriesContainer.scrollTop = 0;
		entriesContainer.dispatchEvent( new Event( 'scroll' ) );
		expect( list ).toHaveClass( 'has-more-videos' );

		entriesContainer.scrollTop = 200;
		entriesContainer.dispatchEvent( new Event( 'scroll' ) );
		expect( list ).not.toHaveClass( 'has-more-videos' );
	} );

	it( 'shows the fade for horizontal strip overflow too', () => {
		const root = setUpPlaylist();
		const list = root.querySelector< HTMLElement >( '.videopress-playlist__list' );
		const entriesContainer = root.querySelector< HTMLElement >( '.videopress-playlist__entries' );

		// jsdom has no layout; give the strip a horizontally scrollable geometry.
		Object.defineProperty( entriesContainer, 'scrollWidth', { configurable: true, value: 800 } );
		Object.defineProperty( entriesContainer, 'clientWidth', { configurable: true, value: 400 } );

		entriesContainer.scrollLeft = 0;
		entriesContainer.dispatchEvent( new Event( 'scroll' ) );
		expect( list ).toHaveClass( 'has-more-videos' );

		entriesContainer.scrollLeft = 400;
		entriesContainer.dispatchEvent( new Event( 'scroll' ) );
		expect( list ).not.toHaveClass( 'has-more-videos' );
	} );

	it( 'ignores clicks on entries without an embed URL', () => {
		const root = setUpPlaylist();
		const entries = root.querySelectorAll< HTMLButtonElement >( '.videopress-playlist__select' );
		entries[ 1 ].removeAttribute( 'data-embed-url' );
		const iframe = root.querySelector< HTMLIFrameElement >( '.videopress-playlist__iframe' );
		const initialSrc = iframe.src;

		entries[ 1 ].click();

		expect( iframe.src ).toBe( initialSrc );
		expect( entries[ 1 ] ).not.toHaveClass( 'is-current' );
		expect( entries[ 0 ] ).toHaveClass( 'is-current' );
	} );
} );
