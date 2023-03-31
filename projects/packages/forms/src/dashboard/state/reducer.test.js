/**
 * Internal dependencies
 */
import { RESPONSES_FETCH } from './action-types';
import reducer from './reducer';
import { isFetchingResponses } from './selectors';

test( 'is loading is true when fetching responses', () => {
	const action = {
		type: RESPONSES_FETCH,
	};
	const state = reducer( {}, action );

	expect( isFetchingResponses( state ) ).toBe( true );
} );
