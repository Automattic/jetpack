import restApi from '@automattic/jetpack-api';
import { jest } from '@jest/globals';
import { render } from '@testing-library/react';
import AdminPage from '../index.tsx';

describe( 'AdminPage', () => {
	afterEach( () => {
		jest.restoreAllMocks();
	} );

	it( 'leaves the shared REST client alone when no API root or nonce is passed', () => {
		const setApiRoot = jest.spyOn( restApi, 'setApiRoot' );
		const setApiNonce = jest.spyOn( restApi, 'setApiNonce' );

		render( <AdminPage title="Test">content</AdminPage> );

		expect( setApiRoot ).not.toHaveBeenCalled();
		expect( setApiNonce ).not.toHaveBeenCalled();
	} );

	it( 'sets the API root and nonce it is given', () => {
		const setApiRoot = jest.spyOn( restApi, 'setApiRoot' );
		const setApiNonce = jest.spyOn( restApi, 'setApiNonce' );

		render(
			<AdminPage title="Test" apiRoot="https://example.com/wp-json/" apiNonce="nonce">
				content
			</AdminPage>
		);

		expect( setApiRoot ).toHaveBeenCalledWith( 'https://example.com/wp-json/' );
		expect( setApiNonce ).toHaveBeenCalledWith( 'nonce' );
	} );
} );
