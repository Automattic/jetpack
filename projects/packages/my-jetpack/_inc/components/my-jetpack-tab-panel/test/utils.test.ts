/**
 * @jest-environment node
 */
import { currentUserCan, isSimpleSite } from '@automattic/jetpack-script-data';
import {
	MY_JETPACK_SECTION_FEATURES,
	MY_JETPACK_SECTION_HELP,
	MY_JETPACK_SECTION_OVERVIEW,
	MY_JETPACK_SECTION_PRODUCTS,
} from '../constants';
import {
	getDefaultMyJetpackSection,
	getMyJetpackSections,
	isValidMyJetpackSection,
} from '../utils';

jest.mock( '@automattic/jetpack-script-data', () => ( {
	currentUserCan: jest.fn(),
	isSimpleSite: jest.fn(),
} ) );

const mockCurrentUserCan = currentUserCan as jest.Mock;
const mockIsSimpleSite = isSimpleSite as jest.Mock;

beforeEach( () => {
	jest.clearAllMocks();
	mockCurrentUserCan.mockReturnValue( true );
	mockIsSimpleSite.mockReturnValue( false );
} );

const VISIBLE_SECTIONS = [
	MY_JETPACK_SECTION_OVERVIEW,
	MY_JETPACK_SECTION_FEATURES,
	MY_JETPACK_SECTION_HELP,
];

describe( 'getMyJetpackSections', () => {
	it( 'omits Products from the tab bar, keeping Overview, Features and Help', () => {
		expect( getMyJetpackSections().map( tab => tab.name ) ).toEqual( VISIBLE_SECTIONS );
	} );

	it( 'returns the same sections for non-admins', () => {
		mockCurrentUserCan.mockReturnValue( false );

		expect( getMyJetpackSections().map( tab => tab.name ) ).toEqual( VISIBLE_SECTIONS );
	} );

	it( 'returns the same sections on WordPress.com Simple sites', () => {
		mockIsSimpleSite.mockReturnValue( true );

		expect( getMyJetpackSections().map( tab => tab.name ) ).toEqual( VISIBLE_SECTIONS );
	} );
} );

describe( 'isValidMyJetpackSection', () => {
	it( 'accepts the Features section', () => {
		expect( isValidMyJetpackSection( MY_JETPACK_SECTION_FEATURES ) ).toBe( true );
	} );

	it( 'accepts Overview, and Products despite it having no tab', () => {
		expect( isValidMyJetpackSection( MY_JETPACK_SECTION_OVERVIEW ) ).toBe( true );
		// Products keeps working by URL so the two lists can still be compared.
		expect( isValidMyJetpackSection( MY_JETPACK_SECTION_PRODUCTS ) ).toBe( true );
		expect( getMyJetpackSections().some( tab => tab.name === MY_JETPACK_SECTION_PRODUCTS ) ).toBe(
			false
		);
	} );

	it( 'rejects a section that does not exist', () => {
		expect( isValidMyJetpackSection( 'does-not-exist' ) ).toBe( false );
	} );
} );

describe( 'getDefaultMyJetpackSection', () => {
	it( 'defaults to the Overview section', () => {
		expect( getDefaultMyJetpackSection() ).toBe( MY_JETPACK_SECTION_OVERVIEW );
	} );

	it( 'defaults to the Overview section on Simple sites too', () => {
		mockIsSimpleSite.mockReturnValue( true );

		expect( getDefaultMyJetpackSection() ).toBe( MY_JETPACK_SECTION_OVERVIEW );
	} );
} );
