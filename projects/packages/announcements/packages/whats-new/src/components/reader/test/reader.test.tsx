/**
 * External dependencies
 */
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
/**
 * Internal dependencies
 */
import { emitSurfaceEvent } from '../../../utils';
import { Reader } from '../reader';
import type { Announcement } from '../../../types';

jest.mock( '../../../utils', () => ( {
	emitSurfaceEvent: jest.fn(),
} ) );

const announcement = ( overrides: Partial< Announcement > = {} ): Announcement => ( {
	id: 'my-plugin/newest',
	date: '2026-11-20T00:00:00+00:00',
	title: 'Arrange your tabs',
	excerpt: '',
	content: '<p>Open <strong>Settings</strong> to reorder the tabs.</p>',
	media: null,
	link: 'https://example.com/whats-new/tabs',
	channels: [ 'my-plugin' ],
	...overrides,
} );

describe( 'Reader', () => {
	beforeEach( () => {
		jest.useFakeTimers();
	} );

	afterEach( () => {
		jest.useRealTimers();
	} );

	it( 'shows the date, the body as HTML and the link of the announcement', async () => {
		render( <Reader announcement={ announcement() } isOpen onClose={ jest.fn() } /> );

		const dialog = await screen.findByRole( 'dialog', { name: 'Arrange your tabs' } );

		expect( within( dialog ).getByText( 'November 20, 2026' ) ).toHaveAttribute(
			'datetime',
			'2026-11-20T00:00:00+00:00'
		);
		expect( within( dialog ).getByText( 'Settings' ).tagName ).toBe( 'STRONG' );
		expect(
			within( dialog ).getByRole( 'link', { name: /Read the full article/ } )
		).toHaveAttribute( 'href', 'https://example.com/whats-new/tabs' );
	} );

	it.each( [
		[ 'shows the excerpt of an announcement without a body', '', 1 ],
		[ 'leaves the excerpt out of an announcement with a body', '<p>Open Settings.</p>', 0 ],
	] )( '%s', async ( _case, content, times ) => {
		const excerpt = 'Group your videos in a playlist.';
		render(
			<Reader announcement={ announcement( { content, excerpt } ) } isOpen onClose={ jest.fn() } />
		);

		const dialog = await screen.findByRole( 'dialog' );

		expect( within( dialog ).queryAllByText( excerpt ) ).toHaveLength( times );
	} );

	it( 'shows an image with its text alternative', async () => {
		const media = {
			type: 'image',
			url: 'https://example.com/tabs.png',
			alt: 'The tabs menu',
		} as const;
		render( <Reader announcement={ announcement( { media } ) } isOpen onClose={ jest.fn() } /> );

		const dialog = await screen.findByRole( 'dialog' );

		expect( within( dialog ).getByRole( 'img', { name: 'The tabs menu' } ) ).toHaveAttribute(
			'src',
			media.url
		);
	} );

	it( 'plays a video muted and with controls', async () => {
		const media = {
			type: 'video',
			url: 'https://example.com/tabs.mp4',
			alt: 'The tabs menu',
		} as const;
		render( <Reader announcement={ announcement( { media } ) } isOpen onClose={ jest.fn() } /> );

		const dialog = await screen.findByRole( 'dialog' );
		const video = within( dialog ).getByLabelText< HTMLVideoElement >( 'The tabs menu' );

		expect( video ).toHaveAttribute( 'src', media.url );
		expect( video ).toHaveAttribute( 'controls' );
		expect( video.muted ).toBe( true );
	} );

	it( 'tells when the link of the announcement is followed', async () => {
		const user = userEvent.setup( { advanceTimers: jest.advanceTimersByTime } );
		render( <Reader announcement={ announcement() } isOpen onClose={ jest.fn() } /> );

		await user.click( await screen.findByRole( 'link', { name: /Read the full article/ } ) );

		expect( emitSurfaceEvent ).toHaveBeenCalledWith( {
			type: 'readerLinkClick',
			announcementId: 'my-plugin/newest',
		} );
	} );

	it( 'tells its owner when the dialog is closed', async () => {
		const user = userEvent.setup( { advanceTimers: jest.advanceTimersByTime } );
		const onClose = jest.fn();
		render( <Reader announcement={ announcement() } isOpen onClose={ onClose } /> );

		await user.click( await screen.findByRole( 'button', { name: 'Close' } ) );

		expect( onClose ).toHaveBeenCalledTimes( 1 );
	} );
} );
