/**
 * Tests for the welcome guide's Webpack public-path override, which runs as an
 * import-time side effect — each case arranges globals then re-requires it.
 */

describe( 'welcome-guide public-path', () => {
	beforeEach( () => {
		/*
		 * Webpack supplies this free variable in real builds; define it here so
		 * the module's strict-mode assignment resolves instead of throwing.
		 */
		global.__webpack_public_path__ = 'initial/';
		jest.resetModules();
	} );

	afterEach( () => {
		delete window.jetpackFormsWelcomeGuide;
		delete global.__webpack_public_path__;
	} );

	test( 'sets the public path from the localized global when present', () => {
		window.jetpackFormsWelcomeGuide = {
			isEligible: true,
			isCoreGuidePending: false,
			assetsUrl: 'https://example.com/dist/form-editor/',
		};

		require( '../../../../src/form-editor/welcome-guide/public-path' );

		expect( global.__webpack_public_path__ ).toBe( 'https://example.com/dist/form-editor/' );
	} );

	test( 'leaves the public path unchanged when the localized global is absent', () => {
		delete window.jetpackFormsWelcomeGuide;

		require( '../../../../src/form-editor/welcome-guide/public-path' );

		expect( global.__webpack_public_path__ ).toBe( 'initial/' );
	} );

	test( 'leaves the public path unchanged when assetsUrl is empty', () => {
		window.jetpackFormsWelcomeGuide = {
			isEligible: true,
			isCoreGuidePending: false,
			assetsUrl: '',
		};

		require( '../../../../src/form-editor/welcome-guide/public-path' );

		expect( global.__webpack_public_path__ ).toBe( 'initial/' );
	} );
} );
