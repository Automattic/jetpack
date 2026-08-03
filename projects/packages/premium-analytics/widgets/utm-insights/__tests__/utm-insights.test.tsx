/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
/**
 * Internal dependencies
 */
import UtmInsightsWidget from '../render';
import type { UtmInsightsRow } from '../use-utm-insights';

jest.mock( '@wordpress/route', () => jest.requireActual( '../../test-utils' ).mockWordPressRoute );

let mockRows: UtmInsightsRow[] = [];

jest.mock( '../use-utm-insights', () => ( {
	__esModule: true,
	default: () => ( {
		data: mockRows,
		hasComparison: false,
		isLoading: false,
		isFetching: false,
		hasData: mockRows.length > 0,
		isError: false,
	} ),
} ) );

beforeEach( () => {
	mockRows = [];
} );

describe( 'UtmInsightsWidget', () => {
	it( 'links to the UTM report', () => {
		render( <UtmInsightsWidget attributes={ {} } /> );

		expect( screen.getByRole( 'link', { name: 'See report' } ) ).toHaveAttribute(
			'href',
			expect.stringContaining( '/reports/utm' )
		);
		expect( screen.getByRole( 'link', { name: 'See report' } ) ).toHaveAttribute(
			'href',
			expect.stringContaining( 'section=source-medium' )
		);
	} );

	it( 'links the combined campaign dimension to its matching report tab', () => {
		render(
			<UtmInsightsWidget attributes={ { utmDimension: 'utm_campaign,utm_source,utm_medium' } } />
		);

		expect( screen.getByRole( 'link', { name: 'See report' } ) ).toHaveAttribute(
			'href',
			expect.stringContaining( 'section=campaign-source-medium' )
		);
	} );

	it( 'hides the report link when the host composition opts out', () => {
		render( <UtmInsightsWidget attributes={ { showReportLink: false } } /> );

		expect( screen.queryByRole( 'link', { name: 'See report' } ) ).not.toBeInTheDocument();
	} );

	it( 'links a drilled-in post to its detail page and carries the report window', async () => {
		const user = userEvent.setup();
		mockRows = [
			{
				label: 'jetpack-forms / email',
				value: 30,
				children: [
					{ postId: 12, label: 'Jetpack Forms', value: 20, href: 'https://example.com/forms/' },
				],
			},
		];

		render(
			<UtmInsightsWidget
				attributes={ { reportParams: { from: '2026-06-01', to: '2026-06-30' } } }
			/>
		);

		await user.click(
			screen.getByRole( 'button', { name: 'View posts for jetpack-forms / email' } )
		);

		const titleLink = screen.getByRole( 'link', { name: 'Jetpack Forms' } );
		expect( titleLink ).toHaveAttribute( 'href', expect.stringContaining( '/post/12' ) );
		expect( titleLink ).toHaveAttribute( 'href', expect.stringContaining( 'from=2026-06-01' ) );
		expect( titleLink ).not.toHaveAttribute( 'target', '_blank' );
	} );

	it( 'falls back to the public URL when a drilled-in post has no ID', async () => {
		const user = userEvent.setup();
		mockRows = [
			{
				label: 'jetpack-forms / email',
				value: 30,
				children: [
					{ postId: 0, label: 'Untracked page', value: 20, href: 'https://example.com/untracked/' },
				],
			},
		];

		render( <UtmInsightsWidget attributes={ {} } /> );

		await user.click(
			screen.getByRole( 'button', { name: 'View posts for jetpack-forms / email' } )
		);

		const titleLink = screen.getByRole( 'link', { name: /Untracked page/ } );
		expect( titleLink ).toHaveAttribute( 'href', 'https://example.com/untracked/' );
		expect( titleLink ).toHaveAttribute( 'target', '_blank' );
	} );
} );
