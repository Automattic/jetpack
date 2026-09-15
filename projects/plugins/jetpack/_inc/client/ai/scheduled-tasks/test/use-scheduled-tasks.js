import requestJwt from '@automattic/jetpack-ai-client/jwt';
import { act, renderHook, waitFor } from '@testing-library/react';
import { useScheduledTasks } from '../use-scheduled-tasks';

jest.mock( '@automattic/jetpack-ai-client/jwt', () => ( {
	__esModule: true,
	default: jest.fn(),
} ) );

const response = body => Promise.resolve( { ok: true, json: () => Promise.resolve( body ) } );

beforeEach( () => {
	requestJwt.mockResolvedValue( { token: 'signed-ai-token' } );
	Object.defineProperty( global, 'fetch', {
		configurable: true,
		writable: true,
		value: jest.fn( () => response( { tasks: [], next_cursor: null } ) ),
	} );
} );

afterEach( () => {
	delete global.fetch;
	jest.clearAllMocks();
} );

test( 'lists tasks from the absolute Public API URL with the existing AI JWT', async () => {
	const { result } = renderHook( () => useScheduledTasks( { blogId: 123, apiNonce: 'nonce' } ) );

	await waitFor( () => expect( result.current.isLoading ).toBe( false ) );

	expect( requestJwt ).toHaveBeenCalledWith( { apiNonce: 'nonce' } );
	expect( fetch ).toHaveBeenCalledWith(
		'https://public-api.wordpress.com/wpcom/v2/sites/123/ai/scheduled-tasks?per_page=100',
		expect.objectContaining( {
			headers: expect.objectContaining( { Authorization: 'Bearer signed-ai-token' } ),
		} )
	);
} );

test( 'runs a task immediately and refreshes the collection', async () => {
	const { result } = renderHook( () => useScheduledTasks( { blogId: 123, apiNonce: 'nonce' } ) );
	await waitFor( () => expect( result.current.isLoading ).toBe( false ) );

	global.fetch
		.mockImplementationOnce( () => response( { id: 7 } ) )
		.mockImplementationOnce( () => response( { tasks: [], next_cursor: null } ) );

	await act( () => result.current.runNow( 7 ) );

	expect( fetch ).toHaveBeenCalledWith(
		'https://public-api.wordpress.com/wpcom/v2/sites/123/ai/scheduled-tasks/7/run',
		expect.objectContaining( { method: 'POST' } )
	);
	expect( result.current.inFlightIds ).toEqual( [] );
} );
