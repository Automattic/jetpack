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
	const originalTty = {
		stdin: Object.getOwnPropertyDescriptor( process.stdin, 'isTTY' ),
		stdout: Object.getOwnPropertyDescriptor( process.stdout, 'isTTY' ),
	};
	const setTty = ( stdin, stdout ) => {
		Object.defineProperty( process.stdin, 'isTTY', { value: stdin, configurable: true } );
		Object.defineProperty( process.stdout, 'isTTY', { value: stdout, configurable: true } );
	};

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
		for ( const name of [ 'stdin', 'stdout' ] ) {
			if ( originalTty[ name ] ) {
				Object.defineProperty( process[ name ], 'isTTY', originalTty[ name ] );
			} else {
				delete process[ name ].isTTY;
			}
		}
		jest.restoreAllMocks();
	} );

	test.each( [
		[ 'stdin', undefined, true ],
		[ 'stdout', true, undefined ],
	] )(
		'does not ask, or save an answer, when %s is not a terminal',
		async ( _name, stdin, stdout ) => {
			setTty( stdin, stdout );

			await expect( checkAnalyticsEnabled() ).resolves.toBe( false );
			expect( mockPrompt ).not.toHaveBeenCalled();
			expect( store.size ).toBe( 0 );
		}
	);

	test( 'keeps a saved preference when there is no terminal', async () => {
		setTty( undefined, undefined );
		store.set( 'askedToEnableAnalytics', true );
		store.set( 'analyticsEnabled', true );

		await expect( checkAnalyticsEnabled() ).resolves.toBe( true );
		expect( mockPrompt ).not.toHaveBeenCalled();
	} );

	test( 'does not ask in CI, even from a terminal', async () => {
		setTty( true, true );
		process.env.CI = 'true';

		await expect( checkAnalyticsEnabled() ).resolves.toBe( false );
		expect( mockPrompt ).not.toHaveBeenCalled();
		expect( store.size ).toBe( 0 );
	} );

	test.each( [ true, false ] )(
		'asks once from a terminal and saves the answer %s',
		async answer => {
			setTty( true, true );
			mockPrompt.mockResolvedValueOnce( { analyticsEnabled: answer } );

			await expect( checkAnalyticsEnabled() ).resolves.toBe( answer );
			expect( mockPrompt ).toHaveBeenCalledTimes( 1 );
			expect( store.get( 'askedToEnableAnalytics' ) ).toBe( true );
			expect( store.get( 'analyticsEnabled' ) ).toBe( answer );
		}
	);
} );
