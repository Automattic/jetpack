import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ChaptersCard from '../chapters-card';

describe( 'ChaptersCard', () => {
	it( 'lists chapters parsed from the description', () => {
		render(
			<ChaptersCard
				description={ 'Prose.\n00:00 Intro\n00:30 Middle\n01:00 End' }
				onManageChapters={ jest.fn() }
			/>
		);
		expect( screen.getByText( 'Chapters' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Intro' ) ).toBeInTheDocument();
		expect( screen.getByText( '00:30' ) ).toBeInTheDocument();
		expect( screen.getByText( 'End' ) ).toBeInTheDocument();
	} );

	it( 'shows an empty state when the description has no chapters', () => {
		render( <ChaptersCard description="Just prose." onManageChapters={ jest.fn() } /> );
		expect(
			screen.getByText(
				'Chapters help viewers navigate long videos. Add timestamps and titles to create them.'
			)
		).toBeInTheDocument();
	} );

	it( 'fires onManageChapters', async () => {
		const onManageChapters = jest.fn();
		render( <ChaptersCard description="" onManageChapters={ onManageChapters } /> );
		await userEvent.click( screen.getByRole( 'button', { name: 'Manage chapters' } ) );
		expect( onManageChapters ).toHaveBeenCalled();
	} );
} );
