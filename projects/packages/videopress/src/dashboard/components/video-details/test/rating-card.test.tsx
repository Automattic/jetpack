import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RatingCard from '../rating-card';
import type { VideoRating } from '../../../types/library';

const renderCard = ( value: VideoRating = 'G' ) => {
	const onChange = jest.fn();
	render( <RatingCard value={ value } onChange={ onChange } /> );
	return { onChange };
};

describe( 'RatingCard', () => {
	it( 'starts collapsed with the current rating in the header', () => {
		renderCard( 'PG-13' );

		const trigger = screen.getByRole( 'button', { name: /rating/i } );

		expect( trigger ).toHaveAttribute( 'aria-expanded', 'false' );
		// Reaches assistive tech via `aria-describedby`; HeaderDescription is
		// aria-hidden so it isn't announced twice.
		expect( trigger ).toHaveAccessibleDescription( 'PG-13' );
	} );

	it( 'reveals the options when expanded, and reports a change', async () => {
		const user = userEvent.setup();
		const { onChange } = renderCard( 'G' );

		await user.click( screen.getByRole( 'button', { name: /rating/i } ) );

		expect( screen.getByRole( 'radio', { name: 'G' } ) ).toBeChecked();

		await user.click( screen.getByRole( 'radio', { name: 'PG-13' } ) );
		expect( onChange ).toHaveBeenCalledWith( 'PG-13' );
	} );

	/*
	 * The descriptions are the reason this card is the tallest in the column,
	 * and the reason it collapses. They must survive collapsing rather than be
	 * unmounted — `hiddenUntilFound` keeps them reachable by find-in-page.
	 */
	it( 'keeps the option descriptions in the document while collapsed', () => {
		renderCard();

		expect(
			screen.getByText( 'Suitable for all audiences, including children.' )
		).toBeInTheDocument();
	} );
} );
