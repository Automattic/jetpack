/**
 * @jest-environment node
 */
import { currentUserCan, isSimpleSite } from '@automattic/jetpack-script-data';
import {
	MY_JETPACK_SECTION_FEATURES,
	MY_JETPACK_SECTION_HELP,
	MY_JETPACK_SECTION_LEGACY_PRODUCTS,
	MY_JETPACK_SECTION_OVERVIEW,
} from '../constants';
import { getMyJetpackSections, resolveMyJetpackSection } from '../utils';

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

describe( 'getMyJetpackSections', () => {
	it( 'returns all sections for an admin', () => {
		expect( getMyJetpackSections() ).toEqual( [
			expect.objectContaining( { name: MY_JETPACK_SECTION_OVERVIEW } ),
			{ name: MY_JETPACK_SECTION_FEATURES, title: 'Features' },
			expect.objectContaining( { name: MY_JETPACK_SECTION_HELP } ),
		] );
	} );

	it( 'omits the Features section for non-admins', () => {
		mockCurrentUserCan.mockReturnValue( false );

		expect( getMyJetpackSections().map( tab => tab.name ) ).toEqual( [
			MY_JETPACK_SECTION_OVERVIEW,
			MY_JETPACK_SECTION_HELP,
		] );
	} );

	it( 'returns only the Features section on WordPress.com Simple sites', () => {
		mockIsSimpleSite.mockReturnValue( true );

		expect( getMyJetpackSections().map( tab => tab.name ) ).toEqual( [
			MY_JETPACK_SECTION_FEATURES,
		] );
	} );

	it( 'returns only the Features section on Simple sites for non-admins too', () => {
		mockIsSimpleSite.mockReturnValue( true );
		mockCurrentUserCan.mockReturnValue( false );

		expect( getMyJetpackSections().map( tab => tab.name ) ).toEqual( [
			MY_JETPACK_SECTION_FEATURES,
		] );
	} );
} );

describe( 'resolveMyJetpackSection', () => {
	it( 'keeps a valid section and defaults to Overview on regular sites', () => {
		expect( resolveMyJetpackSection( MY_JETPACK_SECTION_HELP ) ).toBe( MY_JETPACK_SECTION_HELP );
		expect( resolveMyJetpackSection( undefined ) ).toBe( MY_JETPACK_SECTION_OVERVIEW );
	} );

	it( 'resolves the Overview and Help sections to Features on Simple sites', () => {
		mockIsSimpleSite.mockReturnValue( true );

		expect( resolveMyJetpackSection( MY_JETPACK_SECTION_OVERVIEW ) ).toBe(
			MY_JETPACK_SECTION_FEATURES
		);
		expect( resolveMyJetpackSection( MY_JETPACK_SECTION_HELP ) ).toBe(
			MY_JETPACK_SECTION_FEATURES
		);
		expect( resolveMyJetpackSection( undefined ) ).toBe( MY_JETPACK_SECTION_FEATURES );
	} );

	it( 'resolves the retired Products section to Features', () => {
		expect( resolveMyJetpackSection( MY_JETPACK_SECTION_LEGACY_PRODUCTS ) ).toBe(
			MY_JETPACK_SECTION_FEATURES
		);
	} );

	it( 'falls back to the default section for non-admins and unknown sections', () => {
		expect( resolveMyJetpackSection( 'does-not-exist' ) ).toBe( MY_JETPACK_SECTION_OVERVIEW );

		mockCurrentUserCan.mockReturnValue( false );
		expect( resolveMyJetpackSection( MY_JETPACK_SECTION_FEATURES ) ).toBe(
			MY_JETPACK_SECTION_OVERVIEW
		);
		expect( resolveMyJetpackSection( MY_JETPACK_SECTION_LEGACY_PRODUCTS ) ).toBe(
			MY_JETPACK_SECTION_OVERVIEW
		);
	} );
} );
