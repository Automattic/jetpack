import '@testing-library/jest-dom';
import { currentUserCan, isSimpleSite } from '@automattic/jetpack-script-data';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
	MY_JETPACK_SECTION_FEATURES,
	MY_JETPACK_SECTION_HELP,
	MY_JETPACK_SECTION_LEGACY_PRODUCTS,
	MY_JETPACK_SECTION_OVERVIEW,
} from '../constants';
import { MyJetpackTabPanel } from '../index';

// `getMyJetpackSections()` derives the tab set from these two flags, so driving
// them exercises the real section/validation/default logic rather than a stub.
jest.mock( '@automattic/jetpack-script-data', () => ( {
	currentUserCan: jest.fn(),
	isSimpleSite: jest.fn(),
} ) );

// The router boundary is the only thing mocked out of the panel itself: the
// `onTabSelect` gate runs for real against it.
const mockNavigate = jest.fn();
let mockSection: string | undefined;
let mockSearch = '';
jest.mock( 'react-router', () => ( {
	useLocation: () => ( { search: mockSearch } ),
	useNavigate: () => mockNavigate,
	useParams: () => ( { section: mockSection } ),
} ) );

const mockRecordEvent = jest.fn();
jest.mock( '../../../hooks/use-analytics', () => ( {
	__esModule: true,
	default: () => ( { recordEvent: mockRecordEvent } ),
} ) );

jest.mock( '../../../hooks/use-is-jetpack-user-new', () => ( {
	__esModule: true,
	default: () => false,
} ) );

// The real `TabContent` pulls in the full features/overview/help trees; a stub
// that echoes its notices and section name is enough to assert what rendered.
jest.mock( '../tab-content', () => ( {
	TabContent: ( { name, beforeContent }: { name: string; beforeContent?: unknown } ) => {
		const react = jest.requireActual( 'react' );
		return react.createElement( 'div', { 'data-testid': 'tab-content' }, beforeContent, name );
	},
} ) );

const mockIsSimpleSite = isSimpleSite as jest.Mock;
const mockCurrentUserCan = currentUserCan as jest.Mock;

const callsFor = ( event: string ) =>
	mockRecordEvent.mock.calls.filter( ( [ name ] ) => name === event );

beforeEach( () => {
	jest.clearAllMocks();
	mockCurrentUserCan.mockReturnValue( true );
	mockIsSimpleSite.mockReturnValue( false );
	mockSection = undefined;
	mockSearch = '';
	setPinnedTabs( false );
} );

const setPinnedTabs = ( on: boolean ) => {
	window.myJetpackInitialState = {
		myJetpackFlags: { headerControls: on },
	} as unknown as Window[ 'myJetpackInitialState' ];
};

