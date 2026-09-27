import { renderHook, waitFor } from '@testing-library/react';
import { useSiteShot } from '../use-site-shot';

const URL = 'https://example.com';

const mockFetch = jest.fn();

beforeEach( () => {
	mockFetch.mockReset();
	window.fetch = mockFetch as unknown as typeof window.fetch;
} );

const answers = ( type: string, size = 95774 ) =>
	Promise.resolve( {
		headers: { get: () => type },
		blob: () => Promise.resolve( { size } ),
	} as unknown as Response );

const ask = () => renderHook( () => useSiteShot( URL, true ) );

describe( 'Waiting for the screenshot', () => {
	/*
	 * The service answers 200 with a placeholder while it renders and 200 with the
	 * picture once it has. The content type is the only thing between them: both
	 * are 400 by 300, so there is nothing in the pixels to measure.
	 */
	it( 'has nothing while the service is still rendering', async () => {
		mockFetch.mockReturnValue( answers( 'image/gif' ) );

		const { result } = ask();

		await waitFor( () => expect( mockFetch ).toHaveBeenCalled() );
		expect( result.current ).toBeNull();
	} );

	it( 'has the picture once the type says it is one', async () => {
		mockFetch.mockReturnValue( answers( 'image/jpeg', 95774 ) );

		const { result } = ask();

		await waitFor( () => expect( result.current ).not.toBeNull() );
		expect( result.current ).toContain( 'mshots/v1/https%3A%2F%2Fexample.com' );
	} );

	// The URL is what the service keys its render on, so it must not vary.
	it( 'asks the same address every time', async () => {
		mockFetch.mockReturnValue( answers( 'image/gif' ) );

		ask();

		await waitFor( () => expect( mockFetch ).toHaveBeenCalled() );
		const asked = mockFetch.mock.calls.map( ( [ url ] ) => url );

		expect( new Set( asked ).size ).toBe( 1 );
	} );

	it( 'asks for nothing at all for a site that cannot be photographed', async () => {
		renderHook( () => useSiteShot( URL, false ) );

		await Promise.resolve();

		expect( mockFetch ).not.toHaveBeenCalled();
	} );

	it( 'gives up quietly when the service never answers', async () => {
		mockFetch.mockRejectedValue( new Error( 'offline' ) );

		const { result } = ask();

		await waitFor( () => expect( mockFetch ).toHaveBeenCalled() );
		expect( result.current ).toBeNull();
	} );
} );

/*
 * A host the service cannot reach is answered with a fixed WordPress.com error
 * card, as HTTP 200 and `image/jpeg` exactly like a homepage. Showing one would
 * tell the user this is what their site looks like.
 */
describe( 'Refusing an error card', () => {
	it.each( [
		[ 'the unreachable-host card', 17886 ],
		[ 'the local-address card', 18852 ],
	] )( 'never shows %s', async ( _label, bytes ) => {
		mockFetch.mockReturnValue( answers( 'image/jpeg', bytes ) );

		const { result } = ask();

		await waitFor( () => expect( mockFetch ).toHaveBeenCalled() );
		expect( result.current ).toBeNull();
	} );

	// It is the service's final answer, so asking again only gets it back.
	it( 'stops asking once a card comes back', async () => {
		mockFetch.mockReturnValue( answers( 'image/jpeg', 17886 ) );

		ask();

		await waitFor( () => expect( mockFetch ).toHaveBeenCalledTimes( 1 ) );
		await new Promise( resolve => setTimeout( resolve, 1400 ) );

		expect( mockFetch ).toHaveBeenCalledTimes( 1 );
	} );

	// A card is recognised by its size, so a picture that is any other size is one.
	it( 'shows a picture one byte off a card', async () => {
		mockFetch.mockReturnValue( answers( 'image/jpeg', 17887 ) );

		const { result } = ask();

		await waitFor( () => expect( result.current ).not.toBeNull() );
	} );
} );
