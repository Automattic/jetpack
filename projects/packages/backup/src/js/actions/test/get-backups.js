import apiFetch from '@wordpress/api-fetch';
import actions from '../index';
import { SITE_BACKUPS_GET, SITE_BACKUPS_GET_SUCCESS, SITE_BACKUPS_GET_FAILED } from '../types';

jest.mock( '@wordpress/api-fetch' );

const anyFunction = () => {};

const apiFixtures = {
	requestOptions: {
		path: '/jetpack/v4/backups',
	},
	successResponse: [
		{
			id: '123456789',
			started: '2024-06-26 11:40:54',
			last_updated: '2024-06-26 11:44:55',
			status: 'not-accessible',
			period: '321321321',
			percent: '0',
			is_backup: '1',
			is_scan: '0',
		},
		{
			id: '987654321',
			started: '2024-06-26 06:36:08',
			last_updated: '2024-06-26 06:39:05',
			status: 'finished',
			period: '123123123',
			percent: '100',
			is_backup: '1',
			is_scan: '0',
			has_snapshot: true,
			discarded: '0',
			stats: {},
		},
	],
	failureResponse: 'Timeout error',
};

describe( 'getBackups', () => {
	beforeEach( () => jest.clearAllMocks() );

	it( 'dispatches SITE_BACKUPS_GET and SITE_BACKUPS_GET_SUCCESS on successful fetch', async () => {
		const dispatch = jest.fn( anyFunction );
		apiFetch.mockReturnValue( Promise.resolve( apiFixtures.successResponse ) );

		await actions.getBackups()( { dispatch } );
		expect( apiFetch ).toHaveBeenCalledWith( apiFixtures.requestOptions );

		expect( dispatch ).toHaveBeenCalledTimes( 2 );
		expect( dispatch ).toHaveBeenCalledWith( { type: SITE_BACKUPS_GET } );
		expect( dispatch ).toHaveBeenCalledWith( {
			type: SITE_BACKUPS_GET_SUCCESS,
			payload: apiFixtures.successResponse,
		} );
	} );

	it( 'dispatches SITE_BACKUPS_GET and SITE_BACKUPS_GET_FAILED when API call fails', async () => {
		const dispatch = jest.fn( anyFunction );
		apiFetch.mockReturnValue( Promise.reject( apiFixtures.failureResponse ) );

		await actions.getBackups()( { dispatch } );
		expect( apiFetch ).toHaveBeenCalledWith( apiFixtures.requestOptions );

		expect( dispatch ).toHaveBeenCalledTimes( 2 );
		expect( dispatch ).toHaveBeenCalledWith( { type: SITE_BACKUPS_GET } );
		expect( dispatch ).toHaveBeenCalledWith( { type: SITE_BACKUPS_GET_FAILED } );
	} );
} );
