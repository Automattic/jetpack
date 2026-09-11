/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { HighlightField, HighlightGroup } from '../highlight-group';

describe( 'HighlightGroup', () => {
	it( 'renders each field as a labelled heading with its value and caption', () => {
		render(
			<HighlightGroup>
				<HighlightField label="Best day" value="Friday" caption="17% of views" />
				<HighlightField label="Best hour" value="7:00 pm" caption="5% of views" />
			</HighlightGroup>
		);

		expect( screen.getAllByRole( 'heading', { level: 4 } ).map( h => h.textContent ) ).toEqual( [
			'Best day',
			'Best hour',
		] );
		expect( screen.getByText( 'Friday' ) ).toBeInTheDocument();
		expect( screen.getByText( '17% of views' ) ).toBeInTheDocument();
		expect( screen.getByText( '7:00 pm' ) ).toBeInTheDocument();
		expect( screen.getByText( '5% of views' ) ).toBeInTheDocument();
	} );

	it( 'drops the caption line when no caption is given', () => {
		render(
			<HighlightGroup>
				<HighlightField label="Views" value="102.6K" />
			</HighlightGroup>
		);

		expect( screen.getByText( '102.6K' ) ).toBeInTheDocument();
		expect( screen.queryByText( /of views/ ) ).not.toBeInTheDocument();
	} );

	it( 'exposes the unabbreviated value as a tooltip', () => {
		render(
			<HighlightGroup>
				<HighlightField label="Views" value="102.6K" valueTitle="102,631" />
			</HighlightGroup>
		);

		expect( screen.getByText( '102.6K' ) ).toHaveAttribute( 'title', '102,631' );
	} );

	it( 'accepts a node value', () => {
		render(
			<HighlightGroup>
				<HighlightField label="Views" value={ <span data-testid="node-value">12</span> } />
			</HighlightGroup>
		);

		expect( screen.getByTestId( 'node-value' ) ).toBeInTheDocument();
	} );
} );
