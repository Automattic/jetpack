import { getSharingBlockEditorUrl, getSharingBlockNotice } from '../sharing-block';
import type { MyJetpackModule } from '../../types';

const sharedaddy = ( overrides = {} ): MyJetpackModule =>
	( {
		module: 'sharedaddy',
		name: 'Sharing',
		activated: false,
		...overrides,
	} ) as MyJetpackModule;

const setState = ( siteEditor: unknown ) => {
	window.myJetpackInitialState = {
		adminUrl: 'https://example.com/wp-admin/',
		siteEditor,
	} as Window[ 'myJetpackInitialState' ];
};

describe( 'getSharingBlockEditorUrl', () => {
	it( 'returns the Single template editor URL on a block theme with the block available', () => {
		setState( {
			isBlockTheme: true,
			isSharingBlockAvailable: true,
			activeThemeStylesheet: 'twentytwentyfour',
		} );

		expect( getSharingBlockEditorUrl( sharedaddy() ) ).toBe(
			'https://example.com/wp-admin/site-editor.php?p=%2Fwp_template%2Ftwentytwentyfour%2F%2Fsingle&canvas=edit'
		);
	} );

	it( 'returns empty when the theme is not a block theme', () => {
		setState( { isBlockTheme: false, isSharingBlockAvailable: true, activeThemeStylesheet: 'x' } );
		expect( getSharingBlockEditorUrl( sharedaddy() ) ).toBe( '' );
	} );

	it( 'returns empty when the block is unavailable', () => {
		setState( { isBlockTheme: true, isSharingBlockAvailable: false, activeThemeStylesheet: 'x' } );
		expect( getSharingBlockEditorUrl( sharedaddy() ) ).toBe( '' );
	} );

	it( 'returns empty for other modules', () => {
		setState( { isBlockTheme: true, isSharingBlockAvailable: true, activeThemeStylesheet: 'x' } );
		expect( getSharingBlockEditorUrl( sharedaddy( { module: 'stats' } ) ) ).toBe( '' );
	} );

	it( 'returns empty when the stylesheet is missing', () => {
		setState( { isBlockTheme: true, isSharingBlockAvailable: true } );
		expect( getSharingBlockEditorUrl( sharedaddy() ) ).toBe( '' );
	} );

	it( 'returns empty when adminUrl is missing', () => {
		window.myJetpackInitialState = {
			siteEditor: {
				isBlockTheme: true,
				isSharingBlockAvailable: true,
				activeThemeStylesheet: 'x',
			},
		} as Window[ 'myJetpackInitialState' ];
		expect( getSharingBlockEditorUrl( sharedaddy() ) ).toBe( '' );
	} );
} );

describe( 'getSharingBlockNotice', () => {
	beforeEach( () => {
		setState( {
			isBlockTheme: true,
			isSharingBlockAvailable: true,
			activeThemeStylesheet: 'twentytwentyfour',
		} );
	} );

	it( 'explains the legacy limitation only when sharing is active', () => {
		expect( getSharingBlockNotice( sharedaddy( { activated: true } ) ) ).toBe(
			'Legacy sharing buttons cannot be customized on block themes.'
		);
	} );

	it( 'explains how to add the block when sharing is inactive', () => {
		expect( getSharingBlockNotice( sharedaddy( { activated: false } ) ) ).toBe(
			'Add the Sharing Buttons block to your theme’s template.'
		);
	} );
} );
