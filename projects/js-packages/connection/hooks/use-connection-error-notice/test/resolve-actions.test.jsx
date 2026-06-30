import { jest } from '@jest/globals';
import {
	DEFAULT_RECONNECT_TRACKING_EVENT,
	resolveConnectionErrorActions,
} from '../resolve-actions';

describe( 'resolveConnectionErrorActions', () => {
	const restoreConnection = jest.fn();
	const baseOptions = {
		restoreConnection,
		isRestoringConnection: false,
	};

	beforeEach( () => {
		jest.clearAllMocks();
	} );

	it( 'falls back to a Restore Connection action when no action data is present', () => {
		const actions = resolveConnectionErrorActions( { error_message: 'Broken' }, baseOptions );

		expect( actions ).toHaveLength( 1 );
		expect( actions[ 0 ].label ).toBe( 'Restore Connection' );
		expect( actions[ 0 ].isLoading ).toBe( false );

		actions[ 0 ].onClick();
		expect( restoreConnection ).toHaveBeenCalled();
	} );

	it( 'fires the default reconnect tracking event on the fallback action', () => {
		const trackingCallback = jest.fn();
		const actions = resolveConnectionErrorActions(
			{ error_message: 'Broken' },
			{ ...baseOptions, trackingCallback }
		);

		actions[ 0 ].onClick();
		expect( trackingCallback ).toHaveBeenCalledWith( DEFAULT_RECONNECT_TRACKING_EVENT, {} );
	} );

	it( 'uses a consumer-supplied reconnect tracking event when provided', () => {
		const trackingCallback = jest.fn();
		const actions = resolveConnectionErrorActions(
			{ error_message: 'Broken' },
			{ ...baseOptions, trackingCallback, reconnectTrackingEvent: 'jetpack_my_jetpack_x' }
		);

		actions[ 0 ].onClick();
		expect( trackingCallback ).toHaveBeenCalledWith( 'jetpack_my_jetpack_x', {} );
	} );

	it( 'resolves a named action handler', () => {
		const handler = jest.fn();
		const trackingCallback = jest.fn();
		const error = {
			error_message: 'Custom',
			error_data: {
				action: 'fix_it',
				action_label: 'Fix Issue',
				action_variant: 'primary',
				tracking_event: 'jetpack_fix_it',
			},
		};

		const actions = resolveConnectionErrorActions( error, {
			...baseOptions,
			trackingCallback,
			actionHandlers: { fix_it: handler },
		} );

		expect( actions ).toHaveLength( 1 );
		expect( actions[ 0 ].label ).toBe( 'Fix Issue' );
		expect( actions[ 0 ].variant ).toBe( 'primary' );

		actions[ 0 ].onClick();
		expect( trackingCallback ).toHaveBeenCalledWith( 'jetpack_fix_it', {} );
		expect( handler ).toHaveBeenCalledWith( error );
	} );

	it( 'falls back to a default label for a named handler without a label', () => {
		const handler = jest.fn();
		const actions = resolveConnectionErrorActions(
			{ error_message: 'Custom', error_data: { action: 'fix_it' } },
			{ ...baseOptions, actionHandlers: { fix_it: handler } }
		);

		expect( actions[ 0 ].label ).toBe( 'Take Action' );
	} );

	it( 'resolves a URL action and navigates via the supplied navigate handler', () => {
		const navigate = jest.fn();
		const actions = resolveConnectionErrorActions(
			{
				error_message: 'Custom',
				error_data: { action_url: 'https://example.com/fix', action_label: 'Fix' },
			},
			{ ...baseOptions, navigate }
		);

		expect( actions[ 0 ].label ).toBe( 'Fix' );
		actions[ 0 ].onClick();
		expect( navigate ).toHaveBeenCalledWith( 'https://example.com/fix' );
	} );

	it( 'adds a secondary handler action', () => {
		const handler = jest.fn();
		const secondary = jest.fn();
		const actions = resolveConnectionErrorActions(
			{
				error_message: 'Custom',
				error_data: {
					action: 'primary',
					action_label: 'Primary',
					secondary_action: 'secondary',
					secondary_action_label: 'Secondary',
				},
			},
			{ ...baseOptions, actionHandlers: { primary: handler, secondary } }
		);

		expect( actions ).toHaveLength( 2 );
		expect( actions[ 1 ].label ).toBe( 'Secondary' );
		expect( actions[ 1 ].variant ).toBe( 'secondary' );
		actions[ 1 ].onClick();
		expect( secondary ).toHaveBeenCalled();
	} );

	it( 'does not add a secondary action without a label', () => {
		const actions = resolveConnectionErrorActions(
			{
				error_message: 'Custom',
				error_data: {
					action_url: 'https://example.com/primary',
					action_label: 'Primary',
					secondary_action_url: 'https://example.com/secondary',
				},
			},
			baseOptions
		);

		expect( actions ).toHaveLength( 1 );
	} );

	it( 'does not add a secondary action to the default restore fallback', () => {
		const actions = resolveConnectionErrorActions(
			{
				error_message: 'Broken',
				error_data: {
					secondary_action_url: 'https://example.com/secondary',
					secondary_action_label: 'Secondary',
				},
			},
			baseOptions
		);

		expect( actions ).toHaveLength( 1 );
		expect( actions[ 0 ].label ).toBe( 'Restore Connection' );
	} );

	it( 'returns custom actions when provided', () => {
		const customActions = jest.fn( () => [ { label: 'Custom', onClick: jest.fn() } ] );
		const actions = resolveConnectionErrorActions(
			{ error_message: 'Broken' },
			{ ...baseOptions, customActions }
		);

		expect( actions ).toEqual( [ { label: 'Custom', onClick: expect.any( Function ) } ] );
		expect( customActions ).toHaveBeenCalledWith(
			{ error_message: 'Broken' },
			{ restoreConnection, isRestoringConnection: false }
		);
	} );

	it( 'returns no actions when customActions throws', () => {
		const customActions = jest.fn( () => {
			throw new Error( 'boom' );
		} );
		const actions = resolveConnectionErrorActions(
			{ error_message: 'Broken' },
			{ ...baseOptions, customActions }
		);

		expect( actions ).toEqual( [] );
	} );
} );
