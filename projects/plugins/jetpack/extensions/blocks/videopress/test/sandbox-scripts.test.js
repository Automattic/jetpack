import { getVideoPressSandboxScripts } from '../sandbox-scripts';

describe( 'getVideoPressSandboxScripts', () => {
	let createObjectURLDescriptor;

	beforeEach( () => {
		delete window.videopressAjax;
		delete window.videoPressEditorState;

		createObjectURLDescriptor = Object.getOwnPropertyDescriptor( URL, 'createObjectURL' );
		Object.defineProperty( URL, 'createObjectURL', {
			configurable: true,
			value: jest.fn().mockReturnValue( 'blob:videopress-ajax' ),
		} );

		jest.spyOn( global, 'Blob' ).mockImplementation( ( parts, options ) => ( { parts, options } ) );
	} );

	afterEach( () => {
		jest.restoreAllMocks();

		if ( createObjectURLDescriptor ) {
			Object.defineProperty( URL, 'createObjectURL', createObjectURLDescriptor );
		} else {
			delete URL.createObjectURL;
		}
	} );

	it( 'returns no extra scripts when VideoPress globals are absent', () => {
		expect( getVideoPressSandboxScripts() ).toEqual( [] );
		expect( global.Blob ).not.toHaveBeenCalled();
		expect( URL.createObjectURL ).not.toHaveBeenCalled();
	} );

	it( 'preserves existing preview scripts', () => {
		expect( getVideoPressSandboxScripts( [ 'https://example.com/preview.js' ] ) ).toEqual( [
			'https://example.com/preview.js',
		] );
	} );

	it( 'does not mutate the existing preview scripts', () => {
		const scripts = [ 'https://example.com/preview.js' ];
		const sandboxScripts = getVideoPressSandboxScripts( scripts );

		sandboxScripts.push( 'https://example.com/another.js' );

		expect( scripts ).toEqual( [ 'https://example.com/preview.js' ] );
	} );

	it( 'injects videopressAjax with sandbox context', () => {
		window.videopressAjax = {
			ajaxUrl: 'https://example.com/ajax',
			bridgeUrl: 'https://example.com/ajax-bridge.js',
		};

		expect( getVideoPressSandboxScripts( [ 'https://example.com/preview.js' ] ) ).toEqual( [
			'https://example.com/preview.js',
			'blob:videopress-ajax',
			'https://example.com/ajax-bridge.js',
		] );

		expect( global.Blob ).toHaveBeenCalledWith(
			[
				'var videopressAjax = {"ajaxUrl":"https://example.com/ajax","bridgeUrl":"https://example.com/ajax-bridge.js","context":"sandbox"};',
			],
			{ type: 'text/javascript' }
		);
	} );

	it( 'includes the editor player bridge script when available', () => {
		window.videoPressEditorState = {
			playerBridgeUrl: 'https://example.com/player-bridge.js',
		};

		expect( getVideoPressSandboxScripts( [ 'https://example.com/preview.js' ] ) ).toEqual( [
			'https://example.com/preview.js',
			'https://example.com/player-bridge.js',
		] );
	} );
} );
