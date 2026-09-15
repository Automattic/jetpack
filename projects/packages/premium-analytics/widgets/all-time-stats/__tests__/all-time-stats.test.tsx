/**
 * External dependencies
 */
import {
	getDefaultQueryParams,
	GlobalErrorProvider,
	queryClient,
} from '@jetpack-premium-analytics/data';
import { render, screen } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
/**
 * Internal dependencies
 */
import AllTimeStatsWidget from '../render';
import widgetDefinition from '../widget';

jest.mock( '@wordpress/api-fetch', () => jest.fn() );

// WidgetRoot reads URL search params as a fallback for report params; outside
// a matched route the real hook warns and throws.
jest.mock( '@wordpress/route', () => ( {
	useSearch: () => ( {} ),
} ) );

const mockApiFetch = apiFetch as unknown as jest.Mock;

const SITE_PAYLOAD = {
	stats: { views: 2068, visitors: 47, posts: 29, comments: 1 },
};

const renderWidget = ( attributes: Record< string, unknown > = {} ) =>
	render(
		<GlobalErrorProvider>
			<AllTimeStatsWidget attributes={ { ...attributes, reportParams: getDefaultQueryParams() } } />
		</GlobalErrorProvider>
	);

describe( 'AllTimeStatsWidget', () => {
	beforeEach( () => {
		queryClient.clear();
		mockApiFetch.mockReset();
		mockApiFetch.mockResolvedValue( SITE_PAYLOAD );
	} );

	it( 'offers no attribute controls', () => {
		expect( widgetDefinition.attributes ).toEqual( [] );
	} );

	it( 'shows every lifetime total', async () => {
		const { container } = renderWidget();

		await expect( screen.findByText( 'Views' ) ).resolves.toBeInTheDocument();
		expect( screen.getAllByRole( 'listitem' ) ).toHaveLength( 4 );
		// The compact figure is hidden from assistive tech; the exact one beside it
		// is hidden visually.
		expect( container ).toHaveTextContent( 'Views2.1K2,068' );
		expect( screen.getByText( '2.1K' ) ).toHaveAttribute( 'aria-hidden', 'true' );
		expect( container ).toHaveTextContent( 'Comments1' );
	} );

	it( 'leaves a total under a thousand uncompacted', async () => {
		renderWidget();

		const value = await screen.findByText( '47' );
		expect( value ).not.toHaveAttribute( 'aria-hidden' );
		expect( screen.queryByText( '47', { selector: '[aria-hidden]' } ) ).not.toBeInTheDocument();
	} );

	it( 'ignores a metrics subset persisted by an earlier version', async () => {
		renderWidget( { metrics: [ 'views' ] } );

		await expect( screen.findByText( 'Views' ) ).resolves.toBeInTheDocument();
		expect( screen.getAllByRole( 'listitem' ) ).toHaveLength( 4 );
	} );
} );
