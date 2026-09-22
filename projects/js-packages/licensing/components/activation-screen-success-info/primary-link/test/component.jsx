import { jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import { PrimaryLink } from '..';
import useActivePlugins from '../../../../hooks/use-active-plugins';

jest.mock( '../../../../hooks/use-active-plugins', () => jest.fn() );

describe( 'PrimaryLink', () => {
	it( 'sends a Social license to the Social admin page when Jetpack is active', () => {
		useActivePlugins.mockReturnValue( [ [ { name: 'Jetpack' } ], false ] );

		render(
			<PrimaryLink
				productId={ 2602 }
				siteAdminUrl="https://example.com/wp-admin/"
				siteRawUrl="example.com"
			/>
		);

		expect( screen.getByRole( 'link', { name: 'Configure my site' } ) ).toHaveAttribute(
			'href',
			'https://example.com/wp-admin/admin.php?page=jetpack-social'
		);
	} );
} );
