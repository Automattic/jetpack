// eslint-disable-next-line import/order -- This is a test file and we need to import the mocks first
import { mockStore } from '../../../utils/test-mocks.js';
import { isJetpackSelfHostedSite } from '@automattic/jetpack-script-data';
import { render, screen } from '@testing-library/react';
import { hasSocialPaidFeatures } from '../../../utils';
import AdminPageHeader from '../page-header';

describe( 'AdminPageHeader', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		mockStore();
	} );

	it( 'should show license text when no paid features and is Jetpack site', () => {
		hasSocialPaidFeatures.mockReturnValue( false );
		isJetpackSelfHostedSite.mockReturnValue( true );

		render( <AdminPageHeader /> );
		expect(
			screen.getByText( /Already have an existing plan or license key\?/i )
		).toBeInTheDocument();
		expect( screen.getByRole( 'link' ) ).toHaveAttribute(
			'href',
			'https://example.com/add-license'
		);
	} );

	it( 'should not show license text when has paid features', () => {
		hasSocialPaidFeatures.mockReturnValue( true );
		isJetpackSelfHostedSite.mockReturnValue( true );

		render( <AdminPageHeader /> );
		expect(
			screen.queryByText( /Already have an existing plan or license key\?/i )
		).not.toBeInTheDocument();
	} );

	it( 'should not show license text when not a Jetpack site', () => {
		hasSocialPaidFeatures.mockReturnValue( false );
		isJetpackSelfHostedSite.mockReturnValue( false );

		render( <AdminPageHeader /> );
		expect(
			screen.queryByText( /Already have an existing plan or license key\?/i )
		).not.toBeInTheDocument();
	} );
} );
