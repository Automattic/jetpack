/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
/**
 * Internal dependencies
 */
import { useAnnouncements } from '../../../hooks';
import { WhatsNew } from '../whats-new';
import type { Announcement } from '../../../types';

jest.mock( '../../../hooks', () => ( {
	useAnnouncements: jest.fn(),
} ) );

const CHANNELS = [ 'my-plugin' ];

const unseen: Announcement = {
	id: 'my-plugin/newest',
	date: '2026-11-20T00:00:00+00:00',
	title: 'Arrange your tabs',
	excerpt: 'Put the tabs you use most first.',
	content: '<p>Open Settings to reorder or hide tabs.</p>',
	media: null,
	link: '',
	channels: CHANNELS,
};

describe( 'WhatsNew', () => {
	beforeEach( () => {
		jest.useFakeTimers();
	} );

	afterEach( () => {
		jest.useRealTimers();
	} );

	it( 'renders nothing without an announcement to tease', () => {
		jest
			.mocked( useAnnouncements )
			.mockReturnValue( { announcements: [], teaser: null, markSeen: jest.fn() } );

		render( <WhatsNew channels={ CHANNELS } /> );

		expect( screen.queryByRole( 'region' ) ).not.toBeInTheDocument();
		expect( screen.queryByRole( 'dialog' ) ).not.toBeInTheDocument();
	} );

	it( 'marks a dismissed teaser as seen', async () => {
		const user = userEvent.setup( { advanceTimers: jest.advanceTimersByTime } );
		const markSeen = jest.fn();
		jest
			.mocked( useAnnouncements )
			.mockReturnValue( { announcements: [ unseen ], teaser: unseen, markSeen } );

		render( <WhatsNew channels={ CHANNELS } /> );
		await user.click( screen.getByRole( 'button', { name: 'Dismiss' } ) );

		expect( markSeen ).toHaveBeenCalledWith( unseen.id );
		expect( screen.queryByRole( 'dialog' ) ).not.toBeInTheDocument();
	} );

	it( 'opens the reader, marks the announcement as seen and keeps reading it once it is', async () => {
		const user = userEvent.setup( { advanceTimers: jest.advanceTimersByTime } );
		const markSeen = jest.fn();
		jest
			.mocked( useAnnouncements )
			.mockReturnValue( { announcements: [ unseen ], teaser: unseen, markSeen } );

		const { rerender } = render( <WhatsNew channels={ CHANNELS } /> );
		expect( screen.getByRole( 'region', { name: 'What’s new' } ) ).toHaveTextContent(
			unseen.title
		);
		await user.click( screen.getByRole( 'button', { name: 'Read more' } ) );

		expect( markSeen ).toHaveBeenCalledWith( unseen.id );
		await expect(
			screen.findByRole( 'dialog', { name: unseen.title } )
		).resolves.toHaveTextContent( 'Open Settings to reorder or hide tabs.' );

		// What the hook answers once the announcement is seen: nothing to tease.
		jest.mocked( useAnnouncements ).mockReturnValue( {
			announcements: [ unseen ],
			teaser: null,
			markSeen,
		} );
		rerender( <WhatsNew channels={ CHANNELS } /> );

		expect( screen.queryByRole( 'region' ) ).not.toBeInTheDocument();
		expect( screen.getByRole( 'dialog', { name: unseen.title } ) ).toBeInTheDocument();
	} );
} );
