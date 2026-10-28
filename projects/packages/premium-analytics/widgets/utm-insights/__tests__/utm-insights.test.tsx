/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import apiFetch from '@wordpress/api-fetch';
/**
 * Internal dependencies
 */
import { renderWithActionsHost } from '../../../tests/js/widget-host-test-utils';
import { captureCsvDownloads } from '../../test-utils';
import UtmInsightsWidget from '../render';
import type { UtmInsightsRow } from '../use-utm-insights';

jest.mock( '@wordpress/api-fetch', () => jest.fn() );

jest.mock( '@wordpress/route', () => jest.requireActual( '../../test-utils' ).mockWordPressRoute );

const mockApiFetch = apiFetch as unknown as jest.Mock;

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

afterEach( () => {
	jest.useRealTimers();
} );

describe( 'UtmInsightsWidget', () => {
	it( 'offers Build URL for an empty selection and keeps View all declared', async () => {
		const user = userEvent.setup();
		const { rerender, declaredAction } = renderWithActionsHost(
			<UtmInsightsWidget attributes={ {} } />
		);

		expect( declaredAction( 'view-all' ) ).toBeDefined();
		await user.click( screen.getByRole( 'button', { name: 'Build URL' } ) );
		expect( screen.getByRole( 'dialog', { name: 'Build URL' } ) ).toBeInTheDocument();

		await user.keyboard( '{Escape}' );
		mockRows = [ { label: 'newsletter / email', value: 18 } ];
		rerender( <UtmInsightsWidget attributes={ {} } /> );
		expect( screen.queryByRole( 'button', { name: 'Build URL' } ) ).not.toBeInTheDocument();
	} );

	it.each( [
		[ 'source-medium', {} ],
		[ 'campaign-source-medium', { utmDimension: 'utm_campaign,utm_source,utm_medium' } ],
	] as const )( 'declares View all to the %s report tab', ( section, attributes ) => {
		const { declaredLink } = renderWithActionsHost(
			<UtmInsightsWidget attributes={ attributes } />
		);

		const href = decodeURIComponent( declaredLink( 'view-all' )?.href ?? '' );
		expect( href ).toContain( '/reports/utm' );
		expect( href ).toContain( `section=${ section }` );
	} );

	it( 'declares neither the report link nor the download when the host composition opts out', () => {
		mockRows = [ { label: 'newsletter / email', value: 18 } ];
		const { declaredActions } = renderWithActionsHost(
			<UtmInsightsWidget attributes={ { showReportLink: false } } />
		);

		expect( declaredActions() ).toEqual( [] );
	} );

	it( 'downloads the full report for the active UTM dimension', async () => {
		jest.useFakeTimers();
		const downloads = captureCsvDownloads();
		mockApiFetch.mockResolvedValue( {} );
		mockRows = [ { label: 'newsletter / email', value: 18 } ];
		const { findDeclaredAction } = renderWithActionsHost(
			<UtmInsightsWidget
				attributes={ {
					utmDimension: 'utm_campaign,utm_source,utm_medium',
					reportParams: { from: '2026-06-01', to: '2026-06-30' },
				} }
			/>
		);

		await downloads.runAndSave( await findDeclaredAction( 'download-csv' ) );
		const [ saved ] = downloads.files;
		downloads.restore();

		expect( saved.filename ).toBe( 'utm-campaign-source-medium-2026-06-01_2026-06-30.csv' );
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

		expect( screen.getByText( 'Source / Medium' ) ).toBeInTheDocument();

		await user.click(
			screen.getByRole( 'button', { name: 'View posts for jetpack-forms / email' } )
		);

		expect( screen.getByText( 'Posts' ) ).toBeInTheDocument();
		const titleLink = screen.getByRole( 'link', { name: 'Jetpack Forms' } );
		const href = titleLink.getAttribute( 'href' ) ?? '';

		expect( href ).toContain( '/post/12' );
		expect( href ).toContain( 'from=2026-06-01' );
		expect( href ).toContain( 'ref=utm' );
		expect( href ).toContain( 'ref_section=source-medium' );
		expect( new URL( href, 'https://example.com' ).searchParams.get( 'post_url' ) ).toBe(
			'https://example.com/forms/'
		);
		expect( titleLink ).not.toHaveAttribute( 'target', '_blank' );
	} );

	it( 'names the active UTM dimension as the origin section', async () => {
		const user = userEvent.setup();
		mockRows = [
			{
				label: 'spring-sale',
				value: 18,
				children: [
					{ postId: 9, label: 'Landing page', value: 11, href: 'https://example.com/landing/' },
				],
			},
		];

		render(
			<UtmInsightsWidget
				attributes={ {
					utmDimension: 'utm_campaign',
					reportParams: { from: '2026-06-01', to: '2026-06-30' },
				} }
			/>
		);

		await user.click( screen.getByRole( 'button', { name: 'View posts for spring-sale' } ) );

		const href = screen.getByRole( 'link', { name: 'Landing page' } ).getAttribute( 'href' ) ?? '';
		expect( href ).toContain( 'ref=utm' );
		expect( href ).toContain( 'ref_section=campaign' );
	} );
} );
