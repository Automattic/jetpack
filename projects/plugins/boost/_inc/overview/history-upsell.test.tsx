/* eslint-disable testing-library/prefer-user-event */
import { fireEvent, render, screen } from '@testing-library/react';
import HistoryUpsell, { previewExpandedKey } from './history-upsell';
import { getHistoryWindow } from './lib/history-days';
import { buildSampleHistory } from './lib/sample-history';

jest.mock( './upgrade-cta', () => ( {
	__esModule: true,
	default: () => <span data-testid="upgrade-cta" />,
} ) );

const range = getHistoryWindow( 0 );
const showPreview = { name: 'Show score history preview' };
const hidePreview = { name: 'Hide score history preview' };

beforeAll( () => {
	jest.spyOn( Element.prototype, 'getBoundingClientRect' ).mockReturnValue( {
		x: 0,
		y: 0,
		top: 0,
		left: 0,
		right: 800,
		bottom: 300,
		width: 800,
		height: 300,
		toJSON: () => ( {} ),
	} );
	globalThis.ResizeObserver = class {
		constructor( private callback: ResizeObserverCallback ) {}
		observe( target: Element ) {
			this.callback(
				[ { target, contentRect: target.getBoundingClientRect() } as ResizeObserverEntry ],
				this
			);
		}
		unobserve() {}
		disconnect() {}
	};
} );
beforeEach( () => window.sessionStorage.clear() );
afterAll( () => jest.restoreAllMocks() );

test( 'shows a collapsed one-line notice with the upgrade slot and no chart', () => {
	render( <HistoryUpsell range={ range } dayCount={ 30 } /> );
	expect(
		screen.getByText( 'Learn more about your site performance over time.', { exact: false } )
	).toBeInTheDocument();
	expect( screen.getByTestId( 'upgrade-cta' ) ).toBeInTheDocument();
	expect( screen.getByRole( 'button', showPreview ) ).toHaveAttribute( 'aria-expanded', 'false' );
	expect( screen.queryByRole( 'img', { name: /sample data/ } ) ).not.toBeInTheDocument();
	expect( screen.queryByRole( 'grid' ) ).not.toBeInTheDocument();
} );

test( 'expands a non-interactive sample chart and remembers it for the session', () => {
	const { unmount } = render( <HistoryUpsell range={ range } dayCount={ 30 } /> );
	fireEvent.click( screen.getByRole( 'button', showPreview ) );
	expect( screen.getByRole( 'button', hidePreview ) ).toHaveAttribute( 'aria-expanded', 'true' );
	const preview = screen.getByRole( 'img', { name: 'Score history chart with sample data' } );
	expect( preview ).toBeVisible();
	// eslint-disable-next-line testing-library/no-node-access -- The inert wrapper has no role.
	expect( preview.firstElementChild ).toHaveAttribute( 'inert' );
	expect( screen.getByRole( 'heading', { name: 'Last 30 days' } ) ).toBeInTheDocument();
	for ( const name of [ 'Previous 30 days', 'Next 30 days' ] ) {
		expect( screen.getByRole( 'button', { name } ) ).toHaveAttribute( 'aria-disabled', 'true' );
	}
	expect( window.sessionStorage.getItem( previewExpandedKey ) ).toBe( '1' );

	unmount();
	render( <HistoryUpsell range={ range } dayCount={ 30 } /> );
	fireEvent.click( screen.getByRole( 'button', hidePreview ) );
	expect( screen.getByRole( 'button', showPreview ) ).toHaveAttribute( 'aria-expanded', 'false' );
	expect( window.sessionStorage.getItem( previewExpandedKey ) ).toBe( '0' );
} );

test.each( [ 15, 30 ] )( 'builds a recorded sample day for each of %d days', dayCount => {
	const window = getHistoryWindow( 0, new Date(), dayCount );
	const { periods } = buildSampleHistory( window );
	expect( periods ).toHaveLength( dayCount );
	expect( periods[ 0 ].timestamp ).toBeGreaterThanOrEqual( window.startDate );
	expect( periods[ dayCount - 1 ].timestamp ).toBeLessThanOrEqual( window.endDate );
} );
