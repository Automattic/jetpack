const MODULE = '../public-path';

beforeEach( () => {
	// Webpack supplies this free variable in real builds.
	global.__webpack_public_path__ = 'initial/';
	jest.resetModules();
} );

afterEach( () => {
	delete window.Jetpack_AI_Admin_Assets_Base_Url;
	delete global.__webpack_public_path__;
} );

test( 'sets the public path from the global the page prints', async () => {
	window.Jetpack_AI_Admin_Assets_Base_Url =
		'https://example.com/wp-content/plugins/jetpack/_inc/build/';

	await import( MODULE );

	expect( global.__webpack_public_path__ ).toBe(
		'https://example.com/wp-content/plugins/jetpack/_inc/build/'
	);
} );

test( 'leaves the public path unchanged when the global is absent', async () => {
	await import( MODULE );

	expect( global.__webpack_public_path__ ).toBe( 'initial/' );
} );
