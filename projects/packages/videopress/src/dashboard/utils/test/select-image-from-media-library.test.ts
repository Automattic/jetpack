import { selectImageFromMediaLibrary } from '../select-image-from-media-library';

type Handler = () => void;

/**
 * Build a minimal wp.media frame stub with record-able event handlers and a
 * fixed selection returning attachment id 77.
 *
 * @return A fake media frame object suitable for use in tests.
 */
function makeMediaFrame() {
	const handlers: Record< string, Handler > = {};
	const selection = {
		first: () => ( {
			toJSON: () => ( { id: 77, url: 'https://example.test/img.png' } ),
		} ),
	};
	return {
		handlers,
		state: () => ( { get: () => selection } ),
		on: ( evt: string, fn: Handler ) => {
			handlers[ evt ] = fn;
		},
		open: jest.fn(),
	};
}

describe( 'selectImageFromMediaLibrary', () => {
	afterEach( () => {
		delete ( window as unknown as { wp?: unknown } ).wp;
	} );

	it( 'resolves the selected attachment id and url', async () => {
		const frame = makeMediaFrame();
		( window as unknown as { wp: { media: jest.Mock } } ).wp = {
			media: jest.fn( () => frame ),
		};

		const promise = selectImageFromMediaLibrary();
		frame.handlers.select();

		await expect( promise ).resolves.toEqual( {
			id: 77,
			url: 'https://example.test/img.png',
		} );
		expect( frame.open ).toHaveBeenCalled();
	} );

	it( 'resolves null when the user closes without selecting', async () => {
		const frame = makeMediaFrame();
		( window as unknown as { wp: { media: jest.Mock } } ).wp = {
			media: jest.fn( () => frame ),
		};

		const promise = selectImageFromMediaLibrary();
		frame.handlers.close();

		await expect( promise ).resolves.toBeNull();
	} );

	it( 'keeps the selection when close fires right after select', async () => {
		const frame = makeMediaFrame();
		( window as unknown as { wp: { media: jest.Mock } } ).wp = {
			media: jest.fn( () => frame ),
		};

		const promise = selectImageFromMediaLibrary();
		frame.handlers.select();
		frame.handlers.close();
		await new Promise( resolve => setTimeout( resolve, 0 ) ); // flush the deferred null-resolve

		await expect( promise ).resolves.toEqual( {
			id: 77,
			url: 'https://example.test/img.png',
		} );
	} );

	it( 'rejects when window.wp.media is unavailable', async () => {
		await expect( selectImageFromMediaLibrary() ).rejects.toThrow( /wp\.media/ );
	} );
} );
