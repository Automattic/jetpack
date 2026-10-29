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

const { CONNECTION_EVENTS, bumpConnectionStat, placementProps, trackConnectionEvent } =
	await import( '../connection-tracking.ts' );

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
