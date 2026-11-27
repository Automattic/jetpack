import { jest } from '@jest/globals';

const mockRecordEvent = jest.fn();
const mockBumpStat = jest.fn();
const mockSetMcAnalyticsEnabled = jest.fn();

jest.unstable_mockModule( '@automattic/jetpack-analytics', () => ( {
	__esModule: true,
	default: {
		tracks: { recordEvent: mockRecordEvent },
		mc: { bumpStat: mockBumpStat },
		setMcAnalyticsEnabled: mockSetMcAnalyticsEnabled,
		initialize: jest.fn(),
	},
} ) );

const {
	CONNECTION_EVENTS,
	bumpConnectionStat,
	placementProps,
	trackConnectionEvent,
	trackIdentityCrisisEvent,
} = await import( '../connection-tracking.ts' );

describe( 'placementProps', () => {
	it.each( [
		[ undefined, {} ],
		[ 'header' as const, { placement: 'header' } ],
	] )( 'returns %p as %p', ( placement, expected ) => {
		expect( placementProps( placement ) ).toStrictEqual( expected );
	} );

	// Checked by typecheck, not Jest: fails if ConnectionPlacement is widened to any string.
	it( 'rejects a placement missing from ConnectionPlacement', () => {
		// @ts-expect-error -- Unregistered placement; add new ones to ConnectionPlacement.
		expect( placementProps( 'sidebar' ) ).toEqual( { placement: 'sidebar' } );
	} );
} );

describe( 'trackConnectionEvent', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

	it( 'records the event with its props and the context', () => {
		trackConnectionEvent( CONNECTION_EVENTS.cardActionClick, 'connectors', { action: 'connect' } );

		expect( mockRecordEvent ).toHaveBeenCalledWith( CONNECTION_EVENTS.cardActionClick, {
			action: 'connect',
			context: 'connectors',
		} );
	} );

	it( 'lets the context win over a same-named prop', () => {
		trackConnectionEvent( CONNECTION_EVENTS.cardView, 'connectors', { context: 'other' } );

		expect( mockRecordEvent ).toHaveBeenCalledWith( CONNECTION_EVENTS.cardView, {
			context: 'connectors',
		} );
	} );

	it.each( [ undefined, null, '' ] )( 'records a null context for %p', context => {
		trackConnectionEvent( CONNECTION_EVENTS.cardView, context );

		expect( mockRecordEvent ).toHaveBeenCalledWith( CONNECTION_EVENTS.cardView, { context: null } );
	} );

	it( 'swallows a failing record', () => {
		mockRecordEvent.mockImplementationOnce( () => {
			throw new Error( 'blocked' );
		} );

		expect( () => trackConnectionEvent( CONNECTION_EVENTS.cardView, 'connectors' ) ).not.toThrow();
	} );
} );

describe( 'trackIdentityCrisisEvent', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

	afterEach( () => {
		delete window.pagenow;
		delete window.JetpackScriptData;
	} );

	it.each( [
		[
			'notice',
			'edit-post',
			'woa',
			{ placement: 'page_notice', context: 'edit-post', platform: 'woa' },
		],
		[
			'notice',
			undefined,
			'atomic',
			{ placement: 'page_notice', context: 'notice', platform: 'self-hosted' },
		],
		[
			'my-jetpack',
			'jetpack_page_my-jetpack',
			'vip',
			{ placement: 'page_modal', context: 'my-jetpack', platform: 'vip' },
		],
		[
			'connectors',
			'options-connectors',
			'newspack',
			{ placement: 'connection_card', context: 'connectors', platform: 'newspack' },
		],
		[
			'connectors',
			undefined,
			'unknown',
			{ placement: 'connection_card', context: 'connectors', platform: 'self-hosted' },
		],
		[
			'notice',
			'dashboard',
			'wpcom',
			{ placement: 'page_notice', context: 'dashboard', platform: 'self-hosted' },
		],
		[ 'notice', 'dashboard', undefined, { placement: 'page_notice', context: 'dashboard' } ],
		[ undefined, 'dashboard', 'woa', { context: null, platform: 'woa' } ],
	] as const )( 'context %s on screen %s, host %s', ( context, pagenow, host, expected ) => {
		window.pagenow = pagenow;
		window.JetpackScriptData = { site: { host } } as typeof window.JetpackScriptData;

		trackIdentityCrisisEvent( CONNECTION_EVENTS.idcActionError, context, {
			action: 'migrate',
			path: undefined,
		} );

		expect( mockRecordEvent.mock.calls ).toStrictEqual( [
			[ CONNECTION_EVENTS.idcActionError, { action: 'migrate', screen_version: 2, ...expected } ],
		] );
	} );
} );

describe( 'bumpConnectionStat', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

	// bumpStat sends nothing until MC stats are enabled.
	it( 'enables MC stats before bumping', () => {
		bumpConnectionStat( 'jetpack-idc', 'migrate' );

		expect( mockSetMcAnalyticsEnabled ).toHaveBeenCalledWith( true );
		expect( mockBumpStat ).toHaveBeenCalledWith( 'jetpack-idc', 'migrate' );
		expect( mockSetMcAnalyticsEnabled.mock.invocationCallOrder[ 0 ] ).toBeLessThan(
			mockBumpStat.mock.invocationCallOrder[ 0 ]
		);
	} );

	it( 'swallows a failing bump', () => {
		mockBumpStat.mockImplementationOnce( () => {
			throw new Error( 'blocked' );
		} );

		expect( () => bumpConnectionStat( 'jetpack-idc', 'migrate' ) ).not.toThrow();
	} );
} );
