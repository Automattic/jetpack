import { render, screen } from '@testing-library/react';
import { SectionHeader } from '../section-header';

const SUBTITLE = 'Jul 21 – Jul 27 (7 days)';

describe( 'SectionHeader', () => {
	it( 'renders the title as a level-2 heading', () => {
		render( <SectionHeader title="Traffic" /> );

		expect( screen.getByRole( 'heading', { level: 2 } ) ).toHaveTextContent( 'Traffic' );
	} );

	it( 'renders the subtitle when one is given', () => {
		render( <SectionHeader title="Traffic" subtitle={ SUBTITLE } /> );

		expect( screen.getByText( SUBTITLE ) ).toBeInTheDocument();
	} );

	it( 'drops the subtitle once there is nothing to describe', () => {
		const { rerender } = render( <SectionHeader title="Traffic" subtitle={ SUBTITLE } /> );

		rerender( <SectionHeader title="Traffic" /> );

		expect( screen.queryByText( SUBTITLE ) ).not.toBeInTheDocument();
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
