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
	window.JetpackScriptData = {
		site: { admin_url: 'https://example.com/wp-admin/' },
		myJetpack: { siteEditor },
	} as Window[ 'JetpackScriptData' ];
};

describe( 'getSharingBlockEditorUrl', () => {
	const blockTheme = {
		isBlockTheme: true,
		isSharingBlockAvailable: true,
		activeThemeStylesheet: 'x',
	};

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

	it.each( [
		[ { ...blockTheme, isBlockTheme: false }, sharedaddy() ],
		[ { ...blockTheme, isSharingBlockAvailable: false }, sharedaddy() ],
		[ blockTheme, sharedaddy( { module: 'stats' } ) ],
		[ { ...blockTheme, activeThemeStylesheet: undefined }, sharedaddy() ],
		[ blockTheme, sharedaddy( { activated: true, override: 'active' } ) ],
	] )( 'returns empty for unsupported context %#', ( siteEditor, module ) => {
		setState( siteEditor );
		expect( getSharingBlockEditorUrl( module ) ).toBe( '' );
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
