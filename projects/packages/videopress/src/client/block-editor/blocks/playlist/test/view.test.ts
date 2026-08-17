import { initPlaylistBlock } from '../view';

const EMBED_A = 'https://videopress.com/embed/aaaaaaaa?cover=1&preloadContent=metadata&autoPlay=1';
const EMBED_B = 'https://videopress.com/embed/bbbbbbbb?cover=1&preloadContent=metadata&autoPlay=1';
const EMBED_C = 'https://videopress.com/embed/cccccccc?cover=1&preloadContent=metadata&autoPlay=1';

/**
 * Render a playlist block's front-end markup and initialize it.
 *
 * @param autoplayNext - Value of the wrapper's data-autoplay-next flag.
 * @return The block root element.
 */
function setUpPlaylist( autoplayNext = true ): HTMLElement {
	document.body.innerHTML = `
		<figure class="wp-block-videopress-playlist videopress-playlist is-layout-side-rail" data-autoplay-next="${
			autoplayNext ? '1' : '0'
		}">
			<div class="videopress-playlist__stage">
				<iframe class="videopress-playlist__iframe" src="${ EMBED_A.replace(
					'autoPlay=1',
					'autoPlay=0'
				) }" title="First"></iframe>
				<div class="videopress-playlist__now">
					<span class="videopress-playlist__now-title">First</span>
					<span class="videopress-playlist__now-meta">
						<span class="videopress-playlist__now-position">1 of 3</span>
						<span class="videopress-playlist__now-details">1080p · 12:04</span>
					</span>
				</div>
			</div>
			<div class="videopress-playlist__list">
				<div class="videopress-playlist__list-header">
					<span class="videopress-playlist__list-progress">1 / 3 · 25:00 total</span>
				</div>
				<ol class="videopress-playlist__entries">
					<li><button type="button" class="videopress-playlist__select is-current" aria-current="true"
						data-guid="aaaaaaaa" data-embed-url="${ EMBED_A }" data-title="First"
						data-position="1 of 3" data-details="1080p · 12:04" data-progress="1 / 3 · 25:00 total"></button></li>
					<li><button type="button" class="videopress-playlist__select"
						data-guid="bbbbbbbb" data-embed-url="${ EMBED_B }" data-title="Second"
						data-position="2 of 3" data-details="4K · 6:41" data-progress="2 / 3 · 25:00 total"></button></li>
					<li><button type="button" class="videopress-playlist__select"
						data-guid="cccccccc" data-embed-url="${ EMBED_C }" data-title="Third"
						data-position="3 of 3" data-details="720p · 6:15" data-progress="3 / 3 · 25:00 total"></button></li>
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

	it( 'updates the now-playing text and progress counter', () => {
		const root = setUpPlaylist();

		root.querySelectorAll< HTMLButtonElement >( '.videopress-playlist__select' )[ 2 ].click();

		expect( root.querySelector( '.videopress-playlist__now-title' ) ).toHaveTextContent( 'Third' );
		expect( root.querySelector( '.videopress-playlist__now-position' ) ).toHaveTextContent(
			'3 of 3'
		);
		expect( root.querySelector( '.videopress-playlist__now-details' ) ).toHaveTextContent(
			'720p · 6:15'
		);
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

	it( 'does not auto-advance when autoplay next is off', () => {
		const root = setUpPlaylist( false );
		const iframe = root.querySelector< HTMLIFrameElement >( '.videopress-playlist__iframe' );
		const initialSrc = iframe.src;

		postPlayerMessage( 'https://videopress.com', { event: 'videopress_ended', id: 'aaaaaaaa' } );

		expect( iframe.src ).toBe( initialSrc );
	} );
} );
