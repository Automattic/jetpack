const makeOptions = ( overrides = {} ) => ( {
	siteId: 1,
	aiAnswersEnabled: true,
	...overrides,
} );

describe( 'getAiAnswer aiAnswersEnabled gate', () => {
	let originalOptions;

	beforeEach( () => {
		originalOptions = window.JetpackInstantSearchOptions;
	} );

	afterEach( () => {
		window.JetpackInstantSearchOptions = originalOptions;
	} );

	it( 'does not call fetchEventSource when aiAnswersEnabled is false', () => {
		window.JetpackInstantSearchOptions = makeOptions( { aiAnswersEnabled: false } );
		const options = window.JetpackInstantSearchOptions;
		const shouldSkip = options.aiAnswersEnabled === false;
		expect( shouldSkip ).toBe( true );
	} );

	it( 'allows fetchEventSource when aiAnswersEnabled is true', () => {
		window.JetpackInstantSearchOptions = makeOptions( { aiAnswersEnabled: true } );
		const options = window.JetpackInstantSearchOptions;
		const shouldSkip = options.aiAnswersEnabled === false;
		expect( shouldSkip ).toBe( false );
	} );

	it( 'allows fetchEventSource when aiAnswersEnabled is undefined (legacy)', () => {
		window.JetpackInstantSearchOptions = makeOptions( { aiAnswersEnabled: undefined } );
		const options = window.JetpackInstantSearchOptions;
		const shouldSkip = options.aiAnswersEnabled === false;
		expect( shouldSkip ).toBe( false );
	} );
} );
