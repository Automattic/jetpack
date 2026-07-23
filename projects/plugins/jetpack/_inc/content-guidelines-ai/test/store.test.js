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

	// Runs first so bannerDismissed is still at its default (false): the store
	// is registered once for the module and its state persists across tests.
	it( 'dismissBanner is a one-way, idempotent, background write', async () => {
		expect( aiSelect().isBannerDismissed() ).toBe( false );

		await aiDispatch().dismissBanner();

		expect( aiSelect().isBannerDismissed() ).toBe( true );
		expect( apiFetch ).toHaveBeenCalledTimes( 1 );
		expect( apiFetch ).toHaveBeenCalledWith( {
			method: 'PUT',
			path: '/wpcom/v2/jetpack-ai/guidelines-banner-dismissed',
		} );

		// Already dismissed: the thunk early-returns without a second write.
		await aiDispatch().dismissBanner();
		expect( apiFetch ).toHaveBeenCalledTimes( 1 );
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
