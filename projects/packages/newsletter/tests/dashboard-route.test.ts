// The `route.inspector` loader runs on every navigation in the boot router.
// Its job is to decide whether the `<Inspector />` slot — the subscriber
// detail drawer — should render. Two contracts matter:
//
// 1. The inspector only opens when a `subscriber` or `u` URL param is set.
//    Boot calls `inspector( ctx )` every nav, so a missing/false return
//    hides the slot entirely.
// 2. Once the visitor flips to `?tab=settings`, the inspector must stay
//    closed even if `subscriber` is still in the URL. Without this guard
//    the subscriber-detail drawer "hitchhikes" across tabs.
const mockGetNewsletterScriptData = jest.fn();

jest.mock( '../src/settings/script-data', () => ( {
	getNewsletterScriptData: () => mockGetNewsletterScriptData(),
} ) );

import { route } from '../routes/dashboard/route';

beforeEach( () => {
	mockGetNewsletterScriptData.mockReset();
	mockGetNewsletterScriptData.mockReturnValue( { overviewEnabled: true } );
} );

describe( 'dashboard route.inspector', () => {
	it( 'is hidden by default when no subscriber selection is present', () => {
		expect( route.inspector( { search: {} } ) ).toBe( false );
	} );

	it( 'opens when a numeric subscriber id is in the URL on the Subscribers tab', () => {
		expect( route.inspector( { search: { tab: 'subscribers', subscriber: 4242 } } ) ).toBe( true );
	} );

	it( 'opens when a wpcom user slug (`u`) is in the URL on the Subscribers tab', () => {
		expect( route.inspector( { search: { tab: 'subscribers', u: 'alice' } } ) ).toBe( true );
	} );

	it( 'stays closed on the Settings tab even when subscriber-detail params linger', () => {
		// This is the hitchhike guard: the visitor flipped to ?tab=settings, but
		// stale `subscriber`/`u` params are still in the URL. The inspector must
		// not render until they hop back to Subscribers.
		expect( route.inspector( { search: { tab: 'settings', subscriber: 4242 } } ) ).toBe( false );
		expect( route.inspector( { search: { tab: 'settings', u: 'alice' } } ) ).toBe( false );
	} );

	it( 'stays closed on the default Overview tab when subscriber-detail params linger', () => {
		expect( route.inspector( { search: { subscriber: 4242 } } ) ).toBe( false );
	} );

	it( 'opens from the default Subscribers route when Overview is disabled', () => {
		mockGetNewsletterScriptData.mockReturnValue( { overviewEnabled: false } );

		expect( route.inspector( { search: { subscriber: 4242 } } ) ).toBe( true );
	} );

	it( 'treats subscriber=0 as no selection (falsy id should not open inspector)', () => {
		expect( route.inspector( { search: { tab: 'subscribers', subscriber: 0 } } ) ).toBe( false );
	} );

	it( 'treats subscriber as a string id (DataViews emits strings from URL params)', () => {
		expect( route.inspector( { search: { tab: 'subscribers', subscriber: '4242' } } ) ).toBe(
			true
		);
	} );
} );
