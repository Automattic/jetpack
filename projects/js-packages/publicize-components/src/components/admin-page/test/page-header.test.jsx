import { render, screen } from '@testing-library/react';
import { clearMockedScriptData, mockScriptData } from '../../../utils/test-utils';
import AdminPageHeader from '../page-header';

describe( 'AdminPageHeader', () => {
	beforeEach( () => {
		mockScriptData();
	} );

	afterEach( () => {
		clearMockedScriptData();
	} );
	it( 'should show license text when no paid features and is Jetpack site', () => {
		render( <AdminPageHeader /> );
		expect(
			screen.getByText( /Already have an existing plan or license key\?/i )
		).toBeInTheDocument();
		expect( screen.getByRole( 'link' ) ).toHaveAttribute(
			'href',
			expect.stringContaining( 'admin.php?page=my-jetpack#/add-license' )
		);
	} );

	it( 'should not show license text when has paid features', () => {
		mockScriptData( {
			site: {
				plan: {
					features: {
						active: [ 'social-enhanced-publishing' ],
					},
				},
			},
		} );
		render( <AdminPageHeader /> );
		expect(
			screen.queryByText( /Already have an existing plan or license key\?/i )
		).not.toBeInTheDocument();
		clearMockedScriptData();
	} );

	it( 'should not show license text when not a Jetpack site', () => {
		mockScriptData( {
			site: {
				host: 'wpcom',
				plan: {
					features: {
						active: [ 'social-enhanced-publishing' ],
					},
				},
			},
		} );
		render( <AdminPageHeader /> );
		expect(
			screen.queryByText( /Already have an existing plan or license key\?/i )
		).not.toBeInTheDocument();
		clearMockedScriptData();
	} );
} );
