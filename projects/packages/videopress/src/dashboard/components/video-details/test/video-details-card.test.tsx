import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import VideoDetailsCard from '../video-details-card';

// The nested ChaptersSummary calls useLinkProps when Studio is on; keep the
// flag off here so the card renders without a router. The deep link itself
// is covered by chapters-summary.test.tsx.
jest.mock( '../../../utils/studio', () => ( {
	__esModule: true,
	isStudioEnabled: () => false,
} ) );

const DESCRIPTION = [ 'Intro prose.', '00:00 Intro', '00:30 Middle', '01:10 End' ].join( '\n' );

const renderCard = () => {
	const onChange = jest.fn();
	const onOpenChapters = jest.fn();
	const utils = render(
		<VideoDetailsCard
			video={ { id: '42' } }
			title="A title"
			description={ DESCRIPTION }
			onChange={ onChange }
			onOpenChapters={ onOpenChapters }
		/>
	);
	return { ...utils, onChange, onOpenChapters };
};

describe( 'VideoDetailsCard', () => {
	it( 'renders the chapters summary in place of the inline editor', () => {
		renderCard();

		expect( screen.getByText( 'Chapters (3)' ) ).toBeInTheDocument();
		// The structured row editor is gone: no per-row inputs, no add button.
		expect( screen.queryByRole( 'button', { name: 'Add chapter' } ) ).not.toBeInTheDocument();
		expect( screen.queryByLabelText( 'Chapter 1 time' ) ).not.toBeInTheDocument();
	} );

	it( 'forwards title and description edits to onChange', async () => {
		const user = userEvent.setup();
		const { onChange } = renderCard();

		await user.type( screen.getByLabelText( 'Title' ), '!' );
		expect( onChange ).toHaveBeenCalledWith( { title: 'A title!' } );

		await user.type( screen.getByLabelText( 'Description' ), '!' );
		expect( onChange ).toHaveBeenCalledWith( { description: `${ DESCRIPTION }!` } );
	} );

	it( 'opens the chapters help modal from the summary link', async () => {
		const user = userEvent.setup();
		const { onOpenChapters } = renderCard();

		await user.click( screen.getByRole( 'link', { name: 'Learn how chapters work' } ) );

		expect( onOpenChapters ).toHaveBeenCalled();
	} );
} );
