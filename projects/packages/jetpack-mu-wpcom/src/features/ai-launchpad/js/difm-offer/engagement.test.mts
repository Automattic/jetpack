import assert from 'node:assert/strict';
import { beforeEach, describe, it, mock } from 'node:test';
import {
	createEngagementTracker,
	HOVER_EVENT,
	selectionLength,
	TEXT_SELECT_EVENT,
} from './engagement.ts';
import {
	DISMISSED_PREFERENCE,
	difmOfferDismissProps,
	difmOfferTracksProps,
	dismissalRequest,
	recordDifmOfferEvent,
} from './tracks.ts';

describe( 'selectionLength', () => {
	it( 'counts the selected characters inside the banner', () => {
		assert.equal( selectionLength( [ 'No time', ' to build' ] ), 16 );
	} );

	it( 'counts the surrounding whitespace of a real selection', () => {
		assert.equal( selectionLength( [ ' offer ' ] ), 7 );
	} );

	it( 'ignores a whitespace-only selection', () => {
		assert.equal( selectionLength( [ '  ', '\n' ] ), 0 );
	} );

	it( 'ignores an empty selection', () => {
		assert.equal( selectionLength( [] ), 0 );
	} );
} );

describe( 'createEngagementTracker', () => {
	let recorded: Array< [ string, { selection_length: number } | undefined ] >;
	let length: number;

	const tracker = () =>
		createEngagementTracker( {
			record: ( eventName, extra ) => recorded.push( [ eventName, extra ] ),
			measureSelection: () => length,
		} );

	beforeEach( () => {
		recorded = [];
		length = 12;
		mock.timers.enable( { apis: [ 'setTimeout' ] } );
	} );

	it( 'records a hover after 500 ms of dwell', t => {
		t.after( () => mock.timers.reset() );
		const subject = tracker();

		subject.pointerEnter();
		mock.timers.tick( 499 );
		assert.deepEqual( recorded, [] );
		mock.timers.tick( 1 );
		assert.deepEqual( recorded, [ [ HOVER_EVENT, undefined ] ] );
	} );

	it( 'records no hover when the pointer leaves before 500 ms', t => {
		t.after( () => mock.timers.reset() );
		const subject = tracker();

		subject.pointerEnter();
		mock.timers.tick( 400 );
		subject.pointerLeave();
		mock.timers.tick( 1000 );
		assert.deepEqual( recorded, [] );
	} );

	it( 'records one hover per mount', t => {
		t.after( () => mock.timers.reset() );
		const subject = tracker();

		subject.pointerEnter();
		mock.timers.tick( 500 );
		subject.pointerLeave();
		subject.pointerEnter();
		mock.timers.tick( 500 );
		assert.equal( recorded.length, 1 );
	} );

	it( 'records a text select 300 ms after the selection settles, with its length', t => {
		t.after( () => mock.timers.reset() );
		const subject = tracker();

		subject.selectionChange();
		mock.timers.tick( 200 );
		subject.selectionChange();
		mock.timers.tick( 299 );
		assert.deepEqual( recorded, [] );
		mock.timers.tick( 1 );
		assert.deepEqual( recorded, [ [ TEXT_SELECT_EVENT, { selection_length: 12 } ] ] );
	} );

	it( 'keeps listening after a selection outside the banner', t => {
		t.after( () => mock.timers.reset() );
		const subject = tracker();

		length = 0;
		subject.selectionChange();
		mock.timers.tick( 300 );
		assert.deepEqual( recorded, [] );

		length = 5;
		subject.selectionChange();
		mock.timers.tick( 300 );
		assert.deepEqual( recorded, [ [ TEXT_SELECT_EVENT, { selection_length: 5 } ] ] );
	} );

	it( 'records one text select per mount', t => {
		t.after( () => mock.timers.reset() );
		const subject = tracker();

		subject.selectionChange();
		mock.timers.tick( 300 );
		subject.selectionChange();
		mock.timers.tick( 300 );
		assert.equal( recorded.length, 1 );
	} );

	it( 'records nothing once disposed, even with timers running', t => {
		t.after( () => mock.timers.reset() );
		const subject = tracker();

		subject.pointerEnter();
		subject.selectionChange();
		subject.dispose();
		mock.timers.tick( 1000 );
		subject.pointerEnter();
		subject.selectionChange();
		mock.timers.tick( 1000 );
		assert.deepEqual( recorded, [] );
	} );

	it( 'keeps one tracker from latching another', t => {
		t.after( () => mock.timers.reset() );
		const first = tracker();
		first.pointerEnter();
		mock.timers.tick( 500 );

		const second = tracker();
		second.pointerEnter();
		mock.timers.tick( 500 );
		assert.equal( recorded.length, 2 );
	} );
} );

describe( 'recordDifmOfferEvent', () => {
	const win = globalThis as unknown as {
		window: { _tkq?: unknown[]; wpcomAiLaunchpadTracks?: unknown };
	};

	it( 'sends only the offer props, never the launchpad standard props', () => {
		win.window = {
			_tkq: [],
			wpcomAiLaunchpadTracks: { props: { agent_name: 'ai_launchpad' }, identity: null },
		};

		recordDifmOfferEvent( 'calypso_banner_cta_click', difmOfferTracksProps( 'treatment' ) );

		assert.deepEqual( win.window._tkq, [
			[
				'recordEvent',
				'calypso_banner_cta_click',
				{
					upsell_id: 'site-setup-difm-offer',
					upsell_feature_id: 'difm-offer',
					variation: 'treatment',
					cta_name: 'site-setup-difm-offer',
					cta_size: 'regular',
				},
			],
		] );
	} );

	it( 'passes use_beacon through to the transport', () => {
		win.window = { _tkq: [] };

		recordDifmOfferEvent( 'calypso_banner_cta_click', {
			...difmOfferTracksProps( 'treatment' ),
			use_beacon: true,
		} );

		const [ , , props ] = win.window._tkq?.[ 0 ] as [ string, string, Record< string, unknown > ];
		assert.equal( props.use_beacon, true );
	} );
} );

describe( 'difmOfferDismissProps', () => {
	it( 'drops cta_size, as the Calypso dismiss events do', () => {
		assert.deepEqual( difmOfferDismissProps( difmOfferTracksProps( 'treatment' ) ), {
			upsell_id: 'site-setup-difm-offer',
			upsell_feature_id: 'difm-offer',
			variation: 'treatment',
			cta_name: 'site-setup-difm-offer',
		} );
	} );
} );

describe( 'dismissalRequest', () => {
	it( 'stores the dismissal in the preference the Calypso surfaces read', () => {
		const now = new Date( '2026-10-12T19:36:31.453Z' );

		assert.deepEqual( dismissalRequest( now ), {
			path: '/wpcom/v2/me/preferences',
			method: 'POST',
			global: true,
			data: {
				calypso_preferences: {
					'hosting-dashboard-difm-offer-dismissed': '2026-10-12T19:36:31.453Z',
				},
			},
		} );
		assert.equal( DISMISSED_PREFERENCE, 'hosting-dashboard-difm-offer-dismissed' );
	} );
} );
