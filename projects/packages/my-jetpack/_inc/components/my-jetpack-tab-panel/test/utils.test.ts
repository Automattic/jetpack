/**
 * @jest-environment node
 */
import { currentUserCan, getScriptData, isSimpleSite } from '@automattic/jetpack-script-data';
import {
	MY_JETPACK_SECTION_FEATURES,
	MY_JETPACK_SECTION_HELP,
	MY_JETPACK_SECTION_OVERVIEW,
	MY_JETPACK_SECTION_PRODUCTS,
} from '../constants';
import { getMyJetpackSections, getProductsSectionPath, resolveMyJetpackSection } from '../utils';

jest.mock( '@automattic/jetpack-script-data', () => ( {
	currentUserCan: jest.fn(),
	getScriptData: jest.fn(),
	isSimpleSite: jest.fn(),
} ) );

const mockCurrentUserCan = currentUserCan as jest.Mock;
const mockIsSimpleSite = isSimpleSite as jest.Mock;

const setFeaturesTab = ( featuresTab: boolean ) => {
	( getScriptData as jest.Mock ).mockReturnValue(
		featuresTab ? { myJetpack: { productsSection: { slug: 'features', label: 'Features' } } } : {}
	);
};

beforeEach( () => {
	jest.clearAllMocks();
	mockCurrentUserCan.mockReturnValue( true );
	mockIsSimpleSite.mockReturnValue( false );
	setFeaturesTab( false );
} );

describe( 'getMyJetpackSections', () => {
	it( 'returns all sections for an admin', () => {
		expect( getMyJetpackSections().map( tab => tab.name ) ).toEqual( [
			MY_JETPACK_SECTION_OVERVIEW,
			MY_JETPACK_SECTION_PRODUCTS,
			MY_JETPACK_SECTION_HELP,
		] );
	} );

	it( 'omits the Products section for non-admins', () => {
		mockCurrentUserCan.mockReturnValue( false );

		expect( getMyJetpackSections().map( tab => tab.name ) ).toEqual( [
			MY_JETPACK_SECTION_OVERVIEW,
			MY_JETPACK_SECTION_HELP,
		] );
	} );

	it( 'returns only the Products section on WordPress.com Simple sites', () => {
		mockIsSimpleSite.mockReturnValue( true );

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

describe( 'resolveMyJetpackSection on regular and Simple sites', () => {
	it( 'keeps a valid section and defaults to Overview on regular sites', () => {
		expect( resolveMyJetpackSection( MY_JETPACK_SECTION_HELP ) ).toBe( MY_JETPACK_SECTION_HELP );
		expect( resolveMyJetpackSection( undefined ) ).toBe( MY_JETPACK_SECTION_OVERVIEW );
	} );

	it( 'resolves the Overview and Help sections to Products on Simple sites', () => {
		mockIsSimpleSite.mockReturnValue( true );

		expect( resolveMyJetpackSection( MY_JETPACK_SECTION_OVERVIEW ) ).toBe(
			MY_JETPACK_SECTION_PRODUCTS
		);
		expect( resolveMyJetpackSection( MY_JETPACK_SECTION_HELP ) ).toBe(
			MY_JETPACK_SECTION_PRODUCTS
		);
		expect( resolveMyJetpackSection( undefined ) ).toBe( MY_JETPACK_SECTION_PRODUCTS );
	} );
} );

describe( 'with the Features tab flag', () => {
	beforeEach( () => setFeaturesTab( true ) );

	it( 'replaces the Products section with a Features section', () => {
		expect( getMyJetpackSections() ).toEqual( [
			expect.objectContaining( { name: MY_JETPACK_SECTION_OVERVIEW } ),
			{ name: MY_JETPACK_SECTION_FEATURES, title: 'Features' },
			expect.objectContaining( { name: MY_JETPACK_SECTION_HELP } ),
		] );
		expect( getProductsSectionPath( '?filter=included' ) ).toBe( '/features?filter=included' );
	} );

	it( 'applies the Simple and non-admin rules to the Features section', () => {
		mockCurrentUserCan.mockReturnValue( false );
		expect( getMyJetpackSections().map( tab => tab.name ) ).toEqual( [
			MY_JETPACK_SECTION_OVERVIEW,
			MY_JETPACK_SECTION_HELP,
		] );

		mockIsSimpleSite.mockReturnValue( true );
		expect( resolveMyJetpackSection( undefined ) ).toBe( MY_JETPACK_SECTION_FEATURES );
	} );

	it( 'resolves the legacy Products section to Features', () => {
		expect( resolveMyJetpackSection( MY_JETPACK_SECTION_PRODUCTS ) ).toBe(
			MY_JETPACK_SECTION_FEATURES
		);
	} );
} );

describe( 'resolveMyJetpackSection', () => {
	it( 'resolves a Features link to Products while the flag is off', () => {
		expect( getProductsSectionPath() ).toBe( '/products' );
		expect( resolveMyJetpackSection( MY_JETPACK_SECTION_FEATURES ) ).toBe(
			MY_JETPACK_SECTION_PRODUCTS
		);
	} );

	it( 'falls back to the default section for non-admins and unknown sections', () => {
		expect( resolveMyJetpackSection( 'does-not-exist' ) ).toBe( MY_JETPACK_SECTION_OVERVIEW );

		mockCurrentUserCan.mockReturnValue( false );
		expect( resolveMyJetpackSection( MY_JETPACK_SECTION_PRODUCTS ) ).toBe(
			MY_JETPACK_SECTION_OVERVIEW
		);
	} );
} );
