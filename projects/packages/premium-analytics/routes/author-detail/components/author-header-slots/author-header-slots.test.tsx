import { render, screen } from '@testing-library/react';
import { getSettings, setSettings } from '@wordpress/date';
import { authorHeaderSlots, authorSubtitle } from './author-header-slots';
import type { AuthorSummary } from '../../hooks';

const resolved: AuthorSummary = {
	name: 'Priya Patel',
	avatarUrl: 'https://secure.gravatar.com/avatar/abc?s=96',
	postCount: 4,
	firstPublishedDate: '2023-07-04T10:00:00',
	isLoading: false,
	isError: false,
	isNotFound: false,
	refetch: () => {},
};

describe( 'authorSubtitle', () => {
	it( 'joins the post count and the writing-since month', () => {
		expect( authorSubtitle( 4, '2023-07-04T10:00:00' ) ).toBe(
			'4 posts · writing since July 2023'
		);
		expect( authorSubtitle( 1, '2023-07-04T10:00:00' ) ).toBe( '1 post · writing since July 2023' );
	} );

	it( 'formats the month in the site timezone', () => {
		const defaultSettings = getSettings();
		setSettings( {
			...defaultSettings,
			timezone: { offset: -10, offsetFormatted: '-10', string: '', abbr: '' },
		} );

		try {
			// A site-local wall time on the first of the month stays in that month.
			expect( authorSubtitle( 2, '2023-08-01T00:30:00' ) ).toBe(
				'2 posts · writing since August 2023'
			);
		} finally {
			setSettings( defaultSettings );
		}
	} );

	it( 'stands alone on whichever half is known', () => {
		expect( authorSubtitle( 0, undefined ) ).toBe( '0 posts' );
		expect( authorSubtitle( undefined, '2023-07-04T10:00:00' ) ).toBe( 'writing since July 2023' );
		expect( authorSubtitle( undefined, 'not a date' ) ).toBeUndefined();
	} );
} );

describe( 'authorHeaderSlots', () => {
	it( 'names the author with avatar and subtitle once resolved', () => {
		const slots = authorHeaderSlots( { summary: resolved } );

		expect( slots.title ).toBe( 'Priya Patel' );
		expect( slots.subTitle ).toBe( '4 posts · writing since July 2023' );

		render( <>{ slots.visual }</> );
		expect( screen.getByRole( 'presentation' ) ).toHaveAttribute(
			'src',
			'https://secure.gravatar.com/avatar/abc?s=96'
		);
	} );

	it( 'falls back to a neutral name for an empty display name', () => {
		expect( authorHeaderSlots( { summary: { ...resolved, name: '  ' } } ).title ).toBe(
			'Unnamed author'
		);
	} );

	it( 'shows placeholders while loading', () => {
		const slots = authorHeaderSlots( { summary: { ...resolved, isLoading: true } } );

		expect( slots.busy ).toBe( true );
		render( <>{ slots.title }</> );
		expect( screen.getByText( 'Loading…' ) ).toBeInTheDocument();
	} );

	it.each( [
		[ { isNotFound: true }, 'Author not found' ],
		[ { isError: true }, 'Author unavailable' ],
	] )( 'names the failed state %j without a subtitle', ( state, title ) => {
		const slots = authorHeaderSlots( { summary: { ...resolved, ...state } } );

		expect( slots.title ).toBe( title );
		expect( slots.subTitle ).toBeUndefined();
	} );
} );
