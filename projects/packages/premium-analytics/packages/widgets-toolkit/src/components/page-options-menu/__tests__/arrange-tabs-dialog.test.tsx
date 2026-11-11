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
import { PageOptionsMenu } from '../page-options-menu';

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
 * @return The `userEvent` session and the close callback.
 */
function renderDialog() {
	const onClose = jest.fn();
	render( <ArrangeTabsDialog scope={ SCOPE } items={ TABS } onClose={ onClose } /> );

	return { user: setupUser(), onClose };
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

describe( 'page-options-menu Arrange tabs entry', () => {
	it( 'opens the dialog for a page with two or more tabs', async () => {
		const user = setupUser();

		render( <PageOptionsMenu tabs={ { scope: SCOPE, items: TABS } } /> );
		await user.click( screen.getByRole( 'button', { name: 'Page options' } ) );
		await user.click( await screen.findByRole( 'menuitem', { name: 'Arrange tabs' } ) );

		await expect(
			screen.findByRole( 'dialog', { name: 'Arrange tabs' } )
		).resolves.toBeInTheDocument();
	} );

	it( 'is absent for a page with a single tab', async () => {
		const user = setupUser();

		render( <PageOptionsMenu tabs={ { scope: SCOPE, items: TABS.slice( 0, 1 ) } } /> );
		await user.click( screen.getByRole( 'button', { name: 'Page options' } ) );

		await expect(
			screen.findByRole( 'menuitem', { name: 'Any feedback?' } )
		).resolves.toBeInTheDocument();
		expect( screen.queryByRole( 'menuitem', { name: 'Arrange tabs' } ) ).not.toBeInTheDocument();
	} );
} );
