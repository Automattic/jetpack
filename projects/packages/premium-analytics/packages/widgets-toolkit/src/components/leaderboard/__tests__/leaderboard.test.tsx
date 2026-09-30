/**
 * External dependencies
 */
import { GlobalChartsProvider } from '@jetpack-premium-analytics/externals';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
/**
 * Internal dependencies
 */
import { useWidgetRootContext } from '../../widget-root';
import { Leaderboard, type LeaderboardStatus } from '../leaderboard';
import type { AnchorHTMLAttributes, ReactNode } from 'react';

type MockRouteLinkProps = {
	to: string;
	params?: Record< string, unknown >;
	search?: Record< string, unknown >;
	children: ReactNode;
} & Omit< AnchorHTMLAttributes< HTMLAnchorElement >, 'href' >;

// `forwardRef`, because the design system link that renders this forwards a ref.
jest.mock( '@wordpress/route', () => {
	const { forwardRef } = jest.requireActual( 'react' ) as typeof import( 'react' );

	return {
		Link: forwardRef< HTMLAnchorElement, MockRouteLinkProps >(
			( { to, params, search, children, ...props }, ref ) => {
				const path = Object.entries( params ?? {} ).reduce(
					( result, [ key, value ] ) => result.replace( `$${ key }`, String( value ) ),
					to
				);
				const query = new URLSearchParams();
				Object.entries( search ?? {} ).forEach( ( [ key, value ] ) => {
					if ( value !== undefined && value !== null ) {
						query.set( key, String( value ) );
					}
				} );
				const queryString = query.toString();

				return (
					<a ref={ ref } href={ queryString ? `${ path }?${ queryString }` : path } { ...props }>
						{ children }
					</a>
				);
			}
		),
	};
} );

jest.mock( '../../widget-root', () => ( {
	useWidgetRootContext: jest.fn(),
} ) );

const mockUseWidgetRootContext = jest.mocked( useWidgetRootContext );

const REPORT_PARAMS = {
	from: '2026-06-01',
	to: '2026-06-16',
	interval: 'day' as const,
	date_type: 'created' as const,
};

const READY: LeaderboardStatus = { isLoading: false, isError: false };

const ROWS = [
	{ id: '1', label: 'Getting Started', value: 3820, previousValue: 3000 },
	{ id: '2', label: 'Product Launch', value: 2640, previousValue: 2700 },
];

const renderLeaderboard = ( ui: ReactNode ) =>
	render( <GlobalChartsProvider>{ ui }</GlobalChartsProvider> );

describe( 'Leaderboard', () => {
	beforeEach( () => {
		mockUseWidgetRootContext.mockReturnValue( {
			reportParams: REPORT_PARAMS,
		} as unknown as ReturnType< typeof useWidgetRootContext > );
	} );

	it( 'renders the rows with their values', () => {
		renderLeaderboard( <Leaderboard rows={ ROWS } status={ READY } /> );

		expect( screen.getByText( 'Getting Started' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Product Launch' ) ).toBeInTheDocument();
		expect( screen.getByText( '3.8K' ) ).toBeInTheDocument();
	} );

	it( 'links a video row to the detail route with the dashboard window', () => {
		renderLeaderboard(
			<Leaderboard
				rows={ [
					{ id: '1', label: 'Walkthrough', value: 10, action: { kind: 'videoLink', id: 101 } },
				] }
				status={ READY }
			/>
		);

		expect( screen.getByRole( 'link', { name: 'Walkthrough' } ) ).toHaveAttribute(
			'href',
			'/video/101?from=2026-06-01&to=2026-06-16&interval=day&date_type=created'
		);
	} );

	it( 'shows the skeleton instead of the rows while loading', () => {
		renderLeaderboard( <Leaderboard rows={ ROWS } status={ { isLoading: true } } /> );

		expect( screen.queryByText( 'Getting Started' ) ).not.toBeInTheDocument();
	} );

	it( 'offers a retry bound to refetch on error', async () => {
		const refetch = jest.fn();
		renderLeaderboard(
			<Leaderboard
				rows={ [] }
				status={ { isLoading: false, isError: true, refetch } }
				error={ { description: 'Could not load videos.' } }
			/>
		);

		expect( screen.getByRole( 'alert' ) ).toHaveTextContent( 'Could not load videos.' );
		await userEvent.click( screen.getByRole( 'button', { name: 'Retry' } ) );
		expect( refetch ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'keeps the error actions a widget declares', () => {
		const refetch = jest.fn();
		renderLeaderboard(
			<Leaderboard
				rows={ [] }
				status={ { isLoading: false, isError: true, refetch } }
				error={ { description: 'No access.', actions: [] } }
			/>
		);

		expect( screen.queryByRole( 'button', { name: 'Retry' } ) ).not.toBeInTheDocument();
	} );

	it( 'shows the generic empty state without rows', () => {
		renderLeaderboard( <Leaderboard rows={ [] } status={ READY } /> );

		expect(
			screen.getByText( 'We couldn’t find results for this time period.' )
		).toBeInTheDocument();
	} );

	it( 'renders the footer in every state', () => {
		renderLeaderboard(
			<Leaderboard
				rows={ [] }
				status={ { isLoading: true } }
				footer={ <a href="/all">View all</a> }
			/>
		);

		expect( screen.getByRole( 'link', { name: 'View all' } ) ).toBeInTheDocument();
	} );
} );
