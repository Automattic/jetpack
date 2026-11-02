import { jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import ActivationSuccessInfo from '..';

jest.mock( '../../../hooks/use-active-plugins', () => {
	return jest.fn( () => [ [], false ] );
} );

describe( 'ActivationSuccessInfo', () => {
	const testProps = {
		productId: 2100,
		siteAdminUrl: 'http://test-site.jurassic.ninja/wp-admin',
		siteRawUrl: 'http://test-site.jurassic.ninja',
	};

	it.each( [ 2024, 2025, 2026 ] )(
		'recognizes Pro license %s and links to its backup',
		productId => {
			render( <ActivationSuccessInfo { ...testProps } productId={ productId } /> );
			expect(
				screen.getByRole( 'heading', { name: /Jetpack Pro is active!/ } )
			).toBeInTheDocument();
			expect( screen.getByRole( 'link', { name: /View latest backup/ } ) ).toBeInTheDocument();
		}
	);

	describe( 'Render the ActivationSuccessInfo component', () => {
		it( 'shows the correct product name', () => {
			render( <ActivationSuccessInfo { ...testProps } /> );
			expect(
				screen.getByRole( 'heading', { name: /Jetpack Backup is active!/ } )
			).toBeInTheDocument();
		} );
	} );
} );
