/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { ChartsProvider } from '../charts-provider';
import type { ReactNode } from 'react';

const mockChartFormatting = { locale: 'en-US', timeZone: 'Asia/Tokyo' };

jest.mock( '@jetpack-premium-analytics/externals', () => ( {
	GlobalChartsProvider: ( {
		children,
		locale,
		timeZone,
	}: {
		children: ReactNode;
		locale?: string;
		timeZone?: string;
	} ) => (
		<div data-testid="global-charts-provider" data-locale={ locale } data-time-zone={ timeZone }>
			{ children }
		</div>
	),
} ) );

jest.mock( '../../../helpers', () => ( {
	siteChartFormatting: () => mockChartFormatting,
} ) );

jest.mock( '../../../hooks', () => ( {
	useChartTheme: () => ( {} ),
} ) );

describe( 'ChartsProvider', () => {
	it( "formats charts with the site's locale and timezone", () => {
		render( <ChartsProvider>chart</ChartsProvider> );

		const provider = screen.getByTestId( 'global-charts-provider' );

		expect( provider ).toHaveAttribute( 'data-locale', mockChartFormatting.locale );
		expect( provider ).toHaveAttribute( 'data-time-zone', mockChartFormatting.timeZone );
		expect( provider ).toHaveTextContent( 'chart' );
	} );
} );
