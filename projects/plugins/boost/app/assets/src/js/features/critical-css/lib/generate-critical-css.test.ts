import { runLocalGenerator } from './generate-critical-css';
import type { CriticalCssErrorDetails, Provider } from './stores/critical-css-state-types';

/*
 * Mock the side-effecting helpers so the test stays focused on control flow:
 * - analytics fires Tracks events,
 * - the console helper logs.
 */
jest.mock( '$lib/utils/analytics', () => ( {
	recordBoostEvent: jest.fn(),
} ) );
jest.mock( '$lib/utils/console', () => ( {
	logPreCriticalCSSGeneration: jest.fn(),
} ) );

/*
 * Mock the Critical CSS generator library. mockGenerateCriticalCSS is the call
 * we drive per-provider; BrowserInterfaceIframe just needs to be constructable;
 * SuccessTargetError must be a real class so the instanceof check works. The
 * helper classes live inside the factory because jest.mock factories cannot
 * reference out-of-scope variables (only `mock`-prefixed ones).
 */
const mockGenerateCriticalCSS = jest.fn();
jest.mock(
	'@automattic/jetpack-critical-css-gen',
	() => {
		class SuccessTargetError extends Error {
			urlErrors: Record< string, unknown >;
			constructor( urlErrors: Record< string, unknown > = {} ) {
				super( 'success target error' );
				this.urlErrors = urlErrors;
			}
		}
		class BrowserInterfaceIframe {}
		return {
			generateCriticalCSS: ( ...args: unknown[] ) => mockGenerateCriticalCSS( ...args ),
			BrowserInterfaceIframe,
			SuccessTargetError,
		};
	},
	{ virtual: true }
);

function makeProvider( key: string ): Provider {
	return {
		key,
		label: key,
		urls: [ `https://example.com/${ key }` ],
		success_ratio: 1,
		status: 'pending',
	};
}

function makeCallbacks() {
	let resolveFinished: ( succeeded: boolean ) => void = () => {};
	const finished = new Promise< boolean >( resolve => {
		resolveFinished = resolve;
	} );
	return {
		setProviderCss: jest
			.fn< Promise< unknown >, [ string, string ] >()
			.mockResolvedValue( undefined ),
		setProviderErrors: jest
			.fn< Promise< unknown >, [ string, CriticalCssErrorDetails[] ] >()
			.mockResolvedValue( undefined ),
		setProviderProgress: jest.fn(),
		onError: jest.fn(),
		onFinished: jest.fn( ( succeeded: boolean ) => resolveFinished( succeeded ) ),
		finished,
	};
}

describe( 'runLocalGenerator - per-provider error resilience', () => {
	beforeEach( () => {
		mockGenerateCriticalCSS.mockReset();
	} );

	it( 'records an unexpected provider failure and still generates the remaining providers', async () => {
		mockGenerateCriticalCSS
			.mockRejectedValueOnce( new Error( 'unexpected boom' ) )
			.mockResolvedValueOnce( [ '.button{color:red}' ] );

		const callbacks = makeCallbacks();
		runLocalGenerator(
			[ makeProvider( 'provider_a' ), makeProvider( 'provider_b' ) ],
			'nonce',
			callbacks
		);
		await callbacks.finished;

		// The failing provider is recorded as an UnknownError, not surfaced as a global failure.
		expect( callbacks.onError ).not.toHaveBeenCalled();
		expect( callbacks.onFinished ).toHaveBeenCalledWith( true );

		expect( callbacks.setProviderErrors ).toHaveBeenCalledTimes( 1 );
		const [ failedKey, errors ] = callbacks.setProviderErrors.mock.calls[ 0 ];
		expect( failedKey ).toBe( 'provider_a' );
		expect( errors[ 0 ] ).toMatchObject( { type: 'UnknownError', message: 'unexpected boom' } );

		// The second provider still generated and saved its CSS.
		expect( callbacks.setProviderCss ).toHaveBeenCalledTimes( 1 );
		expect( callbacks.setProviderCss ).toHaveBeenCalledWith( 'provider_b', '.button{color:red}' );
	} );

	it( 'records every provider when they all fail unexpectedly, without a global error', async () => {
		mockGenerateCriticalCSS
			.mockRejectedValueOnce( new Error( 'boom one' ) )
			.mockRejectedValueOnce( new Error( 'boom two' ) );

		const callbacks = makeCallbacks();
		runLocalGenerator(
			[ makeProvider( 'provider_a' ), makeProvider( 'provider_b' ) ],
			'nonce',
			callbacks
		);
		await callbacks.finished;

		/*
		 * Both providers are recorded as errors and no CSS is saved. onFinished
		 * still reports true: it signals that the run reached completion without a
		 * global crash, not that any provider succeeded. The all-failed UX is
		 * surfaced separately by isFatalError(), which reports a fatal error once
		 * no provider is in a success/pending state.
		 */
		expect( callbacks.onError ).not.toHaveBeenCalled();
		expect( callbacks.onFinished ).toHaveBeenCalledWith( true );
		expect( callbacks.setProviderCss ).not.toHaveBeenCalled();

		expect( callbacks.setProviderErrors ).toHaveBeenCalledTimes( 2 );
		expect( callbacks.setProviderErrors.mock.calls.map( ( [ key ] ) => key ) ).toEqual( [
			'provider_a',
			'provider_b',
		] );
		const allUnknown = callbacks.setProviderErrors.mock.calls.every(
			( [ , errors ] ) => errors[ 0 ].type === 'UnknownError'
		);
		expect( allUnknown ).toBe( true );
	} );
} );
