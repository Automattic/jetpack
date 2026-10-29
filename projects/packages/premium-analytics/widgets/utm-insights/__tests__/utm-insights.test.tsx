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
let mockIsLoading = false;

jest.mock( '../use-utm-insights', () => ( {
	__esModule: true,
	default: () => ( {
		data: mockRows,
		hasComparison: false,
		isLoading: mockIsLoading,
		isFetching: false,
		hasData: mockRows.length > 0,
		isError: false,
	} ),
} ) );

beforeEach( () => {
	jest.useFakeTimers();
	mockRows = [];
	mockIsLoading = false;
} );

const setupUser = () => userEvent.setup( { advanceTimers: jest.advanceTimersByTime } );

afterEach( () => {
	jest.useRealTimers();
} );

describe( 'UtmInsightsWidget', () => {
	it( 'offers Build URL in the empty state', async () => {
		const user = setupUser();
		render( <UtmInsightsWidget attributes={ {} } /> );

		await user.click( screen.getByRole( 'button', { name: 'Build URL' } ) );
		expect( screen.getByRole( 'dialog', { name: 'Build URL' } ) ).toBeInTheDocument();
	} );

	it( 'declares Build URL when there are UTM visits', async () => {
		mockRows = [ { label: 'newsletter / email', value: 18 } ];
		const { runDeclaredAction } = renderWithActionsHost( <UtmInsightsWidget attributes={ {} } /> );

		await runDeclaredAction( 'build-url' );
		expect( screen.getByRole( 'dialog', { name: 'Build URL' } ) ).toBeInTheDocument();
	} );

	it.each( [
		[ 'there are no UTM visits', [], false ],
		[ 'the first load is in flight', [], true ],
		[
			'a new period loads over the previous rows',
			[ { label: 'newsletter / email', value: 18 } ],
			true,
		],
	] )( 'leaves Build URL out of the footer while %s', ( _state, rows, isLoading ) => {
		mockRows = rows;
		mockIsLoading = isLoading;
		const { declaredActions } = renderWithActionsHost( <UtmInsightsWidget attributes={ {} } /> );

		expect( declaredActions().map( action => action.id ) ).toEqual( [ 'view-all' ] );
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

	it( 'keeps only Build URL when the host composition opts out of the report actions', () => {
		mockRows = [ { label: 'newsletter / email', value: 18 } ];
		const { declaredActions } = renderWithActionsHost(
			<UtmInsightsWidget attributes={ { showReportLink: false } } />
		);

		expect( declaredActions().map( action => action.id ) ).toEqual( [ 'build-url' ] );
	} );

	it( 'downloads the full report for the active UTM dimension', async () => {
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
		const user = setupUser();
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
		const user = setupUser();
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
