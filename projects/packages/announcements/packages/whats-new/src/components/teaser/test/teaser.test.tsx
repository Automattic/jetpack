/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { Teaser } from '../teaser';
import type { Announcement, AnnouncementMedia } from '../../../types';

const announcement = ( media: AnnouncementMedia | null ): Announcement => ( {
	id: 'my-plugin/newest',
	date: '2026-11-20T00:00:00+00:00',
	title: 'Arrange your tabs',
	excerpt: 'Put the tabs you use most first.',
	content: '',
	media,
	link: '',
	channels: [ 'my-plugin' ],
} );

describe( 'Teaser', () => {
	it( 'shows an image as the cover of the card', () => {
		const media: AnnouncementMedia = {
			type: 'image',
			url: 'https://example.com/tabs.png',
			alt: 'The tabs menu',
		};

		render(
			<Teaser announcement={ announcement( media ) } onOpen={ jest.fn() } onDismiss={ jest.fn() } />
		);

		expect( screen.getByRole( 'img', { name: 'The tabs menu' } ) ).toHaveAttribute(
			'src',
			media.url
		);
	} );

	it.each< [ string, AnnouncementMedia | null ] >( [
		[ 'a video', { type: 'video', url: 'https://example.com/tabs.mp4', alt: 'The tabs menu' } ],
		[ 'no media', null ],
	] )( 'shows no cover for %s', ( _case, media ) => {
		render(
			<Teaser announcement={ announcement( media ) } onOpen={ jest.fn() } onDismiss={ jest.fn() } />
		);

		expect( screen.queryByRole( 'img' ) ).not.toBeInTheDocument();
		expect( screen.getByRole( 'heading', { name: 'Arrange your tabs' } ) ).toBeInTheDocument();
	} );
} );
