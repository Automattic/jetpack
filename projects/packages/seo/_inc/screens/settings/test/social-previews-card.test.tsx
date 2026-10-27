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

	it( 'says it follows both the front-page title structure and the description', () => {
		renderOpen();

		expect(
			screen.getByText(
				'How your home page looks in search results and social shares. Updates as you edit the front-page title structure and description above.'
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

	describe( 'the Google title', () => {
		it( 'is the default front-page title when the format is untouched: site name, separator, tagline', () => {
			renderOpen();

			expect( screen.getByText( 'Example site – Example tagline' ) ).toBeInTheDocument();
			// Facebook and X keep the Open Graph title, the site name.
			expect( screen.getAllByText( 'Example site' ) ).toHaveLength( 2 );
		} );

		it( 'drops the separator when the site has no tagline, as WordPress does', () => {
			getSite.mockReturnValue( { ...site, tagline: '' } );

			renderOpen();

			// Google's title plus the Facebook and X cards.
			expect( screen.getAllByText( 'Example site' ) ).toHaveLength( 3 );
		} );

		it( 'follows a custom Front page format', () => {
			renderOpen( {
				frontPageTitleFormat: [
					{ type: 'token', value: 'tagline' },
					{ type: 'string', value: ' | ' },
					{ type: 'token', value: 'site_name' },
				],
			} );

			expect( screen.getByText( 'Example tagline | Example site' ) ).toBeInTheDocument();
		} );

		it( 'updates when the format changes, without a save', () => {
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

			expect( screen.getByText( 'Welcome to Example site' ) ).toBeInTheDocument();
			expect( screen.queryByText( 'Example site – Example tagline' ) ).not.toBeInTheDocument();
		} );
	} );
} );
