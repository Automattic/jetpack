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
		expect( container ).toHaveTextContent( 'Views2,068' );
		expect( container ).toHaveTextContent( 'Comments1' );
	} );

	it( 'ignores a metrics subset persisted by an earlier version', async () => {
		renderWidget( { metrics: [ 'views' ] } );

		await expect( screen.findByText( 'Views' ) ).resolves.toBeInTheDocument();
		expect( screen.getAllByRole( 'listitem' ) ).toHaveLength( 4 );
	} );
} );
