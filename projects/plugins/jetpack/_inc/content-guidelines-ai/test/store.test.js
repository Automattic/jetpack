import apiFetch from '@wordpress/api-fetch';
import { dispatch, select } from '@wordpress/data';
import { AI_STORE_NAME } from '../store';

jest.mock( '@wordpress/api-fetch' );

const aiDispatch = () => dispatch( AI_STORE_NAME );
const aiSelect = () => select( AI_STORE_NAME );

describe( 'content-guidelines-ai store', () => {
	beforeEach( () => {
		apiFetch.mockReset();
		apiFetch.mockResolvedValue( {} );
	} );

	// bannerDismissed is a one-way flag with no reset, so isolate a fresh store
	// instance rather than relying on this test running before any other.
	it( 'dismissBanner is a one-way, idempotent, background write', () => {
		jest.isolateModules( () => {
			const mod = require( '@wordpress/api-fetch' );
			const freshApiFetch = mod.default || mod;
			const { dispatch: d, select: s } = require( '@wordpress/data' );
			const { AI_STORE_NAME: name } = require( '../store' );
			freshApiFetch.mockResolvedValue( {} );

			expect( s( name ).isBannerDismissed() ).toBe( false );

			d( name ).dismissBanner();

			expect( s( name ).isBannerDismissed() ).toBe( true );
			expect( freshApiFetch ).toHaveBeenCalledTimes( 1 );
			expect( freshApiFetch ).toHaveBeenCalledWith( {
				method: 'PUT',
				path: '/wpcom/v2/jetpack-ai/guidelines-banner-dismissed',
			} );

			// Already dismissed: the thunk early-returns without a second write.
			d( name ).dismissBanner();
			expect( freshApiFetch ).toHaveBeenCalledTimes( 1 );
		} );
	} );

	it( 'sets and clears a section suggestion', () => {
		aiDispatch().setSuggestion( 'site', 'Some text.' );
		expect( aiSelect().getSuggestion( 'site' ) ).toBe( 'Some text.' );
		expect( aiSelect().hasSuggestion( 'site' ) ).toBe( true );

		aiDispatch().clearSuggestion( 'site' );
		expect( aiSelect().getSuggestion( 'site' ) ).toBe( '' );
		expect( aiSelect().hasSuggestion( 'site' ) ).toBe( false );
	} );

	it( 'reports per-section loading, and global loading covers every section', () => {
		aiDispatch().startSectionLoading( 'copy' );
		expect( aiSelect().isSectionLoading( 'copy' ) ).toBe( true );
		expect( aiSelect().isSectionLoading( 'images' ) ).toBe( false );

		aiDispatch().stopSectionLoading( 'copy' );
		expect( aiSelect().isSectionLoading( 'copy' ) ).toBe( false );

		aiDispatch().startLoading();
		expect( aiSelect().isLoading() ).toBe( true );
		expect( aiSelect().isSectionLoading( 'images' ) ).toBe( true );

		aiDispatch().stopLoading();
		expect( aiSelect().isLoading() ).toBe( false );
	} );

	it( 'toggles the forced upgrade notice flag', () => {
		expect( aiSelect().isUpgradeNoticeForced() ).toBe( false );

		aiDispatch().showUpgradeNotice();
		expect( aiSelect().isUpgradeNoticeForced() ).toBe( true );

		aiDispatch().hideUpgradeNotice();
		expect( aiSelect().isUpgradeNoticeForced() ).toBe( false );
	} );
} );
