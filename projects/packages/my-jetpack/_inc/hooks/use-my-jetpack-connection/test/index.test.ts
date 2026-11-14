import { renderHook } from '@testing-library/react';
import useMyJetpackConnection from '../index';

describe( 'useMyJetpackConnection', () => {
	it( 'runs without the connection state, as on the offline Features page', () => {
		const state = window.JP_CONNECTION_INITIAL_STATE;
		delete window.JP_CONNECTION_INITIAL_STATE;

		try {
			const { result } = renderHook( () => useMyJetpackConnection() );
			expect( result.current.registrationNonce ).toBeUndefined();
		} finally {
			window.JP_CONNECTION_INITIAL_STATE = state;
		}
	} );
} );
