/**
 * @jest-environment node
 */
import { currentUserCan, isSimpleSite } from '@automattic/jetpack-script-data';
import { getMyJetpackWindowInitialState } from '../../../data/utils/get-my-jetpack-window-state';
import {
	MY_JETPACK_SECTION_CUSTOMIZE,
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
jest.mock( '../../../data/utils/get-my-jetpack-window-state' );

const mockCurrentUserCan = currentUserCan as jest.Mock;
const mockIsSimpleSite = isSimpleSite as jest.Mock;
const mockGetMyJetpackWindowInitialState = getMyJetpackWindowInitialState as jest.Mock;

beforeEach( () => {
	jest.clearAllMocks();
	mockCurrentUserCan.mockReturnValue( true );
	mockIsSimpleSite.mockReturnValue( false );
	mockGetMyJetpackWindowInitialState.mockReturnValue( { featureEnabled: false } );
} );

describe( 'getMyJetpackSections', () => {
	it( 'returns all available sections for an admin', () => {
		expect( getMyJetpackSections().map( tab => tab.name ) ).toEqual( [
			MY_JETPACK_SECTION_OVERVIEW,
			MY_JETPACK_SECTION_PRODUCTS,
			MY_JETPACK_SECTION_HELP,
		] );
	} );

	it( 'includes Customize when admin menu customization is available', () => {
		mockGetMyJetpackWindowInitialState.mockReturnValue( { featureEnabled: true } );

		expect( getMyJetpackSections().map( tab => tab.name ) ).toEqual( [
			MY_JETPACK_SECTION_OVERVIEW,
			MY_JETPACK_SECTION_PRODUCTS,
			MY_JETPACK_SECTION_CUSTOMIZE,
			MY_JETPACK_SECTION_HELP,
		] );
		expect( isValidMyJetpackSection( MY_JETPACK_SECTION_CUSTOMIZE ) ).toBe( true );
	} );

	it( 'omits Customize when admin menu customization is unavailable', () => {
		expect( isValidMyJetpackSection( MY_JETPACK_SECTION_CUSTOMIZE ) ).toBe( false );
	} );

	it( 'keeps Customize available for non-admin users while hiding Products', () => {
		mockCurrentUserCan.mockReturnValue( false );
		mockGetMyJetpackWindowInitialState.mockReturnValue( { featureEnabled: true } );

		expect( getMyJetpackSections().map( tab => tab.name ) ).toEqual( [
			MY_JETPACK_SECTION_OVERVIEW,
			MY_JETPACK_SECTION_CUSTOMIZE,
			MY_JETPACK_SECTION_HELP,
		] );
	} );

	it( 'returns only the Products section on WordPress.com Simple sites', () => {
		mockIsSimpleSite.mockReturnValue( true );
		mockGetMyJetpackWindowInitialState.mockReturnValue( { featureEnabled: true } );

		expect( getMyJetpackSections().map( tab => tab.name ) ).toEqual( [
			MY_JETPACK_SECTION_PRODUCTS,
		] );
	} );

	it( 'returns only the Products section on Simple sites for non-admins too', () => {
		mockIsSimpleSite.mockReturnValue( true );
		mockCurrentUserCan.mockReturnValue( false );

		expect( getMyJetpackSections().map( tab => tab.name ) ).toEqual( [
			MY_JETPACK_SECTION_PRODUCTS,
		] );
	} );
} );

describe( 'isValidMyJetpackSection', () => {
	it( 'accepts the Overview section on regular sites', () => {
		expect( isValidMyJetpackSection( MY_JETPACK_SECTION_OVERVIEW ) ).toBe( true );
	} );

	it( 'rejects the Overview and Help sections on Simple sites', () => {
		mockIsSimpleSite.mockReturnValue( true );

		expect( isValidMyJetpackSection( MY_JETPACK_SECTION_OVERVIEW ) ).toBe( false );
		expect( isValidMyJetpackSection( MY_JETPACK_SECTION_HELP ) ).toBe( false );
		expect( isValidMyJetpackSection( MY_JETPACK_SECTION_PRODUCTS ) ).toBe( true );
	} );
} );

describe( 'getDefaultMyJetpackSection', () => {
	it( 'defaults to the Overview section on regular sites', () => {
		expect( getDefaultMyJetpackSection() ).toBe( MY_JETPACK_SECTION_OVERVIEW );
	} );

	it( 'defaults to the Products section on Simple sites', () => {
		mockIsSimpleSite.mockReturnValue( true );

		expect( getDefaultMyJetpackSection() ).toBe( MY_JETPACK_SECTION_PRODUCTS );
	} );
} );
