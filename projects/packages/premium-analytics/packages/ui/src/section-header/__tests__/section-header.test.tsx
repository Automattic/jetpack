import { render, screen } from '@testing-library/react';
import { SectionHeader } from '../section-header';

describe( 'SectionHeader', () => {
	it( 'renders the title as a level-2 heading', () => {
		render( <SectionHeader title="Traffic" /> );

		expect( screen.getByRole( 'heading', { level: 2 } ) ).toHaveTextContent( 'Traffic' );
	} );

	it( 'carries the title as an attribute, past the ellipsis', () => {
		render( <SectionHeader title="Traffic across every channel this site measures" /> );

		expect( screen.getByRole( 'heading', { level: 2 } ) ).toHaveAttribute(
			'title',
			'Traffic across every channel this site measures'
		);
	} );

	it( 'renders the date controls passed to the slot', () => {
		render(
			<SectionHeader title="Traffic">
				<button type="button">Last 7 days</button>
			</SectionHeader>
		);

		expect( screen.getByRole( 'button', { name: 'Last 7 days' } ) ).toBeInTheDocument();
	} );
} );
