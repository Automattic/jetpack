// Mock the transport so we can drive the endpoint's success/failure responses.
const mockApiFetch = jest.fn();
jest.mock( '@wordpress/api-fetch', () => ( {
	__esModule: true,
	default: ( ...args ) => mockApiFetch( ...args ),
} ) );

import actions, { SET_CONNECTION_HEALTH_ERRORS } from '../actions';

describe( 'runConnectionHealthCheck thunk', () => {
	afterEach( () => jest.clearAllMocks() );

	it( 'clears health errors when all checks pass', async () => {
		mockApiFetch.mockResolvedValue( { code: 'success' } );
		const dispatch = jest.fn();

		const result = await actions.runConnectionHealthCheck()( { dispatch } );

		expect( mockApiFetch ).toHaveBeenCalledWith( { path: '/jetpack/v4/connection/test' } );
		expect( dispatch ).toHaveBeenCalledWith( {
			type: SET_CONNECTION_HEALTH_ERRORS,
			connectionHealthErrors: {},
		} );
		expect( result ).toEqual( {} );
	} );

	it( 'maps and stores failed checks from the rejected response body', async () => {
		mockApiFetch.mockRejectedValue( {
			code: 'failed_test__connection_token_health',
			message: 'The site token used to authenticate with WordPress.com could not be validated.',
			data: { resolution: 'Reconnect now :https://example.com/reconnect' },
		} );
		const dispatch = jest.fn();

		await actions.runConnectionHealthCheck()( { dispatch } );

		const [ action ] = dispatch.mock.calls[ 0 ];
		expect( action.type ).toBe( SET_CONNECTION_HEALTH_ERRORS );
		expect( action.connectionHealthErrors ).toEqual( {
			failed_test__connection_token_health: {
				0: {
					error_code: 'failed_test__connection_token_health',
					error_message:
						'The site token used to authenticate with WordPress.com could not be validated.',
					error_type: 'connection_health',
					error_data: {
						action_label: 'Reconnect now',
						action_url: 'https://example.com/reconnect',
					},
				},
			},
		} );
	} );
} );
