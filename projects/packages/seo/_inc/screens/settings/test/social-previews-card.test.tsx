/* eslint-disable testing-library/prefer-user-event */

import '@testing-library/jest-dom';
import { jest } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react';
import type { TitleFormatToken } from '../../../data/settings-types';

const site = {
	title: 'Example site',
	tagline: 'Example tagline',
	url: 'https://example.com',
	icon: '',
	image: 'https://example.com/representative.jpg',
};
const getSite = jest.fn( () => site );

jest.unstable_mockModule( '../../../data/get-site', () => ( {
	default: getSite,
} ) );

const { default: SocialPreviewsCard } = await import( '../social-previews-card' );

/**
 * Render the card with a default (untouched) Front page title and open it.
 *
 * @param props                      - Overrides for the card's props.
 * @param props.description          - The front-page description.
 * @param props.frontPageTitleFormat - The Front page title format.
 * @param props.titleSeparator       - The site's document-title separator.
 * @return The testing-library render result.
 */
const renderOpen = ( {
	description = '',
	frontPageTitleFormat = [] as TitleFormatToken[],
	titleSeparator = '–',
} = {} ) => {
	const view = render(
		<SocialPreviewsCard
			description={ description }
			frontPageTitleFormat={ frontPageTitleFormat }
			titleSeparator={ titleSeparator }
		/>
	);
	fireEvent.click( screen.getByRole( 'button', { name: /Search & social previews/ } ) );
	return view;
};

describe( 'SocialPreviewsCard', () => {
	beforeEach( () => {
		getSite.mockReturnValue( site );
	} );

	it( 'explains that platform appearance can vary', () => {
		renderOpen();

		expect(
			screen.getByText(
				'Preview your home page in search results and social shares. Actual appearance varies by platform.'
			)
		).toBeInTheDocument();
	} );

	it( 'uses the site tagline when the front-page description is empty', () => {
		renderOpen();

		expect( screen.getAllByText( 'Example tagline' ) ).toHaveLength( 3 );
	} );

	it( 'prefers the front-page description over the tagline', () => {
		renderOpen( { description: 'Custom description' } );

		expect( screen.getAllByText( 'Custom description' ) ).toHaveLength( 3 );
		expect( screen.queryByText( 'Example tagline' ) ).not.toBeInTheDocument();
	} );

	describe( 'the titles', () => {
		it( 'use the default titles when the format is untouched', () => {
			renderOpen();

			// Google: the title WordPress composes (site name, separator, tagline).
			expect( screen.getByText( 'Example site – Example tagline' ) ).toBeInTheDocument();
			// Facebook and X: the Open Graph title, the site name.
			expect( screen.getAllByText( 'Example site' ) ).toHaveLength( 2 );
		} );

		it( 'drop the separator when the site has no tagline, as WordPress does', () => {
			getSite.mockReturnValue( { ...site, tagline: '' } );

			renderOpen();

			// Google's title plus the Facebook and X cards.
			expect( screen.getAllByText( 'Example site' ) ).toHaveLength( 3 );
		} );

		it( 'follow a custom Front page format on Google, Facebook and X', () => {
			renderOpen( {
				frontPageTitleFormat: [
					{ type: 'token', value: 'tagline' },
					{ type: 'string', value: ' | ' },
					{ type: 'token', value: 'site_name' },
				],
			} );

			// Jetpack copies the custom title into og:title, which Facebook and X read.
			expect( screen.getAllByText( 'Example tagline | Example site' ) ).toHaveLength( 3 );
		} );

		it( 'fall back to the defaults when the format comes out empty', () => {
			// WordPress ignores an empty custom title, and Jetpack leaves og:title alone.
			getSite.mockReturnValue( { ...site, tagline: '' } );

			renderOpen( { frontPageTitleFormat: [ { type: 'token', value: 'tagline' } ] } );

			expect( screen.getAllByText( 'Example site' ) ).toHaveLength( 3 );
		} );

		it( 'update when the format changes, without a save', () => {
			const { rerender } = renderOpen();

			rerender(
				<SocialPreviewsCard
					description=""
					frontPageTitleFormat={ [
						{ type: 'string', value: 'Welcome to ' },
						{ type: 'token', value: 'site_name' },
					] }
					titleSeparator="–"
				/>
			);

			expect( screen.getAllByText( 'Welcome to Example site' ) ).toHaveLength( 3 );
			expect( screen.queryByText( 'Example site – Example tagline' ) ).not.toBeInTheDocument();
		} );
	} );
	it( 'updates both social previews with the chosen default', () => {
		render(
			<SocialPreviewsCard
				description=""
				frontPageTitleFormat={ [] }
				titleSeparator="-"
				defaultImage={ { id: 42, src: 'https://example.com/default.jpg', alt_text: 'Default' } }
			/>
		);
		fireEvent.click( screen.getByRole( 'button', { name: /Search & social previews/ } ) );
		const images = screen.getAllByAltText( '' );
		expect( images ).toHaveLength( 2 );
		images.forEach( image =>
			expect( image ).toHaveAttribute( 'src', 'https://example.com/default.jpg' )
		);
	} );

	it( 'preserves the home page content image ahead of the default', () => {
		getSite.mockReturnValue( {
			...site,
			content_image: 'https://example.com/home.jpg',
		} as typeof site );
		render(
			<SocialPreviewsCard
				description=""
				frontPageTitleFormat={ [] }
				titleSeparator="-"
				defaultImage={ { id: 42, src: 'https://example.com/default.jpg', alt_text: 'Default' } }
			/>
		);
		fireEvent.click( screen.getByRole( 'button', { name: /Search & social previews/ } ) );
		screen
			.getAllByAltText( '' )
			.forEach( image => expect( image ).toHaveAttribute( 'src', 'https://example.com/home.jpg' ) );
	} );
} );
