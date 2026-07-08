import findPlugins from '../src/utils/parse-content/find-plugins.ts';

describe( 'findPlugins', () => {
	test( 'returns empty array when no plugin section found', () => {
		expect( findPlugins( 'Just a regular issue body.' ) ).toEqual( [] );
	} );

	test( 'returns empty array for empty body', () => {
		expect( findPlugins( '' ) ).toEqual( [] );
	} );

	test( 'extracts a single plugin', () => {
		const body = '### Impacted plugin\n\nJetpack\n\nSome other content';
		expect( findPlugins( body ) ).toEqual( [ 'Jetpack' ] );
	} );

	test( 'extracts multiple comma-separated plugins', () => {
		const body = '### Impacted plugin\n\nJetpack, Boost, Search\n\nMore content';
		expect( findPlugins( body ) ).toEqual( [ 'Jetpack', 'Boost', 'Search' ] );
	} );

	test( 'filters out empty strings from trailing commas', () => {
		const body = '### Impacted plugin\n\nJetpack, \n\nMore content';
		expect( findPlugins( body ) ).toEqual( [ 'Jetpack' ] );
	} );
} );
