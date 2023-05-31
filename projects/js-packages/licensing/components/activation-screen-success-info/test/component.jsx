import { render, screen } from '@testing-library/react';
import React from 'react';
import ActivationSuccessInfo from '..';

describe( 'ActivationSuccessInfo', () => {
	const testProps = {
		productId: 2100,
		siteAdminUrl: 'http://test-site.jurassic.ninja/wp-admin',
		siteRawUrl: 'http://test-site.jurassic.ninja',
	};

	describe( 'Render the ActivationSuccessInfo component', () => {
		it( 'shows the correct product name', () => {
			render( <ActivationSuccessInfo { ...testProps } /> );
			expect(
				screen.getByRole( 'heading', { name: /Jetpack Backup is active!/ } )
			).toBeInTheDocument();
		} );
	} );
} );
