/**
 * External dependencies
 */
import { ReportScopeProvider } from '@jetpack-premium-analytics/routing';
import { render, screen } from '@testing-library/react';
import { useSearch } from '@wordpress/route';
/**
 * Internal dependencies
 */
import { useWidgetRootContext } from '../context';
import { WidgetRoot } from '../widget-root';
import type { ReportParams } from '@jetpack-premium-analytics/data';

jest.mock( '@wordpress/route', () => ( {
	useSearch: jest.fn(),
} ) );

const useSearchMock = jest.mocked( useSearch );

const COMPARED_WINDOW = {
	from: '2026-01-01T00:00:00.000Z',
	to: '2026-01-31T23:59:59.999Z',
	interval: 'day',
	compare_from: '2025-12-01T00:00:00.000Z',
	compare_to: '2025-12-31T23:59:59.999Z',
	compare_preset: 'previous-period' as const,
	comp: '1' as const,
};

function ParamsProbe() {
	const { reportParams } = useWidgetRootContext();

	return <span data-testid="report-params">{ JSON.stringify( reportParams ) }</span>;
}

function resolvedParams(): ReportParams {
	return JSON.parse( screen.getByTestId( 'report-params' ).textContent ?? '{}' );
}

describe( 'WidgetRoot report params', () => {
	beforeEach( () => {
		useSearchMock.mockReturnValue( COMPARED_WINDOW );
	} );

	it( 'keeps the comparison from the URL when the surface offers one', () => {
		render(
			<WidgetRoot>
				<ParamsProbe />
			</WidgetRoot>
		);

		expect( resolvedParams() ).toMatchObject( {
			comp: '1',
			compare_from: COMPARED_WINDOW.compare_from,
			compare_to: COMPARED_WINDOW.compare_to,
		} );
	} );

	it( 'drops the comparison from the URL when the surface offers none', () => {
		render(
			<ReportScopeProvider offersComparison={ false }>
				<WidgetRoot>
					<ParamsProbe />
				</WidgetRoot>
			</ReportScopeProvider>
		);

		const params = resolvedParams();

		expect( params ).not.toHaveProperty( 'comp' );
		expect( params ).not.toHaveProperty( 'compare_from' );
		expect( params ).not.toHaveProperty( 'compare_to' );
		expect( params ).not.toHaveProperty( 'compare_preset' );
		expect( params.from ).toBe( COMPARED_WINDOW.from );
	} );

	it( 'drops the comparison a widget carries in its own attributes', () => {
		useSearchMock.mockReturnValue( {} );

		render(
			<ReportScopeProvider offersComparison={ false }>
				<WidgetRoot attributes={ { reportParams: COMPARED_WINDOW } }>
					<ParamsProbe />
				</WidgetRoot>
			</ReportScopeProvider>
		);

		const params = resolvedParams();

		expect( params ).not.toHaveProperty( 'comp' );
		expect( params ).not.toHaveProperty( 'compare_from' );
		expect( params.from ).toBe( COMPARED_WINDOW.from );
	} );
} );
