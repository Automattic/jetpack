import { render, screen } from '@testing-library/react';
import React from 'react';
import AdminPage from '../index';

describe( 'AdminPage', () => {
	test( 'Renders the component', () => {
		render(
			<AdminPage headline={ 'Headline is present' } subHeadline={ 'Sub-headline is present' }>
				<p>This is a child element.</p>
			</AdminPage>
		);

		expect( screen.getByText( 'This is a child element.' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Headline is present' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Sub-headline is present' ) ).toBeInTheDocument();
	} );
} );
