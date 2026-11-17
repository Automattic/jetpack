jest.mock( '@automattic/jetpack-script-data', () => ( {
	isSimpleSite: () => true,
} ) );

// The store reads its initial state on import, so each case loads a fresh copy.
const loadIsAutoEnhanceEnabled = async () => {
	let isEnabled: boolean;
	await jest.isolateModulesAsync( async () => {
		const { select } = await import( '@wordpress/data' );
		const { store } = await import( '../store' );
		isEnabled = select( store ).isAutoEnhanceEnabled();
	} );
	return isEnabled;
};

describe( 'SEO enhancer store', () => {
	afterEach( () => {
		delete window.Jetpack_Editor_Initial_State;
	} );

	it.each( [ true, false ] )( 'starts from the saved setting on Simple: %s', async isOn => {
		window.Jetpack_Editor_Initial_State = {
			'ai-assistant': { 'is-seo-auto-enhance-enabled': isOn },
		} as unknown as Window[ 'Jetpack_Editor_Initial_State' ];

		await expect( loadIsAutoEnhanceEnabled() ).resolves.toBe( isOn );
	} );
} );
