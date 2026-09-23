import { hydratePoster, initAllPlaylistsBlock, initAllPlaylistsBlocks } from '../view';

// What the mocked live-metadata lookup returns per GUID.
let mockLiveMetadata: Record< string, { poster?: string } | 'locked' | null > = {};

jest.mock( '../../playlist/fetch-live-metadata', () => ( {
	fetchLiveMetadata: jest.fn( ( guid: string ) =>
		Promise.resolve( mockLiveMetadata[ guid ] ?? null )
	),
} ) );

/**
 * Build a card's markup.
 *
 * @param key    - Playlist key.
 * @param guid   - First video GUID; empty for a playlist without videos.
 * @param page   - Page the card belongs to.
 * @param hidden - Whether the card starts hidden.
 * @return Card markup.
 */
function card( key: string, guid: string, page = 1, hidden = false ): string {
	return `
		<li class="videopress-all-playlists__item ${ guid ? 'is-poster-loading' : 'is-poster-missing' }" data-playlist="${ key }" data-page="${ page }"${
			hidden ? ' hidden' : ''
		}>
			<a class="videopress-all-playlists__poster" href="/p"${ guid ? ` data-guid="${ guid }"` : '' }>
				<span class="videopress-all-playlists__poster-frame">
					<img class="videopress-all-playlists__poster-image" alt="" hidden />
					<span class="videopress-all-playlists__poster-missing">No poster available</span>
				</span>
			</a>
			<div class="videopress-all-playlists__body"><h3 class="videopress-all-playlists__title">${ key }</h3></div>
		</li>`;
}

/**
 * Render a block and return its root.
 *
 * @param cards    - Card markup.
 * @param loadMore - Whether the block paginates with a "Load more" button.
 * @return The block root element.
 */
function setUpBlock( cards: string, loadMore = false ): HTMLElement {
	document.body.innerHTML = `
		<div class="wp-block-videopress-all-playlists videopress-all-playlists is-layout-list" data-playlist-total="3" data-video-total="7" data-per-page="1" data-summary="Showing %1$s of %2$s">
			<div class="videopress-all-playlists__header"><span class="videopress-all-playlists__summary">Showing 1 of 3</span></div>
			<ul class="videopress-all-playlists__items">${ cards }</ul>
			${
				loadMore
					? '<div class="videopress-all-playlists__load-more"><button type="button" class="videopress-all-playlists__load-more-button" data-label="Load %s more">Load 1 more</button></div>'
					: ''
			}
		</div>`;
	return document.querySelector< HTMLElement >(
		'.wp-block-videopress-all-playlists'
	) as HTMLElement;
}

beforeEach( () => {
	jest.clearAllMocks();
	mockLiveMetadata = {};
} );

describe( 'hydratePoster', () => {
	it( 'shows the first video poster', async () => {
		mockLiveMetadata = { aaaaaaaa: { poster: 'https://example.com/a.jpg' } };
		const root = setUpBlock( card( 'one', 'aaaaaaaa' ) );
		const item = root.querySelector< HTMLElement >(
			'.videopress-all-playlists__item'
		) as HTMLElement;

		await hydratePoster( item );

		const image = item.querySelector< HTMLImageElement >( 'img' ) as HTMLImageElement;
		expect( image.src ).toBe( 'https://example.com/a.jpg' );
		expect( image.hidden ).toBe( false );
		expect( item ).not.toHaveClass( 'is-poster-loading' );
		expect( item ).not.toHaveClass( 'is-poster-missing' );
	} );

	it( 'marks a private or deleted first video as missing', async () => {
		mockLiveMetadata = { aaaaaaaa: 'locked' };
		const root = setUpBlock( card( 'one', 'aaaaaaaa' ) + card( 'two', 'bbbbbbbb' ) );
		const [ locked, deleted ] = Array.from(
			root.querySelectorAll< HTMLElement >( '.videopress-all-playlists__item' )
		);

		await hydratePoster( locked );
		await hydratePoster( deleted );

		expect( locked ).toHaveClass( 'is-poster-missing' );
		expect( deleted ).toHaveClass( 'is-poster-missing' );
		expect( locked.querySelector< HTMLImageElement >( 'img' )?.hidden ).toBe( true );
	} );

	it( 'leaves a playlist without videos alone', async () => {
		const root = setUpBlock( card( 'one', '' ) );
		const item = root.querySelector< HTMLElement >(
			'.videopress-all-playlists__item'
		) as HTMLElement;

		await hydratePoster( item );

		expect( item ).toHaveClass( 'is-poster-missing' );
	} );
} );

describe( 'initAllPlaylistsBlock', () => {
	it( 'hydrates only the visible cards', async () => {
		mockLiveMetadata = {
			aaaaaaaa: { poster: 'https://example.com/a.jpg' },
			bbbbbbbb: { poster: 'https://example.com/b.jpg' },
		};
		const root = setUpBlock( card( 'one', 'aaaaaaaa' ) + card( 'two', 'bbbbbbbb', 2, true ), true );

		initAllPlaylistsBlock( root );
		await Promise.resolve();
		await Promise.resolve();

		const images = root.querySelectorAll< HTMLImageElement >( 'img' );
		expect( images[ 0 ].src ).toBe( 'https://example.com/a.jpg' );
		expect( images[ 1 ].hidden ).toBe( true );
	} );

	it( 'reveals the next page on "Load more" and updates the summary', async () => {
		mockLiveMetadata = { cccccccc: { poster: 'https://example.com/c.jpg' } };
		const root = setUpBlock(
			card( 'one', '' ) + card( 'two', 'bbbbbbbb', 2, true ) + card( 'three', 'cccccccc', 3, true ),
			true
		);
		initAllPlaylistsBlock( root );
		const button = root.querySelector< HTMLButtonElement >( 'button' ) as HTMLButtonElement;
		const summary = root.querySelector< HTMLElement >( '.videopress-all-playlists__summary' );

		button.click();

		const items = root.querySelectorAll< HTMLElement >( '.videopress-all-playlists__item' );
		expect( items[ 1 ].hidden ).toBe( false );
		expect( items[ 2 ].hidden ).toBe( true );
		expect( summary ).toHaveTextContent( 'Showing 2 of 3' );
		expect( button ).toHaveTextContent( 'Load 1 more' );

		button.click();
		await Promise.resolve();
		await Promise.resolve();

		expect( items[ 2 ].hidden ).toBe( false );
		expect( summary ).toHaveTextContent( 'Showing 3 of 3' );
		expect( root.querySelector( '.videopress-all-playlists__load-more' ) ).toBeNull();
		expect( items[ 2 ].querySelector< HTMLImageElement >( 'img' )?.src ).toBe(
			'https://example.com/c.jpg'
		);
	} );

	it( 'initializes every block on the page', () => {
		setUpBlock( card( 'one', '' ) );
		document.body.innerHTML += document.body.innerHTML;

		initAllPlaylistsBlocks();

		expect( document.querySelectorAll( '.wp-block-videopress-all-playlists' ) ).toHaveLength( 2 );
	} );
} );
