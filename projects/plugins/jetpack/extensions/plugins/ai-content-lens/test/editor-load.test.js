jest.mock( '..', () => ( {
	aiExcerptPluginName: 'ai-content-lens',
	aiExcerptPluginSettings: { render: () => null },
} ) );

describe( 'AI Content Lens editor loading', () => {
	afterEach( () => {
		delete window.Jetpack_Editor_Initial_State;
	} );

	it( 'loads when the initial state has no block availability', () => {
		window.Jetpack_Editor_Initial_State = {};

		expect( () => require( '../editor' ) ).not.toThrow();
	} );
} );
