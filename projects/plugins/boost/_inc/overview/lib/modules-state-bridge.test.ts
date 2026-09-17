import { MutationObserver, QueryClient } from '@tanstack/react-query';
import { ONBOARDING_CHANGE_EVENT } from '../../runtime-contract';
import { observeLegacyModulesState, OVERVIEW_MODULES_CHANGE_EVENT } from './modules-state-bridge';

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
		expect( onChange ).toHaveBeenCalledWith( expect.objectContaining( { detail: key } ) );
	}
);

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
	let failSave: ( error: Error ) => void = () => undefined;
	const save = new MutationObserver< boolean, Error, boolean >( client, {
		mutationFn: () => new Promise< boolean >( ( _, reject ) => ( failSave = reject ) ),
		onMutate: () => client.setQueryData( [ 'getting_started' ], false ),
		onError: () => client.setQueryData( [ 'getting_started' ], true ),
	} )
		.mutate( false )
		.catch( () => undefined );
	await Promise.resolve();

	expect( client.getQueryData( [ 'getting_started' ] ) ).toBe( false );
	expect( onOnboardingChange ).not.toHaveBeenCalled();

	failSave( new Error( 'Save failed' ) );
	await save;

	expect( onboardingValues() ).toEqual( [ true ] );
} );
