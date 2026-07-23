import '@testing-library/jest-dom';
import { currentUserCan, isSimpleSite } from '@automattic/jetpack-script-data';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
	MY_JETPACK_SECTION_HELP,
	MY_JETPACK_SECTION_OVERVIEW,
	MY_JETPACK_SECTION_PRODUCTS,
} from '../constants';
import { MyJetpackTabPanel } from '../index';

// `getMyJetpackSections()` derives the tab set from these two flags, so driving
// them exercises the real section/validation/default logic rather than a stub.
jest.mock( '@automattic/jetpack-script-data', () => ( {
	currentUserCan: jest.fn(),
	isSimpleSite: jest.fn(),
} ) );

// The router boundary is the only thing mocked out of the panel itself: the
// `onTabSelect` gate and the keyed-remount effect run for real against it.
const mockNavigate = jest.fn();
let mockSection: string | undefined;
jest.mock( 'react-router', () => ( {
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

// The real `TabContent` pulls in the full products/overview/help trees; a stub
// that echoes its section name is enough to assert which section rendered.
jest.mock( '../tab-content', () => ( {
	TabContent: ( { name }: { name: string } ) => {
		const react = jest.requireActual( 'react' );
		return react.createElement( 'div', { 'data-testid': 'tab-content' }, name );
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
} );

describe( 'MyJetpackTabPanel', () => {
	it( 'renders the single Products section directly, with no tab bar, on Simple sites', () => {
		mockIsSimpleSite.mockReturnValue( true );
		mockSection = MY_JETPACK_SECTION_PRODUCTS;

		render( <MyJetpackTabPanel /> );

		expect( screen.getByTestId( 'tab-content' ) ).toHaveTextContent( MY_JETPACK_SECTION_PRODUCTS );
		// The direct-render path renders no TabPanel, so there is no tab bar.
		expect( screen.queryByRole( 'tablist' ) ).not.toBeInTheDocument();
		// The canonical Products hash needs no rewrite.
		expect( mockNavigate ).not.toHaveBeenCalled();
		// No synthetic click; the view fires exactly once, attributed to Products.
		expect( callsFor( 'jetpack_myjetpack_tab_click' ) ).toHaveLength( 0 );
		expect( callsFor( 'jetpack_myjetpack_tab_view' ) ).toHaveLength( 1 );
		expect( mockRecordEvent ).toHaveBeenCalledWith(
			'jetpack_myjetpack_tab_view',
			expect.objectContaining( { tab_name: MY_JETPACK_SECTION_PRODUCTS } )
		);
	} );

	it( 'does not record a tab click when the multi-section panel mounts', async () => {
		mockSection = MY_JETPACK_SECTION_OVERVIEW;

		render( <MyJetpackTabPanel /> );
		// Awaiting the query lets TabPanel's async post-mount selection settle in act().
		await expect( screen.findByRole( 'tablist' ) ).resolves.toBeInTheDocument();

		expect( screen.getAllByRole( 'tab' ) ).toHaveLength( 3 );
		// Mount and the keyed remount both settle on the current tab: no phantom click.
		expect( callsFor( 'jetpack_myjetpack_tab_click' ) ).toHaveLength( 0 );
		expect( mockNavigate ).not.toHaveBeenCalled();
		expect( callsFor( 'jetpack_myjetpack_tab_view' ) ).toHaveLength( 1 );
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

		render( <MyJetpackTabPanel /> );
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
} );
