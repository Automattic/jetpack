import apiFetch from '@wordpress/api-fetch';
import controls, { FETCH_JETPACK_MODULES, UPDATE_JETPACK_MODULE_STATUS } from '../controls';

jest.mock( '@wordpress/api-fetch', () => jest.fn() );

describe( 'controls', () => {
	test( 'should fetch jetpack modules', () => {
		const expectedPath = '/jetpack/v4/module/all';
		const expectedMethod = 'GET';

		controls[ FETCH_JETPACK_MODULES ]();

		expect( apiFetch ).toHaveBeenCalledWith( {
			path: expectedPath,
			method: expectedMethod,
		} );
	} );

	test( 'should update jetpack module status', () => {
		const settings = {
			name: 'test-module',
			active: true,
		};
		const expectedPath = `/jetpack/v4/module/${ settings.name }/active`;
		const expectedMethod = 'POST';
		const expectedData = {
			active: settings.active,
		};

		controls[ UPDATE_JETPACK_MODULE_STATUS ]( { settings } );

		expect( apiFetch ).toHaveBeenCalledWith( {
			path: expectedPath,
			method: expectedMethod,
			data: expectedData,
		} );
	} );
} );
