/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
/**
 * Internal dependencies
 */
import RecentVideoCard from '../recent-video-card';
import type { LibraryItem } from '../../../src/dashboard/types/library';

jest.mock( '@automattic/jetpack-components/global-notices', () => ( {
	useGlobalNotices: () => ( { createSuccessNotice: jest.fn(), createErrorNotice: jest.fn() } ),
} ) );

jest.mock( '../../../src/dashboard/hooks/use-processing-progress', () => ( {
	useProcessingProgress: () => null,
} ) );

const item = {
	id: 42,
	guid: 'abc12345',
	title: 'Harbour at dusk',
	filename: 'harbour.mp4',
	type: 'videopress',
	privacy: 'public',
	isPrivate: false,
	isProcessing: false,
	durationSeconds: 34,
	thumbnailUrl: 'https://example.com/thumb.jpg',
	uploadDate: '2026-08-14T00:00:00',
} as unknown as LibraryItem;

describe( 'RecentVideoCard', () => {
	it( 'opens the video when the thumbnail is clicked', async () => {
		// The picture is the biggest target on the card and the thing people aim
		// at, so it has to be the thing that works — before this it was inert and
		// only the title opened the video.
		const onOpen = jest.fn();
		render( <RecentVideoCard item={ item } viewsSlot="unknown" onOpen={ onOpen } /> );

		await userEvent.click( screen.getByTestId( 'recent-video-media' ) );

		expect( onOpen ).toHaveBeenCalledWith( 42 );
	} );

	it( 'leaves the title as the only tab stop to the video', async () => {
		// The thumbnail is a redundant pointer affordance, so it must stay out of
		// the accessibility tree: two tab stops onto one destination is worse for
		// a keyboard user than one, and the thumbnail carries no name of its own.
		const onOpen = jest.fn();
		render( <RecentVideoCard item={ item } viewsSlot="unknown" onOpen={ onOpen } /> );

		expect( screen.getByTestId( 'recent-video-media' ) ).toHaveAttribute( 'aria-hidden', 'true' );

		// And the keyboard path still works.
		await userEvent.click( screen.getByRole( 'button', { name: 'Harbour at dusk' } ) );
		expect( onOpen ).toHaveBeenCalledWith( 42 );
	} );
} );
