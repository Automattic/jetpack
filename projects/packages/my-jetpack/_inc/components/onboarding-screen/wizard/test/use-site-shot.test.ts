import { renderHook, waitFor } from '@testing-library/react';
import { useSiteShot } from '../use-site-shot';

const URL = 'https://example.com';
const CARD = 17886;
const PICTURE = 95774;

const mockFetch = jest.fn();

beforeEach( () => {
	mockFetch.mockReset();
	window.fetch = mockFetch as unknown as typeof window.fetch;
} );

/*
 * Shaped like what the service really sends, because the difference is the whole
 * subject: a render in progress is a 307 the request is told not to follow, and
 * anything else is an answer.
 */
const rendering = () =>
	Promise.resolve( { type: 'opaqueredirect', status: 0, ok: false } as Response );

const answers = ( size: number, status = 200 ) =>
	Promise.resolve( {
		type: 'cors',
		status,
		ok: status >= 200 && status < 300,
		blob: () => Promise.resolve( new Blob( [ new Uint8Array( size ) ] ) ),
	} as unknown as Response );

const ask = ( url: string | undefined = URL, allowed = true ) =>
	renderHook(
		( props: { url?: string; allowed: boolean } ) => useSiteShot( props.url, props.allowed ),
		{
			initialProps: { url, allowed },
		}
	);

// Lets the poll's promise chain run without leaning on a timer.
const settle = () =>
	waitFor( () => expect( mockFetch ).toHaveBeenCalled() ).then(
		() => new Promise( r => setTimeout( r, 0 ) )
	);

describe( 'Waiting for the screenshot', () => {
	it( 'has nothing while the service is still rendering', async () => {
		mockFetch.mockReturnValue( rendering() );

		const { result } = ask();

		await settle();
		expect( result.current ).toBeNull();
	} );

	it( 'has the picture once the service answers with one', async () => {
		mockFetch.mockReturnValue( answers( PICTURE ) );

		const { result } = ask();

		await waitFor( () => expect( result.current ).not.toBeNull() );
		/*
		 * The whole address, and the same one again in the PHP test, because the
		 * head preload has to ask for exactly this picture. A drift on either side
		 * warms a render nothing then reads and nothing else would notice.
		 */
		expect( result.current ).toBe(
			'https://s0.wp.com/mshots/v1/https%3A%2F%2Fexample.com?vpw=1600&vph=1600&w=880&h=550&scale=2'
		);
	} );

	it( 'keeps asking until one arrives', async () => {
		mockFetch.mockReturnValueOnce( rendering() ).mockReturnValue( answers( PICTURE ) );

		const { result } = ask();

		await waitFor( () => expect( result.current ).not.toBeNull(), { timeout: 4000 } );
		expect( mockFetch.mock.calls.length ).toBeGreaterThan( 1 );
	} );

	// The URL is what the service keys its render on, so it must not vary.
	it( 'asks the same address every time', async () => {
		mockFetch.mockReturnValue( rendering() );

		ask();

		await waitFor( () => expect( mockFetch ).toHaveBeenCalledTimes( 2 ), { timeout: 4000 } );
		const asked = mockFetch.mock.calls.map( ( [ url ] ) => url );

		expect( new Set( asked ).size ).toBe( 1 );
	} );

	it( 'asks for nothing at all for a site that cannot be photographed', async () => {
		ask( URL, false );

		await new Promise( resolve => setTimeout( resolve, 0 ) );

		expect( mockFetch ).not.toHaveBeenCalled();
	} );

	it( 'gives up quietly when the service never answers', async () => {
		mockFetch.mockRejectedValue( new Error( 'offline' ) );

		const { result } = ask();

		await settle();
		expect( result.current ).toBeNull();
	} );

	it( 'stops asking when it is taken off the page', async () => {
		mockFetch.mockReturnValue( rendering() );

		const { unmount } = ask();

		await settle();
		unmount();
		const asked = mockFetch.mock.calls.length;
		await new Promise( resolve => setTimeout( resolve, 1400 ) );

		expect( mockFetch ).toHaveBeenCalledTimes( asked );
	} );

	/*
	 * Aborting the request is not enough on its own: an abort lands in the same
	 * catch as a flaky network, which is a reason to ask again.
	 */
	it( 'does not start again when it is taken off the page mid-request', async () => {
		let answer: ( response: Response ) => void = () => {};
		mockFetch.mockReturnValue( new Promise< Response >( resolve => ( answer = resolve ) ) );

		const { unmount } = ask();

		await waitFor( () => expect( mockFetch ).toHaveBeenCalled() );
		unmount();
		answer( await rendering() );
		await new Promise( resolve => setTimeout( resolve, 1400 ) );

		expect( mockFetch ).toHaveBeenCalledTimes( 1 );
	} );

	// A picture of the previous site is worse than no picture.
	it( 'drops the picture when the address changes', async () => {
		mockFetch.mockReturnValue( answers( PICTURE ) );

		const { result, rerender } = ask();

		await waitFor( () => expect( result.current ).not.toBeNull() );

		mockFetch.mockReturnValue( rendering() );
		rerender( { url: 'https://elsewhere.example', allowed: true } );

		expect( result.current ).toBeNull();
		await settle();
	} );
} );

/*
 * A host the service cannot reach is answered with a fixed WordPress.com error
 * card, as HTTP 200 and a real JPEG at the full size, exactly like a homepage.
 * Showing one would tell the reader this is what their site looks like.
 */
describe( 'Refusing an answer that is not a homepage', () => {
	it.each( [
		[ 'the unreachable-host card', 17886 ],
		[ 'the local-address card', 18852 ],
	] )( 'never shows %s', async ( _label, bytes ) => {
		mockFetch.mockReturnValue( answers( bytes ) );

		const { result } = ask();

		await settle();
		expect( result.current ).toBeNull();
	} );

	// A card is recognised by its size, so a picture of any other size is one.
	it( 'shows a picture one byte off a card', async () => {
		mockFetch.mockReturnValue( answers( CARD + 1 ) );

		const { result } = ask();

		await waitFor( () => expect( result.current ).not.toBeNull() );
	} );

	it.each( [
		{ label: 'a card', bytes: CARD, status: 200 },
		{ label: 'a refusal', bytes: PICTURE, status: 403 },
	] )( 'stops asking once $label comes back', async ( { bytes, status } ) => {
		mockFetch.mockReturnValue( answers( bytes, status ) );

		ask();

		await settle();
		await new Promise( resolve => setTimeout( resolve, 1400 ) );

		expect( mockFetch ).toHaveBeenCalledTimes( 1 );
	} );

	/*
	 * The edge answers 403 for a while during an outage. Treated as a slow render
	 * that is sixteen requests per wizard with a guaranteed empty result.
	 */
	it( 'does not poll out the clock against a refusal', async () => {
		mockFetch.mockReturnValue( answers( PICTURE, 500 ) );

		const { result } = ask();

		await settle();
		expect( result.current ).toBeNull();
		expect( mockFetch ).toHaveBeenCalledTimes( 1 );
	} );
} );
