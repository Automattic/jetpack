import { MY_JETPACK_SECTION_CUSTOMIZE, MY_JETPACK_SECTION_PRODUCTS } from '../constants';
import { getMyJetpackSections, isValidMyJetpackSection } from '../utils';

const setCanManageOptions = ( canManageOptions: boolean ) => {
	global.JetpackScriptData = {
		user: {
			current_user: {
				capabilities: {
					manage_options: canManageOptions,
				},
			},
		},
		site: {
			host: 'standard',
		},
	};
};

const setCustomizationFlag = ( featureEnabled: boolean ) => {
	window.myJetpackInitialState = {
		adminMenuCustomization: {
			featureEnabled,
		},
	} as Window[ 'myJetpackInitialState' ];
};

describe( 'getMyJetpackSections', () => {
	beforeEach( () => {
		setCanManageOptions( true );
		setCustomizationFlag( false );
	} );

	it( 'omits Customize when admin menu customization is unavailable', () => {
		const sections = getMyJetpackSections();

		expect(
			sections.find( section => section.name === MY_JETPACK_SECTION_CUSTOMIZE )
		).toBeUndefined();
		expect( isValidMyJetpackSection( MY_JETPACK_SECTION_CUSTOMIZE ) ).toBe( false );
	} );

	it( 'includes Customize when admin menu customization is available', () => {
		setCustomizationFlag( true );

		const sections = getMyJetpackSections();

		expect(
			sections.find( section => section.name === MY_JETPACK_SECTION_CUSTOMIZE )
		).toBeDefined();
		expect( isValidMyJetpackSection( MY_JETPACK_SECTION_CUSTOMIZE ) ).toBe( true );
	} );

	it( 'keeps Customize available for non-admin users while hiding Products', () => {
		setCanManageOptions( false );
		setCustomizationFlag( true );

		const sections = getMyJetpackSections();

		expect(
			sections.find( section => section.name === MY_JETPACK_SECTION_PRODUCTS )
		).toBeUndefined();
		expect(
			sections.find( section => section.name === MY_JETPACK_SECTION_CUSTOMIZE )
		).toBeDefined();
	} );
} );
