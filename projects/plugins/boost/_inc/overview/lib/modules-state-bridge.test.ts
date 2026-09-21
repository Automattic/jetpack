import { DataSyncProvider, queryClient } from '@automattic/jetpack-react-data-sync-client';
import { act, renderHook, waitFor } from '@testing-library/react';
import { MutationObserver, QueryClient } from '@tanstack/react-query';
import { useGettingStarted } from '../../../app/assets/src/js/lib/stores/getting-started';
import { ONBOARDING_CHANGE_EVENT } from '../../runtime-contract';
import {
	observeLegacyModulesState,
	ONBOARDING_SAVE_META,
	OVERVIEW_MODULES_CHANGE_EVENT,
} from './modules-state-bridge';

let client: QueryClient;
let unsubscribe: () => void;
const onChange = jest.fn();
const onOnboardingChange = jest.fn();
const onboardingValues = () =>
	onOnboardingChange.mock.calls.map( ( [ event ] ) => ( event as CustomEvent< boolean > ).detail );

beforeEach( () => {
	client = new QueryClient();
	onChange.mockClear();
	onOnboardingChange.mockClear();
	window.addEventListener( OVERVIEW_MODULES_CHANGE_EVENT, onChange );
	window.addEventListener( ONBOARDING_CHANGE_EVENT, onOnboardingChange );
	unsubscribe = observeLegacyModulesState( client );
} );

afterEach( () => {
	unsubscribe();
	window.removeEventListener( OVERVIEW_MODULES_CHANGE_EVENT, onChange );
	window.removeEventListener( ONBOARDING_CHANGE_EVENT, onOnboardingChange );
	client.clear();
} );

test.each( [ 'modules_state', 'critical_css_state', 'lcp_state' ] )(
	'relays successful updates to %s',
	key => {
		client.setQueryData( [ key ], {} );
		expect( onChange ).toHaveBeenCalledTimes( 1 );
		expect( onChange ).toHaveBeenCalledWith(
			expect.objectContaining( { detail: { key, data: {} } } )
		);
	}
);

test.each( [ 'critical_css_state', 'lcp_state' ] )( 'relays polled results for %s', async key => {
	const data = { status: 'pending', updated: 1 };
	await client.fetchQuery( {
		queryKey: [ key ],
		queryFn: async () => ( { status: 'pending', updated: 1 } ),
	} );
	expect( onChange ).toHaveBeenCalledTimes( 1 );
	expect( onChange ).toHaveBeenCalledWith( expect.objectContaining( { detail: { key, data } } ) );
} );

test( 'does not relay updates to unrelated keys', () => {
	client.setQueryData( [ 'performance_history' ], {} );
	client.setQueryData( [ 'getting_started' ], false );
	expect( onChange ).not.toHaveBeenCalled();
} );

test( 'does not relay non-success updates', () => {
	client.setQueryData( [ 'modules_state' ], {} );
	onChange.mockClear();
	client.invalidateQueries( { queryKey: [ 'modules_state' ] } );
	expect( onChange ).not.toHaveBeenCalled();
} );

test( 'reports getting_started after every successful write or read', async () => {
	client.setQueryData( [ 'getting_started' ], true );
	await client.fetchQuery( { queryKey: [ 'getting_started' ], queryFn: async () => false } );

	expect( onboardingValues() ).toEqual( [ true, false ] );
} );

test( 'holds getting_started while a save is pending and reports the value it settles on', async () => {
	client.setQueryData( [ 'getting_started' ], true );
	onOnboardingChange.mockClear();
	let callsAfterRevert: number;
	let failSave: ( error: Error ) => void = () => undefined;
	const save = new MutationObserver< boolean, Error, boolean >( client, {
		meta: ONBOARDING_SAVE_META,
		mutationFn: () => new Promise< boolean >( ( _, reject ) => ( failSave = reject ) ),
		onMutate: () => client.setQueryData( [ 'getting_started' ], false ),
		onError: () => {
			client.setQueryData( [ 'getting_started' ], true );
			callsAfterRevert = onOnboardingChange.mock.calls.length;
		},
	} )
		.mutate( false )
		.catch( () => undefined );
	await Promise.resolve();

	expect( client.getQueryData( [ 'getting_started' ] ) ).toBe( false );
	expect( onOnboardingChange ).not.toHaveBeenCalled();

	failSave( new Error( 'Save failed' ) );
	await save;

	expect( callsAfterRevert ).toBe( 0 );
	expect( onboardingValues() ).toEqual( [ true ] );
} );

