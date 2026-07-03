import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ImportQueue from '../queue';
import type { QueueItem } from '../queue';

const makeItem = ( overrides: Partial< QueueItem > = {} ): QueueItem => ( {
	externalId: 'yt-1',
	title: 'First video',
	status: 'queued',
	error: null,
	...overrides,
} );

describe( 'ImportQueue', () => {
	const renderQueue = ( items: QueueItem[], isImporting: boolean ) => {
		const onRetry = jest.fn();
		const onBack = jest.fn();
		render(
			<ImportQueue
				items={ items }
				isImporting={ isImporting }
				onRetry={ onRetry }
				onBack={ onBack }
			/>
		);
		return { onRetry, onBack };
	};

	it( 'shows a progress heading and per-item statuses while importing', () => {
		renderQueue(
			[ makeItem(), makeItem( { externalId: 'yt-2', title: 'Second video', status: 'done' } ) ],
			true
		);

		expect( screen.getByText( 'Importing from YouTube…' ) ).toBeInTheDocument();
		expect( screen.getByText( 'First video' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Importing…' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Second video' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Imported' ) ).toBeInTheDocument();
		// No exit while the job is running.
		expect( screen.queryByRole( 'button', { name: 'Back to library' } ) ).not.toBeInTheDocument();
	} );

	it( 'summarizes the result and offers "Back to library" when settled', async () => {
		const { onBack } = renderQueue(
			[
				makeItem( { status: 'done' } ),
				makeItem( { externalId: 'yt-2', title: 'Second video', status: 'done' } ),
			],
			false
		);

		expect( screen.getByText( 'Imported 2 of 2 videos.' ) ).toBeInTheDocument();

		await userEvent.click( screen.getByRole( 'button', { name: 'Back to library' } ) );
		expect( onBack ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'renders the error message and a Retry button for failed items', async () => {
		const { onRetry } = renderQueue(
			[
				makeItem( { status: 'done' } ),
				makeItem( {
					externalId: 'yt-2',
					title: 'Second video',
					status: 'failed',
					error: { code: 'unknown_video', message: 'This video could not be found.' },
				} ),
			],
			false
		);

		expect( screen.getByText( 'Imported 1 of 2 videos.' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Failed' ) ).toBeInTheDocument();
		expect( screen.getByText( 'This video could not be found.' ) ).toBeInTheDocument();

		await userEvent.click( screen.getByRole( 'button', { name: 'Retry' } ) );
		expect( onRetry ).toHaveBeenCalledWith( 'yt-2' );
	} );
} );
