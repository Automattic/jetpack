/**
 * Internal dependencies
 */
import type * as SurfaceEvents from '../../surface-events';
import type * as TrackWhatsNew from '../track-whats-new';

type TracksCall = [ string, ...unknown[] ];

const queue = (): TracksCall[] => ( window as unknown as { _tkq: TracksCall[] } )._tkq;

const recorded = (): TracksCall[] => queue().filter( ( [ command ] ) => command === 'recordEvent' );

describe( 'trackWhatsNew', () => {
	let trackWhatsNew: typeof TrackWhatsNew.trackWhatsNew;
	let emitSurfaceEvent: typeof SurfaceEvents.emitSurfaceEvent;

	// The module tracks for the page load, so each test loads a copy of its own.
	beforeEach( () => {
		jest.resetModules();
		Object.assign( window, {
			_tkq: [],
			JetpackScriptData: {
				site: { wpcom: { blog_id: 12 } },
				user: { current_user: { wpcom: { ID: 7, login: 'ana' } } },
			},
		} );
		( { emitSurfaceEvent } = jest.requireActual( '../../surface-events' ) );
		( { trackWhatsNew } = jest.requireActual( '../track-whats-new' ) );
	} );

	afterEach( () => {
		delete window.JetpackScriptData;
	} );

	it( 'records nothing until a host asks for it', () => {
		emitSurfaceEvent( { type: 'teaserOpen', announcementId: 'my-plugin/newest' } );

		expect( queue() ).toEqual( [] );
	} );

	it.each< [ SurfaceEvents.SurfaceEvent, string, Record< string, unknown > ] >( [
		[
			{ type: 'teaserView', announcementId: 'my-plugin/newest' },
			'jetpack_announcements_teaser_view',
			{ announcement_id: 'my-plugin/newest' },
		],
		[
			{ type: 'teaserOpen', announcementId: 'my-plugin/newest' },
			'jetpack_announcements_teaser_open',
			{ announcement_id: 'my-plugin/newest' },
		],
		[
			{ type: 'teaserDismiss', announcementId: 'my-plugin/newest' },
			'jetpack_announcements_teaser_dismiss',
			{ announcement_id: 'my-plugin/newest' },
		],
		[
			{ type: 'readerLinkClick', announcementId: 'my-plugin/newest' },
			'jetpack_announcements_reader_link_click',
			{ announcement_id: 'my-plugin/newest' },
		],
		[
			{ type: 'teaserSwitch', isOn: false },
			'jetpack_announcements_teaser_switch',
			{ enabled: false },
		],
	] )( 'records $type with its properties and the site', ( event, name, properties ) => {
		trackWhatsNew();

		emitSurfaceEvent( event );

		expect( recorded() ).toEqual( [ [ 'recordEvent', name, { ...properties, blog_id: 12 } ] ] );
	} );

	it( 'tells Tracks who the user is', () => {
		trackWhatsNew();

		expect( queue() ).toContainEqual( [ 'identifyUser', 7, 'ana' ] );
	} );

	it( 'records an event once when more than one host asks', () => {
		trackWhatsNew();
		trackWhatsNew();

		emitSurfaceEvent( { type: 'teaserDismiss', announcementId: 'my-plugin/newest' } );

		expect( recorded() ).toHaveLength( 1 );
	} );
} );