test( 'reports a settled onboarding save while a later modules_state save remains pending', async () => {
	client.setQueryData( [ 'getting_started' ], true );
	onOnboardingChange.mockClear();
	let callsAfterSuccess: number;
	let finishOnboarding: ( value: boolean ) => void = () => undefined;
	let finishModules: () => void = () => undefined;
	const onboardingSave = new MutationObserver< boolean, Error, boolean >( client, {
		meta: ONBOARDING_SAVE_META,
		mutationFn: () => new Promise< boolean >( resolve => ( finishOnboarding = resolve ) ),
		onMutate: () => client.setQueryData( [ 'getting_started' ], false ),
		onSuccess: value => {
			client.setQueryData( [ 'getting_started' ], value );
			callsAfterSuccess = onOnboardingChange.mock.calls.length;
		},
	} ).mutate( false );
	await Promise.resolve();
	const modulesSave = new MutationObserver( client, {
		mutationFn: () => new Promise< void >( resolve => ( finishModules = resolve ) ),
		onMutate: () => client.setQueryData( [ 'modules_state' ], {} ),
	} ).mutate();
	await Promise.resolve();

	expect( onOnboardingChange ).not.toHaveBeenCalled();
	finishOnboarding( false );
	await onboardingSave;

	expect( callsAfterSuccess ).toBe( 0 );
	expect( client.isMutating() ).toBe( 1 );
	expect( onboardingValues() ).toEqual( [ false ] );
	finishModules();
	await modulesSave;
	expect( onboardingValues() ).toEqual( [ false ] );
} );

test( 'reports a non-manual read of true immediately during a modules_state save', async () => {
	client.setQueryData( [ 'getting_started' ], false );
	onOnboardingChange.mockClear();
	let finishModules: () => void = () => undefined;
	const modulesSave = new MutationObserver( client, {
		mutationFn: () => new Promise< void >( resolve => ( finishModules = resolve ) ),
		onMutate: () => client.setQueryData( [ 'modules_state' ], {} ),
	} ).mutate();
	await Promise.resolve();

	await client.fetchQuery( { queryKey: [ 'getting_started' ], queryFn: async () => true } );

	expect( client.isMutating() ).toBe( 1 );
	expect( onboardingValues() ).toEqual( [ true ] );
	finishModules();
	await modulesSave;
	expect( onboardingValues() ).toEqual( [ true ] );
} );

test.each( [ true, false ] )(
	'holds the real onboarding hook until its save settles (success: %s)',
	async succeeds => {
		window.jetpack_boost_ds = {
			rest_api: { value: 'https://example.org/wp-json/jetpack-boost-ds', nonce: 'test' },
			getting_started: { value: true, nonce: 'test' },
		};
		queryClient.clear();
		const stop = observeLegacyModulesState( queryClient );
		let resolveSave: ( value: Response ) => void;
		let rejectSave: ( error: Error ) => void;
		const originalFetch = globalThis.fetch;
		const request = jest.fn< ReturnType< typeof fetch >, Parameters< typeof fetch > >(
			() =>
				new Promise( ( resolve, reject ) => {
					resolveSave = resolve;
					rejectSave = reject;
				} )
		);
		globalThis.fetch = request;
		const { result, unmount } = renderHook( useGettingStarted, { wrapper: DataSyncProvider } );
		try {
			let saved: Promise< unknown >;
			act( () => {
				saved = result.current.markGettingStartedComplete().catch( () => undefined );
			} );
			await waitFor( () => expect( request ).toHaveBeenCalledTimes( 1 ) );
			expect( queryClient.getQueryData( [ 'getting_started' ] ) ).toBe( false );
			expect( onboardingValues() ).toEqual( [] );
			await act( async () => {
				if ( succeeds ) {
					resolveSave( {
						ok: true,
						text: async () => JSON.stringify( { status: 'success', JSON: false } ),
					} as Response );
				} else {
					rejectSave( new Error( 'Save failed' ) );
				}
				await saved;
			} );
			expect( onboardingValues() ).toEqual( [ ! succeeds ] );
		} finally {
			unmount();
			stop();
			queryClient.clear();
			if ( originalFetch ) {
				globalThis.fetch = originalFetch;
			} else {
				Reflect.deleteProperty( globalThis, 'fetch' );
			}
		}
	}
);
