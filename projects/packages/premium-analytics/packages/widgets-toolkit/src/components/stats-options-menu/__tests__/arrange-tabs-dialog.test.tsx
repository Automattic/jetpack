/**
 * External dependencies
 */
import { getScriptData } from '@automattic/jetpack-script-data';
import { getSectionOrder, setSectionOrder } from '@jetpack-premium-analytics/data';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
// Registers the store the order is kept in.
import '@wordpress/preferences';
/**
 * Internal dependencies
 */
import { ArrangeTabsDialog } from '../arrange-tabs-dialog';
import { StatsOptionsMenu } from '../stats-options-menu';

jest.mock(
	'@automattic/jetpack-analytics',
	() => jest.requireActual( '../../../../../../tests/js/analytics-test-utils' ).mockJetpackAnalytics
);
jest.mock(
	'@automattic/jetpack-script-data',
	() =>
		jest.requireActual( '../../../../../../tests/js/script-data-test-utils' ).mockJetpackScriptData
);

const SCOPE = 'jetpack-premium-analytics/test';
const TABS = [
	{ slug: 'traffic', label: 'Traffic' },
	{ slug: 'insights', label: 'Insights' },
	{ slug: 'subscribers', label: 'Subscribers' },
];

const setupUser = () => userEvent.setup( { advanceTimers: jest.advanceTimersByTime } );

const tabOrder = () =>
	screen.getAllByRole( 'listitem' ).map( row => row.firstElementChild?.textContent );

/**
 * Renders the dialog over the three tabs.
 *
 * @param onPreview - Receives the orders the reader tries.
 * @return The `userEvent` session, the close callback and the way to take the dialog down.
 */
function renderDialog( onPreview?: ( order?: string[] ) => void ) {
	const onClose = jest.fn();
	const { unmount } = render(
		<ArrangeTabsDialog scope={ SCOPE } items={ TABS } onPreview={ onPreview } onClose={ onClose } />
	);

	return { user: setupUser(), onClose, unmount };
}

beforeEach( () => {
	jest.useFakeTimers();
	jest.clearAllMocks();
	jest.mocked( getScriptData ).mockReturnValue( {} as ReturnType< typeof getScriptData > );
} );

afterEach( () => {
	jest.useRealTimers();
	setSectionOrder( SCOPE );
} );