describe( 'MyJetpackTabPanel', () => {
	it( 'renders the single Features section directly, with no tab bar, on Simple sites', () => {
		mockIsSimpleSite.mockReturnValue( true );
		mockSection = MY_JETPACK_SECTION_FEATURES;

		render( <MyJetpackTabPanel /> );

		expect( screen.getByTestId( 'tab-content' ) ).toHaveTextContent( MY_JETPACK_SECTION_FEATURES );
		expect( screen.queryByRole( 'tablist' ) ).not.toBeInTheDocument();
		// The canonical Features hash needs no rewrite.
		expect( mockNavigate ).not.toHaveBeenCalled();
		// No synthetic click; the view fires exactly once, attributed to Features.
		expect( callsFor( 'jetpack_myjetpack_tab_click' ) ).toHaveLength( 0 );
		expect( callsFor( 'jetpack_myjetpack_tab_view' ) ).toHaveLength( 1 );
		expect( mockRecordEvent ).toHaveBeenCalledWith(
			'jetpack_myjetpack_tab_view',
			expect.objectContaining( { tab_name: MY_JETPACK_SECTION_FEATURES } )
		);
	} );

	it( 'does not record a tab click when the multi-section panel mounts', async () => {
		mockSection = MY_JETPACK_SECTION_OVERVIEW;

		render( <MyJetpackTabPanel /> );
		await expect( screen.findByRole( 'tablist' ) ).resolves.toBeInTheDocument();

		expect( screen.getAllByRole( 'tab' ) ).toHaveLength( 3 );
		// Mounting on the current tab records no click.
		expect( callsFor( 'jetpack_myjetpack_tab_click' ) ).toHaveLength( 0 );
		expect( mockNavigate ).not.toHaveBeenCalled();
		expect( callsFor( 'jetpack_myjetpack_tab_view' ) ).toHaveLength( 1 );
	} );

	it.each( [
		[ 'the single-section view', true ],
		[ 'the tabbed view', false ],
	] )( 'hands the notices to the section in %s', async ( _, isSimple ) => {
		mockIsSimpleSite.mockReturnValue( isSimple );
		mockSection = MY_JETPACK_SECTION_FEATURES;

		render( <MyJetpackTabPanel beforeContent={ <div>Notice</div> } /> );

		const notice = await screen.findByText( 'Notice' );
		expect( screen.getByTestId( 'tab-content' ) ).toContainElement( notice );
	} );

	it( 'canonicalizes a stale or invalid hash without recording a tab click', async () => {
		// Resolves to the default (Overview) for rendering rather than erroring.
		mockSection = 'does-not-exist';

		render( <MyJetpackTabPanel /> );
		await expect( screen.findByRole( 'tab', { selected: true } ) ).resolves.toHaveTextContent(
			'Overview'
		);

		// The URL is rewritten to the resolved section via `replace`: no synthetic
		// tab_click and no extra history entry (the interstitials' `/:section`
		// redirect depends on this settling on a concrete hash).
		expect( callsFor( 'jetpack_myjetpack_tab_click' ) ).toHaveLength( 0 );
		expect( mockNavigate ).toHaveBeenCalledWith( `/${ MY_JETPACK_SECTION_OVERVIEW }`, {
			replace: true,
		} );
	} );

	it( 'records one tab click, with the resolved previous tab, on a genuine switch', async () => {
		mockSection = MY_JETPACK_SECTION_OVERVIEW;

		const { rerender } = render( <MyJetpackTabPanel /> );
		// Like the router, navigating re-renders the panel on the new section before the click lands.
		mockNavigate.mockImplementationOnce( ( path: string ) => {
			mockSection = path.slice( 1 );
			rerender( <MyJetpackTabPanel /> );
		} );
		await userEvent.click( screen.getByRole( 'tab', { name: 'Help' } ) );

		expect( callsFor( 'jetpack_myjetpack_tab_click' ) ).toHaveLength( 1 );
		expect( mockRecordEvent ).toHaveBeenCalledWith(
			'jetpack_myjetpack_tab_click',
			expect.objectContaining( {
				tab_name: MY_JETPACK_SECTION_HELP,
				previous_tab: MY_JETPACK_SECTION_OVERVIEW,
			} )
		);
		expect( mockNavigate ).toHaveBeenCalledWith( `/${ MY_JETPACK_SECTION_HELP }` );
	} );

	it( 'switches tabs with the arrow keys', async () => {
		mockSection = MY_JETPACK_SECTION_OVERVIEW;

		render( <MyJetpackTabPanel /> );
		await userEvent.click( screen.getByRole( 'tab', { name: 'Overview' } ) );
		await userEvent.keyboard( '{ArrowRight}' );

		expect( mockNavigate ).toHaveBeenCalledWith( `/${ MY_JETPACK_SECTION_FEATURES }` );
	} );

	it( 'redirects the retired Products hash to Features, keeping its query', async () => {
		mockSection = MY_JETPACK_SECTION_LEGACY_PRODUCTS;
		mockSearch = '?filter=security';

		render( <MyJetpackTabPanel /> );
		await expect( screen.findByRole( 'tab', { selected: true } ) ).resolves.toHaveTextContent(
			'Features'
		);

		expect( mockNavigate ).toHaveBeenCalledWith(
			`/${ MY_JETPACK_SECTION_FEATURES }?filter=security`,
			{ replace: true }
		);
		expect( callsFor( 'jetpack_myjetpack_tab_click' ) ).toHaveLength( 0 );
	} );

	it( 'with the flag on, pins the shared tab strip and leaves out the panel separator', () => {
		setPinnedTabs( true );
		mockSection = MY_JETPACK_SECTION_OVERVIEW;

		render( <MyJetpackTabPanel /> );

		// eslint-disable-next-line testing-library/no-node-access -- The strip wrapper has no role to query by.
		expect( screen.getByRole( 'tablist' ).parentElement ).toHaveClass( 'jp-admin-page-tabs' );
		const content = within( screen.getByRole( 'tabpanel' ) ).getByTestId( 'tab-content' );
		// eslint-disable-next-line testing-library/no-node-access -- The separator has no role to query by.
		expect( content.previousElementSibling ).toBeNull();
	} );

	it( 'with the flag off, keeps the tab list unpinned and the panel separator', () => {
		mockSection = MY_JETPACK_SECTION_OVERVIEW;

		render( <MyJetpackTabPanel /> );

		// eslint-disable-next-line testing-library/no-node-access -- The strip wrapper has no role to query by.
		expect( screen.getByRole( 'tablist' ).parentElement ).not.toHaveClass( 'jp-admin-page-tabs' );
		const content = within( screen.getByRole( 'tabpanel' ) ).getByTestId( 'tab-content' );
		// eslint-disable-next-line testing-library/no-node-access -- The separator has no role to query by.
		expect( content.previousElementSibling ).not.toBeNull();
	} );

	it.each( [
		[ 'pinned', true, 0 ],
		[ 'unpinned', false, 400 ],
	] )(
		'with %s tabs, a tab switch leaves the page scrolled to %d',
		async ( _label, on, scrollTop ) => {
			setPinnedTabs( on );
			mockSection = MY_JETPACK_SECTION_OVERVIEW;
			const scroller = document.body.appendChild( document.createElement( 'div' ) );
			scroller.className = 'jp-admin-page__content';

			const { rerender } = render( <MyJetpackTabPanel />, { container: scroller } );
			mockNavigate.mockImplementationOnce( ( path: string ) => {
				mockSection = path.slice( 1 );
				rerender( <MyJetpackTabPanel /> );
			} );
			scroller.scrollTop = 400;
			await userEvent.click( screen.getByRole( 'tab', { name: 'Help' } ) );

			expect( scroller.scrollTop ).toBe( scrollTop );
		}
	);
} );
