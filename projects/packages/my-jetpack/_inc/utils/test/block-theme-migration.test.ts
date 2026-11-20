import { getBlockThemeMigration } from '../block-theme-migration';
import type { MyJetpackModule } from '../../types';

const makeModule = ( overrides = {} ): MyJetpackModule =>
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

const blockTheme = {
	isBlockTheme: true,
	isSharingBlockAvailable: true,
	isLikeBlockAvailable: true,
};

describe( 'getBlockThemeMigration', () => {
	it.each( [
		[ 'sharedaddy', 'https://example.com/wp-admin/options-general.php?page=sharing' ],
		[ 'likes', 'https://example.com/wp-admin/options-general.php?page=sharing#likes' ],
	] )(
		'points %s at Settings › Sharing on a block theme with the block available',
		( module, url ) => {
			setState( blockTheme );

			expect( getBlockThemeMigration( makeModule( { module } ) )?.settingsUrl ).toBe( url );
		}
	);

	it.each( [
		[ { ...blockTheme, isBlockTheme: false }, makeModule() ],
		[ { ...blockTheme, isSharingBlockAvailable: false }, makeModule() ],
		[ { ...blockTheme, isLikeBlockAvailable: false }, makeModule( { module: 'likes' } ) ],
		[ blockTheme, makeModule( { module: 'stats' } ) ],
		[ blockTheme, makeModule( { activated: true, override: 'active' } ) ],
		[ blockTheme, makeModule( { module: 'likes', activated: true, override: 'active' } ) ],
	] )( 'returns null for unsupported context %#', ( siteEditor, module ) => {
		setState( siteEditor );
		expect( getBlockThemeMigration( module ) ).toBeNull();
	} );

	it( 'only offers the Sharing block when the Like block is unavailable', () => {
		setState( { ...blockTheme, isLikeBlockAvailable: false } );

		expect( getBlockThemeMigration( makeModule() ) ).not.toBeNull();
		expect( getBlockThemeMigration( makeModule( { module: 'likes' } ) ) ).toBeNull();
	} );
} );

describe( 'migration copy', () => {
	beforeEach( () => setState( blockTheme ) );

	it.each( [
		[ 'sharedaddy', 'Legacy sharing buttons cannot be customized on block themes.' ],
		[ 'likes', 'Legacy Like buttons cannot be customized on block themes.' ],
	] )( 'explains the legacy limitation for active %s', ( module, notice ) => {
		expect( getBlockThemeMigration( makeModule( { module, activated: true } ) )?.notice ).toBe(
			notice
		);
	} );

	it.each( [
		[ 'sharedaddy', 'Choose where the Sharing Buttons block goes on your posts and pages.' ],
		[ 'likes', 'Choose where the Like block goes on your posts and pages.' ],
	] )( 'says where to place the block for inactive %s', ( module, notice ) => {
		expect( getBlockThemeMigration( makeModule( { module } ) )?.notice ).toBe( notice );
	} );

	it.each( [
		[ 'sharedaddy', 'Switch to Sharing Buttons block' ],
		[ 'likes', 'Switch to the Like block' ],
	] )( 'labels the switch action for %s', ( module, label ) => {
		expect( getBlockThemeMigration( makeModule( { module } ) )?.switchLabel ).toBe( label );
	} );
} );
