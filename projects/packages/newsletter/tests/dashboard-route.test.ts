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
import { route } from '../routes/dashboard/route';

describe( 'dashboard route.inspector', () => {
	it( 'is hidden by default when no subscriber selection is present', () => {
		expect( route.inspector( { search: {} } ) ).toBe( false );
	} );

	it( 'opens when a numeric subscriber id is in the URL on the Subscribers tab', () => {
		expect( route.inspector( { search: { subscriber: 4242 } } ) ).toBe( true );
	} );

	it( 'opens when a wpcom user slug (`u`) is in the URL on the Subscribers tab', () => {
		expect( route.inspector( { search: { u: 'alice' } } ) ).toBe( true );
	} );

	it( 'stays closed on the Settings tab even when subscriber-detail params linger', () => {
		// This is the hitchhike guard: the visitor flipped to ?tab=settings, but
		// stale `subscriber`/`u` params are still in the URL. The inspector must
		// not render until they hop back to Subscribers.
		expect( route.inspector( { search: { tab: 'settings', subscriber: 4242 } } ) ).toBe( false );
		expect( route.inspector( { search: { tab: 'settings', u: 'alice' } } ) ).toBe( false );
	} );

	it( 'treats subscriber=0 as no selection (falsy id should not open inspector)', () => {
		expect( route.inspector( { search: { subscriber: 0 } } ) ).toBe( false );
	} );

	it( 'treats subscriber as a string id (DataViews emits strings from URL params)', () => {
		expect( route.inspector( { search: { subscriber: '4242' } } ) ).toBe( true );
	} );
} );
