import { QueryClient } from '@tanstack/react-query';
import { observeLegacyModulesState, OVERVIEW_MODULES_CHANGE_EVENT } from './modules-state-bridge';

let client: QueryClient;
let unsubscribe: () => void;
const onChange = jest.fn();

beforeEach( () => {
	client = new QueryClient();
	onChange.mockClear();
	window.addEventListener( OVERVIEW_MODULES_CHANGE_EVENT, onChange );
	unsubscribe = observeLegacyModulesState( client );
} );

afterEach( () => {
	unsubscribe();
	window.removeEventListener( OVERVIEW_MODULES_CHANGE_EVENT, onChange );
	client.clear();
} );

test.each( [ 'modules_state', 'critical_css_state', 'lcp_state' ] )(
	'relays successful updates to %s',
	key => {
		client.setQueryData( [ key ], {} );
		expect( onChange ).toHaveBeenCalledTimes( 1 );
	}
);

test( 'does not relay updates to unrelated keys', () => {
	client.setQueryData( [ 'performance_history' ], {} );
	expect( onChange ).not.toHaveBeenCalled();
} );

test( 'does not relay non-success updates', () => {
	client.setQueryData( [ 'modules_state' ], {} );
	onChange.mockClear();
	client.invalidateQueries( { queryKey: [ 'modules_state' ] } );
	expect( onChange ).not.toHaveBeenCalled();
} );
