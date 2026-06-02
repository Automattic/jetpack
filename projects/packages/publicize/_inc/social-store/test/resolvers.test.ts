import { getScriptData, isSimpleSite } from '@automattic/jetpack-script-data';
import apiFetch from '@wordpress/api-fetch';
import { getTrafficReferrers } from '../resolvers';
import type { TrafficInterval } from '../types';

jest.mock( '@automattic/jetpack-script-data', () => ( {
	getScriptData: jest.fn(),
	isSimpleSite: jest.fn(),
} ) );

jest.mock( '@wordpress/api-fetch' );

const mockGetScriptData = getScriptData as jest.Mock;
const mockIsSimpleSite = isSimpleSite as jest.Mock;
const mockApiFetch = apiFetch as unknown as jest.Mock;

/**
 * Run the `getTrafficReferrers` resolver thunk against a stub dispatch and
 * return the dispatched action creators so assertions can inspect the
 * fetch/receive/error sequence.
 *
 * @param interval - Number of days the chart should cover.
 * @return The dispatch spy.
 */
async function runResolver( interval: TrafficInterval = 30 ) {
	const dispatch = jest.fn();
	await getTrafficReferrers( interval )( { dispatch } );
	return dispatch;
}

beforeEach( () => {
	jest.clearAllMocks();
	mockIsSimpleSite.mockReturnValue( false );
} );

describe( 'getTrafficReferrers resolver', () => {
	it( 'dispatches the error action when the site has no wpcom blog ID', async () => {
		mockGetScriptData.mockReturnValue( { site: {} } );

		const dispatch = await runResolver( 30 );

		// Loading was flagged first…
		expect( dispatch ).toHaveBeenCalledWith(
			expect.objectContaining( { type: 'FETCH_TRAFFIC_REFERRERS', interval: 30 } )
		);
		// …then the error action, with no network request made.
		expect( dispatch ).toHaveBeenCalledWith(
			expect.objectContaining( { type: 'RECEIVE_TRAFFIC_REFERRERS_ERROR', interval: 30 } )
		);
		expect( mockApiFetch ).not.toHaveBeenCalled();
	} );

	it( 'dispatches the error action when the referrers fetch rejects', async () => {
		mockGetScriptData.mockReturnValue( { site: { wpcom: { blog_id: 123 } } } );
		mockApiFetch.mockRejectedValue( new Error( 'boom' ) );

		const dispatch = await runResolver( 7 );

		expect( mockApiFetch ).toHaveBeenCalledTimes( 1 );
		expect( dispatch ).toHaveBeenCalledWith(
			expect.objectContaining( { type: 'FETCH_TRAFFIC_REFERRERS', interval: 7 } )
		);
		expect( dispatch ).toHaveBeenCalledWith(
			expect.objectContaining( { type: 'RECEIVE_TRAFFIC_REFERRERS_ERROR', interval: 7 } )
		);
		// The success action must not fire on a rejected fetch.
		expect( dispatch ).not.toHaveBeenCalledWith(
			expect.objectContaining( { type: 'RECEIVE_TRAFFIC_REFERRERS' } )
		);
	} );

	it( 'targets the Jetpack stats-app route with the real blog ID and stores the payload', async () => {
		mockGetScriptData.mockReturnValue( { site: { wpcom: { blog_id: 123 } } } );
		const days = { '2026-05-01': { groups: [] } };
		mockApiFetch.mockResolvedValue( { days } );

		const dispatch = await runResolver( 30 );

		expect( mockApiFetch ).toHaveBeenCalledWith(
			expect.objectContaining( {
				path: expect.stringContaining( '/jetpack/v4/stats-app/sites/123/stats/referrers' ),
			} )
		);
		expect( dispatch ).toHaveBeenCalledWith(
			expect.objectContaining( { type: 'RECEIVE_TRAFFIC_REFERRERS', interval: 30, days } )
		);
		expect( dispatch ).not.toHaveBeenCalledWith(
			expect.objectContaining( { type: 'RECEIVE_TRAFFIC_REFERRERS_ERROR' } )
		);
	} );

	it( 'reads the public REST namespace on Simple sites', async () => {
		mockIsSimpleSite.mockReturnValue( true );
		mockGetScriptData.mockReturnValue( { site: { wpcom: { blog_id: 456 } } } );
		mockApiFetch.mockResolvedValue( { days: {} } );

		await runResolver( 30 );

		expect( mockApiFetch ).toHaveBeenCalledWith(
			expect.objectContaining( {
				path: expect.stringContaining( '/rest/v1.1/sites/456/stats/referrers' ),
			} )
		);
	} );

	it( 'defaults a missing payload to an empty day map', async () => {
		mockGetScriptData.mockReturnValue( { site: { wpcom: { blog_id: 123 } } } );
		mockApiFetch.mockResolvedValue( {} );

		const dispatch = await runResolver( 30 );

		expect( dispatch ).toHaveBeenCalledWith(
			expect.objectContaining( { type: 'RECEIVE_TRAFFIC_REFERRERS', interval: 30, days: {} } )
		);
	} );
} );
