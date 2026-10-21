import { jest } from '@jest/globals';

const store = new Map();
jest.unstable_mockModule( 'configstore', () => ( {
	default: class {
		get( key ) {
			return store.get( key );
		}
		set( key, value ) {
			store.set( key, value );
		}
	},
} ) );

const mockPrompt = jest.fn();
jest.unstable_mockModule( 'enquirer', () => ( { default: { prompt: mockPrompt } } ) );

const { checkAnalyticsEnabled } = await import( '../../../helpers/analytics.js' );

describe( 'checkAnalyticsEnabled', () => {
	const originalCi = process.env.CI;
	const originalIsTty = Object.getOwnPropertyDescriptor( process.stdin, 'isTTY' );
	const setStdinTty = value =>
		Object.defineProperty( process.stdin, 'isTTY', { value, configurable: true } );

	beforeEach( () => {
		delete process.env.CI;
		store.clear();
		mockPrompt.mockReset();
		jest.spyOn( console, 'log' ).mockImplementation( () => {} );
	} );

	afterEach( () => {
		if ( originalCi === undefined ) {
			delete process.env.CI;
		} else {
			process.env.CI = originalCi;
		}
		if ( originalIsTty ) {
			Object.defineProperty( process.stdin, 'isTTY', originalIsTty );
		} else {
			delete process.stdin.isTTY;
		}
		jest.restoreAllMocks();
	} );

	test( 'does not ask, or save an answer, when stdin is not a terminal', async () => {
		setStdinTty( undefined );

		await expect( checkAnalyticsEnabled() ).resolves.toBe( false );
		expect( mockPrompt ).not.toHaveBeenCalled();
		expect( store.size ).toBe( 0 );
	} );

	test( 'keeps a saved preference when stdin is not a terminal', async () => {
		setStdinTty( undefined );
		store.set( 'askedToEnableAnalytics', true );
		store.set( 'analyticsEnabled', true );

		await expect( checkAnalyticsEnabled() ).resolves.toBe( true );
		expect( mockPrompt ).not.toHaveBeenCalled();
	} );

	test( 'asks once and saves the answer when stdin is a terminal', async () => {
		setStdinTty( true );
		mockPrompt.mockResolvedValueOnce( { analyticsEnabled: false } );

		await expect( checkAnalyticsEnabled() ).resolves.toBe( false );
		expect( mockPrompt ).toHaveBeenCalledTimes( 1 );
		expect( store.get( 'askedToEnableAnalytics' ) ).toBe( true );
		expect( store.get( 'analyticsEnabled' ) ).toBe( false );
	} );
} );