describe( 'ArrangeTabsDialog', () => {
	it( 'stores the order the reader arranged once they save it', async () => {
		const { user, onClose } = renderDialog();

		await user.click( screen.getByRole( 'button', { name: 'Move Insights up' } ) );

		expect( tabOrder() ).toEqual( [ 'Insights', 'Traffic', 'Subscribers' ] );
		expect(
			within( screen.getAllByRole( 'listitem' )[ 0 ] ).getByText( 'Opens first' )
		).toBeInTheDocument();
		expect( getSectionOrder( SCOPE ) ).toEqual( [] );

		await user.click( screen.getByRole( 'button', { name: 'Save' } ) );

		expect( getSectionOrder( SCOPE ) ).toEqual( [ 'insights', 'traffic', 'subscribers' ] );
		expect( onClose ).toHaveBeenCalled();
	} );

	it( 'shows the page each order the reader tries, and takes it back on the way out', async () => {
		const onPreview = jest.fn();
		const { user, unmount } = renderDialog( onPreview );

		await user.click( screen.getByRole( 'button', { name: 'Move Insights up' } ) );

		expect( onPreview ).toHaveBeenLastCalledWith( [ 'insights', 'traffic', 'subscribers' ] );
		expect( getSectionOrder( SCOPE ) ).toEqual( [] );

		unmount();

		expect( onPreview ).toHaveBeenLastCalledWith();
	} );

	it( 'slides each row from where it sat', async () => {
		// jsdom has no Web Animations and lays nothing out: rows sit 40px apart, in document order.
		const animate = jest.fn();
		Object.assign( Element.prototype, { animate, getAnimations: () => [] } );
		const rects = jest
			.spyOn( Element.prototype, 'getBoundingClientRect' )
			.mockImplementation( function ( this: Element ) {
				const top = 40 * screen.queryAllByRole( 'listitem' ).indexOf( this as HTMLElement );

				return { top, bottom: top + 40, left: 0, right: 300, width: 300, height: 40 } as DOMRect;
			} );

		try {
			const { user } = renderDialog();

			await user.click( screen.getByRole( 'button', { name: 'Move Insights up' } ) );

			const slides = animate.mock.calls
				.map( ( [ keyframes ], call ) => [
					( animate.mock.contexts[ call ] as Element ).firstElementChild?.textContent,
					keyframes[ 0 ].transform,
				] )
				.filter( ( [ , transform ] ) => transform );
			expect( slides ).toEqual( [
				[ 'Insights', 'translateY(40px)' ],
				[ 'Traffic', 'translateY(-40px)' ],
			] );
		} finally {
			rects.mockRestore();
			delete ( Element.prototype as Partial< Element > ).animate;
			delete ( Element.prototype as Partial< Element > ).getAnimations;
		}
	} );

	it( 'does not move the first tab up or the last one down', async () => {
		const { user } = renderDialog();

		await user.click( screen.getByRole( 'button', { name: 'Move Traffic up' } ) );
		await user.click( screen.getByRole( 'button', { name: 'Move Subscribers down' } ) );

		expect( tabOrder() ).toEqual( [ 'Traffic', 'Insights', 'Subscribers' ] );
	} );

	it( 'leaves the order alone when the reader cancels', async () => {
		const { user, onClose } = renderDialog();

		await user.click( screen.getByRole( 'button', { name: 'Move Insights up' } ) );
		await user.click( screen.getByRole( 'button', { name: 'Cancel' } ) );

		expect( getSectionOrder( SCOPE ) ).toEqual( [] );
		expect( onClose ).toHaveBeenCalled();
	} );

	it( 'stores no order when the reader saves without moving a tab', async () => {
		const { user } = renderDialog();

		await user.click( screen.getByRole( 'button', { name: 'Save' } ) );

		expect( getSectionOrder( SCOPE ) ).toEqual( [] );
	} );

	it( "resets an order of the reader's own, and offers to only then", async () => {
		const { unmount } = render(
			<ArrangeTabsDialog scope={ SCOPE } items={ TABS } onClose={ jest.fn() } />
		);
		expect( screen.queryByRole( 'button', { name: 'Reset order' } ) ).not.toBeInTheDocument();
		unmount();

		setSectionOrder( SCOPE, [ 'insights' ] );
		const { user } = renderDialog();
		await user.click( screen.getByRole( 'button', { name: 'Reset order' } ) );

		expect( getSectionOrder( SCOPE ) ).toEqual( [] );
	} );
} );

describe( 'stats-options-menu Arrange tabs entry', () => {
	it( 'opens the dialog for a page with two or more tabs', async () => {
		const user = setupUser();

		render( <StatsOptionsMenu tabs={ { scope: SCOPE, items: TABS } } /> );
		await user.click( screen.getByRole( 'button', { name: 'Stats options' } ) );
		await user.click( await screen.findByRole( 'menuitem', { name: 'Arrange tabs' } ) );

		await expect(
			screen.findByRole( 'dialog', { name: 'Arrange tabs' } )
		).resolves.toBeInTheDocument();
	} );

	it( 'is disabled for a page with a single tab', async () => {
		const user = setupUser();

		render( <StatsOptionsMenu tabs={ { scope: SCOPE, items: TABS.slice( 0, 1 ) } } /> );
		await user.click( screen.getByRole( 'button', { name: 'Stats options' } ) );

		await expect(
			screen.findByRole( 'menuitem', { name: 'Arrange tabs' } )
		).resolves.toHaveAttribute( 'aria-disabled', 'true' );
	} );
} );
