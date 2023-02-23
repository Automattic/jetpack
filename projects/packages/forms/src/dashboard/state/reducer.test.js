/**
 * Internal dependencies
 */
import { JETPACK_FORMS_RESPONSES_FETCH } from './action-types';
import reducer from './reducer';
import { isFetchingResponses } from './selectors';

test( 'is loading is true when fetching responses', () => {
	const action = {
		type: JETPACK_FORMS_RESPONSES_FETCH,
	};
	const state = reducer( {}, action );

	expect( isFetchingResponses( state ) ).toBe( true );
} );
