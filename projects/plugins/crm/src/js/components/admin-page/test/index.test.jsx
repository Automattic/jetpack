import { render, screen } from '@testing-library/react';
import React from 'react';
import AdminPage from '../index';

describe( 'AdminPage', () => {
	test( 'Renders the component', () => {
		render(
			<AdminPage>
				<p>This is a child element.</p>
			</AdminPage>
		);

		expect( screen.getByText( 'This is a child element.' ) ).toBeInTheDocument();
		expect( screen.getByRole( 'link', { name: 'Jetpack CRM' } ) ).toHaveAttribute(
			'href',
			'https://jetpackcrm.com/'
		);
	} );
} );
