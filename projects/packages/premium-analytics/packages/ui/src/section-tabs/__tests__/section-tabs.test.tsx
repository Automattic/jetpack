/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { SectionTabs } from '../section-tabs';

describe( 'SectionTabs', () => {
	it( 'shows a loading placeholder in place of a pending label', () => {
		render(
			<SectionTabs
				tabs={ [
					{ id: 'traffic', label: 'Post traffic', isPending: true },
					{ id: 'opens', label: 'Email opens' },
				] }
				value="traffic"
				onChange={ () => {} }
			/>
		);

		expect( screen.getByRole( 'tab', { name: 'Loading…' } ) ).toBeInTheDocument();
		expect( screen.queryByText( 'Post traffic' ) ).not.toBeInTheDocument();
		expect( screen.getByRole( 'tab', { name: 'Email opens' } ) ).toBeInTheDocument();
	} );
} );
